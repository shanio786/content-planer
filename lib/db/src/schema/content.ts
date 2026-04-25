import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contentTable = sqliteTable("content", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  platform: text("platform").notNull(),
  status: text("status").notNull().default("idea"),
  scheduledDate: integer("scheduled_date", { mode: "timestamp" }),
  projectId: integer("project_id"),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const insertContentSchema = createInsertSchema(contentTable).omit({ id: true, createdAt: true });
export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof contentTable.$inferSelect;
