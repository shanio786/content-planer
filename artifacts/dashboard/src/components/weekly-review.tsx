import { useGetWeeklyReview } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CalendarRange, TrendingUp, TrendingDown, Minus } from "lucide-react";

const flagColors: Record<string, string> = {
  working: "bg-green-500/10 text-green-400 border-green-500/20",
  grace: "bg-muted text-muted-foreground border-border",
  review: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  kill: "bg-red-500/10 text-red-400 border-red-500/20",
};

const flagLabels: Record<string, string> = {
  working: "working",
  grace: "young",
  review: "review",
  kill: "kill",
};

export function WeeklyReview() {
  const { data, isLoading } = useGetWeeklyReview();

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }
  if (!data) return null;

  const change = data.revenueChangePct;
  const TrendIcon = change == null ? Minus : change >= 0 ? TrendingUp : TrendingDown;
  const trendColor = change == null
    ? "text-muted-foreground"
    : change >= 0 ? "text-green-400" : "text-red-400";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-primary" />
          Weekly review
          <span className="text-xs font-normal text-muted-foreground ml-1">
            ({data.weekStartDate} → {data.weekEndDate})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Revenue</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="text-lg font-bold">${data.revenueThisWeek.toFixed(0)}</p>
              <span className={`text-xs flex items-center gap-0.5 ${trendColor}`}>
                <TrendIcon className="w-3 h-3" />
                {change == null ? "—" : `${Math.abs(change).toFixed(0)}%`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              vs ${data.revenueLastWeek.toFixed(0)} last week
            </p>
          </div>
          <div className="p-3 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Tasks done</p>
            <p className="text-lg font-bold mt-1">{data.tasksCompletedThisWeek}</p>
          </div>
          <div className="p-3 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Focus days</p>
            <p className="text-lg font-bold mt-1">{data.focusDaysCompletedThisWeek}/7</p>
          </div>
          <div className="p-3 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Streak</p>
            <p className="text-lg font-bold mt-1">{data.currentStreak} days</p>
          </div>
        </div>

        {data.projects.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Projects
            </p>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {data.projects.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 text-sm p-2 rounded bg-muted/20"
                >
                  <span className="font-medium truncate flex-1">{p.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.ageDays}d · ${p.revenue.toFixed(0)}
                  </span>
                  <Badge variant="outline" className={`text-xs ${flagColors[p.flag]}`}>
                    {flagLabels[p.flag]}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
