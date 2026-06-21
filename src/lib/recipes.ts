import type { PlanConfig, PlanSlot, Recipe, RecipeSummary } from "@/types";
import { getDb } from "./db";
import { normalizeTag } from "./ingredients";

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

export function searchRecipesByTags(
  tags: string[],
  matchMode: "all" | "partial" = "all",
  partialThreshold = 0.5,
  limit = 50
): RecipeSummary[] {
  if (tags.length === 0) return [];

  const normalized = tags.map(normalizeTag);
  const db = getDb();

  if (matchMode === "all") {
    const placeholders = normalized.map(() => "?").join(",");
    const rows = db
      .prepare(
        `SELECT r.id, r.title, r.num_ingredients, r.num_steps, COUNT(DISTINCT it.token) as match_count
         FROM recipes r
         JOIN ingredient_tokens it ON r.id = it.recipe_id
         WHERE it.token IN (${placeholders})
         GROUP BY r.id
         HAVING match_count = ?
         ORDER BY RANDOM()
         LIMIT ?`
      )
      .all(...normalized, normalized.length, limit) as Array<{
      id: string;
      title: string;
      num_ingredients: number;
      num_steps: number;
      match_count: number;
    }>;

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      num_ingredients: r.num_ingredients,
      num_steps: r.num_steps,
      matchScore: Math.round((r.match_count / normalized.length) * 100),
    }));
  }

  const placeholders = normalized.map(() => "?").join(",");
  const minMatches = Math.max(1, Math.ceil(normalized.length * partialThreshold));
  const rows = db
    .prepare(
      `SELECT r.id, r.title, r.num_ingredients, r.num_steps, COUNT(DISTINCT it.token) as match_count
       FROM recipes r
       JOIN ingredient_tokens it ON r.id = it.recipe_id
       WHERE it.token IN (${placeholders})
       GROUP BY r.id
       HAVING match_count >= ?
       ORDER BY match_count DESC, RANDOM()
       LIMIT ?`
    )
    .all(...normalized, minMatches, limit) as Array<{
    id: string;
    title: string;
    num_ingredients: number;
    num_steps: number;
    match_count: number;
  }>;

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    num_ingredients: r.num_ingredients,
    num_steps: r.num_steps,
    matchScore: Math.round((r.match_count / normalized.length) * 100),
  }));
}

function pickRandomRecipe(
  config: PlanConfig,
  excludeIds: Set<string>,
  excludeTitles: Set<string>,
  maxAttempts = 80
): string | null {
  const tags = config.ingredientTags?.map(normalizeTag) ?? [];
  const db = getDb();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let row: { id: string; title_normalized: string } | undefined;

    if (tags.length === 0) {
      row = db
        .prepare("SELECT id, title_normalized FROM recipes ORDER BY RANDOM() LIMIT 1")
        .get() as { id: string; title_normalized: string } | undefined;
    } else if ((config.matchMode ?? "all") === "all") {
      const placeholders = tags.map(() => "?").join(",");
      row = db
        .prepare(
          `SELECT r.id, r.title_normalized
           FROM recipes r
           JOIN ingredient_tokens it ON r.id = it.recipe_id
           WHERE it.token IN (${placeholders})
           GROUP BY r.id
           HAVING COUNT(DISTINCT it.token) = ?
           ORDER BY RANDOM()
           LIMIT 1`
        )
        .get(...tags, tags.length) as { id: string; title_normalized: string } | undefined;
    } else {
      const placeholders = tags.map(() => "?").join(",");
      const minMatches = Math.max(1, Math.ceil(tags.length * (config.partialThreshold ?? 0.5)));
      row = db
        .prepare(
          `SELECT r.id, r.title_normalized
           FROM recipes r
           JOIN ingredient_tokens it ON r.id = it.recipe_id
           WHERE it.token IN (${placeholders})
           GROUP BY r.id
           HAVING COUNT(DISTINCT it.token) >= ?
           ORDER BY RANDOM()
           LIMIT 1`
        )
        .get(...tags, minMatches) as { id: string; title_normalized: string } | undefined;
    }

    if (!row) return null;
    if (excludeIds.has(row.id)) continue;
    if (excludeTitles.has(row.title_normalized)) continue;
    return row.id;
  }

  return null;
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
  const usedIds = new Set<string>();
  const usedTitles = new Set<string>();
  const slots: PlanSlot[] = [];
  const totalNeeded = config.days * config.recipesPerDay;

  for (let day = 1; day <= config.days; day++) {
    for (let slot = 1; slot <= config.recipesPerDay; slot++) {
      const recipeId = pickRandomRecipe(config, usedIds, usedTitles);
      if (!recipeId) break;

      const db = getDb();
      const row = db
        .prepare("SELECT title_normalized FROM recipes WHERE id = ?")
        .get(recipeId) as { title_normalized: string };

      usedIds.add(recipeId);
      usedTitles.add(row.title_normalized);
      slots.push({ day, slot, recipeId });
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

  const newId = pickRandomRecipe(config, usedIds, usedTitles);
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
