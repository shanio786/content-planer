import { useGetDashboardSummary, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  DollarSign,
  CheckSquare,
  Calendar,
  TrendingUp,
  Zap,
  StickyNote,
  Clock,
  AlertCircle,
  CreditCard,
  Search,
  CalendarDays,
} from "lucide-react";
import { TodayFocus } from "@/components/today-focus";
import { MonthlyGoalBar } from "@/components/monthly-goal-bar";
import { WinsLog } from "@/components/wins-log";
import { EndOfDayReflection } from "@/components/end-of-day-reflection";
import { WeeklyReview } from "@/components/weekly-review";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  accentColor: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `hsl(var(--primary) / 0.1)` }}
          >
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const activityIcons: Record<string, React.ElementType> = {
  project_created: Briefcase,
  project_updated: Briefcase,
  revenue_added: DollarSign,
  task_completed: CheckSquare,
  content_scheduled: Calendar,
  note_created: StickyNote,
};

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useGetDashboardSummary();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity({ limit: 8 });

  if (summaryError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your business at a glance</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
            <p className="text-muted-foreground">Failed to load dashboard data. Please refresh.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (summaryLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your business at a glance</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Empire Control Room</h1>
        <p className="text-sm text-muted-foreground mt-1">
          What to do today. Keep the streak. That's it.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TodayFocus />
        </div>
        <MonthlyGoalBar />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Projects"
          value={summary?.totalProjects ?? 0}
          subtitle={`${summary?.liveProjects ?? 0} live · ${summary?.abandonedProjects ?? 0} dropped`}
          icon={Briefcase}
          accentColor="primary"
        />
        <StatCard
          title="Total Revenue"
          value={`$${(summary?.totalRevenue ?? 0).toFixed(2)}`}
          subtitle={`$${(summary?.thisMonthRevenue ?? 0).toFixed(2)} this month`}
          icon={DollarSign}
          accentColor="primary"
        />
        <StatCard
          title="Monthly Expenses"
          value={`$${(summary?.monthlyExpenses ?? 0).toFixed(2)}`}
          subtitle="recurring costs"
          icon={CreditCard}
          accentColor="primary"
        />
        <StatCard
          title="Pending Tasks"
          value={summary?.pendingTasks ?? 0}
          subtitle={`${summary?.completedTasksToday ?? 0} completed today`}
          icon={CheckSquare}
          accentColor="primary"
        />
        <StatCard
          title="Today's Plan"
          value={summary?.todayPlannerItems ?? 0}
          subtitle="items for today"
          icon={CalendarDays}
          accentColor="primary"
        />
        <StatCard
          title="Keywords Tracked"
          value={summary?.totalKeywords ?? 0}
          subtitle="research entries"
          icon={Search}
          accentColor="primary"
        />
        <StatCard
          title="Upcoming Content"
          value={summary?.upcomingContent ?? 0}
          subtitle={`${summary?.recentNotes ?? 0} new notes`}
          icon={Calendar}
          accentColor="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WinsLog />
        <EndOfDayReflection />
      </div>

      <WeeklyReview />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))
            ) : activity && activity.length > 0 ? (
              activity.map((item) => {
                const Icon = activityIcons[item.type] || Zap;
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(item.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-md bg-muted/30">
                <p className="text-xs text-muted-foreground">Live Projects</p>
                <p className="text-xl font-bold mt-1">{summary?.liveProjects ?? 0}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/30">
                <p className="text-xs text-muted-foreground">Net Income</p>
                <p className="text-xl font-bold mt-1">${((summary?.thisMonthRevenue ?? 0) - (summary?.monthlyExpenses ?? 0)).toFixed(0)}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/30">
                <p className="text-xs text-muted-foreground">Tasks Due</p>
                <p className="text-xl font-bold mt-1">{summary?.pendingTasks ?? 0}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/30">
                <p className="text-xs text-muted-foreground">Keywords</p>
                <p className="text-xl font-bold mt-1">{summary?.totalKeywords ?? 0}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/30">
                <p className="text-xs text-muted-foreground">Content Queue</p>
                <p className="text-xl font-bold mt-1">{summary?.upcomingContent ?? 0}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/30">
                <p className="text-xs text-muted-foreground">Dropped Projects</p>
                <p className="text-xl font-bold mt-1 text-red-400">{summary?.abandonedProjects ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
