import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const keywordsTable = sqliteTable("keywords", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  keyword: text("keyword").notNull(),
  niche: text("niche").notNull(),
  volume: integer("volume").notNull().default(0),
  difficulty: integer("difficulty").notNull().default(0),
  cpc: real("cpc").notNull().default(0),
  competition: text("competition").notNull().default("low"),
  position: integer("position"),
  projectId: integer("project_id"),
  notes: text("notes"),
  status: text("status").notNull().default("researching"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

export const insertKeywordSchema = createInsertSchema(keywordsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertKeyword = z.infer<typeof insertKeywordSchema>;
export type Keyword = typeof keywordsTable.$inferSelect;
