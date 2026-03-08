"use client";

import Link from "next/link";
import { InlineMarkdown } from "@/components/inline-markdown";
import {
  CheckCircle2,
  ListTodo,
  Zap,
  FileText,
  Plus,
  ArrowRight,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { SPRINT_SECTIONS } from "@/lib/config";
import { cn } from "@/lib/utils";

export function ProjectOverviewPage() {
  const { getActiveProject, activeProjectId } = useAppStore();

  const project = getActiveProject();

  const allTasks = project.sprints.flatMap((s) => s.tasks);
  const doneTasks = allTasks.filter((t) => t.status === "done");
  const activeSprint = project.sprints.find((s) => s.status === "active");
  const inProgressTasks = allTasks.filter((t) => t.status === "in_progress");
  const completionRate =
    allTasks.length > 0
      ? Math.round((doneTasks.length / allTasks.length) * 100)
      : 0;

  const stats = [
    {
      label: "Total Tasks",
      value: allTasks.length,
      icon: ListTodo,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Completed",
      value: doneTasks.length,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "In Progress",
      value: inProgressTasks.length,
      icon: Zap,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Documents",
      value: project.documents.length,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
  ];

  // Find sprints with documented sections
  const documentedSprints = project.sprints.filter(
    (s) =>
      s.sections &&
      SPRINT_SECTIONS.some(
        (sec) => s.sections?.[sec.key] && (s.sections[sec.key] ?? "").trim().length > 0
      )
  );

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {project.name}
        </h1>
        <div className="mt-1.5 text-sm text-muted-foreground leading-relaxed text-justify">
          <InlineMarkdown content={project.description} />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
      <div className="max-w-5xl">

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", stat.bgColor)}
                  >
                    <Icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Progress + Active Sprint */}
      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-foreground">
                {completionRate}%
              </span>
              <span className="text-xs text-muted-foreground">
                {doneTasks.length} of {allTasks.length} tasks
              </span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </CardContent>
        </Card>

        {activeSprint && (
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Active Sprint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">
                    {activeSprint.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeSprint.tasks.length} tasks &middot;{" "}
                    {
                      activeSprint.tasks.filter((t) => t.status === "done")
                        .length
                    }{" "}
                    completed
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  asChild
                >
                  <Link href={`/${activeProjectId}/sprints/${activeSprint.id}`}>
                    Open Board
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent documented sprints */}
      {documentedSprints.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Documented Sprints
          </h2>
          <div className="grid gap-3">
            {documentedSprints.slice(0, 3).map((sprint) => {
              const filled = SPRINT_SECTIONS.filter(
                (s) =>
                  sprint.sections?.[s.key] &&
                  (sprint.sections[s.key] ?? "").trim().length > 0
              );
              return (
                <Link
                  key={sprint.id}
                  href={`/${activeProjectId}/sprints/${sprint.id}/detail`}
                >
                  <Card className="border shadow-sm hover:border-primary/30 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <FolderOpen className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">
                              {sprint.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {sprint.version && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] h-4 font-mono"
                                >
                                  v{sprint.version}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {filled.length}/{SPRINT_SECTIONS.length} sections
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {filled.map((s) => (
                            <span
                              key={s.key}
                              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                            />
                          ))}
                          {Array.from({ length: SPRINT_SECTIONS.length - filled.length }).map(
                            (_, i) => (
                              <span
                                key={i}
                                className="h-1.5 w-1.5 rounded-full bg-muted"
                              />
                            )
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href={`/${activeProjectId}/sprints`}>
              <Plus className="h-3.5 w-3.5" />
              Create Sprint
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href={`/${activeProjectId}/documents`}>
              <Plus className="h-3.5 w-3.5" />
              Add Document
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href={`/${activeProjectId}/readme`}>
              <FileText className="h-3.5 w-3.5" />
              Edit README
            </Link>
          </Button>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}
