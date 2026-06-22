import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

let db: Database.Database | null = null;

export function getDbPath(): string {
  if (process.env.DATABASE_PATH && fs.existsSync(process.env.DATABASE_PATH)) {
    return process.env.DATABASE_PATH;
  }

  const candidates = [
    path.join(process.cwd(), "data", "recipes.db"),
    path.join(process.cwd(), ".next", "server", "data", "recipes.db"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return path.join(process.cwd(), "data", "recipes.db");
}

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(getDbPath(), { readonly: true, fileMustExist: true });
    db.pragma("cache_size = -64000");
    db.pragma("temp_store = memory");
  }
  return db;
}

export function initSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      title_normalized TEXT NOT NULL,
      ingredients TEXT NOT NULL,
      steps TEXT NOT NULL,
      num_ingredients INTEGER NOT NULL,
      num_steps INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ingredient_tokens (
      token TEXT NOT NULL,
      recipe_id TEXT NOT NULL,
      PRIMARY KEY (token, recipe_id)
    );

    CREATE INDEX IF NOT EXISTS idx_tokens_token ON ingredient_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_tokens_recipe ON ingredient_tokens(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes(title_normalized);

    CREATE TABLE IF NOT EXISTS popular_tokens (
      token TEXT PRIMARY KEY,
      cnt INTEGER NOT NULL
    );
  `);
}
