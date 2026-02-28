"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "./task-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Task, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BoardColumnProps {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export function BoardColumn({
  id,
  title,
  color,
  tasks,
  onEditTask,
  onDeleteTask,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex h-full w-72 shrink-0 flex-col">
      {/* Column Header */}
      <div className="flex items-center gap-2 px-2 pb-3">
        <div className={cn("h-2 w-2 rounded-full", color)} />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {tasks.length}
        </span>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 rounded-xl border border-dashed p-2 transition-colors min-h-[200px]",
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
            <div className="flex flex-col gap-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
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
    </div>
  );
}
