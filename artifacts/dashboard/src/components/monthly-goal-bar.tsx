import {
  useGetSettings,
  useGetDashboardSummary,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Target } from "lucide-react";

export function MonthlyGoalBar() {
  const { data: settings } = useGetSettings();
  const { data: summary } = useGetDashboardSummary();

  const goal = settings?.monthlyGoalAmount ?? 0;
  const earned = summary?.thisMonthRevenue ?? 0;
  const pct = goal > 0 ? Math.min(100, (earned / goal) * 100) : 0;
  const remaining = Math.max(0, goal - earned);

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Monthly goal</span>
          </div>
          <Link
            href="/settings"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            edit
          </Link>
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-2xl font-bold">${earned.toFixed(0)}</span>
            <span className="text-xs text-muted-foreground">
              of ${goal.toFixed(0)} ({pct.toFixed(0)}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {remaining > 0
              ? `$${remaining.toFixed(0)} more needed this month`
              : goal > 0
                ? "Goal achieved! Set a new target."
                : "Set your monthly goal."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
