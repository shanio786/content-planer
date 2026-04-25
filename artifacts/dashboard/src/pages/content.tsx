import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListContent,
  useCreateContent,
  useUpdateContent,
  useDeleteContent,
  useGetUpcomingContent,
  getListContentQueryKey,
  getGetUpcomingContentQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import type { CreateContentBodyStatus, UpdateContentBodyStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Trash2, Calendar, Youtube, Instagram, Twitter, BookOpen, Video, AlertCircle, Hash } from "lucide-react";
import { format } from "date-fns";

const DEFAULT_PLATFORMS = ["youtube", "instagram", "tiktok", "blog", "twitter"];

const formatPlatformLabel = (p: string) =>
  p.charAt(0).toUpperCase() + p.slice(1).replace(/_/g, " ");

const platformIcons: Record<string, React.ElementType> = {
  youtube: Youtube,
  instagram: Instagram,
  tiktok: Video,
  blog: BookOpen,
  twitter: Twitter,
};

const platformColors: Record<string, string> = {
  youtube: "bg-red-500/10 text-red-500",
  instagram: "bg-pink-500/10 text-pink-500",
  tiktok: "bg-purple-500/10 text-purple-500",
  blog: "bg-blue-500/10 text-blue-500",
  twitter: "bg-sky-500/10 text-sky-500",
};

const statusColors: Record<string, string> = {
  idea: "bg-muted text-muted-foreground",
  scheduled: "bg-yellow-500/10 text-yellow-500",
  published: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-500",
};

export default function Content() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [form, setForm] = useState<{
    title: string;
    platform: string;
    status: CreateContentBodyStatus;
    scheduledDate: string;
    description: string;
  }>({
    title: "",
    platform: "youtube",
    status: "idea",
    scheduledDate: "",
    description: "",
  });

  const { data: items, isLoading, isError } = useListContent(
    filterPlatform !== "all" ? { platform: filterPlatform } : undefined
  );
  const { data: upcoming } = useGetUpcomingContent({ days: 7 });
  const createMutation = useCreateContent();
  const updateMutation = useUpdateContent();
  const deleteMutation = useDeleteContent();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListContentQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetUpcomingContentQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    const cleanPlatform = form.platform.trim().toLowerCase().replace(/\s+/g, "_");
    if (!cleanPlatform) return;
    createMutation.mutate(
      {
        data: {
          title: form.title,
          platform: cleanPlatform,
          status: form.status,
          scheduledDate: form.scheduledDate ? new Date(form.scheduledDate).toISOString() : null,
          description: form.description || null,
        },
      },
      {
        onSuccess: () => {
          invalidate();
          setOpen(false);
          setForm({ title: "", platform: "youtube", status: "idea", scheduledDate: "", description: "" });
        },
      }
    );
  };

  const handleStatusChange = (id: number, status: UpdateContentBodyStatus) => {
    updateMutation.mutate({ id, data: { status } }, { onSuccess: invalidate });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, { onSuccess: invalidate });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {upcoming?.length ?? 0} upcoming this week
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> New Content
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Plan Content</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Content title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  list="content-platforms"
                  placeholder="Platform (e.g. youtube, podcast)"
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                />
                <datalist id="content-platforms">
                  {Array.from(new Set([...DEFAULT_PLATFORMS, ...(items?.map((i) => i.platform) ?? [])])).map((p) => (
                    <option key={p} value={p}>{formatPlatformLabel(p)}</option>
                  ))}
                </datalist>
                <Select value={form.status} onValueChange={(v: CreateContentBodyStatus) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input type="datetime-local" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
              <Textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              <Button onClick={handleSubmit} className="w-full" disabled={!form.title.trim()}>Create Content</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(() => {
          const dynamic = Array.from(
            new Set([...DEFAULT_PLATFORMS, ...(items?.map((i) => i.platform) ?? [])])
          );
          return ["all", ...dynamic].map((p) => (
            <Button key={p} variant={filterPlatform === p ? "default" : "outline"} size="sm" onClick={() => setFilterPlatform(p)} className="text-xs">
              {p === "all" ? "All" : formatPlatformLabel(p)}
            </Button>
          ));
        })()}
      </div>

      {upcoming && upcoming.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Upcoming This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcoming.map((item) => {
                const Icon = platformIcons[item.platform] || Hash;
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-md bg-primary/5">
                    <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.scheduledDate ? format(new Date(item.scheduledDate), "EEE, MMM d 'at' h:mm a") : "No date"}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-xs ${platformColors[item.platform] || ""}`}>
                      {item.platform}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isError ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
            <p className="text-muted-foreground">Failed to load content. Please try again.</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : items && items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = platformIcons[item.platform] || Hash;
            return (
              <div key={item.id} className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors group">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${platformColors[item.platform] || "bg-muted"}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.title}</p>
                  {item.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.scheduledDate ? format(new Date(item.scheduledDate), "MMM d, yyyy") : "No date set"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={item.status} onValueChange={(v: UpdateContentBodyStatus) => handleStatusChange(item.id, v)}>
                    <SelectTrigger className="h-7 text-xs w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Idea</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No content planned yet. Start creating!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
