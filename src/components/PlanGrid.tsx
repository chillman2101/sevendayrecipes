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

  async function swap(day: number, slot: number) {
    await fetch(`/api/plans/${plan.id}/swap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, slot }),
    });
    router.refresh();
  }

  async function toggleLock(day: number, slot: number) {
    await fetch(`/api/plans/${plan.id}/lock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, slot }),
    });
    router.refresh();
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
    <div className="space-y-10">
      <div className="flex flex-wrap gap-4 no-print">
        <Button href={`/plan/${plan.id}/print`} variant="primary">
          Cetak Menu + QR
        </Button>
      </div>

      {grouped.map(({ day, label, slots }) => (
        <section key={day} className="card space-y-6">
          <h2 className="text-heading-sm font-bold">
            Hari {day} — {label}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {slots.map((slot) => {
              const recipe = recipeMap.get(slot.recipeId);
              if (!recipe) return null;
              return (
                <article key={`${day}-${slot.slot}`} className="border border-ink-violet bg-cream-paper p-6">
                  <p className="mb-2 text-sm font-bold uppercase">Resep {slot.slot}</p>
                  <h3 className="mb-4 text-xl font-bold">
                    <Link href={`/recipe/${recipe.id}`} className="hover:underline">
                      {recipe.title}
                    </Link>
                  </h3>
                  <p className="mb-4 text-body-sm">
                    {recipe.num_ingredients} bahan · {recipe.num_steps} langkah
                  </p>
                  <div className="flex flex-wrap gap-2 no-print">
                    <button
                      type="button"
                      className="btn-ghost text-sm"
                      onClick={() => swap(day, slot.slot)}
                    >
                      Ganti
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-sm"
                      onClick={() => toggleLock(day, slot.slot)}
                    >
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
