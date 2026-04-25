import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const winsTable = sqliteTable("wins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  text: text("text").notNull(),
  projectId: integer("project_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const insertWinSchema = createInsertSchema(winsTable).omit({ id: true, createdAt: true });
export type InsertWin = z.infer<typeof insertWinSchema>;
export type Win = typeof winsTable.$inferSelect;
