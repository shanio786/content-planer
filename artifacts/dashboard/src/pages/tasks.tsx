import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, CheckCircle2, Circle, Clock, AlertCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";

import {
  useListTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useGetTaskStats,
  getListTasksQueryKey,
  getGetTaskStatsQueryKey,
  getGetDashboardSummaryQueryKey
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Tasks() {
  const queryClient = useQueryClient();
  const { data: tasks, isLoading } = useListTasks();
  const { data: stats } = useGetTaskStats();
  
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  };

  const handleCreate = () => {
    if (!title) return;
    createTask.mutate(
      { data: { title, priority } },
      {
        onSuccess: () => {
          refresh();
          setTitle("");
        },
      }
    );
  };

  const toggleTask = (id: number, completed: boolean) => {
    updateTask.mutate(
      { id, data: { completed: !completed } },
      { onSuccess: refresh }
    );
  };

  const priorityColors = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-blue-500/10 text-blue-500",
    high: "bg-orange-500/10 text-orange-500",
    urgent: "bg-red-500/10 text-red-500"
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-1">
            <span className="text-2xl font-bold">{stats?.total || 0}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Total</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-1">
            <span className="text-2xl font-bold text-primary">{stats?.pending || 0}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Pending</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-1">
            <span className="text-2xl font-bold text-green-500">{stats?.completed || 0}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Completed</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-1">
            <span className="text-2xl font-bold text-destructive">{stats?.overdue || 0}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Overdue</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-1">
            <span className="text-2xl font-bold text-orange-500">{stats?.streak || 0}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Day Streak</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-2 sm:p-4 flex gap-2">
          <Input 
            placeholder="What needs to be done?" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="flex-1"
          />
          <Select value={priority} onValueChange={(v: "low" | "medium" | "high" | "urgent") => setPriority(v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleCreate} disabled={createTask.isPending || !title}>
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Add Task</span>
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))
        ) : tasks?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
            No tasks. You're all caught up!
          </div>
        ) : (
          tasks?.map((task) => (
            <div 
              key={task.id} 
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg border border-border bg-card transition-all group",
                task.completed && "opacity-60"
              )}
            >
              <button 
                className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => toggleTask(task.id, task.completed)}
              >
                {task.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium truncate transition-all duration-300",
                  task.completed && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="outline" className={priorityColors[task.priority]}>
                  {task.priority}
                </Badge>
                {task.dueDate && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(task.dueDate), "MMM d")}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteTask.mutate({ id: task.id }, { onSuccess: refresh })}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
