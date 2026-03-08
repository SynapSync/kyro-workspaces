"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronDown, ChevronRight, Ban } from "lucide-react";
import { TaskCard } from "@/components/kanban/task-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Task, TaskStatus } from "@/lib/types";
import { TASK_TAGS } from "@/lib/config";
import { cn } from "@/lib/utils";

interface BoardColumnProps {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
  collapsed?: boolean;
  updatingTasks?: Record<string, boolean>;
  onToggleCollapse?: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export function BoardColumn({
  id,
  title,
  color,
  tasks,
  collapsed = false,
  updatingTasks,
  onToggleCollapse,
  onEditTask,
  onDeleteTask,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  const blockedTasks = tasks.filter((t) => t.tags.includes(TASK_TAGS.BLOCKED));
  const hasBlocked = blockedTasks.length > 0;

  return (
    <div
      className={cn(
        "flex h-full shrink-0 flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-72"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 px-2 pb-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={onToggleCollapse}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </Button>
        
        {!collapsed && (
          <>
            <div className={cn("h-2 w-2 rounded-full", color)} />
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <span className="text-xs text-muted-foreground ml-auto">
              {tasks.length}
            </span>
            {hasBlocked && (
              <Badge variant="destructive" className="h-5 text-[10px] gap-1">
                <Ban className="h-2.5 w-2.5" />
                {blockedTasks.length}
              </Badge>
            )}
          </>
        )}
        
        {collapsed && (
          <div className="flex flex-col items-center gap-2 w-full">
            <div className={cn("h-2 w-2 rounded-full", color)} />
            <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center">
              {tasks.length}
            </Badge>
          </div>
        )}
      </div>

      {/* Column Content - Hidden when collapsed */}
      {!collapsed && (
        <div
          ref={setNodeRef}
          className={cn(
            "min-w-0 flex-1 rounded-xl border border-dashed p-2 transition-colors min-h-[200px]",
            isOver
              ? "border-primary/50 bg-primary/5"
              : "border-transparent bg-muted/30"
          )}
        >
          <ScrollArea className="h-full">
            <SortableContext
              items={tasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex min-w-0 flex-col gap-2">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isUpdating={updatingTasks?.[task.id] ?? false}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                  />
                ))}
              </div>
            </SortableContext>
            {tasks.length === 0 && (
              <div className="flex h-24 items-center justify-center">
                <p className="text-xs text-muted-foreground">
                  Drop tasks here
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
