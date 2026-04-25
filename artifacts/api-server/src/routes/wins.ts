import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, winsTable } from "@workspace/db";
import {
  ListWinsQueryParams,
  ListWinsResponse,
  CreateWinBody,
  DeleteWinParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/wins", async (req, res): Promise<void> => {
  const params = ListWinsQueryParams.safeParse(req.query);
  const limit = params.success && params.data.limit ? params.data.limit : 20;
  const rows = await db
    .select()
    .from(winsTable)
    .orderBy(desc(winsTable.createdAt))
    .limit(limit);
  res.json(ListWinsResponse.parse(rows));
});

router.post("/wins", async (req, res): Promise<void> => {
  const parsed = CreateWinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(winsTable)
    .values({
      text: parsed.data.text,
      projectId: parsed.data.projectId ?? null,
    })
    .returning();
  res.status(201).json(row);
});

router.delete("/wins/:id", async (req, res): Promise<void> => {
  const params = DeleteWinParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(winsTable)
    .where(eq(winsTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Win not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
