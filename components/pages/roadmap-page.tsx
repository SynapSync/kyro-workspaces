"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Layers, Map, Wand2 } from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EntitySkeleton } from "@/components/ui/entity-skeleton";
import { SprintForgeWizard } from "@/components/dialogs/sprint-forge-wizard";
import { useAppStore } from "@/lib/store";
import { assembleSprintContext } from "@/lib/forge/context";
import { SPRINT_TYPE_COLORS } from "@/lib/config";
import { cn } from "@/lib/utils";

type RoadmapView = "sprints" | "document";

export function RoadmapPage() {
  const [view, setView] = useState<RoadmapView>("sprints");
  const [wizardOpen, setWizardOpen] = useState(false);

  const {
    activeProjectId,
    roadmaps,
    roadmapLoading,
    loadRoadmap,
    getActiveProject,
    findings,
    findingsLoading,
    loadFindings,
  } = useAppStore();

  const roadmap = roadmaps[activeProjectId];
  const isLoading = roadmapLoading[activeProjectId] ?? false;
  const sprints = roadmap?.sprints ?? [];
  const project = getActiveProject();

  const existingSprintIds = useMemo(
    () => new Set(project.sprints.map((s) => s.id)),
    [project.sprints],
  );

  useEffect(() => {
    if (activeProjectId && !roadmaps[activeProjectId]) {
      loadRoadmap(activeProjectId);
    }
  }, [activeProjectId, roadmaps, loadRoadmap]);

  // Load findings for the wizard (lazy)
  useEffect(() => {
    if (activeProjectId && !findings[activeProjectId] && !findingsLoading[activeProjectId]) {
      loadFindings(activeProjectId);
    }
  }, [activeProjectId, findings, findingsLoading, loadFindings]);

  const hasPendingSprints = sprints.some((s) => s.status !== "completed");

  const forgeContext = useMemo(() => {
    if (!project || !sprints.length) return null;
    return assembleSprintContext(
      project,
      findings[activeProjectId] ?? [],
      sprints,
    );
  }, [project, sprints, findings, activeProjectId]);

  const completedCount = sprints.filter((s) => s.status === "completed").length;
  const totalCount = sprints.length;
  const overallProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Roadmap
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Sprint plan from the project&apos;s ROADMAP.md
            </p>
          </div>

          <div className="flex items-center gap-2">
          {/* Generate Sprint button */}
          {hasPendingSprints && (
            <Button
              size="sm"
              variant="default"
              onClick={() => setWizardOpen(true)}
              className="gap-1.5"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Generate Next Sprint
            </Button>
          )}

          {/* View toggle */}
          {sprints.length > 0 && (
            <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
              <button
                type="button"
                onClick={() => setView("sprints")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  view === "sprints"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Layers className="h-3.5 w-3.5" />
                Sprints
              </button>
              <button
                type="button"
                onClick={() => setView("document")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  view === "document"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                Document
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
      <div className="max-w-5xl">

      {isLoading ? (
        <EntitySkeleton rows={5} />
      ) : sprints.length > 0 ? (
        <>
          {view === "sprints" && (
            <>
              {totalCount > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Overall Progress</span>
                    <span>
                      {completedCount}/{totalCount} sprints completed ({overallProgress}%)
                    </span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                </div>
              )}

              <div className="grid gap-3">
                {sprints.map((entry) => {
                  const typeColor = SPRINT_TYPE_COLORS[entry.type] ?? "";
                  const isCompleted = entry.status === "completed";
                  const hasLink = existingSprintIds.has(entry.sprintId);

                  const card = (
                    <Card
                      key={entry.number}
                      className={cn(
                        "border shadow-sm",
                        isCompleted && "opacity-75",
                        hasLink && "cursor-pointer transition-colors hover:border-primary/50",
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary text-sm">
                            {entry.number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-medium text-sm text-foreground">
                                {entry.focus}
                              </h3>
                              <Badge variant="outline" className="text-[10px] h-5 font-mono">
                                v{entry.version}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className={cn("text-[10px] h-5 border-0", typeColor)}
                              >
                                {entry.type}
                              </Badge>
                              <Badge
                                variant={isCompleted ? "outline" : "secondary"}
                                className="text-[10px] h-5"
                              >
                                {entry.status}
                              </Badge>
                            </div>
                            {entry.dependencies.length > 0 && (
                              <p className="text-[10px] text-muted-foreground">
                                Depends on: {entry.dependencies.join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );

                  return hasLink ? (
                    <Link key={entry.number} href={`/${activeProjectId}/sprints/${entry.sprintId}/detail`}>
                      {card}
                    </Link>
                  ) : (
                    card
                  );
                })}
              </div>
            </>
          )}

          {view === "document" && roadmap?.raw && (
            <MarkdownRenderer
              content={roadmap.raw}
              className="rounded-xl border bg-card p-6"
            />
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
            <Map className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No roadmap available
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            The roadmap is loaded from the project&apos;s ROADMAP.md file.
          </p>
        </div>
      )}
      </div>
      </div>

      <SprintForgeWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        context={forgeContext}
      />
    </div>
  );
}
