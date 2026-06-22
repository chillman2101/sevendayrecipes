import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { initSchema } from "@/lib/db";
import { extractTokensFromIngredients } from "@/lib/ingredients";

interface RawRecipe {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  num_ingredients: number;
  num_steps: number;
}

const ROOT = path.join(__dirname, "..");
const JSON_PATH = path.join(ROOT, "data", "recipes.json");
const DB_PATH = path.join(ROOT, "data", "recipes.db");

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim().replace(/\s+/g, " ");
}

function main() {
  console.log("Reading recipes.json...");
  const raw = fs.readFileSync(JSON_PATH, "utf-8");
  const recipes = JSON.parse(raw) as RawRecipe[];
  console.log(`Found ${recipes.length} recipes`);

  let db: Database.Database;
  if (fs.existsSync(DB_PATH)) {
    try {
      fs.unlinkSync(DB_PATH);
      db = new Database(DB_PATH);
    } catch {
      db = new Database(DB_PATH);
      db.exec(`
        DROP TABLE IF EXISTS ingredient_tokens;
        DROP TABLE IF EXISTS recipes;
        DROP TABLE IF EXISTS popular_tokens;
      `);
    }
  } else {
    db = new Database(DB_PATH);
  }

  initSchema(db);

  db.exec("ANALYZE");

  const insertRecipe = db.prepare(`
    INSERT INTO recipes (id, title, title_normalized, ingredients, steps, num_ingredients, num_steps)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertToken = db.prepare(`
    INSERT OR IGNORE INTO ingredient_tokens (token, recipe_id) VALUES (?, ?)
  `);

  const tx = db.transaction((items: RawRecipe[]) => {
    for (const recipe of items) {
      insertRecipe.run(
        recipe.id,
        recipe.title,
        normalizeTitle(recipe.title),
        JSON.stringify(recipe.ingredients),
        JSON.stringify(recipe.steps),
        recipe.num_ingredients,
        recipe.num_steps
      );

      const tokens = extractTokensFromIngredients(recipe.ingredients);
      for (const token of tokens) {
        insertToken.run(token, recipe.id);
      }
    }
  });

  console.log("Building database...");
  tx(recipes);

  console.log("Caching popular tokens...");
  db.exec(`
    DELETE FROM popular_tokens;
    INSERT INTO popular_tokens (token, cnt)
    SELECT token, COUNT(*) as cnt FROM ingredient_tokens
    GROUP BY token ORDER BY cnt DESC LIMIT 500;
  `);
  db.exec("ANALYZE");

  const tokenCount = db.prepare("SELECT COUNT(*) as c FROM ingredient_tokens").get() as { c: number };
  console.log(`Done. ${recipes.length} recipes, ${tokenCount.c} tokens`);
  console.log(`Database: ${DB_PATH}`);

  db.close();
}

main();
