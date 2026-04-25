import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pin } from "lucide-react";
import { format } from "date-fns";

import {
  useListNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  getListNotesQueryKey
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = ["general", "ideas", "strategy", "monetization", "research", "personal"];

const categoryColors: Record<string, string> = {
  general: "bg-muted text-muted-foreground",
  ideas: "bg-yellow-500/10 text-yellow-500",
  strategy: "bg-blue-500/10 text-blue-500",
  monetization: "bg-green-500/10 text-green-500",
  research: "bg-purple-500/10 text-purple-500",
  personal: "bg-pink-500/10 text-pink-500",
};

export default function Notes() {
  const queryClient = useQueryClient();
  const { data: notes, isLoading } = useListNotes();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const refresh = () => queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });

  const handleCreate = () => {
    if (!title) return;
    createNote.mutate(
      { data: { title, content, category, pinned: false } },
      {
        onSuccess: () => {
          refresh();
          setTitle("");
          setContent("");
          setCategory("general");
        },
      }
    );
  };

  const filteredNotes = notes?.filter(
    (n) => filterCategory === "all" || n.category === filterCategory
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Capture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Idea title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Details..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCreate} disabled={createNote.isPending || !title}>
              <Plus className="w-4 h-4 mr-2" />
              Capture Note
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 flex-wrap">
        {["all", ...categories].map((c) => (
          <Button
            key={c}
            variant={filterCategory === c ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterCategory(c)}
            className="text-xs capitalize"
          >
            {c === "all" ? "All" : c}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))
        ) : !filteredNotes?.length ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {filterCategory === "all"
              ? "No notes yet. Start capturing ideas above."
              : `No notes in "${filterCategory}" category.`}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <Card key={note.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{note.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      deleteNote.mutate(
                        { id: note.id },
                        { onSuccess: refresh }
                      );
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {note.content}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <Badge variant="outline" className={`text-xs capitalize ${categoryColors[note.category] || ""}`}>
                    {note.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(note.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
