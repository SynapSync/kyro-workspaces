"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  Bot,
  PlusCircle,
  ArrowRightLeft,
  FileEdit,
  Zap,
  CheckCircle2,
  Undo2,
  ChevronDown,
  ChevronRight,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import type { AgentActionType, AgentActivity } from "@/lib/types";
import { cn } from "@/lib/utils";

const actionConfig: Record<
  AgentActionType,
  { icon: typeof Bot; color: string; bgColor: string; label: string }
> = {
  created_task: {
    icon: PlusCircle,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    label: "Created Task",
  },
  moved_task: {
    icon: ArrowRightLeft,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    label: "Moved Task",
  },
  edited_doc: {
    icon: FileEdit,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    label: "Edited Document",
  },
  created_sprint: {
    icon: Zap,
    color: "text-primary",
    bgColor: "bg-primary/10",
    label: "Created Sprint",
  },
  completed_task: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    label: "Completed Task",
  },
  chain_action: {
    icon: Link2,
    color: "text-primary",
    bgColor: "bg-primary/10",
    label: "Chain Action",
  },
};

type ActivityGroup =
  | { type: "single"; activity: AgentActivity }
  | { type: "chain"; chainId: string; activities: AgentActivity[] };

function groupActivities(activities: AgentActivity[]): ActivityGroup[] {
  const groups: ActivityGroup[] = [];
  const chainMap = new Map<string, AgentActivity[]>();
  const chainOrder: string[] = [];

  for (const activity of activities) {
    if (activity.chainId) {
      if (!chainMap.has(activity.chainId)) {
        chainMap.set(activity.chainId, []);
        chainOrder.push(activity.chainId);
      }
      chainMap.get(activity.chainId)!.push(activity);
    } else {
      // Flush any pending chains that appeared before this single activity
      // (chains are grouped by chainId, shown at first occurrence position)
      groups.push({ type: "single", activity });
    }
  }

  // Build final ordered list: chains first, then singles.
  // Activities are already sorted by timestamp (newest first).
  const result: ActivityGroup[] = [];
  for (const chainId of chainOrder) {
    const chainActivities = chainMap.get(chainId)!;
    result.push({ type: "chain", chainId, activities: chainActivities });
  }

  // Add singles that aren't part of a chain
  for (const activity of activities) {
    if (!activity.chainId) {
      result.push({ type: "single", activity });
    }
  }

  return result;
}

