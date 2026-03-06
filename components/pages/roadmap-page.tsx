"use client";

import { useEffect } from "react";
import { Map } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EntitySkeleton } from "@/components/ui/entity-skeleton";
import { useAppStore } from "@/lib/store";
import { SPRINT_TYPE_COLORS } from "@/lib/config";
import { cn } from "@/lib/utils";

export function RoadmapPage() {
  const {
    activeProjectId,
    roadmaps,
    roadmapLoading,
    loadRoadmap,
  } = useAppStore();

  const roadmap = roadmaps[activeProjectId];
  const isLoading = roadmapLoading[activeProjectId] ?? false;
  const sprints = roadmap?.sprints ?? [];

  useEffect(() => {
    if (activeProjectId && !roadmaps[activeProjectId]) {
      loadRoadmap(activeProjectId);
    }
  }, [activeProjectId, roadmaps, loadRoadmap]);

  const completedCount = sprints.filter((s) => s.status === "completed").length;
  const totalCount = sprints.length;
  const overallProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Roadmap
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Sprint plan from the project&apos;s ROADMAP.md
        </p>
      </div>

      {isLoading ? (
        <EntitySkeleton rows={5} />
      ) : sprints.length > 0 ? (
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

              return (
                <Card
                  key={entry.number}
                  className={cn("border shadow-sm", isCompleted && "opacity-75")}
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
            })}
          </div>
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
  );
}
