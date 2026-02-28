"use client";

import {
  CheckCircle2,
  ListTodo,
  Zap,
  FileText,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/lib/store";

export function ProjectOverview() {
  const { project, setActiveSidebarItem, setActiveSprintId } = useAppStore();

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

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {project.name}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-2xl">
          {project.description}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.bgColor}`}
                  >
                    <Icon className={`h-5 w-5 ${stat.color}`} />
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
                  onClick={() => setActiveSprintId(activeSprint.id)}
                  className="gap-1.5"
                >
                  Open Board
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setActiveSidebarItem("sprints")}
          >
            <Plus className="h-3.5 w-3.5" />
            Create Sprint
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setActiveSidebarItem("documents")}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Document
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setActiveSidebarItem("readme")}
          >
            <FileText className="h-3.5 w-3.5" />
            Edit README
          </Button>
        </div>
      </div>
    </div>
  );
}
