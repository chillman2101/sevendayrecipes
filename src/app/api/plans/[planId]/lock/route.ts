import { NextResponse } from "next/server";
import { getPlan, updatePlanSlots } from "@/lib/plans";
import { toggleSlotLock } from "@/lib/recipes";

export const runtime = "nodejs";

type Props = { params: Promise<{ planId: string }> };

export async function POST(request: Request, { params }: Props) {
  const { planId: rawPlanId } = await params;
  const plan = getPlan(decodeURIComponent(rawPlanId));
  if (!plan) return NextResponse.json({ error: "Plan tidak ditemukan" }, { status: 404 });

  const { day, slot } = (await request.json()) as { day: number; slot: number };
  const updatedSlots = toggleSlotLock(plan.slots, day, slot);
  const updatedPlan = updatePlanSlots(plan, updatedSlots);

  return NextResponse.json({ id: updatedPlan.id });
}
