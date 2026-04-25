import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListPlannerItems,
  useCreatePlannerItem,
  useUpdatePlannerItem,
  useDeletePlannerItem,
  getListPlannerItemsQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import type {
  CreatePlannerBodyPriority,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { appTodayString, formatDateLabel, shiftDateString } from "@/lib/timezone";
import { Plus, Trash2, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Clock, Circle, SkipForward } from "lucide-react";

const statusIcons: Record<string, typeof Circle> = {
  planned: Circle,
  in_progress: Clock,
  done: CheckCircle2,
  skipped: SkipForward,
};

const statusColors: Record<string, string> = {
  planned: "text-blue-400",
  in_progress: "text-yellow-400",
  done: "text-green-400",
  skipped: "text-gray-400",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-500/10 text-gray-400 border-gray-500/30",
  medium: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  urgent: "bg-red-500/10 text-red-400 border-red-500/30",
};

const timeSlots = [
  "Morning (6-9 AM)", "Late Morning (9-12 PM)", "Afternoon (12-3 PM)",
  "Late Afternoon (3-6 PM)", "Evening (6-9 PM)", "Night (9 PM+)",
];

function formatDate(dateStr: string) {
  return formatDateLabel(dateStr);
}

export default function Planner() {
  const queryClient = useQueryClient();
  const today = appTodayString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as CreatePlannerBodyPriority,
    timeSlot: "",
  });

  const { data: allItems, isLoading, isError } = useListPlannerItems();
  const createMutation = useCreatePlannerItem();
  const updateMutation = useUpdatePlannerItem();
  const deleteMutation = useDeletePlannerItem();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListPlannerItemsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  };

  const handleSubmit = () => {
    if (!form.title) return;
    createMutation.mutate(
      {
        data: {
          date: selectedDate,
          title: form.title,
          description: form.description || null,
          priority: form.priority,
          timeSlot: form.timeSlot || null,
        },
      },
      {
        onSuccess: () => {
          invalidate();
          setOpen(false);
          setForm({ title: "", description: "", priority: "medium", timeSlot: "" });
        },
      }
    );
  };

  const cycleStatus = (id: number, current: string) => {
    const order = ["planned", "in_progress", "done", "skipped"];
    const next = order[(order.indexOf(current) + 1) % order.length];
    updateMutation.mutate(
      { id, data: { status: next as "planned" | "in_progress" | "done" | "skipped" } },
      { onSuccess: invalidate }
    );
  };

  const navigateDay = (offset: number) => {
    setSelectedDate(shiftDateString(selectedDate, offset));
  };

  const dayItems = allItems?.filter((item) => item.date === selectedDate) || [];
  const doneCount = dayItems.filter((i) => i.status === "done").length;

  // Build the Sun..Sat row for the week containing selectedDate.
  // Compute weekday from the calendar-date string (treat as UTC) so
  // the row stays consistent regardless of browser timezone.
  const [sy, sm, sd] = selectedDate.split("-").map(Number);
  const selectedWeekday = new Date(Date.UTC(sy, sm - 1, sd)).getUTCDay();
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    shiftDateString(selectedDate, i - selectedWeekday)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Planner</h1>
          <p className="text-sm text-muted-foreground mt-1">Plan your day, project by project</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Plan for {formatDate(selectedDate)}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="What to do *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Input placeholder="Details (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Select value={form.priority} onValueChange={(v: CreatePlannerBodyPriority) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={form.timeSlot} onValueChange={(v) => setForm({ ...form, timeSlot: v })}>
                  <SelectTrigger><SelectValue placeholder="Time Slot" /></SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={!form.title}>Add to Plan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigateDay(-1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex gap-1 flex-1 overflow-x-auto">
          {weekDates.map((d) => (
            <Button
              key={d}
              size="sm"
              variant={d === selectedDate ? "default" : d === today ? "secondary" : "ghost"}
              className={cn("flex-1 min-w-[80px] text-xs", d === today && d !== selectedDate && "border border-primary/30")}
              onClick={() => setSelectedDate(d)}
            >
              {formatDate(d)}
            </Button>
          ))}
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigateDay(1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Today's Tasks</p>
            <p className="text-2xl font-bold mt-1">{dayItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Done</p>
            <p className="text-2xl font-bold mt-1 text-green-400">{doneCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Remaining</p>
            <p className="text-2xl font-bold mt-1">{dayItems.length - doneCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Plan for {formatDate(selectedDate)}
            {selectedDate === today && <span className="text-primary ml-2 text-xs font-normal">(Today)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="py-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
              <p className="text-muted-foreground">Failed to load planner.</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : dayItems.length > 0 ? (
            <div className="space-y-2">
              {dayItems.map((item) => {
                const Icon = statusIcons[item.status] || Circle;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border border-border bg-card transition-all group",
                      item.status === "done" && "opacity-60",
                      item.status === "skipped" && "opacity-40"
                    )}
                  >
                    <button
                      onClick={() => cycleStatus(item.id, item.status)}
                      className={cn("flex-shrink-0 transition-colors", statusColors[item.status])}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium text-sm", item.status === "done" && "line-through")}>{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.timeSlot && <span className="text-xs text-muted-foreground">{item.timeSlot}</span>}
                        {item.description && <span className="text-xs text-muted-foreground truncate">{item.description}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className={priorityColors[item.priority]}>
                        {item.priority}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate({ id: item.id }, { onSuccess: invalidate })}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nothing planned for this day. Add something!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
