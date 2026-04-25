import { Router, type IRouter } from "express";
import { desc, eq, gte } from "drizzle-orm";
import { db, projectsTable, revenueTable, tasksTable, contentTable, notesTable, activityTable, expensesTable, keywordsTable, plannerTable, dailyFocusTable, settingsTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetRecentActivityQueryParams,
  GetRecentActivityResponse,
  GetWeeklyReviewResponse,
} from "@workspace/api-zod";
import {
  appStartOfThisMonthUtc,
  appStartOfTodayUtc,
  appStartOfNDaysAgoUtc,
  appTodayString,
  appDateString,
} from "../lib/timezone.js";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const projects = await db.select().from(projectsTable);
  const revenue = await db.select().from(revenueTable);
  const tasks = await db.select().from(tasksTable);
  const content = await db.select().from(contentTable);
  const notes = await db.select().from(notesTable);
  const expenses = await db.select().from(expensesTable);
  const keywords = await db.select().from(keywordsTable);
  const planner = await db.select().from(plannerTable);

  // All "today" / "this month" boundaries are computed in the app's
  // configured timezone (Asia/Karachi). See lib/timezone.ts.
  const now = new Date();
  const thisMonthStart = appStartOfThisMonthUtc();
  const todayStart = appStartOfTodayUtc();
  const todayStr = appTodayString();

  const liveProjects = projects.filter((p) => p.status === "live").length;
  const abandonedProjects = projects.filter((p) => p.status === "abandoned" || p.status === "flopped").length;
  const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
  const thisMonthRevenue = revenue
    .filter((r) => r.date >= thisMonthStart)
    .reduce((sum, r) => sum + r.amount, 0);
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const completedTasksToday = tasks.filter(
    (t) => t.completed && t.completedAt && t.completedAt >= todayStart
  ).length;

  const upcomingContent = content.filter((c) => {
    if (!c.scheduledDate) return false;
    return c.scheduledDate >= now && c.status === "scheduled";
  }).length;

  const oneWeekAgo = appStartOfNDaysAgoUtc(7);
  const recentNotes = notes.filter((n) => n.createdAt >= oneWeekAgo).length;

  const monthlyExpenses = expenses
    .filter((e) => e.active && e.billingCycle === "monthly")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalKeywords = keywords.length;
  const todayPlannerItems = planner.filter((p) => p.date === todayStr).length;

  res.json(GetDashboardSummaryResponse.parse({
    totalProjects: projects.length,
    liveProjects,
    totalRevenue,
    thisMonthRevenue,
    pendingTasks,
    completedTasksToday,
    upcomingContent,
    recentNotes,
    monthlyExpenses,
    totalKeywords,
    todayPlannerItems,
    abandonedProjects,
  }));
});

router.get("/dashboard/recent-activity", async (req, res): Promise<void> => {
  const params = GetRecentActivityQueryParams.safeParse(req.query);
  const limit = params.success && params.data.limit ? params.data.limit : 10;

  const activities = await db
    .select()
    .from(activityTable)
    .orderBy(desc(activityTable.timestamp))
    .limit(limit);

  res.json(GetRecentActivityResponse.parse(activities));
});

router.get("/dashboard/weekly-review", async (_req, res): Promise<void> => {
  const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.id, 1));
  const killWarn = settings?.killWarnDays ?? 30;
  const killDead = settings?.killDeadDays ?? 45;

  const sevenDaysAgo = appStartOfNDaysAgoUtc(7);
  const fourteenDaysAgo = appStartOfNDaysAgoUtc(14);
  // Streak can extend back arbitrarily — query a separate, wider window
  // (matches /focus/streak's 365-day lookback) so longer streaks don't get
  // truncated by the 14-day weekly-aggregate window.
  const yearAgo = appStartOfNDaysAgoUtc(365);

  const [revenueLast14, tasksLast7, focusLast14, focusForStreak, projects] = await Promise.all([
    db.select().from(revenueTable).where(gte(revenueTable.date, fourteenDaysAgo)),
    db.select().from(tasksTable).where(gte(tasksTable.completedAt, sevenDaysAgo)),
    db.select().from(dailyFocusTable).where(gte(dailyFocusTable.createdAt, fourteenDaysAgo)),
    db.select().from(dailyFocusTable).where(gte(dailyFocusTable.createdAt, yearAgo)),
    db.select().from(projectsTable),
  ]);

  let revenueThisWeek = 0;
  let revenueLastWeek = 0;
  for (const r of revenueLast14) {
    if (r.date >= sevenDaysAgo) revenueThisWeek += r.amount;
    else revenueLastWeek += r.amount;
  }
  const revenueChangePct = revenueLastWeek > 0
    ? ((revenueThisWeek - revenueLastWeek) / revenueLastWeek) * 100
    : null;

  const tasksCompletedThisWeek = tasksLast7.filter(
    (t) => t.completed && t.completedAt && t.completedAt >= sevenDaysAgo
  ).length;

  // Focus days completed this week = unique dates with at least 1 completed item in last 7 days.
  const focusDayDates = new Set<string>();
  for (const f of focusLast14) {
    if (f.completedAt && f.completedAt >= sevenDaysAgo) {
      focusDayDates.add(f.date);
    }
  }
  const focusDaysCompletedThisWeek = focusDayDates.size;

  // Streak (reuse same logic as /focus/streak — kept inline to avoid coupling).
  // Use the wider 365-day query so streaks longer than 14 days are reported
  // accurately on the dashboard weekly-review card.
  const completedDates = new Set<string>();
  for (const f of focusForStreak) {
    if (f.completedAt) completedDates.add(f.date);
  }
  const today = appTodayString();
  const yesterday = appDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
  let currentStreak = 0;
  let cursor: string | null = completedDates.has(today)
    ? today
    : completedDates.has(yesterday) ? yesterday : null;
  while (cursor && completedDates.has(cursor)) {
    currentStreak += 1;
    const d = new Date(`${cursor}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    cursor = appDateString(d);
  }

  const now = Date.now();
  const projectSummaries = projects
    .filter((p) => p.status !== "abandoned" && p.status !== "flopped")
    .map((p) => {
      const ageDays = Math.floor((now - p.createdAt.getTime()) / (24 * 60 * 60 * 1000));
      let flag: "working" | "review" | "kill" | "grace" = "grace";
      if (p.revenue > 0 || p.traffic > 100) flag = "working";
      else if (ageDays >= killDead) flag = "kill";
      else if (ageDays >= killWarn) flag = "review";
      return {
        id: p.id,
        name: p.name,
        type: p.type,
        status: p.status,
        ageDays,
        traffic: p.traffic,
        revenue: p.revenue,
        flag,
      };
    })
    .sort((a, b) => b.ageDays - a.ageDays);

  const weekStart = appDateString(new Date(sevenDaysAgo.getTime()));
  const weekEnd = appTodayString();

  res.json(GetWeeklyReviewResponse.parse({
    weekStartDate: weekStart,
    weekEndDate: weekEnd,
    revenueThisWeek,
    revenueLastWeek,
    revenueChangePct,
    tasksCompletedThisWeek,
    focusDaysCompletedThisWeek,
    currentStreak,
    projects: projectSummaries,
  }));
});

export default router;
