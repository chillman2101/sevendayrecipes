import type { Plan, PlanConfig, PlanSlot } from "@/types";

interface EncodedPlanPayload {
  c: PlanConfig;
  s: PlanSlot[];
  t: string;
}

export function encodePlan(config: PlanConfig, slots: PlanSlot[], createdAt?: string): string {
  const payload: EncodedPlanPayload = {
    c: config,
    s: slots,
    t: createdAt ?? new Date().toISOString(),
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodePlan(id: string): Plan | null {
  try {
    const payload = JSON.parse(
      Buffer.from(decodeURIComponent(id), "base64url").toString("utf-8")
    ) as EncodedPlanPayload;

    if (!payload.c || !Array.isArray(payload.s)) return null;

    return {
      id,
      config: payload.c,
      slots: payload.s,
      createdAt: payload.t,
    };
  } catch {
    return null;
  }
}

export function reencodePlan(config: PlanConfig, slots: PlanSlot[], createdAt: string): string {
  return encodePlan(config, slots, createdAt);
}
