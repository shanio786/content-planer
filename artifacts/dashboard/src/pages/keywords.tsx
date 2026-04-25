import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListKeywords,
  useCreateKeyword,
  useDeleteKeyword,
  useGetKeywordStats,
  getListKeywordsQueryKey,
  getGetKeywordStatsQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import type {
  CreateKeywordBodyCompetition,
  CreateKeywordBodyStatus,
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
import { Plus, Trash2, Search, AlertCircle, BarChart3, Target } from "lucide-react";

const difficultyColor = (d: number) => {
  if (d <= 30) return "text-green-500";
  if (d <= 60) return "text-yellow-500";
  return "text-red-500";
};

const competitionBadge: Record<string, string> = {
  low: "bg-green-500/10 text-green-500 border-green-500/30",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  high: "bg-red-500/10 text-red-500 border-red-500/30",
};

const statusBadge: Record<string, string> = {
  researching: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  targeting: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  ranking: "bg-green-500/10 text-green-400 border-green-500/30",
  dropped: "bg-gray-500/10 text-gray-400 border-gray-500/30",
};

export default function Keywords() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [nicheFilter, setNicheFilter] = useState("");
  const [form, setForm] = useState({
    keyword: "",
    niche: "",
    volume: "",
    difficulty: "",
    cpc: "",
    competition: "low" as CreateKeywordBodyCompetition,
    status: "researching" as CreateKeywordBodyStatus,
    notes: "",
  });

  const { data: keywords, isLoading, isError } = useListKeywords();
  const { data: stats } = useGetKeywordStats();
  const createMutation = useCreateKeyword();
  const deleteMutation = useDeleteKeyword();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListKeywordsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetKeywordStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  };

  const handleSubmit = () => {
    if (!form.keyword || !form.niche) return;
    createMutation.mutate(
      {
        data: {
          keyword: form.keyword,
          niche: form.niche,
          volume: parseInt(form.volume) || 0,
          difficulty: parseInt(form.difficulty) || 0,
          cpc: parseFloat(form.cpc) || 0,
          competition: form.competition,
          status: form.status,
          notes: form.notes || null,
        },
      },
      {
        onSuccess: () => {
          invalidate();
          setOpen(false);
          setForm({ keyword: "", niche: "", volume: "", difficulty: "", cpc: "", competition: "low", status: "researching", notes: "" });
        },
      }
    );
  };

  const niches = [...new Set(keywords?.map((k) => k.niche) || [])];
  const filtered = nicheFilter
    ? keywords?.filter((k) => k.niche === nicheFilter)
    : keywords;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Keyword Research</h1>
          <p className="text-sm text-muted-foreground mt-1">Track niches, keywords & rankings</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Add Keyword
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Keyword</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Keyword *" value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} />
              <Input placeholder="Niche *" value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} />
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" placeholder="Volume" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} />
                <Input type="number" placeholder="Difficulty (0-100)" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} />
                <Input type="number" step="0.01" placeholder="CPC ($)" value={form.cpc} onChange={(e) => setForm({ ...form, cpc: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={form.competition} onValueChange={(v: CreateKeywordBodyCompetition) => setForm({ ...form, competition: v })}>
                  <SelectTrigger><SelectValue placeholder="Competition" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={form.status} onValueChange={(v: CreateKeywordBodyStatus) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="researching">Researching</SelectItem>
                    <SelectItem value="targeting">Targeting</SelectItem>
                    <SelectItem value="ranking">Ranking</SelectItem>
                    <SelectItem value="dropped">Dropped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <Button onClick={handleSubmit} className="w-full" disabled={!form.keyword || !form.niche}>Add Keyword</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Keywords</p>
                <p className="text-2xl font-bold mt-1">{stats?.total ?? 0}</p>
              </div>
              <Search className="w-5 h-5 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Volume</p>
                <p className="text-2xl font-bold mt-1">{stats?.avgVolume?.toLocaleString() ?? 0}</p>
              </div>
              <BarChart3 className="w-5 h-5 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Difficulty</p>
                <p className="text-2xl font-bold mt-1">{stats?.avgDifficulty ?? 0}</p>
              </div>
              <Target className="w-5 h-5 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Niches</p>
            <p className="text-2xl font-bold mt-1">{Object.keys(stats?.byNiche ?? {}).length}</p>
          </CardContent>
        </Card>
      </div>

      {niches.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={nicheFilter === "" ? "default" : "outline"}
            onClick={() => setNicheFilter("")}
          >
            All
          </Button>
          {niches.map((n) => (
            <Button
              key={n}
              size="sm"
              variant={nicheFilter === n ? "default" : "outline"}
              onClick={() => setNicheFilter(n)}
            >
              {n}
            </Button>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Keywords Table</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="py-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
              <p className="text-muted-foreground">Failed to load keywords.</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : filtered && filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 px-3 font-medium text-muted-foreground">Keyword</th>
                    <th className="py-2 px-3 font-medium text-muted-foreground">Niche</th>
                    <th className="py-2 px-3 font-medium text-muted-foreground text-right">Volume</th>
                    <th className="py-2 px-3 font-medium text-muted-foreground text-right">KD</th>
                    <th className="py-2 px-3 font-medium text-muted-foreground text-right">CPC</th>
                    <th className="py-2 px-3 font-medium text-muted-foreground">Competition</th>
                    <th className="py-2 px-3 font-medium text-muted-foreground">Status</th>
                    <th className="py-2 px-3 font-medium text-muted-foreground text-right">Pos</th>
                    <th className="py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((kw) => (
                    <tr key={kw.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                      <td className="py-2.5 px-3 font-medium">{kw.keyword}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{kw.niche}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{kw.volume.toLocaleString()}</td>
                      <td className={`py-2.5 px-3 text-right tabular-nums font-medium ${difficultyColor(kw.difficulty)}`}>{kw.difficulty}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">${kw.cpc.toFixed(2)}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className={competitionBadge[kw.competition] || ""}>
                          {kw.competition}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className={statusBadge[kw.status] || ""}>
                          {kw.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {kw.position ? `#${kw.position}` : "-"}
                      </td>
                      <td className="py-2.5 px-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteMutation.mutate({ id: kw.id }, { onSuccess: invalidate })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No keywords yet. Start your research!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
