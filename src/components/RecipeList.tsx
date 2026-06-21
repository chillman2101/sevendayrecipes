"use client";

import Link from "next/link";
import type { RecipeSummary } from "@/types";

type Props = {
  recipes: RecipeSummary[];
};

export function RecipeList({ recipes }: Props) {
  if (recipes.length === 0) {
    return (
      <div className="card text-center">
        <p>Tidak ada resep yang cocok. Coba kurangi tag atau ganti mode pencarian.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {recipes.map((recipe) => (
        <Link
          key={recipe.id}
          href={`/recipe/${recipe.id}`}
          className="card block transition-transform hover:-translate-y-0.5"
        >
          <h3 className="mb-2 text-xl font-bold">{recipe.title}</h3>
          <p className="text-body-sm">
            {recipe.num_ingredients} bahan · {recipe.num_steps} langkah
          </p>
          {recipe.matchScore !== undefined && (
            <span className="tag mt-4">{recipe.matchScore}% bahan cocok</span>
          )}
        </Link>
      ))}
    </div>
  );
}
