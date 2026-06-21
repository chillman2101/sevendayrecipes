import { nanoid } from "nanoid";
import type { Plan, PlanConfig, PlanSlot } from "@/types";
import { getDb, getWritableDb } from "./db";

export function savePlan(config: PlanConfig, slots: PlanSlot[]): Plan {
  const id = nanoid(8);
  const plan: Plan = {
    id,
    config,
    slots,
    createdAt: new Date().toISOString(),
  };

  const db = getWritableDb();
  db.prepare(
    "INSERT INTO plans (id, config, slots, created_at) VALUES (?, ?, ?, ?)"
  ).run(id, JSON.stringify(config), JSON.stringify(slots), plan.createdAt);
  db.close();

  return plan;
}

export function getPlan(id: string): Plan | null {
  const db = getDb();
  const row = db
    .prepare("SELECT id, config, slots, created_at FROM plans WHERE id = ?")
    .get(id) as { id: string; config: string; slots: string; created_at: string } | undefined;

  if (!row) return null;

  return {
    id: row.id,
    config: JSON.parse(row.config) as PlanConfig,
    slots: JSON.parse(row.slots) as PlanSlot[],
    createdAt: row.created_at,
  };
}

export function updatePlanSlots(id: string, slots: PlanSlot[]): void {
  const db = getWritableDb();
  db.prepare("UPDATE plans SET slots = ? WHERE id = ?").run(JSON.stringify(slots), id);
  db.close();
}
