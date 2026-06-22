"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Plan, Recipe } from "@/types";
import { downloadPlanPdf } from "@/lib/plan-pdf-client";
import { DAY_LABELS } from "@/lib/utils";
import { PageLoading } from "./PageLoading";
import { Button } from "./ui/Button";

type Props = {
  plan: Plan;
  recipes: Recipe[];
};

function formatDayMenu(titles: string[]): string {
  if (titles.length === 0) return "";
  if (titles.length === 1) return titles[0];
  return titles.join(" · ");
}

export function PlanGrid({ plan, recipes }: Props) {
  const router = useRouter();
  const [pdfLoading, setPdfLoading] = useState(false);
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
    const slots = plan.slots.filter((s) => s.day === day);
    const titles = slots
      .map((s) => recipeMap.get(s.recipeId)?.title)
      .filter(Boolean) as string[];

    return {
      day,
      label: DAY_LABELS[i] ?? `Hari ${day}`,
      slots,
      menuSummary: formatDayMenu(titles),
    };
  });

  const planPath = `/plan/${encodeURIComponent(plan.id)}`;

  async function handleDownloadPdf() {
    setPdfLoading(true);
    try {
      await downloadPlanPdf(plan.id);
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="no-print">
        {pdfLoading && <PageLoading message="Menyiapkan PDF..." />}
        <button
          type="button"
          className="btn-primary w-full sm:hidden"
          onClick={() => void handleDownloadPdf()}
        >
          Unduh PDF
        </button>
        <Button
          href={`/plan/${encodeURIComponent(plan.id)}/print`}
          variant="primary"
          className="hidden w-full sm:inline-flex sm:w-auto"
        >
          Unduh / Cetak PDF
        </Button>
      </div>

      {grouped.map(({ day, label, slots, menuSummary }) => (
        <section key={day} className="card space-y-4 md:space-y-6">
          <div>
            <h2 className="text-2xl font-bold md:text-heading-sm">
              Hari {day} — {label}
            </h2>
            {menuSummary && (
              <p className="mt-2 text-sm leading-relaxed text-ink-violet/90 md:text-base">{menuSummary}</p>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {slots.map((slot) => {
              const recipe = recipeMap.get(slot.recipeId);
              if (!recipe) return null;
              return (
                <article key={`${day}-${slot.slot}`} className="border border-ink-violet bg-cream-paper p-4 md:p-6">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold uppercase md:text-sm">Lauk {slot.slot}</p>
                    {slot.pantryTag && <span className="tag text-xs">Pakai: {slot.pantryTag}</span>}
                  </div>
                  <h3 className="mb-3 text-lg font-bold leading-snug md:mb-4 md:text-xl">
                    <Link
                      href={`/recipe/${recipe.id}?from=${encodeURIComponent(planPath)}`}
                      className="hover:underline"
                    >
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
