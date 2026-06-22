"use client";

import { useMemo, useState } from "react";
import { PageLoading } from "./PageLoading";
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
        : new URLSearchParams({ tags: tags.join(",") });

    const res = await fetch(`/api/recipes/search?${params}`);
    const data = await res.json();
    setRecipes(data.recipes ?? []);
    setSearched(true);
    setLoading(false);
  }

  const canSearch = mode === "name" ? nameQuery.trim().length >= 2 : tags.length > 0;

  const groupedByTag = useMemo(() => {
    if (mode !== "ingredients" || tags.length === 0) return null;

    const groups = new Map<string, RecipeSummary[]>();
    for (const tag of tags) {
      groups.set(tag, []);
    }

    for (const recipe of recipes) {
      const tag = recipe.primaryPantryTag ?? recipe.matchedPantryTags?.[0];
      if (tag && groups.has(tag)) {
        groups.get(tag)!.push(recipe);
      } else if (recipe.matchedPantryTags?.[0]) {
        const t = recipe.matchedPantryTags[0];
        if (!groups.has(t)) groups.set(t, []);
        groups.get(t)!.push(recipe);
      }
    }

    return [...groups.entries()].filter(([, items]) => items.length > 0);
  }, [mode, tags, recipes]);

  return (
    <div className="space-y-8 md:space-y-10">
      {loading && <PageLoading message="Mencari resep..." />}
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
          <div className="space-y-2">
            <p className="text-sm text-ink-violet/80 md:text-body-sm">
              Temukan berbagai masakan terpisah yang bisa dibuat dari bahan di dapur Anda.
            </p>
            <IngredientTagInput popularTokens={popularTokens} selected={tags} onChange={setTags} />
          </div>
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
          Cari Resep
        </Button>
      </form>

      {searched && groupedByTag && groupedByTag.length > 0 ? (
        <div className="space-y-8">
          {groupedByTag.map(([tag, items]) => (
            <section key={tag} className="space-y-4">
              <h2 className="text-xl font-bold md:text-subheading">Resep {tag}</h2>
              <RecipeList recipes={items} returnTo="/browse" />
            </section>
          ))}
        </div>
      ) : (
        searched && (
          <RecipeList
            recipes={recipes}
            returnTo="/browse"
            emptyMessage={
              mode === "name"
                ? "Tidak ada resep dengan nama itu."
                : "Tidak ada resep untuk bahan ini. Coba bahan lain."
            }
          />
        )
      )}
    </div>
  );
}
