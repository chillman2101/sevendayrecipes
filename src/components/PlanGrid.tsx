"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Plan, Recipe } from "@/types";
import { DAY_LABELS } from "@/lib/utils";
import { Button } from "./ui/Button";

type Props = {
  plan: Plan;
  recipes: Recipe[];
};

export function PlanGrid({ plan, recipes }: Props) {
  const router = useRouter();
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));

  async function mutatePlan(path: string, body: { day: number; slot: number }) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return;
    if (data.id && data.id !== plan.id) {
      router.push(`/plan/${encodeURIComponent(data.id)}`);
    } else {
      router.refresh();
    }
  }

  function swap(day: number, slot: number) {
    return mutatePlan(`/api/plans/${encodeURIComponent(plan.id)}/swap`, { day, slot });
  }

  function toggleLock(day: number, slot: number) {
    return mutatePlan(`/api/plans/${encodeURIComponent(plan.id)}/lock`, { day, slot });
  }

  const grouped = Array.from({ length: plan.config.days }, (_, i) => {
    const day = i + 1;
    return {
      day,
      label: DAY_LABELS[i] ?? `Hari ${day}`,
      slots: plan.slots.filter((s) => s.day === day),
    };
  });

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="no-print">
        <Button href={`/plan/${encodeURIComponent(plan.id)}/print`} variant="primary" className="w-full sm:w-auto">
          Cetak Menu + QR
        </Button>
      </div>

      {grouped.map(({ day, label, slots }) => (
        <section key={day} className="card space-y-4 md:space-y-6">
          <h2 className="text-2xl font-bold md:text-heading-sm">
            Hari {day} — {label}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {slots.map((slot) => {
              const recipe = recipeMap.get(slot.recipeId);
              if (!recipe) return null;
              return (
                <article key={`${day}-${slot.slot}`} className="border border-ink-violet bg-cream-paper p-4 md:p-6">
                  <p className="mb-2 text-xs font-bold uppercase md:text-sm">Resep {slot.slot}</p>
                  <h3 className="mb-3 text-lg font-bold leading-snug md:mb-4 md:text-xl">
                    <Link href={`/recipe/${recipe.id}`} className="hover:underline">
                      {recipe.title}
                    </Link>
                  </h3>
                  <p className="mb-4 text-body-sm">
                    {recipe.num_ingredients} bahan · {recipe.num_steps} langkah
                  </p>
                  <div className="flex flex-wrap gap-2 no-print">
                    <button type="button" className="btn-ghost flex-1 text-sm sm:flex-none" onClick={() => swap(day, slot.slot)}>
                      Ganti
                    </button>
                    <button type="button" className="btn-ghost flex-1 text-sm sm:flex-none" onClick={() => toggleLock(day, slot.slot)}>
                      {slot.locked ? "Buka kunci" : "Kunci"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
