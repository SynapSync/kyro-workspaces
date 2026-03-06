"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Layers, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { InlineMarkdown } from "@/components/inline-markdown";
import type { Phase } from "@/lib/types";
import { cn } from "@/lib/utils";

const TASK_STATUS_ICONS: Record<string, { symbol: string; className: string }> = {
  done: { symbol: "[x]", className: "text-emerald-500" },
  in_progress: { symbol: "[~]", className: "text-amber-500" },
  blocked: { symbol: "[!]", className: "text-red-500" },
  skipped: { symbol: "[-]", className: "text-muted-foreground" },
  todo: { symbol: "[ ]", className: "text-muted-foreground" },
  backlog: { symbol: "[ ]", className: "text-muted-foreground" },
  review: { symbol: "[~]", className: "text-blue-500" },
};

interface PhasesListProps {
  phases: Phase[];
}

export function PhasesList({ phases }: PhasesListProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    phases.forEach((p) => { initial[p.id] = true; });
    return initial;
  });

  if (phases.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No phases defined.</p>
    );
  }

  const togglePhase = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-3">
      {phases.map((phase) => {
        const isOpen = expanded[phase.id] ?? true;
        const doneTasks = phase.tasks.filter((t) => t.status === "done").length;
        const totalTasks = phase.tasks.length;
        const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

        return (
          <div
            key={phase.id}
            className={cn(
              "rounded-lg border bg-card overflow-hidden",
              phase.isEmergent && "border-purple-300 dark:border-purple-800"
            )}
          >
            <button
              onClick={() => togglePhase(phase.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              {phase.isEmergent ? (
                <Sparkles className="h-4 w-4 shrink-0 text-purple-500" />
              ) : (
                <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="flex-1 font-medium text-sm">{phase.name}</span>
              {phase.isEmergent && (
                <Badge variant="secondary" className="text-[10px] h-5 bg-purple-500/10 text-purple-600 border-0">
                  Emergent
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {doneTasks}/{totalTasks}
              </span>
              <div className="w-16">
                <Progress value={progress} className="h-1" />
              </div>
            </button>

            {isOpen && (
              <div className="border-t px-4 py-3 space-y-1">
                {phase.objective && (
                  <InlineMarkdown content={phase.objective} className="text-xs text-muted-foreground mb-3 block" />
                )}
                {phase.tasks.map((task) => {
                  const statusInfo = TASK_STATUS_ICONS[task.status] ?? TASK_STATUS_ICONS["todo"];
                  return (
                    <div key={task.id} className="flex items-start gap-2 py-1">
                      <span className={cn("font-mono text-xs shrink-0 mt-0.5", statusInfo.className)}>
                        {statusInfo.symbol}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {task.taskRef && (
                            <Badge variant="outline" className="text-[10px] h-4 font-mono px-1.5">
                              {task.taskRef}
                            </Badge>
                          )}
                          <InlineMarkdown content={task.title} className="text-sm" />
                        </div>
                        {task.files && task.files.length > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                            {task.files.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
