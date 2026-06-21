import { notFound } from "next/navigation";
import { PlanGrid } from "@/components/PlanGrid";
import { formatPlanDate, resolvePlanId } from "@/lib/utils";
import { getPlan } from "@/lib/plans";
import { getRecipesByIds } from "@/lib/recipes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ planId: string }> };

export default async function PlanPage({ params }: Props) {
  const { planId: rawPlanId } = await params;
  const plan = getPlan(resolvePlanId(rawPlanId));
  if (!plan) notFound();

  const recipes = getRecipesByIds(plan.slots.map((s) => s.recipeId));

  return (
    <div className="page-container">
      <header className="mb-8 md:mb-12">
        <h1 className="text-2xl font-bold sm:text-3xl md:text-heading-sm">Menu {plan.config.days} Hari</h1>
        <p className="mt-2 text-sm md:text-body-sm">{formatPlanDate(plan.createdAt)}</p>
        <p className="mt-1 text-sm md:text-body-sm">
          {plan.config.recipesPerDay} resep/hari · {plan.slots.length} total resep
        </p>
      </header>

      <PlanGrid plan={plan} recipes={recipes} />
    </div>
  );
}
