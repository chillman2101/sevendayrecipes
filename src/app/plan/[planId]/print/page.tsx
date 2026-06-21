import { notFound } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { PrintLayout } from "@/components/PrintLayout";
import { resolvePlanId } from "@/lib/utils";
import { getPlan } from "@/lib/plans";
import { getRecipesByIds } from "@/lib/recipes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ planId: string }> };

export default async function PlanPrintPage({ params }: Props) {
  const { planId: rawPlanId } = await params;
  const plan = getPlan(resolvePlanId(rawPlanId));
  if (!plan) notFound();

  const recipes = getRecipesByIds(plan.slots.map((s) => s.recipeId));

  return (
    <div className="bg-cream-paper px-3 py-6 sm:px-4 sm:py-8">
      <div className="no-print mx-auto mb-4 max-w-[900px] text-center sm:mb-6">
        <PrintButton />
      </div>
      <PrintLayout plan={plan} recipes={recipes} />
    </div>
  );
}
