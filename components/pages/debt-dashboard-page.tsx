"use client";

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { DebtTable } from "@/components/sprint/debt-table";
import type { DebtItem } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-500/10 text-red-600",
  "in-progress": "bg-amber-500/10 text-amber-600",
  resolved: "bg-emerald-500/10 text-emerald-600",
  deferred: "bg-muted text-muted-foreground",
};

export function DebtDashboardPage() {
  const { getActiveProject } = useAppStore();
  const project = getActiveProject();

  // Aggregate debt items across all sprints, deduplicating by item number
  const debtMap = new Map<number, DebtItem>();
  for (const sprint of project.sprints ?? []) {
    for (const item of sprint.debtItems ?? []) {
      const existing = debtMap.get(item.number);
      // Keep the most recent version (later sprint = more up-to-date status)
      if (!existing) {
        debtMap.set(item.number, item);
      } else {
        debtMap.set(item.number, item);
      }
    }
  }

  const allItems = Array.from(debtMap.values()).sort((a, b) => a.number - b.number);
  const openItems = allItems.filter((d) => d.status === "open");
  const inProgressItems = allItems.filter((d) => d.status === "in-progress");
  const resolvedItems = allItems.filter((d) => d.status === "resolved");
  const deferredItems = allItems.filter((d) => d.status === "deferred");

  const stats = [
    { label: "Open", count: openItems.length, color: STATUS_COLORS.open },
    { label: "In Progress", count: inProgressItems.length, color: STATUS_COLORS["in-progress"] },
    { label: "Resolved", count: resolvedItems.length, color: STATUS_COLORS.resolved },
    { label: "Deferred", count: deferredItems.length, color: STATUS_COLORS.deferred },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Technical Debt
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Aggregated debt tracking across all sprints
        </p>
      </div>

      {allItems.length > 0 ? (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="border shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{stat.count}</p>
                  <Badge variant="secondary" className={`text-[10px] mt-1 border-0 ${stat.color}`}>
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
  );
}
