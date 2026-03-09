"use client";

import Link from "next/link";
import {
  Zap,
  ArrowRight,
  CheckCircle2,
  Calendar,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SprintProgressBar } from "@/components/sprint/sprint-progress-bar";
import { useAppStore } from "@/lib/store";
import { SPRINT_SECTIONS, SPRINT_STATUS_CONFIG, computeSprintProgress } from "@/lib/config";
import { type SprintStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { InlineMarkdown } from "@/components/inline-markdown";

const statusIcons: Record<SprintStatus, typeof Zap> = {
  planned: Calendar,
  active: Zap,
  closed: CheckCircle2,
};

export function SprintsPage() {
  const { getActiveProject, activeProjectId } = useAppStore();
  const project = getActiveProject();

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Sprints
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {project.sprints.length} sprint
          {project.sprints.length !== 1 ? "s" : ""} total
        </p>
      </div>
      <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
      <div className="max-w-5xl grid gap-4">
        {project.sprints.map((sprint) => {
          const config = SPRINT_STATUS_CONFIG[sprint.status];
          const Icon = statusIcons[sprint.status];
          const progressData = computeSprintProgress(sprint.tasks);
          const totalTasks = progressData.totalTasks;

          const filledSections = SPRINT_SECTIONS.filter(
            (s) =>
              sprint.sections?.[s.key] &&
              (sprint.sections[s.key] ?? "").trim().length > 0
          );

          return (
            <Card
              key={sprint.id}
              className="border shadow-sm hover:border-primary/30 transition-colors"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        <InlineMarkdown content={sprint.name} />
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge variant={config.variant} className="text-[10px] h-5">
                          {config.label}
                        </Badge>
                        {sprint.version && (
                          <Badge variant="outline" className="text-[10px] h-5 font-mono">
                            v{sprint.version}
                          </Badge>
                        )}
                        {sprint.sprintType && (
                          <Badge variant="outline" className="text-[10px] h-5">
                            {sprint.sprintType}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {totalTasks} task{totalTasks !== 1 ? "s" : ""}
                        </span>
                        {filledSections.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {filledSections.length}/{SPRINT_SECTIONS.length} sections
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      asChild
                    >
                      <Link href={`/${activeProjectId}/sprints/${sprint.id}/detail`}>
                        <FileText className="h-3.5 w-3.5" />
                        Details
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      asChild
                    >
                      <Link href={`/${activeProjectId}/sprints/${sprint.id}`}>
                        Board
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {sprint.objective && (
                  <div className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                    <InlineMarkdown content={sprint.objective} />
                  </div>
                )}

                <SprintProgressBar data={progressData} status={sprint.status} />

                {/* Section dots */}
                {filledSections.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                    <span className="text-[10px] text-muted-foreground mr-1">
                      Sections:
                    </span>
                    {SPRINT_SECTIONS.map((section) => {
                      const hasCt =
                        sprint.sections?.[section.key] &&
                        (sprint.sections[section.key] ?? "").trim().length > 0;
                      return (
                        <span
                          key={section.key}
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            hasCt ? "bg-emerald-500" : "bg-muted"
                          )}
                          title={section.label}
                        />
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {project.sprints.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
              <Zap className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No sprints yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Sprints are read from sprint-forge project directories.
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
