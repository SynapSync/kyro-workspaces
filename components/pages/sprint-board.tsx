"use client";

import { useState, useMemo, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { ArrowLeft, FileText, Focus, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { BoardColumn } from "@/components/kanban/board-column";
import { TaskCard } from "@/components/kanban/task-card";
import { useAppStore } from "@/lib/store";
import { COLUMNS, SPRINT_STATUS_CONFIG, ZEN_COLUMNS } from "@/lib/config";
import { type Task, type TaskStatus, type Phase } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SprintBoardProps {
  sprintId: string;
}

export function SprintBoard({ sprintId }: SprintBoardProps) {
  const {
    getActiveProject,
    setActiveSprintId,
    setActiveSprintDetailId,
    setActiveSidebarItem,
    collapsedColumns,
    setColumnCollapsed,
    toggleColumnCollapsed,
    focusMode,
    focusedColumnId,
    setFocusedColumn,
    toggleFocusMode,
    zenMode,
    setZenMode,
  } = useAppStore();

  const project = getActiveProject();
  const sprint = project.sprints.find((s) => s.id === sprintId);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Load persisted column state on mount
  useEffect(() => {
    const saved = localStorage.getItem(`kyro-column-state-${sprintId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.entries(parsed).forEach(([columnId, collapsed]) => {
        setColumnCollapsed(sprintId, columnId, collapsed as boolean);
      });
    }
  }, [sprintId, setColumnCollapsed]);

  // Persist column state changes
  useEffect(() => {
    const toSave: Record<string, boolean> = {};
    Object.keys(collapsedColumns).forEach((key) => {
      if (key.startsWith(sprintId)) {
        const columnId = key.replace(`${sprintId}-`, "");
        toSave[columnId] = collapsedColumns[key];
      }
    });
    localStorage.setItem(`kyro-column-state-${sprintId}`, JSON.stringify(toSave));
  }, [collapsedColumns, sprintId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const columnTasks = useMemo(() => {
    if (!sprint) return {} as Record<TaskStatus, Task[]>;
    const map: Record<TaskStatus, Task[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      review: [],
      done: [],
      blocked: [],
      skipped: [],
    };
    sprint.tasks.forEach((task) => {
      map[task.status].push(task);
    });
    return map;
  }, [sprint]);

  if (!sprint) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Sprint not found</p>
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = sprint.tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // handled in dragEnd
  };

  const handleDragEnd = (_event: DragEndEvent) => {
    setActiveTask(null);
  };

  const handleBack = () => {
    setActiveSprintId(null);
    setActiveSidebarItem("sprints");
  };

  const handleViewDetails = () => {
    setActiveSprintId(null);
    setActiveSprintDetailId(sprintId);
  };

  const statusCfg = SPRINT_STATUS_CONFIG[sprint.status];

  return (
    <div className="flex h-full flex-col">
      {/* Board Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to sprints</span>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                {sprint.name}
              </h1>
              <Badge
                variant={statusCfg.variant}
                className="text-[10px] h-5"
              >
                {statusCfg.label}
              </Badge>
              {sprint.version && (
                <Badge variant="outline" className="text-[10px] h-5 font-mono">
                  v{sprint.version}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {sprint.tasks.length} tasks
              </p>
              {sprint.phases && sprint.phases.length > 0 && (
                <div className="flex items-center gap-1">
                  {sprint.phases.map((phase: Phase) => {
                    const phaseDone = phase.tasks.filter((t) => t.status === "done").length;
                    return (
                      <Badge
                        key={phase.id}
                        variant="outline"
                        className={cn(
                          "text-[10px] h-4 px-1.5",
                          phase.isEmergent && "border-purple-300 text-purple-600"
                        )}
                        title={`${phase.name}: ${phaseDone}/${phase.tasks.length}`}
                      >
                        {phase.name.replace(/^Phase \d+ — /, "").substring(0, 12)}
                        {" "}
                        {phaseDone}/{phase.tasks.length}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={zenMode ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setZenMode(!zenMode)}
            title="Zen Mode (In Progress + Review)"
          >
            <EyeOff className="h-3.5 w-3.5" />
            Zen
          </Button>
          <Button
            variant={focusMode ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={toggleFocusMode}
            title="Focus Mode"
          >
            <Focus className="h-3.5 w-3.5" />
            Focus
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleViewDetails}
          >
            <FileText className="h-3.5 w-3.5" />
            Details
          </Button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex gap-4 p-6 h-full min-h-[500px]">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              {COLUMNS.filter(col => {
                if (zenMode) return ZEN_COLUMNS.includes(col.id);
                if (focusMode && focusedColumnId) return col.id === focusedColumnId;
                return true;
              }).map((col) => {
                const isColumnCollapsed = collapsedColumns[`${sprintId}-${col.id}`] ?? false;
                const shouldBeCollapsed = zenMode || (focusMode && focusedColumnId && focusedColumnId !== col.id);

                return (
                <BoardColumn
                  key={col.id}
                  id={col.id}
                  title={col.title}
                  color={col.color}
                  tasks={columnTasks[col.id] || []}
                  collapsed={shouldBeCollapsed || isColumnCollapsed}
                  onToggleCollapse={() => {
                    if (focusMode && !focusedColumnId) {
                      setFocusedColumn(col.id);
                    } else if (focusedColumnId === col.id) {
                      setFocusedColumn(null);
                    } else {
                      toggleColumnCollapsed(sprintId, col.id);
                    }
                  }}
                  onEditTask={() => {}}
                  onDeleteTask={() => {}}
                />
                );
              })}
              <DragOverlay>
                {activeTask ? (
                  <div className="w-72 rotate-3 scale-105">
                    <TaskCard
                      task={activeTask}
                      onEdit={() => {}}
                      onDelete={() => {}}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
