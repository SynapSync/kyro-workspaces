"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  Hammer,
  Zap,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Activity,
  Database,
  Eye,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { SPRINT_STATUS_CONFIG, computeSprintProgress } from "@/lib/config";
import type { SprintStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HealthData {
  indexReady: boolean;
  watcherCount: number;
  lastIndexedAt: string | null;
  dbSizeBytes: number;
  projectCount: number;
}

const statusIcons: Record<SprintStatus, typeof Zap> = {
  planned: Calendar,
  active: Zap,
  closed: CheckCircle2,
};

export function SprintForgePage() {
  const { getActiveProject, activeProjectId } = useAppStore();
  const project = getActiveProject();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setHealth(data?.data ?? null))
      .catch(() => setHealth(null))
      .finally(() => setHealthLoading(false));
  }, []);

  const sprints = project.sprints;
  const activeSprint = useMemo(
    () => sprints.find((s) => s.status === "active"),
    [sprints],
  );
  const latestSprint = sprints[sprints.length - 1];

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center gap-2.5 mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sprint Forge
          </h1>
          <div className="flex h-5 items-center justify-center rounded-full bg-primary/10 px-2">
            <span className="text-[10px] font-semibold text-primary">AI</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Sprint generation, history, and infrastructure health
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
        <div className="max-w-4xl space-y-6">
          {/* Quick Actions */}
          <div className="flex gap-3">
            {latestSprint && (
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <Link
                  href={`/${activeProjectId}/sprints/${latestSprint.id}/detail`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Latest Sprint
                </Link>
              </Button>
            )}
            {activeSprint && (
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <Link
                  href={`/${activeProjectId}/sprints/${activeSprint.id}`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  Active Board
                </Link>
              </Button>
            )}
          </div>

          {/* Infrastructure Health */}
          <Card className="border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">
                  Infrastructure Health
                </h2>
              </div>
              {healthLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading...
                </div>
              ) : health ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <HealthStat
                    label="Index"
                    value={health.indexReady ? "Ready" : "Offline"}
                    ok={health.indexReady}
                  />
                  <HealthStat
                    label="Watchers"
                    value={String(health.watcherCount)}
                    ok={health.watcherCount > 0}
                  />
                  <HealthStat
                    label="Projects"
                    value={String(health.projectCount)}
                    ok={health.projectCount > 0}
                  />
                  <HealthStat
                    label="DB Size"
                    value={formatBytes(health.dbSizeBytes)}
                    ok
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Health endpoint unavailable (mock mode or server error).
                </p>
              )}
            </CardContent>
          </Card>

          {/* Generation History */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Generation History
              </h2>
              <span className="text-xs text-muted-foreground">
                {sprints.length} sprint{sprints.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-2">
              {sprints.map((sprint) => {
                const config = SPRINT_STATUS_CONFIG[sprint.status];
                const Icon = statusIcons[sprint.status];
                const progress = computeSprintProgress(sprint.tasks);

                return (
                  <Card
                    key={sprint.id}
                    className="border shadow-sm hover:border-primary/30 transition-colors"
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                          config.variant === "default"
                            ? "bg-primary/10"
                            : "bg-muted",
                        )}
                      >
                        <Icon className="h-4 w-4 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {sprint.name}
                          </span>
                          <Badge
                            variant={config.variant}
                            className="text-[10px] h-4 shrink-0"
                          >
                            {config.label}
                          </Badge>
                          {sprint.version && (
                            <Badge
                              variant="outline"
                              className="text-[10px] h-4 font-mono shrink-0"
                            >
                              v{sprint.version}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">
                            {progress.doneTasks}/{progress.totalTasks} tasks
                          </span>
                          {progress.totalTasks > 0 && (
                            <div className="flex-1 max-w-[120px] h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{
                                  width: `${progress.completionRate}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        asChild
                      >
                        <Link
                          href={`/${activeProjectId}/sprints/${sprint.id}/detail`}
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}

              {sprints.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted mb-3">
                    <Hammer className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    No sprints generated yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use the command palette (⌘K) to generate your first sprint.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthStat({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-mono font-medium",
          ok ? "text-foreground" : "text-destructive",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
