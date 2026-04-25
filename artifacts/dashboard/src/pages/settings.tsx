import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSettings,
  useUpdateSettings,
  getGetSettingsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings as SettingsIcon, Check } from "lucide-react";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [form, setForm] = useState({
    mission: "",
    monthlyGoalAmount: 3000,
    killWarnDays: 30,
    killDeadDays: 45,
    reflectionStartHour: 20,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        mission: settings.mission,
        monthlyGoalAmount: settings.monthlyGoalAmount,
        killWarnDays: settings.killWarnDays,
        killDeadDays: settings.killDeadDays,
        reflectionStartHour: settings.reflectionStartHour,
      });
    }
  }, [settings]);

  const save = () => {
    updateSettings.mutate(
      { data: form },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          setSavedAt(Date.now());
        },
      },
    );
  };

  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mission, monthly goal, and Kill Rule thresholds.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="mission" className="text-xs text-muted-foreground">
            Your current mission in one line. Shows at the top of every page.
          </Label>
          <Textarea
            id="mission"
            value={form.mission}
            onChange={(e) => setForm({ ...form, mission: e.target.value })}
            rows={2}
            placeholder="Example: First $1k recurring revenue in 90 days."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly revenue goal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="goal" className="text-xs text-muted-foreground">
            Dollars. Shown as a progress bar on the dashboard.
          </Label>
          <Input
            id="goal"
            type="number"
            min={0}
            value={form.monthlyGoalAmount}
            onChange={(e) =>
              setForm({ ...form, monthlyGoalAmount: Number(e.target.value) || 0 })
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kill Rule thresholds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            If a project hasn't gained traction in this many days (revenue ≤ 0 and traffic ≤ 100),
            flag it. Removes sentiment, makes the decision easy.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="warn" className="text-xs text-muted-foreground">
                Review badge (days)
              </Label>
              <Input
                id="warn"
                type="number"
                min={1}
                value={form.killWarnDays}
                onChange={(e) =>
                  setForm({ ...form, killWarnDays: Number(e.target.value) || 1 })
                }
              />
            </div>
            <div>
              <Label htmlFor="dead" className="text-xs text-muted-foreground">
                Kill badge (days)
              </Label>
              <Input
                id="dead"
                type="number"
                min={1}
                value={form.killDeadDays}
                onChange={(e) =>
                  setForm({ ...form, killDeadDays: Number(e.target.value) || 1 })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">End-of-day reflection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="reflection" className="text-xs text-muted-foreground">
            Hour (PKT) after which the reflection card appears on the dashboard. 0–23.
          </Label>
          <Input
            id="reflection"
            type="number"
            min={0}
            max={23}
            value={form.reflectionStartHour}
            onChange={(e) =>
              setForm({
                ...form,
                reflectionStartHour: Math.min(23, Math.max(0, Number(e.target.value) || 0)),
              })
            }
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={updateSettings.isPending}>
          Save settings
        </Button>
        {savedAt && Date.now() - savedAt < 5000 && (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <Check className="w-3 h-3" /> saved
          </span>
        )}
      </div>
    </div>
  );
}
