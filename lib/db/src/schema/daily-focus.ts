import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dailyFocusTable = sqliteTable(
  "daily_focus",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull(),
    slot: integer("slot").notNull(),
    title: text("title").notNull(),
    projectId: integer("project_id"),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
  },
  (table) => ({
    dateSlotIdx: uniqueIndex("daily_focus_date_slot_idx").on(table.date, table.slot),
  }),
);

export const insertDailyFocusSchema = createInsertSchema(dailyFocusTable).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true });
export type InsertDailyFocus = z.infer<typeof insertDailyFocusSchema>;
export type DailyFocusItem = typeof dailyFocusTable.$inferSelect;
