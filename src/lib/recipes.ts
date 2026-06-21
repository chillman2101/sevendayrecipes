import type { PlanConfig, PlanSlot, Recipe, RecipeSummary } from "@/types";
import { getDb } from "./db";
import {
  inferPrimaryPantryTag,
  normalizePantryTags,
  pickRandomRecipeUnfiltered,
  pickRecipeForPantryTag,
  rotatePantryTags,
} from "./pantry";

function parseRecipe(row: {
  id: string;
  title: string;
  ingredients: string;
  steps: string;
  num_ingredients: number;
  num_steps: number;
}): Recipe {
  return {
    id: row.id,
    title: row.title,
    ingredients: JSON.parse(row.ingredients) as string[],
    steps: JSON.parse(row.steps) as string[],
    num_ingredients: row.num_ingredients,
    num_steps: row.num_steps,
  };
}

export function getRecipeById(id: string): Recipe | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT id, title, ingredients, steps, num_ingredients, num_steps FROM recipes WHERE id = ?"
    )
    .get(id) as
    | {
        id: string;
        title: string;
        ingredients: string;
        steps: string;
        num_ingredients: number;
        num_steps: number;
      }
    | undefined;

  return row ? parseRecipe(row) : null;
}

export function getRecipesByIds(ids: string[]): Recipe[] {
  if (ids.length === 0) return [];
  const db = getDb();
  const placeholders = ids.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT id, title, ingredients, steps, num_ingredients, num_steps FROM recipes WHERE id IN (${placeholders})`
    )
    .all(...ids) as Array<{
    id: string;
    title: string;
    ingredients: string;
    steps: string;
    num_ingredients: number;
    num_steps: number;
  }>;

  const map = new Map(rows.map((r) => [r.id, parseRecipe(r)]));
  return ids.map((id) => map.get(id)).filter(Boolean) as Recipe[];
}

export function getPopularTokens(limit = 500): string[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT token, COUNT(*) as cnt FROM ingredient_tokens
       GROUP BY token ORDER BY cnt DESC LIMIT ?`
    )
    .all(limit) as Array<{ token: string; cnt: number }>;
  return rows.map((r) => r.token);
}

export function searchRecipesByTitle(query: string, limit = 50): RecipeSummary[] {
  const normalized = query.toLowerCase().trim().replace(/\s+/g, " ");
  if (normalized.length < 2) return [];

  const db = getDb();
  const likePattern = `%${normalized}%`;
  const prefixPattern = `${normalized}%`;

  const rows = db
    .prepare(
      `SELECT id, title, num_ingredients, num_steps
       FROM recipes
       WHERE title_normalized LIKE ?
       ORDER BY
         CASE WHEN title_normalized LIKE ? THEN 0 ELSE 1 END,
         LENGTH(title) ASC
       LIMIT ?`
    )
    .all(likePattern, prefixPattern, limit) as Array<{
    id: string;
    title: string;
    num_ingredients: number;
    num_steps: number;
  }>;

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    num_ingredients: r.num_ingredients,
    num_steps: r.num_steps,
  }));
}

export function searchRecipesByTags(tags: string[], limit = 50): RecipeSummary[] {
  const normalized = normalizePantryTags(tags);
  if (normalized.length === 0) return [];

  const db = getDb();
  const placeholders = normalized.map(() => "?").join(",");

  const rows = db
    .prepare(
      `SELECT r.id, r.title, r.title_normalized, r.num_ingredients, r.num_steps,
              GROUP_CONCAT(DISTINCT it.token) as matched_tokens,
              COUNT(DISTINCT it.token) as match_count
       FROM recipes r
       JOIN ingredient_tokens it ON r.id = it.recipe_id
       WHERE it.token IN (${placeholders})
       GROUP BY r.id
       HAVING match_count >= 1
       ORDER BY match_count ASC, RANDOM()
       LIMIT ?`
    )
    .all(...normalized, limit) as Array<{
    id: string;
    title: string;
    title_normalized: string;
    num_ingredients: number;
    num_steps: number;
    matched_tokens: string;
    match_count: number;
  }>;

  return rows.map((r) => {
    const matchedPantryTags = r.matched_tokens.split(",").filter(Boolean);
    return {
      id: r.id,
      title: r.title,
      num_ingredients: r.num_ingredients,
      num_steps: r.num_steps,
      matchedPantryTags,
      primaryPantryTag: inferPrimaryPantryTag(r.title_normalized, matchedPantryTags),
    };
  });
}

function getUsedTitles(slots: PlanSlot[], skipDay?: number, skipSlot?: number): Set<string> {
  const db = getDb();
  const titles = new Set<string>();
  for (const s of slots) {
    if (s.day === skipDay && s.slot === skipSlot) continue;
    const row = db
      .prepare("SELECT title_normalized FROM recipes WHERE id = ?")
      .get(s.recipeId) as { title_normalized: string } | undefined;
    if (row) titles.add(row.title_normalized);
  }
  return titles;
}

export function generatePlanSlots(config: PlanConfig): PlanSlot[] {
  const pantryTags = normalizePantryTags(config.ingredientTags ?? []);
  const usedIds = new Set<string>();
  const usedTitles = new Set<string>();
  const slots: PlanSlot[] = [];
  const totalNeeded = config.days * config.recipesPerDay;

  for (let day = 1; day <= config.days; day++) {
    const rotation = pantryTags.length > 0 ? rotatePantryTags(pantryTags, day) : [];

    for (let slot = 1; slot <= config.recipesPerDay; slot++) {
      let recipeId: string | null = null;
      let pantryTag: string | undefined;

      if (pantryTags.length > 0) {
        pantryTag = rotation[(slot - 1) % rotation.length];
        const picked = pickRecipeForPantryTag(pantryTag, usedIds, usedTitles);
        recipeId = picked?.id ?? null;
      } else {
        const picked = pickRandomRecipeUnfiltered(usedIds, usedTitles);
        recipeId = picked?.id ?? null;
      }

      if (!recipeId) break;

      const db = getDb();
      const row = db
        .prepare("SELECT title_normalized FROM recipes WHERE id = ?")
        .get(recipeId) as { title_normalized: string };

      usedIds.add(recipeId);
      usedTitles.add(row.title_normalized);
      slots.push({ day, slot, recipeId, pantryTag });
    }
  }

  return slots.length === totalNeeded ? slots : slots;
}

export function swapSlot(
  config: PlanConfig,
  currentSlots: PlanSlot[],
  day: number,
  slot: number
): PlanSlot[] {
  const target = currentSlots.find((s) => s.day === day && s.slot === slot);
  if (!target || target.locked) return currentSlots;

  const usedIds = new Set(
    currentSlots.filter((s) => !(s.day === day && s.slot === slot)).map((s) => s.recipeId)
  );
  const usedTitles = getUsedTitles(currentSlots, day, slot);

  let newId: string | null = null;

  if (target.pantryTag) {
    const picked = pickRecipeForPantryTag(target.pantryTag, usedIds, usedTitles);
    newId = picked?.id ?? null;
  } else {
    const picked = pickRandomRecipeUnfiltered(usedIds, usedTitles);
    newId = picked?.id ?? null;
  }

  if (!newId) return currentSlots;

  return currentSlots.map((s) =>
    s.day === day && s.slot === slot ? { ...s, recipeId: newId } : s
  );
}

export function toggleSlotLock(
  slots: PlanSlot[],
  day: number,
  slot: number
): PlanSlot[] {
  return slots.map((s) =>
    s.day === day && s.slot === slot ? { ...s, locked: !s.locked } : s
  );
}
