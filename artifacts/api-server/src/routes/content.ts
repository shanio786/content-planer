import { Router, type IRouter } from "express";
import { eq, gte, lte } from "drizzle-orm";
import { db, contentTable, activityTable } from "@workspace/db";
import {
  CreateContentBody,
  UpdateContentParams,
  UpdateContentBody,
  UpdateContentResponse,
  DeleteContentParams,
  ListContentQueryParams,
  ListContentResponse,
  GetUpcomingContentQueryParams,
  GetUpcomingContentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/content", async (req, res): Promise<void> => {
  const params = ListContentQueryParams.safeParse(req.query);
  const items = await db.select().from(contentTable).orderBy(contentTable.createdAt);

  let filtered = items;
  if (params.success && params.data.platform) {
    filtered = filtered.filter((c) => c.platform === params.data.platform);
  }
  if (params.success && params.data.status) {
    filtered = filtered.filter((c) => c.status === params.data.status);
  }

  res.json(ListContentResponse.parse(filtered));
});

router.post("/content", async (req, res): Promise<void> => {
  const parsed = CreateContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db.insert(contentTable).values({
    title: parsed.data.title,
    platform: parsed.data.platform,
    status: parsed.data.status ?? "idea",
    scheduledDate: parsed.data.scheduledDate ? new Date(parsed.data.scheduledDate) : null,
    projectId: parsed.data.projectId ?? null,
    description: parsed.data.description ?? null,
  }).returning();

  await db.insert(activityTable).values({
    type: "content_scheduled",
    title: `Content: ${item.title}`,
    description: `Platform: ${item.platform}`,
  });

  res.status(201).json(item);
});

router.get("/content/upcoming", async (req, res): Promise<void> => {
  const params = GetUpcomingContentQueryParams.safeParse(req.query);
  const days = params.success && params.data.days ? params.data.days : 7;

  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const items = await db.select().from(contentTable);
  const upcoming = items.filter((c) => {
    if (!c.scheduledDate) return false;
    return c.scheduledDate >= now && c.scheduledDate <= futureDate && c.status !== "cancelled";
  });

  res.json(GetUpcomingContentResponse.parse(upcoming));
});

router.patch("/content/:id", async (req, res): Promise<void> => {
  const params = UpdateContentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.platform !== undefined) updateData.platform = parsed.data.platform;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.scheduledDate !== undefined) updateData.scheduledDate = parsed.data.scheduledDate ? new Date(parsed.data.scheduledDate) : null;
  if (parsed.data.projectId !== undefined) updateData.projectId = parsed.data.projectId;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;

  const [item] = await db.update(contentTable).set(updateData).where(eq(contentTable.id, params.data.id)).returning();
  if (!item) {
    res.status(404).json({ error: "Content item not found" });
    return;
  }

  res.json(UpdateContentResponse.parse(item));
});

router.delete("/content/:id", async (req, res): Promise<void> => {
  const params = DeleteContentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [item] = await db.delete(contentTable).where(eq(contentTable.id, params.data.id)).returning();
  if (!item) {
    res.status(404).json({ error: "Content item not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
