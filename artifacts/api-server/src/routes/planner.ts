import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, plannerTable } from "@workspace/db";
import {
  CreatePlannerItemBody,
  UpdatePlannerItemBody,
  ListPlannerItemsQueryParams,
  ListPlannerItemsResponse,
  UpdatePlannerItemParams,
  UpdatePlannerItemResponse,
  DeletePlannerItemParams,
} from "@workspace/api-zod";
import { appDateString } from "../lib/timezone.js";

const router: IRouter = Router();

router.get("/planner", async (req, res): Promise<void> => {
  const params = ListPlannerItemsQueryParams.safeParse(req.query);
  const all = await db.select().from(plannerTable).orderBy(plannerTable.date);
  let filtered = all;

  if (params.success && params.data.date) {
    // Map the inbound Date instant to its calendar date in the app
    // timezone before comparing against stored "YYYY-MM-DD" values.
    const filterDate = appDateString(params.data.date);
    filtered = filtered.filter((p) => p.date === filterDate);
  }
  if (params.success && params.data.projectId) {
    filtered = filtered.filter((p) => p.projectId === params.data.projectId);
  }
  if (params.success && params.data.status) {
    filtered = filtered.filter((p) => p.status === params.data.status);
  }

  res.json(ListPlannerItemsResponse.parse(filtered));
});

router.post("/planner", async (req, res): Promise<void> => {
  const parsed = CreatePlannerItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db.insert(plannerTable).values({
    date: parsed.data.date,
    projectId: parsed.data.projectId ?? null,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    status: parsed.data.status ?? "planned",
    timeSlot: parsed.data.timeSlot ?? null,
    priority: parsed.data.priority ?? "medium",
  }).returning();

  res.status(201).json(UpdatePlannerItemResponse.parse(item));
});

router.patch("/planner/:id", async (req, res): Promise<void> => {
  const params = UpdatePlannerItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePlannerItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db.update(plannerTable).set(parsed.data).where(eq(plannerTable.id, params.data.id)).returning();
  if (!item) {
    res.status(404).json({ error: "Planner item not found" });
    return;
  }

  res.json(UpdatePlannerItemResponse.parse(item));
});

router.delete("/planner/:id", async (req, res): Promise<void> => {
  const params = DeletePlannerItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [item] = await db.delete(plannerTable).where(eq(plannerTable.id, params.data.id)).returning();
  if (!item) {
    res.status(404).json({ error: "Planner item not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
