import { Router, type IRouter } from "express";
import { desc, eq, gte } from "drizzle-orm";
import { db, dailyFocusTable } from "@workspace/db";
import {
  GetTodayFocusResponse,
  SetFocusSlotBody,
  SetFocusSlotResponse,
  UpdateFocusParams,
  UpdateFocusBody,
  UpdateFocusResponse,
  DeleteFocusParams,
  ToggleFocusParams,
  ToggleFocusResponse,
  GetFocusStreakResponse,
} from "@workspace/api-zod";
import { appTodayString, appDateString, appStartOfNDaysAgoUtc } from "../lib/timezone.js";

const router: IRouter = Router();

router.get("/focus/today", async (_req, res): Promise<void> => {
  const today = appTodayString();
  const rows = await db
    .select()
    .from(dailyFocusTable)
    .where(eq(dailyFocusTable.date, today));

  const slots: (typeof rows[number] | null)[] = [null, null, null];
  for (const row of rows) {
    if (row.slot >= 1 && row.slot <= 3) {
      slots[row.slot - 1] = row;
    }
  }

  res.json(GetTodayFocusResponse.parse({ date: today, slots }));
});

router.post("/focus", async (req, res): Promise<void> => {
  const parsed = SetFocusSlotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const today = appTodayString();
  // Atomic upsert keyed on the (date, slot) unique index. Concurrent writes
  // to the same slot will collapse to a single row instead of throwing a
  // 500 from a unique-constraint violation.
  const [row] = await db
    .insert(dailyFocusTable)
    .values({
      date: today,
      slot: parsed.data.slot,
      title: parsed.data.title,
      projectId: parsed.data.projectId ?? null,
    })
    .onConflictDoUpdate({
      target: [dailyFocusTable.date, dailyFocusTable.slot],
      set: {
        title: parsed.data.title,
        projectId: parsed.data.projectId ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  res.json(SetFocusSlotResponse.parse(row));
});

router.patch("/focus/:id", async (req, res): Promise<void> => {
  const params = UpdateFocusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateFocusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) update.title = parsed.data.title;
  if (parsed.data.projectId !== undefined) update.projectId = parsed.data.projectId;

  const [row] = await db
    .update(dailyFocusTable)
    .set(update)
    .where(eq(dailyFocusTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Focus item not found" });
    return;
  }
  res.json(UpdateFocusResponse.parse(row));
});

router.delete("/focus/:id", async (req, res): Promise<void> => {
  const params = DeleteFocusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(dailyFocusTable)
    .where(eq(dailyFocusTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Focus item not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/focus/:id/toggle", async (req, res): Promise<void> => {
  const params = ToggleFocusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [existing] = await db
    .select()
    .from(dailyFocusTable)
    .where(eq(dailyFocusTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Focus item not found" });
    return;
  }
  const [row] = await db
    .update(dailyFocusTable)
    .set({ completedAt: existing.completedAt ? null : new Date() })
    .where(eq(dailyFocusTable.id, params.data.id))
    .returning();
  res.json(ToggleFocusResponse.parse(row));
});

router.get("/focus/streak", async (_req, res): Promise<void> => {
  // A "streak day" = at least one focus item completed that day.
  // We look back at most 365 days for a continuous run ending today
  // OR yesterday (so a fresh day before the user logs anything still
  // shows the existing streak).
  const since = appStartOfNDaysAgoUtc(365);
  const rows = await db
    .select()
    .from(dailyFocusTable)
    .where(gte(dailyFocusTable.createdAt, since))
    .orderBy(desc(dailyFocusTable.date));

  const completedDates = new Set<string>();
  for (const row of rows) {
    if (row.completedAt) completedDates.add(row.date);
  }

  const today = appTodayString();
  const yesterday = appDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));

  let streak = 0;
  let cursor: string;
  if (completedDates.has(today)) {
    cursor = today;
  } else if (completedDates.has(yesterday)) {
    cursor = yesterday;
  } else {
    res.json(GetFocusStreakResponse.parse({ streak: 0, lastCompleteDate: null }));
    return;
  }

  const lastCompleteDate = cursor;
  while (completedDates.has(cursor)) {
    streak += 1;
    const d = new Date(`${cursor}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    cursor = appDateString(d);
  }

  res.json(GetFocusStreakResponse.parse({ streak, lastCompleteDate }));
});

export default router;
