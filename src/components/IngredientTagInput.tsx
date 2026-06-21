"use client";

import { useState } from "react";

type Props = {
  popularTokens: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
};

export function IngredientTagInput({ popularTokens, selected, onChange }: Props) {
  const [query, setQuery] = useState("");

  const suggestions = popularTokens
    .filter((t) => t.includes(query.toLowerCase()) && !selected.includes(t))
    .slice(0, 8);

  function addTag(tag: string) {
    const normalized = tag.toLowerCase().trim();
    if (!normalized || selected.includes(normalized)) return;
    onChange([...selected, normalized]);
    setQuery("");
  }

  function removeTag(tag: string) {
    onChange(selected.filter((t) => t !== tag));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {selected.map((tag) => (
          <span key={tag} className="tag">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} aria-label={`Hapus ${tag}`}>
              ×
            </button>
          </span>
        ))}
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTag(query);
          }
        }}
        placeholder="Ketik bahan: ayam, bawang putih, cabai..."
        className="w-full border border-ink-violet bg-pure-white px-4 py-3 text-base"
      />

      {query && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s} type="button" className="btn-ghost text-sm" onClick={() => addTag(s)}>
              + {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {popularTokens.slice(0, 12).map((t) => (
          <button
            key={t}
            type="button"
            disabled={selected.includes(t)}
            className="border border-ink-violet px-3 py-1 text-sm disabled:opacity-40"
            onClick={() => addTag(t)}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
