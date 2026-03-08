"use client";

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { DebtTable } from "@/components/sprint/debt-table";
import { DEBT_STATUS_STYLES } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { DebtItem } from "@/lib/types";

export function DebtDashboardPage() {
  const { getActiveProject } = useAppStore();
  const project = getActiveProject();

  // Aggregate debt items across all sprints, deduplicating by item number
  const debtMap = new Map<number, DebtItem>();
  for (const sprint of project.sprints ?? []) {
    for (const item of sprint.debtItems ?? []) {
      // Keep the most recent version (later sprint = more up-to-date status)
      debtMap.set(item.number, item);
    }
  }

  const allItems = Array.from(debtMap.values()).sort((a, b) => a.number - b.number);
  const openItems = allItems.filter((d) => d.status === "open");
  const inProgressItems = allItems.filter((d) => d.status === "in-progress");
  const resolvedItems = allItems.filter((d) => d.status === "resolved");
  const deferredItems = allItems.filter((d) => d.status === "deferred");

  const stats = [
    { label: "Open", count: openItems.length, color: DEBT_STATUS_STYLES.open.className },
    { label: "In Progress", count: inProgressItems.length, color: DEBT_STATUS_STYLES["in-progress"].className },
    { label: "Resolved", count: resolvedItems.length, color: DEBT_STATUS_STYLES.resolved.className },
    { label: "Deferred", count: deferredItems.length, color: DEBT_STATUS_STYLES.deferred.className },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Technical Debt
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Aggregated debt tracking across all sprints
        </p>
      </div>
      <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
      <div className="max-w-5xl">

      {allItems.length > 0 ? (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="border shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{stat.count}</p>
                  <Badge variant="secondary" className={cn("text-[10px] mt-1 border-0", stat.color)}>
                    {stat.label}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Active items (open + in-progress) */}
          {(openItems.length > 0 || inProgressItems.length > 0) && (
            <Card className="border shadow-sm mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Active Debt</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <DebtTable items={[...openItems, ...inProgressItems]} />
              </CardContent>
            </Card>
          )}

          {/* Full history */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Full Debt History ({allItems.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <DebtTable items={allItems} />
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
            <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No debt items tracked
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Debt items are extracted from sprint files in the project directory.
          </p>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}
