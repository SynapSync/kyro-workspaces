"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";
import { GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Task, TaskPriority } from "@/lib/types";
import { cn } from "@/lib/utils";

const priorityConfig: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
  medium: {
    label: "Medium",
    className: "bg-blue-500/10 text-blue-600",
  },
  high: {
    label: "High",
    className: "bg-amber-500/10 text-amber-600",
  },
  urgent: {
    label: "Urgent",
    className: "bg-red-500/10 text-red-600",
  },
};

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "task", task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = priorityConfig[task.priority];
  const initials = task.assignee
    ? task.assignee
        .split(" ")
        .map((n) => n[0])
        .join("")
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-lg border bg-card p-3 shadow-sm transition-all hover:border-primary/30",
        isDragging && "opacity-50 rotate-2 scale-105 shadow-lg"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <button
          className="mt-0.5 cursor-grab text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
          <span className="sr-only">Drag task</span>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">
            {task.title}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
              <span className="sr-only">Task actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(task.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 ml-6">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between ml-6">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            variant="secondary"
            className={`text-[10px] h-5 border-0 ${priority.className}`}
          >
            {priority.label}
          </Badge>
          {task.tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-[10px] h-5 text-muted-foreground"
            >
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(task.updatedAt), {
              addSuffix: true,
            })}
          </span>
          {initials && (
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[8px] font-bold bg-primary/15 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  );
}
