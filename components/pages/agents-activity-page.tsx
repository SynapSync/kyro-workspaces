"use client";

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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import type { AgentActionType } from "@/lib/types";
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
};

export function AgentsActivityPage() {
  const { activities } = useAppStore();

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Agents Activity
          </h1>
          <div className="flex h-5 items-center justify-center rounded-full bg-primary/10 px-2">
            <span className="text-[10px] font-semibold text-primary">AI</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Timeline of AI agent actions across your project
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

        <div className="flex flex-col gap-4">
          {activities.map((activity, index) => {
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
          })}
        </div>
      </div>

      {activities.length === 0 && (
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
    </div>
  );
}
