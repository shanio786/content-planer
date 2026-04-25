import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, notesTable, activityTable } from "@workspace/db";
import {
  CreateNoteBody,
  UpdateNoteParams,
  UpdateNoteBody,
  UpdateNoteResponse,
  DeleteNoteParams,
  ListNotesQueryParams,
  ListNotesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/notes", async (req, res): Promise<void> => {
  const params = ListNotesQueryParams.safeParse(req.query);
  const notes = await db.select().from(notesTable).orderBy(notesTable.createdAt);

  let filtered = notes;
  if (params.success && params.data.category) {
    filtered = filtered.filter((n) => n.category === params.data.category);
  }

  res.json(ListNotesResponse.parse(filtered));
});

router.post("/notes", async (req, res): Promise<void> => {
  const parsed = CreateNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [note] = await db.insert(notesTable).values({
    title: parsed.data.title,
    content: parsed.data.content ?? null,
    category: parsed.data.category ?? "general",
    pinned: parsed.data.pinned ?? false,
  }).returning();

  await db.insert(activityTable).values({
    type: "note_created",
    title: `Note: ${note.title}`,
  });

  res.status(201).json(note);
});

router.patch("/notes/:id", async (req, res): Promise<void> => {
  const params = UpdateNoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [note] = await db.update(notesTable).set(parsed.data).where(eq(notesTable.id, params.data.id)).returning();
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  res.json(UpdateNoteResponse.parse(note));
});

router.delete("/notes/:id", async (req, res): Promise<void> => {
  const params = DeleteNoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [note] = await db.delete(notesTable).where(eq(notesTable.id, params.data.id)).returning();
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
