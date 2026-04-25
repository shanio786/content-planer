import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, expensesTable } from "@workspace/db";
import {
  CreateExpenseBody,
  UpdateExpenseBody,
  ListExpensesQueryParams,
  ListExpensesResponse,
  UpdateExpenseParams,
  UpdateExpenseResponse,
  DeleteExpenseParams,
  GetExpenseSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/expenses", async (req, res): Promise<void> => {
  const params = ListExpensesQueryParams.safeParse(req.query);
  const all = await db.select().from(expensesTable).orderBy(expensesTable.createdAt);
  let filtered = all;

  if (params.success && params.data.category) {
    filtered = filtered.filter((e) => e.category === params.data.category);
  }
  if (params.success && params.data.active !== undefined) {
    const active = params.data.active === true || params.data.active === "true" as unknown as boolean;
    filtered = filtered.filter((e) => e.active === active);
  }

  res.json(ListExpensesResponse.parse(filtered));
});

router.post("/expenses", async (req, res): Promise<void> => {
  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [expense] = await db.insert(expensesTable).values({
    name: parsed.data.name,
    amount: parsed.data.amount,
    category: parsed.data.category ?? "tool",
    billingCycle: parsed.data.billingCycle ?? "monthly",
    renewalDate: parsed.data.renewalDate ?? null,
    active: parsed.data.active ?? true,
    notes: parsed.data.notes ?? null,
  }).returning();

  res.status(201).json(UpdateExpenseResponse.parse(expense));
});

router.get("/expenses/summary", async (_req, res): Promise<void> => {
  const all = await db.select().from(expensesTable);

  let totalMonthly = 0;
  let totalYearly = 0;
  let totalOneTime = 0;
  const byCategory: Record<string, number> = {};
  let activeCount = 0;

  for (const e of all) {
    if (e.active) {
      activeCount++;
      if (e.billingCycle === "monthly") totalMonthly += e.amount;
      else if (e.billingCycle === "yearly") totalYearly += e.amount;
      else totalOneTime += e.amount;
    }
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }

  res.json(GetExpenseSummaryResponse.parse({
    totalMonthly,
    totalYearly,
    totalOneTime,
    byCategory,
    activeCount,
  }));
});

router.patch("/expenses/:id", async (req, res): Promise<void> => {
  const params = UpdateExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [expense] = await db.update(expensesTable).set(parsed.data).where(eq(expensesTable.id, params.data.id)).returning();
  if (!expense) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.json(UpdateExpenseResponse.parse(expense));
});

router.delete("/expenses/:id", async (req, res): Promise<void> => {
  const params = DeleteExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [expense] = await db.delete(expensesTable).where(eq(expensesTable.id, params.data.id)).returning();
  if (!expense) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
