import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dailyReflectionTable = sqliteTable("daily_reflection", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull().unique(),
  didWhat: text("did_what"),
  blocker: text("blocker"),
  lesson: text("lesson"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

export const insertDailyReflectionSchema = createInsertSchema(dailyReflectionTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDailyReflection = z.infer<typeof insertDailyReflectionSchema>;
export type DailyReflection = typeof dailyReflectionTable.$inferSelect;
