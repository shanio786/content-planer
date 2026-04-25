import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, dailyReflectionTable } from "@workspace/db";
import {
  GetTodayReflectionResponse,
  UpsertReflectionBody,
  UpsertReflectionResponse,
} from "@workspace/api-zod";
import { appTodayString } from "../lib/timezone.js";

const router: IRouter = Router();

router.get("/reflection/today", async (_req, res): Promise<void> => {
  const today = appTodayString();
  const [row] = await db
    .select()
    .from(dailyReflectionTable)
    .where(eq(dailyReflectionTable.date, today));
  res.json(GetTodayReflectionResponse.parse(row ?? null));
});

router.put("/reflection", async (req, res): Promise<void> => {
  const parsed = UpsertReflectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const today = appTodayString();
  // Atomic upsert keyed on the unique `date` column.
  const [row] = await db
    .insert(dailyReflectionTable)
    .values({
      date: today,
      didWhat: parsed.data.didWhat ?? null,
      blocker: parsed.data.blocker ?? null,
      lesson: parsed.data.lesson ?? null,
    })
    .onConflictDoUpdate({
      target: dailyReflectionTable.date,
      set: {
        didWhat: parsed.data.didWhat ?? null,
        blocker: parsed.data.blocker ?? null,
        lesson: parsed.data.lesson ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  res.json(UpsertReflectionResponse.parse(row));
});

export default router;
