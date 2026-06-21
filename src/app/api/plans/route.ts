import { NextResponse } from "next/server";
import type { PlanConfig } from "@/types";
import { savePlan } from "@/lib/plans";
import { generatePlanSlots } from "@/lib/recipes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PlanConfig;
    const config: PlanConfig = {
      days: body.days ?? 7,
      recipesPerDay: body.recipesPerDay ?? 2,
      ingredientTags: body.ingredientTags ?? [],
      matchMode: body.matchMode ?? "all",
      partialThreshold: body.partialThreshold ?? 0.5,
    };

    const slots = generatePlanSlots(config);
    if (slots.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada resep yang cocok dengan filter bahan. Coba kurangi tag." },
        { status: 400 }
      );
    }

    const plan = savePlan(config, slots);
    return NextResponse.json({ id: plan.id });
  } catch {
    return NextResponse.json({ error: "Gagal membuat plan" }, { status: 500 });
  }
}
