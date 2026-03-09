"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Sprint } from "@/lib/types";

interface SprintAnalyticsProps {
  sprints: Sprint[];
  className?: string;
}

interface SprintDataPoint {
  name: string;
  number: number;
  totalTasks: number;
  doneTasks: number;
  openDebt: number;
  resolvedDebt: number;
}

function buildDataPoints(sprints: Sprint[]): SprintDataPoint[] {
  return sprints.map((s, i) => {
    const match = s.name.match(/Sprint\s+(\d+)/i);
    const number = match ? parseInt(match[1], 10) : i + 1;
    const done = s.tasks.filter((t) => t.status === "done").length;

    const openDebt = (s.debtItems ?? []).filter(
      (d) => d.status === "open" || d.status === "in-progress",
    ).length;
    const resolvedDebt = (s.debtItems ?? []).filter(
      (d) => d.status === "resolved",
    ).length;

    return {
      name: `S${number}`,
      number,
      totalTasks: s.tasks.length,
      doneTasks: done,
      openDebt,
      resolvedDebt,
    };
  });
}

export function SprintAnalytics({ sprints, className }: SprintAnalyticsProps) {
  const data = useMemo(() => buildDataPoints(sprints), [sprints]);

  if (data.length === 0) return null;

  return (
    <div className={cn("grid gap-4 lg:grid-cols-2", className)}>
      <VelocityChart data={data} />
      <DebtTrendChart data={data} />
    </div>
  );
}

function VelocityChart({ data }: { data: SprintDataPoint[] }) {
  const maxTasks = Math.max(...data.map((d) => d.totalTasks), 1);
  const chartHeight = 120;
  const barWidth = Math.min(32, Math.max(16, 200 / data.length));
  const gap = 8;
  const chartWidth = data.length * (barWidth + gap) - gap;

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Sprint Velocity</CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Tasks completed per sprint
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-center gap-0 overflow-x-auto pb-1">
          <svg
            width={chartWidth + 40}
            height={chartHeight + 24}
            viewBox={`0 0 ${chartWidth + 40} ${chartHeight + 24}`}
            className="mx-auto"
          >
            {data.map((d, i) => {
              const totalH = (d.totalTasks / maxTasks) * chartHeight;
              const doneH = (d.doneTasks / maxTasks) * chartHeight;
              const x = 20 + i * (barWidth + gap);
              const yTotal = chartHeight - totalH;
              const yDone = chartHeight - doneH;

              return (
                <g key={d.name}>
                  {/* Total tasks bar (background) */}
                  <rect
                    x={x}
                    y={yTotal}
                    width={barWidth}
                    height={totalH}
                    rx={3}
                    className="fill-muted"
                  />
                  {/* Done tasks bar (foreground) */}
                  <rect
                    x={x}
                    y={yDone}
                    width={barWidth}
                    height={doneH}
                    rx={3}
                    className="fill-primary"
                  />
                  {/* Label */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 14}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {d.name}
                  </text>
                  {/* Value on top */}
                  {doneH > 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={yDone - 4}
                      textAnchor="middle"
                      className="fill-foreground text-[10px] font-medium"
                    >
                      {d.doneTasks}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-sm bg-primary" />
            <span className="text-[10px] text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-sm bg-muted" />
            <span className="text-[10px] text-muted-foreground">Total</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DebtTrendChart({ data }: { data: SprintDataPoint[] }) {
  const hasDebt = data.some((d) => d.openDebt > 0 || d.resolvedDebt > 0);
  if (!hasDebt) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Debt Trend</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Open vs resolved debt over time
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
            No debt data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxDebt = Math.max(...data.map((d) => Math.max(d.openDebt, d.resolvedDebt)), 1);
  const chartHeight = 120;
  const padding = 20;
  const pointGap = data.length > 1 ? (300 - padding * 2) / (data.length - 1) : 0;

  const openPoints = data.map((d, i) => ({
    x: padding + i * pointGap,
    y: chartHeight - (d.openDebt / maxDebt) * (chartHeight - 10),
  }));

  const resolvedPoints = data.map((d, i) => ({
    x: padding + i * pointGap,
    y: chartHeight - (d.resolvedDebt / maxDebt) * (chartHeight - 10),
  }));

  const toPath = (points: { x: number; y: number }[]) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Debt Trend</CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Open vs resolved debt over time
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-1">
          <svg
            width={300 + 40}
            height={chartHeight + 24}
            viewBox={`0 0 ${300 + 40} ${chartHeight + 24}`}
            className="mx-auto"
          >
            {/* Open debt line */}
            <path
              d={toPath(openPoints)}
              fill="none"
              strokeWidth={2}
              className="stroke-destructive"
            />
            {openPoints.map((p, i) => (
              <circle
                key={`open-${data[i].name}`}
                cx={p.x}
                cy={p.y}
                r={3}
                className="fill-destructive"
              />
            ))}

            {/* Resolved debt line */}
            <path
              d={toPath(resolvedPoints)}
              fill="none"
              strokeWidth={2}
              className="stroke-emerald-500"
            />
            {resolvedPoints.map((p, i) => (
              <circle
                key={`resolved-${data[i].name}`}
                cx={p.x}
                cy={p.y}
                r={3}
                className="fill-emerald-500"
              />
            ))}

            {/* X-axis labels */}
            {data.map((d, i) => (
              <text
                key={d.name}
                x={padding + i * pointGap}
                y={chartHeight + 14}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {d.name}
              </text>
            ))}
          </svg>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <span className="text-[10px] text-muted-foreground">Open</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-muted-foreground">Resolved</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
