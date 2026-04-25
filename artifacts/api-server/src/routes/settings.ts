import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
import {
  GetSettingsResponse,
  UpdateSettingsBody,
  UpdateSettingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// The settings singleton row (id=1) is seeded by ensureSchema() on server
// boot via `INSERT OR IGNORE INTO settings (id) VALUES (1)`. We use an
// idempotent upsert (`ON CONFLICT(id) DO UPDATE`) here so concurrent first
// writes never throw, and a fresh DB without seeding still self-heals.
async function readSettings() {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.id, 1));
  if (row) return row;
  // Self-heal: insert defaults if missing. ON CONFLICT keeps it race-safe.
  const [created] = await db
    .insert(settingsTable)
    .values({ id: 1 } as { id: number })
    .onConflictDoNothing({ target: settingsTable.id })
    .returning();
  if (created) return created;
  // Lost the race — re-read.
  const [reread] = await db.select().from(settingsTable).where(eq(settingsTable.id, 1));
  return reread;
}

router.get("/settings", async (_req, res): Promise<void> => {
  const row = await readSettings();
  res.json(GetSettingsResponse.parse(row));
});

router.patch("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.mission !== undefined) update.mission = parsed.data.mission;
  if (parsed.data.monthlyGoalAmount !== undefined) update.monthlyGoalAmount = parsed.data.monthlyGoalAmount;
  if (parsed.data.killWarnDays !== undefined) update.killWarnDays = parsed.data.killWarnDays;
  if (parsed.data.killDeadDays !== undefined) update.killDeadDays = parsed.data.killDeadDays;
  if (parsed.data.weekStartsOn !== undefined) update.weekStartsOn = parsed.data.weekStartsOn;
  if (parsed.data.reflectionStartHour !== undefined) update.reflectionStartHour = parsed.data.reflectionStartHour;

  // Atomic insert-or-update on the singleton row.
  const [row] = await db
    .insert(settingsTable)
    .values({ id: 1, ...update } as { id: number })
    .onConflictDoUpdate({ target: settingsTable.id, set: update })
    .returning();

  res.json(UpdateSettingsResponse.parse(row));
});

export default router;
