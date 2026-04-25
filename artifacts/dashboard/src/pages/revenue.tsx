import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListRevenue,
  useCreateRevenue,
  useDeleteRevenue,
  useGetRevenueSummary,
  getListRevenueQueryKey,
  getGetRevenueSummaryQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Trash2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import type { CreateRevenueBodySource } from "@workspace/api-client-react";

const sourceLabels: Record<string, string> = {
  ads: "Ads",
  youtube: "YouTube",
  subscriptions: "Subscriptions",
  apps: "Apps",
  freelance: "Freelance",
  other: "Other",
};

const sourceColors: Record<string, string> = {
  ads: "bg-blue-500",
  youtube: "bg-red-500",
  subscriptions: "bg-purple-500",
  apps: "bg-green-500",
  freelance: "bg-orange-500",
  other: "bg-gray-500",
};

export default function Revenue() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{
    amount: string;
    source: CreateRevenueBodySource;
    description: string;
    date: string;
  }>({
    amount: "",
    source: "ads",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const { data: entries, isLoading, isError } = useListRevenue();
  const { data: summary } = useGetRevenueSummary();
  const createMutation = useCreateRevenue();
  const deleteMutation = useDeleteRevenue();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListRevenueQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRevenueSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  };

  const handleSubmit = () => {
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) return;

    createMutation.mutate(
      {
        data: {
          amount,
          source: form.source,
          description: form.description || null,
          date: new Date(form.date).toISOString(),
        },
      },
      {
        onSuccess: () => {
          invalidate();
          setOpen(false);
          setForm({ amount: "", source: "ads", description: "", date: new Date().toISOString().split("T")[0] });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, { onSuccess: invalidate });
  };

  const monthChange = summary ? summary.thisMonth - summary.lastMonth : 0;
  const changePercent = summary && summary.lastMonth > 0 ? ((monthChange / summary.lastMonth) * 100).toFixed(0) : "0";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Revenue</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your income streams</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Add Revenue
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Revenue</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Input type="number" placeholder="Amount ($)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <Select value={form.source} onValueChange={(v: CreateRevenueBodySource) => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ads">Ads</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="subscriptions">Subscriptions</SelectItem>
                  <SelectItem value="apps">Apps</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <Input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Button onClick={handleSubmit} className="w-full" disabled={!form.amount}>Add Revenue</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Revenue</p>
            <p className="text-2xl font-bold mt-1">${(summary?.totalRevenue ?? 0).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">This Month</p>
            <p className="text-2xl font-bold mt-1">${(summary?.thisMonth ?? 0).toFixed(2)}</p>
            <div className="flex items-center gap-1 mt-1">
              {monthChange >= 0 ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
              <span className={`text-xs ${monthChange >= 0 ? "text-green-500" : "text-red-500"}`}>{changePercent}% vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Month</p>
            <p className="text-2xl font-bold mt-1">${(summary?.lastMonth ?? 0).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {summary?.bySource && Object.keys(summary.bySource).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Revenue by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(summary.bySource).map(([source, amount]) => {
                const percent = summary.totalRevenue > 0 ? (((amount as number) / summary.totalRevenue) * 100).toFixed(0) : 0;
                return (
                  <div key={source} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{sourceLabels[source] || source}</span>
                      <span className="text-muted-foreground">${(amount as number).toFixed(2)} ({percent}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${sourceColors[source] || "bg-primary"}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="py-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
              <p className="text-muted-foreground">Failed to load revenue data.</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : entries && entries.length > 0 ? (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${sourceColors[entry.source] || "bg-primary"}`} />
                    <div>
                      <p className="text-sm font-medium">${entry.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{sourceLabels[entry.source] || entry.source}{entry.description ? ` - ${entry.description}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete(entry.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No revenue entries yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
