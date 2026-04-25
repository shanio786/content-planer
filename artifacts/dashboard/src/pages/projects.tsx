import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useGetProjectStats,
  getListProjectsQueryKey,
  getGetProjectStatsQueryKey,
  getGetDashboardSummaryQueryKey,
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Globe, Smartphone, Youtube, Sparkles, ExternalLink, Pencil, AlertCircle, Folder } from "lucide-react";
import type { CreateProjectBodyStatus } from "@workspace/api-client-react";
import { useGetSettings } from "@workspace/api-client-react";
import { computeProjectFlag, flagBadgeClass, flagBadgeLabel } from "@/lib/kill-flag";

const DEFAULT_TYPES = ["website", "app", "youtube", "ai_influencer"];

const typeIcons: Record<string, React.ElementType> = {
  website: Globe,
  app: Smartphone,
  youtube: Youtube,
  ai_influencer: Sparkles,
};

const formatTypeLabel = (t: string) =>
  t === "ai_influencer"
    ? "AI Influencer"
    : t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, " ");

const statusColors: Record<string, string> = {
  idea: "bg-muted text-muted-foreground",
  building: "bg-yellow-500/10 text-yellow-500",
  live: "bg-green-500/10 text-green-500",
  paused: "bg-red-500/10 text-red-500",
  abandoned: "bg-gray-500/10 text-gray-400",
  flopped: "bg-red-500/10 text-red-400",
};

export default function Projects() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<{
    name: string;
    type: string;
    status: CreateProjectBodyStatus;
    url: string;
    traffic: number;
    revenue: number;
    nextTask: string;
    description: string;
  }>({
    name: "",
    type: "website",
    status: "idea",
    url: "",
    traffic: 0,
    revenue: 0,
    nextTask: "",
    description: "",
  });
  const [filterType, setFilterType] = useState<string>("all");

  const { data: projects, isLoading, isError } = useListProjects(
    filterType !== "all" ? { type: filterType } : undefined
  );
  const { data: stats } = useGetProjectStats();
  const { data: settings } = useGetSettings();
  const killWarn = settings?.killWarnDays ?? 30;
  const killDead = settings?.killDeadDays ?? 45;
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetProjectStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    const cleanType = form.type.trim().toLowerCase().replace(/\s+/g, "_");
    if (!cleanType) return;
    const payload = {
      ...form,
      type: cleanType,
      url: form.url || null,
      nextTask: form.nextTask || null,
      description: form.description || null,
    };

    if (editId !== null) {
      updateMutation.mutate(
        { id: editId, data: payload },
        { onSuccess: () => { invalidate(); setOpen(false); resetForm(); } }
      );
    } else {
      createMutation.mutate(
        { data: payload },
        { onSuccess: () => { invalidate(); setOpen(false); resetForm(); } }
      );
    }
  };

  const resetForm = () => {
    setForm({ name: "", type: "website", status: "idea", url: "", traffic: 0, revenue: 0, nextTask: "", description: "" });
    setEditId(null);
  };

  const handleEdit = (project: NonNullable<typeof projects>[number]) => {
    setEditId(project.id);
    setForm({
      name: project.name,
      type: project.type,
      status: project.status,
      url: project.url || "",
      traffic: project.traffic,
      revenue: project.revenue,
      nextTask: project.nextTask || "",
      description: project.description || "",
    });
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, { onSuccess: invalidate });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats?.total ?? 0} projects, {stats?.totalTraffic ?? 0} total traffic
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Project" : "New Project"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  list="project-types"
                  placeholder="Type (e.g. website, course)"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                />
                <datalist id="project-types">
                  {Array.from(new Set([...DEFAULT_TYPES, ...Object.keys(stats?.byType ?? {})])).map((t) => (
                    <option key={t} value={t}>{formatTypeLabel(t)}</option>
                  ))}
                </datalist>
                <Select value={form.status} onValueChange={(v: CreateProjectBodyStatus) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="building">Building</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="abandoned">Abandoned</SelectItem>
                    <SelectItem value="flopped">Flopped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="URL (optional)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Traffic" value={form.traffic} onChange={(e) => setForm({ ...form, traffic: Number(e.target.value) })} />
                <Input type="number" placeholder="Revenue ($)" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: Number(e.target.value) })} />
              </div>
              <Input placeholder="Next task" value={form.nextTask} onChange={(e) => setForm({ ...form, nextTask: e.target.value })} />
              <Textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              <Button onClick={handleSubmit} className="w-full" disabled={!form.name.trim()}>
                {editId ? "Update" : "Create"} Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(() => {
          const dynamicTypes = Array.from(
            new Set([...DEFAULT_TYPES, ...Object.keys(stats?.byType ?? {})])
          );
          return ["all", ...dynamicTypes].map((t) => (
            <Button
              key={t}
              variant={filterType === t ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(t)}
              className="text-xs"
            >
              {t === "all" ? "All" : formatTypeLabel(t)}
              {t !== "all" && stats?.byType && ` (${stats.byType[t] ?? 0})`}
            </Button>
          ));
        })()}
      </div>

      {isError ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
            <p className="text-muted-foreground">Failed to load projects. Please try again.</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const Icon = typeIcons[project.type] || Folder;
            const isAbandoned = project.status === "abandoned" || project.status === "flopped";
            const { flag, ageDays } = computeProjectFlag(
              project.createdAt,
              project.revenue,
              project.traffic,
              killWarn,
              killDead,
            );
            return (
              <Card key={project.id} className="group hover:border-primary/30 transition-colors">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4.5 h-4.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">
                          {project.type.replace("_", " ")} · {ageDays}d
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge variant="outline" className={`text-xs ${statusColors[project.status] || ""}`}>
                        {project.status}
                      </Badge>
                      {!isAbandoned && flag !== "grace" && (
                        <Badge variant="outline" className={`text-xs ${flagBadgeClass[flag]}`}>
                          {flagBadgeLabel[flag]}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-muted/30">
                      <p className="text-xs text-muted-foreground">Traffic</p>
                      <p className="text-sm font-semibold">{project.traffic.toLocaleString()}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="text-sm font-semibold">${project.revenue.toFixed(2)}</p>
                    </div>
                  </div>

                  {project.nextTask && (
                    <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded">
                      Next: {project.nextTask}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {project.url && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => window.open(project.url!, "_blank")}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(project)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(project.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No projects yet. Create your first one!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
