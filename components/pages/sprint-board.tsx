"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ArrowLeft, FileText, Ban, ChevronDown, ChevronRight, Layers, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BoardColumn } from "@/components/kanban/board-column";
import { TaskCard } from "@/components/kanban/task-card";
import { ActionConfirmDialog } from "@/components/dialogs/action-confirm-dialog";
import { TaskEditDialog } from "@/components/dialogs/task-edit-dialog";
import { useAppStore } from "@/lib/store";
import { COLUMNS, SPRINT_STATUS_CONFIG } from "@/lib/config";
import { type Task, type TaskStatus, type Phase } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SprintBoardProps {
  sprintId: string;
}

type ColumnLayoutMode = "empty_only" | "collapse_all" | "expand_all" | "custom";

const COLUMN_LAYOUT_LABEL: Record<Exclude<ColumnLayoutMode, "custom">, string> = {
  empty_only: "Empty Only",
  collapse_all: "Collapse All",
  expand_all: "Expand All",
};

const COLUMN_LAYOUT_ICON = {
  empty_only: Layers,
  collapse_all: ChevronRight,
  expand_all: ChevronDown,
} as const;

export function SprintBoardPage({ sprintId }: SprintBoardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    getActiveProject,
    activeProjectId,
    collapsedColumns,
    setColumnCollapsed,
    updateTaskStatus,
    updateTask,
    updatingTasks,
  } = useAppStore();

  const project = getActiveProject();
  const sprint = project.sprints.find((s) => s.id === sprintId);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    task: Task;
    fromStatus: TaskStatus;
    toStatus: TaskStatus;
  } | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Search & filter state — initialized from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [activeStatusFilters, setActiveStatusFilters] = useState<Set<TaskStatus>>(() => {
    const statusParam = searchParams.get("status");
    if (!statusParam) return new Set<TaskStatus>();
    return new Set(statusParam.split(",").filter(Boolean) as TaskStatus[]);
  });

  const hasActiveFilters = searchQuery.trim() !== "" || activeStatusFilters.size > 0;

  // Sync filter state to URL search params
  const syncFiltersToUrl = useCallback((query: string, statuses: Set<TaskStatus>) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (statuses.size > 0) params.set("status", [...statuses].join(","));
    const search = params.toString();
    const newUrl = search
      ? `/${activeProjectId}/sprints/${sprintId}?${search}`
      : `/${activeProjectId}/sprints/${sprintId}`;
    router.replace(newUrl, { scroll: false });
  }, [activeProjectId, sprintId, router]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    syncFiltersToUrl(value, activeStatusFilters);
  }, [activeStatusFilters, syncFiltersToUrl]);

  const handleToggleStatus = useCallback((status: TaskStatus) => {
    setActiveStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      syncFiltersToUrl(searchQuery, next);
      return next;
    });
  }, [searchQuery, syncFiltersToUrl]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setActiveStatusFilters(new Set());
    syncFiltersToUrl("", new Set());
  }, [syncFiltersToUrl]);

  // Load persisted column state on mount
  useEffect(() => {
    const saved = localStorage.getItem(`kyro-column-state-${sprintId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Record<string, boolean>;
        Object.entries(parsed).forEach(([columnId, collapsed]) => {
          setColumnCollapsed(sprintId, columnId, collapsed);
        });
      } catch {
        // Ignore corrupted localStorage data
      }
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

  // Column IDs are TaskStatus values — used to distinguish column droppables from task sortables
  const columnIds = useMemo(() => new Set(COLUMNS.map((c) => c.id as string)), []);

  const columnTasks = useMemo(() => {
    if (!sprint) return {} as Record<TaskStatus, Task[]>;
    const map: Record<TaskStatus, Task[]> = {
      pending: [],
      in_progress: [],
      done: [],
      blocked: [],
      skipped: [],
      carry_over: [],
    };

    const query = searchQuery.trim().toLowerCase();

    sprint.tasks.forEach((task) => {
      // Apply status filter
      if (activeStatusFilters.size > 0 && !activeStatusFilters.has(task.status)) return;
      // Apply keyword filter
      if (query && !task.title.toLowerCase().includes(query)) return;

      const bucket = map[task.status];
      if (bucket) {
        bucket.push(task);
      } else {
        map.pending.push(task);
      }
    });
    return map;
  }, [sprint, searchQuery, activeStatusFilters]);

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

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const task = sprint.tasks.find((t) => t.id === taskId);
    if (!task) return;

    // over.id can be either a column ID (TaskStatus) or a task ID (from SortableContext).
    // If it's a task ID, find which column that task belongs to.
    let newStatus: TaskStatus;
    if (columnIds.has(over.id as string)) {
      newStatus = over.id as TaskStatus;
    } else {
      // Dropped on a task — find which column owns it
      const targetTask = sprint.tasks.find((t) => t.id === over.id);
      if (!targetTask) return;
      newStatus = targetTask.status;
    }

    if (task.status === newStatus) return;

    setPendingMove({ task, fromStatus: task.status, toStatus: newStatus });
  };

  const handleConfirmMove = () => {
    if (!pendingMove) return;
    updateTaskStatus(activeProjectId, sprintId, pendingMove.task.id, pendingMove.toStatus);
    setPendingMove(null);
  };

  const handleBack = () => {
    router.push(`/${activeProjectId}/sprints`);
  };

  const statusCfg = SPRINT_STATUS_CONFIG[sprint.status];

  const columnStates = COLUMNS.map((col) => {
    const persistedCollapsed = collapsedColumns[`${sprintId}-${col.id}`];
    const tasks = columnTasks[col.id] || [];
    const defaultCollapsed = tasks.length === 0;
    const isCollapsed = persistedCollapsed ?? defaultCollapsed;
    return { col, tasks, isCollapsed };
  });

  const allCollapsed = columnStates.every(({ isCollapsed }) => isCollapsed);
  const allExpanded = columnStates.every(({ isCollapsed }) => !isCollapsed);
  const emptyOnly = columnStates.every(
    ({ tasks, isCollapsed }) => isCollapsed === (tasks.length === 0)
  );

  const columnLayoutMode: ColumnLayoutMode = allCollapsed
    ? "collapse_all"
    : allExpanded
      ? "expand_all"
      : emptyOnly
        ? "empty_only"
        : "custom";

  const nextColumnLayoutMode: Exclude<ColumnLayoutMode, "custom"> =
    columnLayoutMode === "empty_only"
      ? "collapse_all"
      : columnLayoutMode === "collapse_all"
        ? "expand_all"
        : "empty_only";

  const columnLayoutDisplayMode: Exclude<ColumnLayoutMode, "custom"> =
    columnLayoutMode === "custom" ? nextColumnLayoutMode : columnLayoutMode;
  const ColumnLayoutIcon = COLUMN_LAYOUT_ICON[columnLayoutDisplayMode];

  const handleCycleColumnLayoutMode = () => {
    columnStates.forEach(({ col, tasks }) => {
      const collapsed =
        nextColumnLayoutMode === "collapse_all"
          ? true
          : nextColumnLayoutMode === "expand_all"
            ? false
            : tasks.length === 0;
      setColumnCollapsed(sprintId, col.id, collapsed);
    });
  };

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
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleCycleColumnLayoutMode}
            title="Cycle column layout: Empty Only → Collapse All → Expand All"
          >
            <ColumnLayoutIcon className="h-3.5 w-3.5" />
            {COLUMN_LAYOUT_LABEL[columnLayoutDisplayMode]}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            asChild
          >
            <Link href={`/${activeProjectId}/sprints/${sprintId}/detail`}>
              <FileText className="h-3.5 w-3.5" />
              Details
            </Link>
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="shrink-0 border-b border-border px-6 py-2 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Filter tasks..."
            className="w-full rounded-md border bg-background pl-8 pr-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {COLUMNS.map((col) => {
            const isActive = activeStatusFilters.has(col.id);
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => handleToggleStatus(col.id)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium border transition-colors",
                  isActive
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <div className={cn("h-1.5 w-1.5 rounded-full", col.color)} />
                {col.title}
              </button>
            );
          })}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-6 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Board */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full min-w-max flex-col px-6">
          {/* Column Headers — fixed row, never scrolls vertically */}
          <div className="flex shrink-0 gap-4 pt-4 pb-2">
            {columnStates.map(({ col, tasks: colTasks, isCollapsed }) => {
              const blockedCount = colTasks.filter((t) => t.tags.includes("blocked")).length;

              return (
                <div
                  key={col.id}
                  className={cn(
                    "flex shrink-0 items-center gap-2 px-2 transition-all duration-300 ease-in-out",
                    isCollapsed ? "w-16" : "w-72"
                  )}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => setColumnCollapsed(sprintId, col.id, !isCollapsed)}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  {!isCollapsed && (
                    <>
                      <div className={cn("h-2 w-2 rounded-full", col.color)} />
                      <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {colTasks.length}
                      </span>
                      {blockedCount > 0 && (
                        <Badge variant="destructive" className="h-5 text-[10px] gap-1">
                          <Ban className="h-2.5 w-2.5" />
                          {blockedCount}
                        </Badge>
                      )}
                    </>
                  )}
                  {isCollapsed && (
                    <div className="flex flex-col items-center gap-2 w-full">
                      <div className={cn("h-2 w-2 rounded-full", col.color)} />
                      <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center">
                        {colTasks.length}
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Column Content — each column scrolls independently */}
          <div className="flex flex-1 min-h-0 gap-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              {columnStates.map(({ col, tasks: colTasks, isCollapsed }) => {
                return (
                  <BoardColumn
                    key={col.id}
                    id={col.id}
                    title={col.title}
                    color={col.color}
                    tasks={colTasks}
                    collapsed={isCollapsed}
                    hideHeader
                    updatingTasks={updatingTasks}
                    onToggleCollapse={() => setColumnCollapsed(sprintId, col.id, !isCollapsed)}
                    onEditTask={setEditingTask}
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
        </div>
      </div>

      {/* Confirmation dialog for drag-drop status changes */}
      <ActionConfirmDialog
        open={pendingMove !== null}
        onOpenChange={(open) => { if (!open) setPendingMove(null); }}
        title="Move Task"
        description={
          pendingMove
            ? `Move "${pendingMove.task.title}" from ${pendingMove.fromStatus.replace("_", " ")} to ${pendingMove.toStatus.replace("_", " ")}?`
            : ""
        }
        actionLabel="Move"
        onConfirm={handleConfirmMove}
      />

      <TaskEditDialog
        task={editingTask}
        open={editingTask !== null}
        onOpenChange={(open) => { if (!open) setEditingTask(null); }}
        onSave={(updates) => {
          if (!editingTask) return;
          const sprintForTask = sprint?.tasks.find((t) => t.id === editingTask.id) ? sprintId : "";
          if (!sprintForTask) return;
          updateTask(activeProjectId, sprintForTask, editingTask.id, updates);
        }}
      />
    </div>
  );
}
