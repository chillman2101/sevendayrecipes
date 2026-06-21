import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

export function getDbPath(): string {
  return process.env.DATABASE_PATH || path.join(process.cwd(), "data", "recipes.db");
}

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = getDbPath();
    db = new Database(dbPath, { readonly: true });
  }
  return db;
}

export function getWritableDb(): Database.Database {
  const dbPath = getDbPath();
  return new Database(dbPath);
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

    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      config TEXT NOT NULL,
      slots TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}
