import { getDb } from "./db";
import { normalizeTag } from "./ingredients";

export function normalizePantryTags(tags: string[]): string[] {
  return [...new Set(tags.map(normalizeTag).filter(Boolean))];
}

export function titleMatchesTag(titleNormalized: string, tag: string): boolean {
  return titleNormalized.includes(tag);
}

export function inferPrimaryPantryTag(
  titleNormalized: string,
  matchedTags: string[]
): string | undefined {
  if (matchedTags.length === 0) return undefined;
  const fromTitle = matchedTags.find((t) => titleMatchesTag(titleNormalized, t));
  return fromTitle ?? matchedTags[0];
}

export function getRecipePantryMatch(recipeId: string, pantryTags: string[]): string[] {
  if (pantryTags.length === 0) return [];
  const db = getDb();
  const placeholders = pantryTags.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT DISTINCT token FROM ingredient_tokens
       WHERE recipe_id = ? AND token IN (${placeholders})`
    )
    .all(recipeId, ...pantryTags) as Array<{ token: string }>;
  return rows.map((r) => r.token);
}

export function rotatePantryTags(tags: string[], dayOffset: number): string[] {
  if (tags.length === 0) return [];
  const shuffled = [...tags].sort(() => Math.random() - 0.5);
  const offset = (dayOffset - 1) % shuffled.length;
  return [...shuffled.slice(offset), ...shuffled.slice(0, offset)];
}

export function pickRecipeForPantryTag(
  tag: string,
  excludeIds: Set<string>,
  excludeTitles: Set<string>,
  maxAttempts = 80
): { id: string; title_normalized: string } | null {
  const db = getDb();
  const titlePattern = `%${tag}%`;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const rows = db
      .prepare(
        `SELECT r.id, r.title_normalized
         FROM recipes r
         JOIN ingredient_tokens it ON r.id = it.recipe_id
         WHERE it.token = ?
         ORDER BY
           CASE WHEN r.title_normalized LIKE ? THEN 0 ELSE 1 END,
           RANDOM()
         LIMIT 20`
      )
      .all(tag, titlePattern) as Array<{ id: string; title_normalized: string }>;

    for (const row of rows) {
      if (excludeIds.has(row.id)) continue;
      if (excludeTitles.has(row.title_normalized)) continue;
      return row;
    }
  }

  return null;
}

export function pickRandomRecipeUnfiltered(
  excludeIds: Set<string>,
  excludeTitles: Set<string>,
  maxAttempts = 80
): { id: string; title_normalized: string } | null {
  const db = getDb();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const row = db
      .prepare("SELECT id, title_normalized FROM recipes ORDER BY RANDOM() LIMIT 1")
      .get() as { id: string; title_normalized: string } | undefined;

    if (!row) return null;
    if (excludeIds.has(row.id)) continue;
    if (excludeTitles.has(row.title_normalized)) continue;
    return row;
  }

  return null;
}
