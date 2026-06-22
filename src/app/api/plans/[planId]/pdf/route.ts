import { NextResponse } from "next/server";
import { planPdfFilename, buildPlanPdf } from "@/lib/plan-pdf";
import { getPlan } from "@/lib/plans";
import { getRecipesByIds } from "@/lib/recipes";
import { resolvePlanId } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 30;

type Props = { params: Promise<{ planId: string }> };

export async function GET(_request: Request, { params }: Props) {
  try {
    const { planId: rawPlanId } = await params;
    const plan = getPlan(resolvePlanId(rawPlanId));
    if (!plan) {
      return NextResponse.json({ error: "Plan tidak ditemukan" }, { status: 404 });
    }

    const recipes = getRecipesByIds(plan.slots.map((slot) => slot.recipeId));
    const pdfBytes = await buildPlanPdf(plan, recipes);
    const filename = planPdfFilename(plan);

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Gagal membuat PDF" }, { status: 500 });
  }
}
