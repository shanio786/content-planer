import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const plannerTable = sqliteTable("planner", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  projectId: integer("project_id"),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("planned"),
  timeSlot: text("time_slot"),
  priority: text("priority").notNull().default("medium"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

export const insertPlannerSchema = createInsertSchema(plannerTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPlannerItem = z.infer<typeof insertPlannerSchema>;
export type PlannerItem = typeof plannerTable.$inferSelect;
