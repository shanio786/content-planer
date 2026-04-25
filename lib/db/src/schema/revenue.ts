import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const revenueTable = sqliteTable("revenue", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  amount: real("amount").notNull(),
  source: text("source").notNull(),
  description: text("description"),
  projectId: integer("project_id"),
  date: integer("date", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const insertRevenueSchema = createInsertSchema(revenueTable).omit({ id: true, createdAt: true });
export type InsertRevenue = z.infer<typeof insertRevenueSchema>;
export type Revenue = typeof revenueTable.$inferSelect;
