"use client";

import Link from "next/link";
import type { RecipeSummary } from "@/types";

type Props = {
  recipes: RecipeSummary[];
  emptyMessage?: string;
  returnTo?: string;
};

export function RecipeList({ recipes, emptyMessage, returnTo }: Props) {
  if (recipes.length === 0) {
    return (
      <div className="card text-center">
        <p>{emptyMessage ?? "Tidak ada resep yang cocok. Coba bahan lain."}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {recipes.map((recipe) => (
        <Link
          key={recipe.id}
          href={
            returnTo
              ? `/recipe/${recipe.id}?from=${encodeURIComponent(returnTo)}`
              : `/recipe/${recipe.id}?from=${encodeURIComponent("/browse")}`
          }
          className="card block transition-transform hover:-translate-y-0.5"
        >
          <h3 className="mb-2 text-xl font-bold">{recipe.title}</h3>
          <p className="text-body-sm">
            {recipe.num_ingredients} bahan · {recipe.num_steps} langkah
          </p>
          {recipe.primaryPantryTag && (
            <span className="tag mt-4">Pakai: {recipe.primaryPantryTag}</span>
          )}
        </Link>
      ))}
    </div>
  );
}
