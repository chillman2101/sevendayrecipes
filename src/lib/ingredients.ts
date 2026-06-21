const UNITS = new Set([
  "sdm", "sdt", "kg", "gr", "gram", "ons", "ml", "liter", "siung", "bh", "buah",
  "lembar", "butir", "secukupnya", "secukup", "secukupnya,", "secukupnya.",
]);

export function normalizeIngredientLine(line: string): string {
  return line
    .toLowerCase()
    .replace(/[()[\].,:/]/g, " ")
    .replace(/\d+[\d./,-]*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeIngredientLine(line: string): string[] {
  const normalized = normalizeIngredientLine(line);
  if (!normalized || normalized.length < 2) return [];

  const words = normalized.split(" ").filter((w) => w.length > 1 && !UNITS.has(w));
  const tokens: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const next = words[i + 1];
    if (next && (w === "bawang" || w === "daun" || w === "cabai" || w === "sambal")) {
      tokens.push(`${w} ${next}`);
      i++;
      continue;
    }
    if (w.length >= 3) tokens.push(w);
  }

  return [...new Set(tokens)];
}

export function extractTokensFromIngredients(ingredients: string[]): string[] {
  const all = ingredients.flatMap(tokenizeIngredientLine);
  return [...new Set(all)];
}

export function normalizeTag(tag: string): string {
  return tag.toLowerCase().trim().replace(/\s+/g, " ");
}
