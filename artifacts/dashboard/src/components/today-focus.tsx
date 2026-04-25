import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetTodayFocus,
  useGetFocusStreak,
  useSetFocusSlot,
  useUpdateFocus,
  useToggleFocus,
  useDeleteFocus,
  getGetTodayFocusQueryKey,
  getGetFocusStreakQueryKey,
  getGetWeeklyReviewQueryKey,
  type DailyFocusToday,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Flame, Target, Check, X, Pencil } from "lucide-react";

type Slot = 1 | 2 | 3;

function FocusRow({
  slot,
  item,
}: {
  slot: Slot;
  item: DailyFocusToday["slots"][number];
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item?.title ?? "");

  useEffect(() => {
    setDraft(item?.title ?? "");
  }, [item?.title]);

  const setSlot = useSetFocusSlot();
  const updateFocus = useUpdateFocus();
  const toggleFocus = useToggleFocus();
  const deleteFocus = useDeleteFocus();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetTodayFocusQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetFocusStreakQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetWeeklyReviewQueryKey() });
  };

  const save = () => {
    const title = draft.trim();
    if (!title) {
      if (item) {
        deleteFocus.mutate({ id: item.id }, { onSuccess: () => { invalidate(); setEditing(false); } });
      } else {
        setEditing(false);
      }
      return;
    }
    if (item) {
      updateFocus.mutate(
        { id: item.id, data: { title } },
        { onSuccess: () => { invalidate(); setEditing(false); } },
      );
    } else {
      setSlot.mutate(
        { data: { slot, title } },
        { onSuccess: () => { invalidate(); setEditing(false); } },
      );
    }
  };

  const isCompleted = !!item?.completedAt;

  if (editing || !item) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-6 text-xs font-semibold text-muted-foreground">{slot}.</span>
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") { setDraft(item?.title ?? ""); setEditing(false); }
          }}
          onBlur={save}
          placeholder={`Write task #${slot} for today...`}
          className="h-9 text-sm"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <span className="w-6 text-xs font-semibold text-muted-foreground">{slot}.</span>
      <button
        onClick={() => toggleFocus.mutate({ id: item.id }, { onSuccess: invalidate })}
        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
          isCompleted
            ? "bg-primary border-primary text-primary-foreground"
            : "border-border hover:border-primary"
        }`}
        aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
      >
        {isCompleted && <Check className="w-3.5 h-3.5" />}
      </button>
      <button
        onClick={() => setEditing(true)}
        className={`flex-1 text-left text-sm py-1.5 truncate ${
          isCompleted ? "line-through text-muted-foreground" : ""
        }`}
      >
        {item.title}
      </button>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setEditing(true)}
          aria-label="Edit"
        >
          <Pencil className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => deleteFocus.mutate({ id: item.id }, { onSuccess: invalidate })}
          aria-label="Clear"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export function TodayFocus() {
  const { data: today, isLoading } = useGetTodayFocus();
  const { data: streak } = useGetFocusStreak();

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Today's 3 tasks
        </CardTitle>
        <div className="flex items-center gap-1.5 text-xs">
          <Flame
            className={`w-3.5 h-3.5 ${
              (streak?.streak ?? 0) > 0 ? "text-orange-400" : "text-muted-foreground/50"
            }`}
          />
          <span className="font-semibold">{streak?.streak ?? 0}</span>
          <span className="text-muted-foreground">day streak</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          ([1, 2, 3] as Slot[]).map((slot) => {
            const item = today?.slots[slot - 1] ?? null;
            return <FocusRow key={slot} slot={slot} item={item} />;
          })
        )}
        <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
          Just 3. Don't overthink. One complete = streak.
        </p>
      </CardContent>
    </Card>
  );
}
