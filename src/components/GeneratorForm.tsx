"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IngredientTagInput } from "./IngredientTagInput";
import { Button } from "./ui/Button";

type Props = {
  popularTokens: string[];
};

export function GeneratorForm({ popularTokens }: Props) {
  const router = useRouter();
  const [days, setDays] = useState<1 | 3 | 7>(7);
  const [recipesPerDay, setRecipesPerDay] = useState<1 | 2 | 3>(2);
  const [tags, setTags] = useState<string[]>([]);
  const [matchMode, setMatchMode] = useState<"all" | "partial">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days, recipesPerDay, ingredientTags: tags, matchMode }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Gagal generate menu");
      return;
    }

    router.push(`/plan/${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-10">
      <section className="space-y-4">
        <h2 className="text-subheading font-bold">Durasi menu</h2>
        <div className="flex flex-wrap gap-3">
          {[1, 3, 7].map((d) => (
            <button
              key={d}
              type="button"
              className={`border border-ink-violet px-6 py-3 font-bold ${days === d ? "bg-butter-yellow" : "bg-pure-white"}`}
              onClick={() => setDays(d as 1 | 3 | 7)}
            >
              {d} hari
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-subheading font-bold">Resep per hari</h2>
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              className={`border border-ink-violet px-6 py-3 font-bold ${recipesPerDay === n ? "bg-butter-yellow" : "bg-pure-white"}`}
              onClick={() => setRecipesPerDay(n as 1 | 2 | 3)}
            >
              {n} resep
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-subheading font-bold">Bahan yang tersedia (opsional)</h2>
        <p className="text-body-sm">Filter resep berdasarkan bahan di dapur Anda.</p>
        <IngredientTagInput popularTokens={popularTokens} selected={tags} onChange={setTags} />

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={matchMode === "all"}
                onChange={() => setMatchMode("all")}
              />
              Semua bahan harus cocok
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={matchMode === "partial"}
                onChange={() => setMatchMode("partial")}
              />
              Sebagian bahan cocok (≥50%)
            </label>
          </div>
        )}
      </section>

      {error && <p className="text-red-700">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Generating..." : "Generate Menu"}
      </Button>
    </form>
  );
}
