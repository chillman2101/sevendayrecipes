"use client";

import { useState } from "react";
import { IngredientTagInput } from "./IngredientTagInput";
import { RecipeList } from "./RecipeList";
import { Button } from "./ui/Button";
import type { RecipeSummary } from "@/types";

type Props = {
  popularTokens: string[];
};

export function BrowseClient({ popularTokens }: Props) {
  const [tags, setTags] = useState<string[]>([]);
  const [matchMode, setMatchMode] = useState<"all" | "partial">("partial");
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (tags.length === 0) return;

    setLoading(true);
    const params = new URLSearchParams({
      tags: tags.join(","),
      matchMode,
    });
    const res = await fetch(`/api/recipes/search?${params}`);
    const data = await res.json();
    setRecipes(data.recipes ?? []);
    setSearched(true);
    setLoading(false);
  }

  return (
    <div className="space-y-10">
      <form onSubmit={handleSearch} className="card space-y-6">
        <IngredientTagInput popularTokens={popularTokens} selected={tags} onChange={setTags} />

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
          <label className="flex items-center gap-2 text-sm md:text-base">
            <input type="radio" checked={matchMode === "all"} onChange={() => setMatchMode("all")} />
            Semua bahan cocok
          </label>
          <label className="flex items-center gap-2 text-sm md:text-base">
            <input
              type="radio"
              checked={matchMode === "partial"}
              onChange={() => setMatchMode("partial")}
            />
            Sebagian bahan cocok
          </label>
        </div>

        <Button type="submit" disabled={loading || tags.length === 0} className="w-full sm:w-auto">
          {loading ? "Mencari..." : "Cari Resep"}
        </Button>
      </form>

      {searched && <RecipeList recipes={recipes} />}
    </div>
  );
}
