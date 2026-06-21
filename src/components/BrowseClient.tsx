"use client";

import { useState } from "react";
import { IngredientTagInput } from "./IngredientTagInput";
import { MobileSearchInput } from "./MobileSearchInput";
import { RecipeList } from "./RecipeList";
import { Button } from "./ui/Button";
import { useKeyboardPadding } from "@/hooks/useMobileInputFocus";
import type { RecipeSummary } from "@/types";

type Props = {
  popularTokens: string[];
};

type SearchMode = "ingredients" | "name";

const tabClass = (active: boolean) =>
  `flex-1 border border-ink-violet px-4 py-3 text-sm font-bold sm:flex-none sm:px-6 sm:text-base ${
    active ? "bg-butter-yellow" : "bg-pure-white"
  }`;

export function BrowseClient({ popularTokens }: Props) {
  const [mode, setMode] = useState<SearchMode>("ingredients");
  const [tags, setTags] = useState<string[]>([]);
  const [nameQuery, setNameQuery] = useState("");
  const [matchMode, setMatchMode] = useState<"all" | "partial">("partial");
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const keyboardPadding = useKeyboardPadding();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (mode === "ingredients" && tags.length === 0) return;
    if (mode === "name" && nameQuery.trim().length < 2) return;

    setLoading(true);

    const params =
      mode === "name"
        ? new URLSearchParams({ q: nameQuery.trim() })
        : new URLSearchParams({ tags: tags.join(","), matchMode });

    const res = await fetch(`/api/recipes/search?${params}`);
    const data = await res.json();
    setRecipes(data.recipes ?? []);
    setSearched(true);
    setLoading(false);
  }

  const canSearch =
    mode === "name" ? nameQuery.trim().length >= 2 : tags.length > 0;

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={tabClass(mode === "ingredients")} onClick={() => setMode("ingredients")}>
          Cari by Bahan
        </button>
        <button type="button" className={tabClass(mode === "name")} onClick={() => setMode("name")}>
          Cari by Nama
        </button>
      </div>

      <form
        onSubmit={handleSearch}
        className="card space-y-6"
        style={{ paddingBottom: keyboardPadding > 0 ? keyboardPadding : undefined }}
      >
        {mode === "ingredients" ? (
          <>
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
          </>
        ) : (
          <div className="space-y-2">
            <label htmlFor="recipe-name-search" className="text-sm font-bold md:text-base">
              Nama resep / menu
            </label>
            <MobileSearchInput
              id="recipe-name-search"
              type="search"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder="Contoh: rendang, ayam goreng, soto..."
            />
            <p className="text-sm text-ink-violet/80">Minimal 2 karakter.</p>
          </div>
        )}

        <Button type="submit" disabled={loading || !canSearch} className="w-full sm:w-auto">
          {loading ? "Mencari..." : "Cari Resep"}
        </Button>
      </form>

      {searched && <RecipeList recipes={recipes} emptyMessage={mode === "name" ? "Tidak ada resep dengan nama itu." : undefined} />}
    </div>
  );
}
