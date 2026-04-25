import { Router, type IRouter } from "express";
import { eq, sql, gte, lt } from "drizzle-orm";
import { db, revenueTable, activityTable } from "@workspace/db";
import {
  CreateRevenueBody,
  UpdateRevenueParams,
  UpdateRevenueBody,
  UpdateRevenueResponse,
  DeleteRevenueParams,
  ListRevenueQueryParams,
  ListRevenueResponse,
  GetRevenueSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/revenue", async (req, res): Promise<void> => {
  const params = ListRevenueQueryParams.safeParse(req.query);
  const entries = await db.select().from(revenueTable).orderBy(revenueTable.date);

  let filtered = entries;
  if (params.success && params.data.source) {
    filtered = filtered.filter((e) => e.source === params.data.source);
  }
  if (params.success && params.data.projectId) {
    filtered = filtered.filter((e) => e.projectId === params.data.projectId);
  }

  res.json(ListRevenueResponse.parse(filtered));
});

router.post("/revenue", async (req, res): Promise<void> => {
  const parsed = CreateRevenueBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db.insert(revenueTable).values({
    amount: parsed.data.amount,
    source: parsed.data.source,
    description: parsed.data.description ?? null,
    projectId: parsed.data.projectId ?? null,
    date: new Date(parsed.data.date),
  }).returning();

  await db.insert(activityTable).values({
    type: "revenue_added",
    title: `Revenue: $${parsed.data.amount}`,
    description: `From ${parsed.data.source}`,
  });

  res.status(201).json(entry);
});

router.get("/revenue/summary", async (_req, res): Promise<void> => {
  const entries = await db.select().from(revenueTable);

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  let totalRevenue = 0;
  const bySource: Record<string, number> = {};
  let thisMonth = 0;
  let lastMonth = 0;

  for (const e of entries) {
    totalRevenue += e.amount;
    bySource[e.source] = (bySource[e.source] || 0) + e.amount;

    if (e.date >= thisMonthStart) {
      thisMonth += e.amount;
    } else if (e.date >= lastMonthStart && e.date < thisMonthStart) {
      lastMonth += e.amount;
    }
  }

  res.json(GetRevenueSummaryResponse.parse({ totalRevenue, bySource, thisMonth, lastMonth }));
});

router.patch("/revenue/:id", async (req, res): Promise<void> => {
  const params = UpdateRevenueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateRevenueBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.amount !== undefined) updateData.amount = parsed.data.amount;
  if (parsed.data.source !== undefined) updateData.source = parsed.data.source;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.projectId !== undefined) updateData.projectId = parsed.data.projectId;
  if (parsed.data.date !== undefined) updateData.date = new Date(parsed.data.date);

  const [entry] = await db.update(revenueTable).set(updateData).where(eq(revenueTable.id, params.data.id)).returning();
  if (!entry) {
    res.status(404).json({ error: "Revenue entry not found" });
    return;
  }

  res.json(UpdateRevenueResponse.parse(entry));
});

router.delete("/revenue/:id", async (req, res): Promise<void> => {
  const params = DeleteRevenueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [entry] = await db.delete(revenueTable).where(eq(revenueTable.id, params.data.id)).returning();
  if (!entry) {
    res.status(404).json({ error: "Revenue entry not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
