import { notFound } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { PrintLayout } from "@/components/PrintLayout";
import { getPlan } from "@/lib/plans";
import { getRecipesByIds } from "@/lib/recipes";

export const runtime = "nodejs";

type Props = { params: Promise<{ planId: string }> };

export default async function PlanPrintPage({ params }: Props) {
  const { planId } = await params;
  const plan = getPlan(planId);
  if (!plan) notFound();

  const recipes = getRecipesByIds(plan.slots.map((s) => s.recipeId));

  return (
    <div className="bg-cream-paper px-4 py-8">
      <div className="no-print mx-auto mb-6 max-w-[900px] text-center">
        <PrintButton />
      </div>
      <PrintLayout plan={plan} recipes={recipes} />
    </div>
  );
}