export function AgentsActivityPage() {
  const { activities, activitiesDiagnostics, activeProjectId } = useAppStore();
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [expandedChains, setExpandedChains] = useState<Set<string>>(new Set());

  const projectActivities = useMemo(
    () => activities.filter((a) => a.projectId === activeProjectId),
    [activities, activeProjectId]
  );

  const activityGroups = useMemo(
    () => groupActivities(projectActivities),
    [projectActivities],
  );

  const toggleChain = (chainId: string) => {
    setExpandedChains((prev) => {
      const next = new Set(prev);
      if (next.has(chainId)) {
        next.delete(chainId);
      } else {
        next.add(chainId);
      }
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center gap-2.5 mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Agents Activity
          </h1>
          <div className="flex h-5 items-center justify-center rounded-full bg-primary/10 px-2">
            <span className="text-[10px] font-semibold text-primary">AI</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Timeline of AI agent actions in this project
        </p>
      </div>
      <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
      <div className="max-w-3xl">

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

        <div className="flex flex-col gap-4">
          {activityGroups.map((group, index) => {
            if (group.type === "single") {
              return (
                <ActivityCard
                  key={group.activity.id}
                  activity={group.activity}
                  index={index}
                />
              );
            }

            // Chain group
            const isExpanded = expandedChains.has(group.chainId);
            const startActivity = group.activities.find((a) => a.chainStep === -1);
            const endActivity = group.activities.find((a) => a.chainStep === -2 || a.chainStep === -3);
            const stepActivities = group.activities
              .filter((a) => a.chainStep !== undefined && a.chainStep >= 0)
              .sort((a, b) => (a.chainStep ?? 0) - (b.chainStep ?? 0));
            const totalSteps = stepActivities.length;
            const successSteps = stepActivities.filter(
              (a) => !a.description.includes("failed")
            ).length;

            return (
              <motion.div
                key={group.chainId}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="ml-10 border shadow-sm">
                  <CardContent className="p-0">
                    {/* Chain header */}
                    <button
                      type="button"
                      onClick={() => toggleChain(group.chainId)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                    >
                      {/* Icon on the timeline */}
                      <div className="absolute -left-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-background bg-primary/10">
                        <Link2 className="h-4 w-4 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                            Chain
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {totalSteps} step{totalSteps !== 1 ? "s" : ""}
                            {successSteps < totalSteps && ` (${successSteps} ok)`}
                          </span>
                          {startActivity && (
                            <span className="text-xs text-muted-foreground ml-auto">
                              {formatDistanceToNow(new Date(startActivity.timestamp), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground truncate">
                          {startActivity?.description.replace("Chain started: ", "").split(" — ")[1] ?? "AI chain"}
                        </p>
                      </div>

                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                    </button>

                    {/* Expanded steps */}
                    {isExpanded && (
                      <div className="border-t px-4 py-2 space-y-1.5">
                        {stepActivities.map((activity) => (
                          <div
                            key={activity.id}
                            className={cn(
                              "flex items-start gap-2 rounded-md px-2 py-1.5 text-xs",
                              activity.description.includes("failed")
                                ? "bg-destructive/5 text-destructive"
                                : "text-foreground"
                            )}
                          >
                            <span className="shrink-0 font-mono text-muted-foreground w-4 text-right">
                              {(activity.chainStep ?? 0) + 1}
                            </span>
                            <span className="min-w-0 truncate">
                              {activity.description.replace(/^Step \d+: /, "").replace(/^Step \d+ failed: /, "")}
                            </span>
                          </div>
                        ))}
                        {endActivity && (
                          <div className="px-2 py-1 text-[10px] text-muted-foreground">
                            {endActivity.description}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {projectActivities.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
            <Bot className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No agent activity yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            AI agent actions will appear here as they happen.
          </p>
        </div>
      )}

      {/* Activity Diagnostics */}
      <div className="mt-8 border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setDiagnosticsOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-muted-foreground bg-muted/40 hover:bg-muted/70 transition-colors"
        >
          <span>Activity Diagnostics</span>
          {diagnosticsOpen ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
        {diagnosticsOpen && (
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 px-4 py-3 text-xs">
            {activitiesDiagnostics ? (
              <>
                <DiagRow label="Retention limit" value={String(activitiesDiagnostics.retentionLimit)} />
                <DiagRow label="Retention source" value={activitiesDiagnostics.retentionSource} />
                <DiagRow label="Env key" value={activitiesDiagnostics.retentionEnvKey} />
                <DiagRow label="Env value" value={activitiesDiagnostics.retentionRawValue ?? "—"} />
                <DiagRow label="Prune events" value={String(activitiesDiagnostics.pruneMetrics.pruneEvents)} />
                <DiagRow label="Pruned total" value={String(activitiesDiagnostics.pruneMetrics.prunedEntriesTotal)} />
                <DiagRow
                  label="Last pruned at"
                  value={
                    activitiesDiagnostics.pruneMetrics.lastPrunedAt
                      ? formatDistanceToNow(new Date(activitiesDiagnostics.pruneMetrics.lastPrunedAt), { addSuffix: true })
                      : "—"
                  }
                />
              </>
            ) : (
              <span className="col-span-2 text-muted-foreground">No diagnostics available (mock mode).</span>
            )}
          </div>
        )}
      </div>
      </div>
      </div>
    </div>
  );
}

function ActivityCard({ activity, index }: { activity: AgentActivity; index: number }) {
  const config = actionConfig[activity.actionType];
  const Icon = config.icon;

  return (
    <motion.div
      key={activity.id}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="ml-10 border shadow-sm">
        <CardContent className="p-4">
          {/* Icon on the timeline */}
          <div
            className={cn(
              "absolute -left-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-background",
              config.bgColor
            )}
          >
            <Icon className={cn("h-4 w-4", config.color)} />
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                  {config.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(
                    new Date(activity.timestamp),
                    { addSuffix: true }
                  )}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {activity.description}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span className="sr-only">Undo action</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DiagRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground truncate">{value}</span>
    </>
  );
}
