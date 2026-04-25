import { useMemo } from "react";
import { Link } from "wouter";
import {
  useGetSettings,
  useGetFocusStreak,
  useGetTodayFocus,
  useListProjects,
} from "@workspace/api-client-react";
import { Flame, Target, AlertTriangle, ChevronRight } from "lucide-react";

function flagFromAge(ageDays: number, hasTraction: boolean, warn: number, dead: number): "working" | "review" | "kill" | "grace" {
  if (hasTraction) return "working";
  if (ageDays >= dead) return "kill";
  if (ageDays >= warn) return "review";
  return "grace";
}

export function MissionStrip() {
  const { data: settings } = useGetSettings();
  const { data: streak } = useGetFocusStreak();
  const { data: today } = useGetTodayFocus();
  const { data: projects } = useListProjects();

  const filledSlots = today?.slots.filter((s) => s !== null).length ?? 0;
  const completedSlots =
    today?.slots.filter((s) => s !== null && s.completedAt).length ?? 0;

  const killStats = useMemo(() => {
    const warn = settings?.killWarnDays ?? 30;
    const dead = settings?.killDeadDays ?? 45;
    const now = Date.now();
    let review = 0;
    let kill = 0;
    for (const p of projects ?? []) {
      if (p.status === "abandoned" || p.status === "flopped") continue;
      const ageDays = Math.floor(
        (now - new Date(p.createdAt).getTime()) / (24 * 60 * 60 * 1000),
      );
      const hasTraction = p.revenue > 0 || p.traffic > 100;
      const flag = flagFromAge(ageDays, hasTraction, warn, dead);
      if (flag === "review") review += 1;
      if (flag === "kill") kill += 1;
    }
    return { review, kill };
  }, [projects, settings]);

  const mission = settings?.mission?.trim();
  const streakNum = streak?.streak ?? 0;

  return (
    <div className="border-b border-border bg-card/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-2.5 flex items-center gap-3 text-xs flex-wrap">
        <Link
          href="/settings"
          className="flex items-center gap-1.5 min-w-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Target className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="truncate max-w-[42ch]">
            {mission || "Set your mission →"}
          </span>
        </Link>

        <span className="text-muted-foreground/40">·</span>

        <Link
          href="/hub"
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          title="Daily focus streak"
        >
          <Flame
            className={`w-3.5 h-3.5 ${
              streakNum > 0 ? "text-orange-400" : "text-muted-foreground/50"
            }`}
          />
          <span className="font-semibold">
            {streakNum} <span className="font-normal text-muted-foreground">days</span>
          </span>
        </Link>

        <Link
          href="/hub"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          title="Today's 3 tasks"
        >
          <span className="font-semibold text-foreground">{completedSlots}/{filledSlots || 3}</span>
          <span>today</span>
        </Link>

        {(killStats.kill > 0 || killStats.review > 0) && (
          <Link
            href="/projects"
            className="flex items-center gap-1.5 ml-auto text-muted-foreground hover:text-foreground transition-colors"
            title="Projects needing review or kill decision"
          >
            <AlertTriangle
              className={`w-3.5 h-3.5 ${
                killStats.kill > 0 ? "text-red-400" : "text-amber-400"
              }`}
            />
            {killStats.kill > 0 && (
              <span>
                <span className="font-semibold text-red-400">{killStats.kill}</span> kill
              </span>
            )}
            {killStats.review > 0 && (
              <span>
                <span className="font-semibold text-amber-400">{killStats.review}</span> review
              </span>
            )}
            <ChevronRight className="w-3 h-3 opacity-60" />
          </Link>
        )}
      </div>
    </div>
  );
}
