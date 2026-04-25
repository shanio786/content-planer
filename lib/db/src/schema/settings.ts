import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mission: text("mission").notNull().default(""),
  monthlyGoalAmount: real("monthly_goal_amount").notNull().default(3000),
  killWarnDays: integer("kill_warn_days").notNull().default(30),
  killDeadDays: integer("kill_dead_days").notNull().default(45),
  weekStartsOn: integer("week_starts_on").notNull().default(1),
  reflectionStartHour: integer("reflection_start_hour").notNull().default(20),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true, updatedAt: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
