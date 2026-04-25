import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, projectsTable, activityTable } from "@workspace/db";
import {
  CreateProjectBody,
  GetProjectParams,
  GetProjectResponse,
  UpdateProjectParams,
  UpdateProjectBody,
  UpdateProjectResponse,
  DeleteProjectParams,
  ListProjectsQueryParams,
  ListProjectsResponse,
  GetProjectStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/projects", async (req, res): Promise<void> => {
  const params = ListProjectsQueryParams.safeParse(req.query);
  let query = db.select().from(projectsTable).orderBy(projectsTable.createdAt);

  const projects = await query;
  let filtered = projects;

  if (params.success && params.data.type) {
    filtered = filtered.filter((p) => p.type === params.data.type);
  }
  if (params.success && params.data.status) {
    filtered = filtered.filter((p) => p.status === params.data.status);
  }

  res.json(ListProjectsResponse.parse(filtered));
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db.insert(projectsTable).values({
    name: parsed.data.name,
    type: parsed.data.type,
    status: parsed.data.status ?? "idea",
    url: parsed.data.url ?? null,
    traffic: parsed.data.traffic ?? 0,
    revenue: parsed.data.revenue ?? 0,
    nextTask: parsed.data.nextTask ?? null,
    description: parsed.data.description ?? null,
  }).returning();

  await db.insert(activityTable).values({
    type: "project_created",
    title: `New project: ${project.name}`,
    description: `Created ${project.type} project`,
  });

  res.status(201).json(GetProjectResponse.parse(project));
});

router.get("/projects/stats", async (_req, res): Promise<void> => {
  const projects = await db.select().from(projectsTable);

  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let totalTraffic = 0;
  let totalRevenue = 0;

  for (const p of projects) {
    byType[p.type] = (byType[p.type] || 0) + 1;
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    totalTraffic += p.traffic;
    totalRevenue += p.revenue;
  }

  res.json(GetProjectStatsResponse.parse({
    total: projects.length,
    byType,
    byStatus,
    totalTraffic,
    totalRevenue,
  }));
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.json(GetProjectResponse.parse(project));
});

router.patch("/projects/:id", async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db.update(projectsTable).set(parsed.data).where(eq(projectsTable.id, params.data.id)).returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  await db.insert(activityTable).values({
    type: "project_updated",
    title: `Updated project: ${project.name}`,
  });

  res.json(UpdateProjectResponse.parse(project));
});

router.delete("/projects/:id", async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db.delete(projectsTable).where(eq(projectsTable.id, params.data.id)).returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
