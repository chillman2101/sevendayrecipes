import { NextResponse } from "next/server";
import { getPlan, updatePlanSlots } from "@/lib/plans";
import { toggleSlotLock } from "@/lib/recipes";

export const runtime = "nodejs";

type Props = { params: Promise<{ planId: string }> };

export async function POST(request: Request, { params }: Props) {
  const { planId } = await params;
  const plan = getPlan(planId);
  if (!plan) return NextResponse.json({ error: "Plan tidak ditemukan" }, { status: 404 });

  const { day, slot } = (await request.json()) as { day: number; slot: number };
  const updated = toggleSlotLock(plan.slots, day, slot);
  updatePlanSlots(planId, updated);

  return NextResponse.json({ ok: true });
}
