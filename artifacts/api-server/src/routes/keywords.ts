import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, keywordsTable } from "@workspace/db";
import {
  CreateKeywordBody,
  UpdateKeywordBody,
  ListKeywordsQueryParams,
  ListKeywordsResponse,
  UpdateKeywordParams,
  UpdateKeywordResponse,
  DeleteKeywordParams,
  GetKeywordStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/keywords", async (req, res): Promise<void> => {
  const params = ListKeywordsQueryParams.safeParse(req.query);
  const all = await db.select().from(keywordsTable).orderBy(keywordsTable.createdAt);
  let filtered = all;

  if (params.success && params.data.niche) {
    filtered = filtered.filter((k) => k.niche === params.data.niche);
  }
  if (params.success && params.data.projectId) {
    filtered = filtered.filter((k) => k.projectId === params.data.projectId);
  }
  if (params.success && params.data.status) {
    filtered = filtered.filter((k) => k.status === params.data.status);
  }

  res.json(ListKeywordsResponse.parse(filtered));
});

router.post("/keywords", async (req, res): Promise<void> => {
  const parsed = CreateKeywordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [keyword] = await db.insert(keywordsTable).values({
    keyword: parsed.data.keyword,
    niche: parsed.data.niche,
    volume: parsed.data.volume ?? 0,
    difficulty: parsed.data.difficulty ?? 0,
    cpc: parsed.data.cpc ?? 0,
    competition: parsed.data.competition ?? "low",
    position: parsed.data.position ?? null,
    projectId: parsed.data.projectId ?? null,
    notes: parsed.data.notes ?? null,
    status: parsed.data.status ?? "researching",
  }).returning();

  res.status(201).json(UpdateKeywordResponse.parse(keyword));
});

router.get("/keywords/stats", async (_req, res): Promise<void> => {
  const all = await db.select().from(keywordsTable);

  const byNiche: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let totalDifficulty = 0;
  let totalVolume = 0;

  for (const k of all) {
    byNiche[k.niche] = (byNiche[k.niche] || 0) + 1;
    byStatus[k.status] = (byStatus[k.status] || 0) + 1;
    totalDifficulty += k.difficulty;
    totalVolume += k.volume;
  }

  res.json(GetKeywordStatsResponse.parse({
    total: all.length,
    byNiche,
    byStatus,
    avgDifficulty: all.length > 0 ? Math.round(totalDifficulty / all.length) : 0,
    avgVolume: all.length > 0 ? Math.round(totalVolume / all.length) : 0,
  }));
});

router.patch("/keywords/:id", async (req, res): Promise<void> => {
  const params = UpdateKeywordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateKeywordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [keyword] = await db.update(keywordsTable).set(parsed.data).where(eq(keywordsTable.id, params.data.id)).returning();
  if (!keyword) {
    res.status(404).json({ error: "Keyword not found" });
    return;
  }

  res.json(UpdateKeywordResponse.parse(keyword));
});

router.delete("/keywords/:id", async (req, res): Promise<void> => {
  const params = DeleteKeywordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [keyword] = await db.delete(keywordsTable).where(eq(keywordsTable.id, params.data.id)).returning();
  if (!keyword) {
    res.status(404).json({ error: "Keyword not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
