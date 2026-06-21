import type { Plan, PlanConfig, PlanSlot } from "@/types";
import { decodePlan, encodePlan, reencodePlan } from "./plan-code";

/** Stateless plan storage — works on Vercel serverless (no filesystem writes). */
export function savePlan(config: PlanConfig, slots: PlanSlot[]): Plan {
  const createdAt = new Date().toISOString();
  const id = encodePlan(config, slots, createdAt);
  return { id, config, slots, createdAt };
}

export function getPlan(id: string): Plan | null {
  return decodePlan(id);
}

export function updatePlanSlots(plan: Plan, slots: PlanSlot[]): Plan {
  const id = reencodePlan(plan.config, slots, plan.createdAt);
  return { ...plan, id, slots };
}
