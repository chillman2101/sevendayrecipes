"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useKeyboardPadding } from "@/hooks/useMobileInputFocus";
import { PageLoading } from "./PageLoading";
import { IngredientTagInput } from "./IngredientTagInput";
import { Button } from "./ui/Button";

type Props = {
  popularTokens: string[];
};

const optionClass = (active: boolean) =>
  `min-w-[88px] flex-1 border border-ink-violet px-4 py-3 text-sm font-bold sm:flex-none sm:px-6 sm:text-base ${
    active ? "bg-butter-yellow" : "bg-pure-white"
  }`;

export function GeneratorForm({ popularTokens }: Props) {
  const router = useRouter();
  const [days, setDays] = useState<1 | 3 | 7>(7);
  const [recipesPerDay, setRecipesPerDay] = useState<1 | 2 | 3>(2);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const keyboardPadding = useKeyboardPadding();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days, recipesPerDay, ingredientTags: tags }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Gagal generate menu");
      return;
    }

    router.push(`/plan/${encodeURIComponent(data.id)}`);
  }

  return (
    <>
      {loading && <PageLoading message="Menyusun menu mingguan Anda..." />}
      <form
      onSubmit={handleSubmit}
      className="card space-y-8 md:space-y-10"
      style={{ paddingBottom: keyboardPadding > 0 ? keyboardPadding : undefined }}
    >
      <section className="space-y-3 md:space-y-4">
        <h2 className="text-xl font-bold md:text-subheading">Durasi menu</h2>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {[1, 3, 7].map((d) => (
            <button key={d} type="button" className={optionClass(days === d)} onClick={() => setDays(d as 1 | 3 | 7)}>
              {d} hari
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 md:space-y-4">
        <h2 className="text-xl font-bold md:text-subheading">Masakan per hari</h2>
        <p className="text-sm text-ink-violet/80 md:text-body-sm">
          Tiap hari bisa beberapa lauk terpisah — misalnya ayam goreng + tempe goreng + tahu, bukan digabung
          jadi satu resep.
        </p>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              className={optionClass(recipesPerDay === n)}
              onClick={() => setRecipesPerDay(n as 1 | 2 | 3)}
            >
              {n} masakan
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 md:space-y-4">
        <h2 className="text-xl font-bold md:text-subheading">Bahan di dapur (opsional)</h2>
        <p className="text-sm md:text-body-sm">
          Menu dirakit dari bahan yang Anda punya. Setiap masakan memakai salah satu bahan — tidak harus
          digabung dalam satu resep.
        </p>
        <IngredientTagInput popularTokens={popularTokens} selected={tags} onChange={setTags} />
      </section>

      {error && <p className="text-sm text-red-700 md:text-base">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        Generate Menu
      </Button>
    </form>
    </>
  );
}
