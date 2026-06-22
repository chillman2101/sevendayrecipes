import type { PlanConfig, PlanSlot, Recipe, RecipeSummary } from "@/types";
import { getDb } from "./db";
import {
  clearPoolCache,
  inferPrimaryPantryTag,
  normalizePantryTags,
  pickRandomRecipeUnfiltered,
  pickRecipeForPantryTag,
  preloadPantryPools,
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
  try {
    const rows = db
      .prepare("SELECT token FROM popular_tokens ORDER BY cnt DESC LIMIT ?")
      .all(limit) as Array<{ token: string }>;
    if (rows.length > 0) return rows.map((r) => r.token);
  } catch {
    // fallback if popular_tokens not built yet
  }

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
  const perTagLimit = Math.max(20, Math.ceil(limit / normalized.length) + 5);
  const seen = new Set<string>();
  const results: RecipeSummary[] = [];

  const idStmt = db.prepare(
    "SELECT recipe_id FROM ingredient_tokens WHERE token = ? LIMIT ?"
  );

  for (const tag of normalized) {
    const idRows = idStmt.all(tag, perTagLimit * 2) as Array<{ recipe_id: string }>;
    const ids = [...new Set(idRows.map((r) => r.recipe_id))].slice(0, perTagLimit);

    if (ids.length === 0) continue;

    const placeholders = ids.map(() => "?").join(",");
    const rows = db
      .prepare(
        `SELECT id, title, title_normalized, num_ingredients, num_steps
         FROM recipes WHERE id IN (${placeholders})`
      )
      .all(...ids) as Array<{
      id: string;
      title: string;
      title_normalized: string;
      num_ingredients: number;
      num_steps: number;
    }>;

    const ordered = [
      ...rows.filter((r) => r.title_normalized.includes(tag)),
      ...rows.filter((r) => !r.title_normalized.includes(tag)),
    ];

    for (const r of ordered) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);

      results.push({
        id: r.id,
        title: r.title,
        num_ingredients: r.num_ingredients,
        num_steps: r.num_steps,
        matchedPantryTags: [tag],
        primaryPantryTag: inferPrimaryPantryTag(r.title_normalized, [tag]),
      });

      if (results.length >= limit) return results;
    }
  }

  return results;
}

function getUsedTitles(slots: PlanSlot[], skipDay?: number, skipSlot?: number): Set<string> {
  const ids = slots
    .filter((s) => !(s.day === skipDay && s.slot === skipSlot))
    .map((s) => s.recipeId);

  if (ids.length === 0) return new Set();

  const db = getDb();
  const placeholders = ids.map(() => "?").join(",");
  const rows = db
    .prepare(`SELECT title_normalized FROM recipes WHERE id IN (${placeholders})`)
    .all(...ids) as Array<{ title_normalized: string }>;

  return new Set(rows.map((r) => r.title_normalized));
}

export function generatePlanSlots(config: PlanConfig): PlanSlot[] {
  const pantryTags = normalizePantryTags(config.ingredientTags ?? []);
  const usedIds = new Set<string>();
  const usedTitles = new Set<string>();
  const slots: PlanSlot[] = [];
  const totalNeeded = config.days * config.recipesPerDay;

  try {
    if (pantryTags.length > 0) {
      preloadPantryPools(pantryTags);
    }

    for (let day = 1; day <= config.days; day++) {
      const rotation = pantryTags.length > 0 ? rotatePantryTags(pantryTags, day) : [];

      for (let slot = 1; slot <= config.recipesPerDay; slot++) {
        let picked = null;
        let pantryTag: string | undefined;

        if (pantryTags.length > 0) {
          pantryTag = rotation[(slot - 1) % rotation.length];
          picked = pickRecipeForPantryTag(pantryTag, usedIds, usedTitles);
        } else {
          picked = pickRandomRecipeUnfiltered(usedIds, usedTitles);
        }

        if (!picked) break;

        usedIds.add(picked.id);
        usedTitles.add(picked.title_normalized);
        slots.push({ day, slot, recipeId: picked.id, pantryTag });
      }
    }
  } finally {
    clearPoolCache();
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

  try {
    if (target.pantryTag) {
      preloadPantryPools([target.pantryTag]);
    }

    const picked = target.pantryTag
      ? pickRecipeForPantryTag(target.pantryTag, usedIds, usedTitles)
      : pickRandomRecipeUnfiltered(usedIds, usedTitles);

    if (!picked) return currentSlots;

    return currentSlots.map((s) =>
      s.day === day && s.slot === slot ? { ...s, recipeId: picked.id } : s
    );
  } finally {
    clearPoolCache();
  }
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
