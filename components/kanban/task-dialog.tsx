"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { COLUMNS } from "@/lib/types";
import { teamMembers } from "@/lib/mock-data";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSave: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  onSave,
}: TaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [assignee, setAssignee] = useState<string>("");
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setStatus(task.status);
      setAssignee(task.assignee || "");
      setTagsInput(task.tags.join(", "));
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setStatus("todo");
      setAssignee("");
      setTagsInput("");
    }
  }, [task, open]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      assignee: assignee || undefined,
      tags: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
          <DialogDescription>
            {task ? "Update the details for this task." : "Fill in the details to create a new task."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div>
            <Label htmlFor="task-title" className="text-sm font-medium">
              Title
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="task-desc" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task..."
              className="mt-1.5 min-h-[80px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TaskStatus)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUMNS.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Assignee</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers.map((m) => (
                  <SelectItem key={m.name} value={m.name}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="task-tags" className="text-sm font-medium">
              Tags
            </Label>
            <Input
              id="task-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="frontend, feature, bug (comma separated)"
              className="mt-1.5"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!title.trim()}>
            {task ? "Save Changes" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
