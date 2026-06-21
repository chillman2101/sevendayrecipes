export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  num_ingredients: number;
  num_steps: number;
  char_count?: number;
}

export interface PlanConfig {
  days: 1 | 3 | 7;
  recipesPerDay: 1 | 2 | 3;
  ingredientTags?: string[];
}

export interface PlanSlot {
  day: number;
  slot: number;
  recipeId: string;
  pantryTag?: string;
  locked?: boolean;
}

export interface Plan {
  id: string;
  config: PlanConfig;
  slots: PlanSlot[];
  createdAt: string;
}

export interface RecipeSummary {
  id: string;
  title: string;
  num_ingredients: number;
  num_steps: number;
  matchedPantryTags?: string[];
  primaryPantryTag?: string;
}
