import { getDb } from "./db";
import { normalizeTag } from "./ingredients";

export type RecipeCandidate = { id: string; title_normalized: string };

const poolCache = new Map<string, RecipeCandidate[]>();

export function clearPoolCache(): void {
  poolCache.clear();
}

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

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildCandidatePool(tag: string, limit: number): RecipeCandidate[] {
  const db = getDb();

  const idRows = db
    .prepare("SELECT recipe_id FROM ingredient_tokens WHERE token = ? LIMIT ?")
    .all(tag, limit * 3) as Array<{ recipe_id: string }>;

  if (idRows.length === 0) return [];

  const uniqueIds = [...new Set(idRows.map((r) => r.recipe_id))].slice(0, limit * 2);
  const placeholders = uniqueIds.map(() => "?").join(",");

  const rows = db
    .prepare(`SELECT id, title_normalized FROM recipes WHERE id IN (${placeholders})`)
    .all(...uniqueIds) as RecipeCandidate[];

  const focused = rows.filter((r) => r.title_normalized.includes(tag));
  const other = rows.filter((r) => !r.title_normalized.includes(tag));

  return [...shuffle(focused), ...shuffle(other)].slice(0, limit);
}

export function getCandidatesForTag(tag: string, limit = 400): RecipeCandidate[] {
  const cached = poolCache.get(tag);
  if (cached) return cached;

  const pool = buildCandidatePool(tag, limit);
  poolCache.set(tag, pool);
  return pool;
}

export function preloadPantryPools(tags: string[]): void {
  for (const tag of tags) {
    getCandidatesForTag(tag);
  }
}

export function rotatePantryTags(tags: string[], dayOffset: number): string[] {
  if (tags.length === 0) return [];
  const shuffled = shuffle(tags);
  const offset = (dayOffset - 1) % shuffled.length;
  return [...shuffled.slice(offset), ...shuffled.slice(0, offset)];
}

export function pickFromPool(
  pool: RecipeCandidate[],
  excludeIds: Set<string>,
  excludeTitles: Set<string>
): RecipeCandidate | null {
  for (const row of shuffle(pool)) {
    if (excludeIds.has(row.id)) continue;
    if (excludeTitles.has(row.title_normalized)) continue;
    return row;
  }
  return null;
}

export function pickRecipeForPantryTag(
  tag: string,
  excludeIds: Set<string>,
  excludeTitles: Set<string>
): RecipeCandidate | null {
  return pickFromPool(getCandidatesForTag(tag), excludeIds, excludeTitles);
}

let randomIdCache: RecipeCandidate[] | null = null;

function getRandomIdPool(): RecipeCandidate[] {
  if (randomIdCache) return randomIdCache;
  const db = getDb();
  randomIdCache = db
    .prepare("SELECT id, title_normalized FROM recipes ORDER BY rowid LIMIT 5000")
    .all() as RecipeCandidate[];
  return randomIdCache;
}

export function pickRandomRecipeUnfiltered(
  excludeIds: Set<string>,
  excludeTitles: Set<string>
): RecipeCandidate | null {
  const pool = getRandomIdPool();
  return pickFromPool(pool, excludeIds, excludeTitles);
}
