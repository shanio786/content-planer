import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useGetExpenseSummary,
  getListExpensesQueryKey,
  getGetExpenseSummaryQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import type {
  CreateExpenseBodyCategory,
  CreateExpenseBodyBillingCycle,
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
import { Plus, Trash2, AlertCircle, CreditCard, TrendingUp, Repeat, Power, PowerOff } from "lucide-react";

const categoryLabels: Record<string, string> = {
  tool: "Tool",
  subscription: "Subscription",
  hosting: "Hosting",
  domain: "Domain",
  freelancer: "Freelancer",
  ads: "Ads",
  other: "Other",
};

const categoryColors: Record<string, string> = {
  tool: "bg-blue-500",
  subscription: "bg-purple-500",
  hosting: "bg-green-500",
  domain: "bg-orange-500",
  freelancer: "bg-pink-500",
  ads: "bg-yellow-500",
  other: "bg-gray-500",
};

const cycleLabels: Record<string, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
  one_time: "One-time",
};

export default function Expenses() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [form, setForm] = useState({
    name: "",
    amount: "",
    category: "tool" as CreateExpenseBodyCategory,
    billingCycle: "monthly" as CreateExpenseBodyBillingCycle,
    notes: "",
  });

  const { data: expenses, isLoading, isError } = useListExpenses();
  const { data: summary } = useGetExpenseSummary();
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetExpenseSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  };

  const handleSubmit = () => {
    const amount = parseFloat(form.amount);
    if (!form.name || isNaN(amount) || amount <= 0) return;
    createMutation.mutate(
      {
        data: {
          name: form.name,
          amount,
          category: form.category,
          billingCycle: form.billingCycle,
          notes: form.notes || null,
        },
      },
      {
        onSuccess: () => {
          invalidate();
          setOpen(false);
          setForm({ name: "", amount: "", category: "tool", billingCycle: "monthly", notes: "" });
        },
      }
    );
  };

  const toggleActive = (id: number, current: boolean) => {
    updateMutation.mutate(
      { id, data: { active: !current } },
      { onSuccess: invalidate }
    );
  };

  const filtered = categoryFilter
    ? expenses?.filter((e) => e.category === categoryFilter)
    : expenses;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">Track tools, subscriptions & costs</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Name (e.g. ChatGPT Plus) *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input type="number" step="0.01" placeholder="Amount ($) *" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Select value={form.category} onValueChange={(v: CreateExpenseBodyCategory) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tool">Tool</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="hosting">Hosting</SelectItem>
                    <SelectItem value="domain">Domain</SelectItem>
                    <SelectItem value="freelancer">Freelancer</SelectItem>
                    <SelectItem value="ads">Ads</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={form.billingCycle} onValueChange={(v: CreateExpenseBodyBillingCycle) => setForm({ ...form, billingCycle: v })}>
                  <SelectTrigger><SelectValue placeholder="Billing" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="one_time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <Button onClick={handleSubmit} className="w-full" disabled={!form.name || !form.amount}>Add Expense</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Monthly Burn</p>
                <p className="text-2xl font-bold mt-1 text-red-400">${(summary?.totalMonthly ?? 0).toFixed(2)}</p>
              </div>
              <Repeat className="w-5 h-5 text-red-400 opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Yearly Costs</p>
                <p className="text-2xl font-bold mt-1">${(summary?.totalYearly ?? 0).toFixed(2)}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">One-time</p>
                <p className="text-2xl font-bold mt-1">${(summary?.totalOneTime ?? 0).toFixed(2)}</p>
              </div>
              <CreditCard className="w-5 h-5 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Active</p>
            <p className="text-2xl font-bold mt-1 text-green-400">{summary?.activeCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {summary?.byCategory && Object.keys(summary.byCategory).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(summary.byCategory).map(([cat, amount]) => {
                const total = (summary.totalMonthly + summary.totalYearly + summary.totalOneTime) || 1;
                const percent = ((amount as number) / total * 100).toFixed(0);
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{categoryLabels[cat] || cat}</span>
                      <span className="text-muted-foreground">${(amount as number).toFixed(2)} ({percent}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${categoryColors[cat] || "bg-primary"}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={categoryFilter === "" ? "default" : "outline"} onClick={() => setCategoryFilter("")}>
          All
        </Button>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <Button key={key} size="sm" variant={categoryFilter === key ? "default" : "outline"} onClick={() => setCategoryFilter(key)}>
            {label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="py-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
              <p className="text-muted-foreground">Failed to load expenses.</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : filtered && filtered.length > 0 ? (
            <div className="space-y-2">
              {filtered.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${exp.active ? categoryColors[exp.category] || "bg-primary" : "bg-gray-500"}`} />
                    <div>
                      <p className={`text-sm font-medium ${!exp.active ? "line-through opacity-50" : ""}`}>{exp.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{categoryLabels[exp.category] || exp.category}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{cycleLabels[exp.billingCycle] || exp.billingCycle}</span>
                        {exp.notes && (
                          <>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">{exp.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums">${exp.amount.toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => toggleActive(exp.id, exp.active)}
                      title={exp.active ? "Deactivate" : "Activate"}
                    >
                      {exp.active ? <Power className="w-3.5 h-3.5 text-green-400" /> : <PowerOff className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate({ id: exp.id }, { onSuccess: invalidate })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No expenses yet. Start tracking your costs!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
