import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, tasksTable, activityTable } from "@workspace/db";
import {
  CreateTaskBody,
  UpdateTaskParams,
  UpdateTaskBody,
  UpdateTaskResponse,
  DeleteTaskParams,
  ToggleTaskParams,
  ToggleTaskResponse,
  ListTasksQueryParams,
  ListTasksResponse,
  GetTaskStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tasks", async (req, res): Promise<void> => {
  const params = ListTasksQueryParams.safeParse(req.query);
  const tasks = await db.select().from(tasksTable).orderBy(tasksTable.createdAt);

  let filtered = tasks;
  if (params.success && params.data.priority) {
    filtered = filtered.filter((t) => t.priority === params.data.priority);
  }
  if (params.success && params.data.completed !== undefined) {
    filtered = filtered.filter((t) => t.completed === params.data.completed);
  }
  if (params.success && params.data.projectId) {
    filtered = filtered.filter((t) => t.projectId === params.data.projectId);
  }

  res.json(ListTasksResponse.parse(filtered));
});

router.post("/tasks", async (req, res): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [task] = await db.insert(tasksTable).values({
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    priority: parsed.data.priority ?? "medium",
    projectId: parsed.data.projectId ?? null,
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
  }).returning();

  res.status(201).json(task);
});

router.get("/tasks/stats", async (_req, res): Promise<void> => {
  const tasks = await db.select().from(tasksTable);
  const now = new Date();

  let completed = 0;
  let pending = 0;
  let overdue = 0;
  const byPriority: Record<string, number> = {};

  const completionDates = new Set<string>();

  for (const t of tasks) {
    if (t.completed) {
      completed++;
      if (t.completedAt) {
        completionDates.add(t.completedAt.toISOString().split("T")[0]);
      }
    } else {
      pending++;
      if (t.dueDate && t.dueDate < now) {
        overdue++;
      }
    }
    byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
  }

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(today);

  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (completionDates.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (streak === 0 && checkDate.getTime() === today.getTime()) {
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  res.json(GetTaskStatsResponse.parse({
    total: tasks.length,
    completed,
    pending,
    overdue,
    byPriority,
    streak,
  }));
});

router.patch("/tasks/:id", async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority;
  if (parsed.data.completed !== undefined) {
    updateData.completed = parsed.data.completed;
    updateData.completedAt = parsed.data.completed ? new Date() : null;
  }
  if (parsed.data.projectId !== undefined) updateData.projectId = parsed.data.projectId;
  if (parsed.data.dueDate !== undefined) updateData.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;

  const [task] = await db.update(tasksTable).set(updateData).where(eq(tasksTable.id, params.data.id)).returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(UpdateTaskResponse.parse(task));
});

router.patch("/tasks/:id/toggle", async (req, res): Promise<void> => {
  const params = ToggleTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db.select().from(tasksTable).where(eq(tasksTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const newCompleted = !existing.completed;
  const [task] = await db.update(tasksTable).set({
    completed: newCompleted,
    completedAt: newCompleted ? new Date() : null,
  }).where(eq(tasksTable.id, params.data.id)).returning();

  if (newCompleted) {
    await db.insert(activityTable).values({
      type: "task_completed",
      title: `Completed: ${task!.title}`,
    });
  }

  res.json(ToggleTaskResponse.parse(task));
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [task] = await db.delete(tasksTable).where(eq(tasksTable.id, params.data.id)).returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
