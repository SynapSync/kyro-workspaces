"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";
import { GripVertical, Ban, Sparkles, FileCode, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { InlineMarkdown } from "@/components/inline-markdown";
import type { Task } from "@/lib/types";
import { PRIORITY_CONFIG, TAG_CONFIG, TASK_TAGS } from "@/lib/config";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  isUpdating?: boolean;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, isUpdating = false, onEdit }: TaskCardProps) {
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

  const priority = PRIORITY_CONFIG[task.priority];
  const initials = task.assignee
    ? task.assignee
        .split(" ")
        .map((n) => n[0])
        .join("")
    : null;

  const isBlocked = task.tags.includes(TASK_TAGS.BLOCKED);
  const isAICreated = task.tags.includes(TASK_TAGS.AI_CREATED);
  const isEmergent = task.taskRef?.startsWith("TE.");
  const isNew = false; // TODO: wire when new/read distinction is implemented
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group min-w-0 rounded-lg border bg-card p-3 shadow-sm transition-all hover:border-primary/30",
        isDragging && "opacity-50 rotate-2 scale-105 shadow-lg",
        isUpdating && "opacity-70 ring-2 ring-primary/20",
        isBlocked && "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20",
        isAICreated && "border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20",
        isEmergent && !isBlocked && !isAICreated && "border-purple-200 dark:border-purple-900",
        isNew && "animate-pulse ring-2 ring-inset ring-primary/30"
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
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onEdit(task)}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            {task.taskRef && (
              <Badge variant="outline" className="text-[10px] h-4 font-mono px-1.5 shrink-0">
                {task.taskRef}
              </Badge>
            )}
          </div>
          <InlineMarkdown
            content={task.title}
            className="text-sm font-normal text-foreground leading-snug wrap-anywhere"
          />
        </div>
      </div>

      {task.description && (
        <InlineMarkdown
          content={task.description}
          className="mb-2 ml-6 block line-clamp-2 text-xs text-muted-foreground wrap-anywhere"
        />
      )}

      <div className="ml-6 flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 flex-wrap">
          <Badge
            variant="secondary"
            className={cn("text-[10px] h-5 border-0", priority.className)}
          >
            {priority.label}
          </Badge>
          {isBlocked && (
            <Badge className={cn("text-[10px] h-5 gap-1", TAG_CONFIG[TASK_TAGS.BLOCKED].badgeClassName)}>
              <Ban className="h-2.5 w-2.5" />
              {TAG_CONFIG[TASK_TAGS.BLOCKED].label}
            </Badge>
          )}
          {isAICreated && (
            <Badge className={cn("text-[10px] h-5 gap-1", TAG_CONFIG[TASK_TAGS.AI_CREATED].badgeClassName)}>
              <Sparkles className="h-2.5 w-2.5" />
              {TAG_CONFIG[TASK_TAGS.AI_CREATED].label}
            </Badge>
          )}
          {isEmergent && (
            <Badge variant="secondary" className="text-[10px] h-5 bg-purple-500/10 text-purple-600 border-0">
              Emergent
            </Badge>
          )}
          {task.files && task.files.length > 0 && (
            <Badge variant="outline" className="text-[10px] h-5 gap-1 text-muted-foreground">
              <FileCode className="h-2.5 w-2.5" />
              {task.files.length}
            </Badge>
          )}
          {task.tags.filter(t => t !== TASK_TAGS.BLOCKED && t !== TASK_TAGS.AI_CREATED).slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="h-5 max-w-full text-[10px] text-muted-foreground"
            >
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isUpdating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : (
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(task.updatedAt), {
                addSuffix: true,
              })}
            </span>
          )}
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
