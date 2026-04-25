import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListWins,
  useCreateWin,
  useDeleteWin,
  getListWinsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trophy, Plus, X } from "lucide-react";

export function WinsLog() {
  const queryClient = useQueryClient();
  const { data: wins, isLoading } = useListWins({ limit: 8 });
  const createWin = useCreateWin();
  const deleteWin = useDeleteWin();
  const [text, setText] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListWinsQueryKey() });
  };

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    createWin.mutate(
      { data: { text: t } },
      { onSuccess: () => { invalidate(); setText(""); } },
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          Wins
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="Add today's smallest win..."
            className="h-9 text-sm"
          />
          <Button size="sm" onClick={submit} disabled={!text.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : wins && wins.length > 0 ? (
            wins.map((w) => (
              <div
                key={w.id}
                className="flex items-start gap-2 text-sm p-2 rounded bg-muted/30 group"
              >
                <span className="text-amber-400 mt-0.5">•</span>
                <div className="flex-1 min-w-0">
                  <p className="break-words">{w.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(w.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => deleteWin.mutate({ id: w.id }, { onSuccess: invalidate })}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  aria-label="Delete win"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No wins yet. Add your first small win!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
