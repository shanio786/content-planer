import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetTodayReflection,
  useUpsertReflection,
  useGetSettings,
  getGetTodayReflectionQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Moon, Check } from "lucide-react";

function nowHourInPkt(): number {
  // PKT = UTC+5, no DST.
  const utcMs = Date.now();
  const pkt = new Date(utcMs + 5 * 60 * 60 * 1000);
  return pkt.getUTCHours();
}

export function EndOfDayReflection() {
  const queryClient = useQueryClient();
  const { data: settings } = useGetSettings();
  const { data: reflection } = useGetTodayReflection();
  const upsert = useUpsertReflection();

  const [didWhat, setDidWhat] = useState("");
  const [blocker, setBlocker] = useState("");
  const [lesson, setLesson] = useState("");

  useEffect(() => {
    if (reflection) {
      setDidWhat(reflection.didWhat ?? "");
      setBlocker(reflection.blocker ?? "");
      setLesson(reflection.lesson ?? "");
    }
  }, [reflection]);

  const startHour = settings?.reflectionStartHour ?? 20;
  const currentHour = nowHourInPkt();
  const isReflectionTime = currentHour >= startHour;
  const alreadySaved = !!reflection;

  if (!isReflectionTime && !alreadySaved) return null;

  const save = () => {
    upsert.mutate(
      {
        data: {
          didWhat: didWhat.trim() || null,
          blocker: blocker.trim() || null,
          lesson: lesson.trim() || null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTodayReflectionQueryKey() });
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Moon className="w-4 h-4 text-indigo-400" />
          Today's reflection
          {alreadySaved && (
            <span className="ml-auto text-xs font-normal text-green-400 flex items-center gap-1">
              <Check className="w-3 h-3" /> saved
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            What did you actually do today?
          </label>
          <Textarea
            value={didWhat}
            onChange={(e) => setDidWhat(e.target.value)}
            rows={2}
            placeholder="Be totally honest..."
            className="text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            What blocked you? Where did you get stuck?
          </label>
          <Textarea
            value={blocker}
            onChange={(e) => setBlocker(e.target.value)}
            rows={2}
            placeholder="Distraction, focus, energy, any blocker..."
            className="text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            One lesson learned?
          </label>
          <Textarea
            value={lesson}
            onChange={(e) => setLesson(e.target.value)}
            rows={2}
            placeholder="Tomorrow I'll do this differently..."
            className="text-sm"
          />
        </div>
        <Button onClick={save} className="w-full" disabled={upsert.isPending}>
          {alreadySaved ? "Update" : "Save reflection"}
        </Button>
      </CardContent>
    </Card>
  );
}
