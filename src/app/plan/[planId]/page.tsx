import { notFound } from "next/navigation";
import { PlanGrid } from "@/components/PlanGrid";
import { formatPlanDate } from "@/lib/utils";
import { getPlan } from "@/lib/plans";
import { getRecipesByIds } from "@/lib/recipes";

export const runtime = "nodejs";

type Props = { params: Promise<{ planId: string }> };

export default async function PlanPage({ params }: Props) {
  const { planId } = await params;
  const plan = getPlan(planId);
  if (!plan) notFound();

  const recipes = getRecipesByIds(plan.slots.map((s) => s.recipeId));

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-20">
      <header className="mb-12">
        <h1 className="text-heading-sm font-bold">Menu {plan.config.days} Hari</h1>
        <p className="mt-2 text-body-sm">{formatPlanDate(plan.createdAt)}</p>
        <p className="mt-1 text-body-sm">
          {plan.config.recipesPerDay} resep/hari · {plan.slots.length} total resep
        </p>
      </header>

      <PlanGrid plan={plan} recipes={recipes} />
    </div>
  );
}
