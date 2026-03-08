import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getCompletionRateStyle } from "@/lib/config";
import type { SprintProgressData } from "@/lib/config";
import type { SprintStatus } from "@/lib/types";

const SPRINT_STATUS_STYLE: Record<SprintStatus, string> = {
  planned: "border-muted-foreground/30 bg-muted text-muted-foreground",
  active: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  closed: "border-green-500/30 bg-green-500/10 text-green-600",
};

interface SprintProgressBarProps {
  data: SprintProgressData;
  status: SprintStatus;
  className?: string;
}

export function SprintProgressBar({ data, status, className }: SprintProgressBarProps) {
  const { totalTasks, doneTasks, sprintProgress, completionRate } = data;

  if (totalTasks === 0) return null;

  return (
    <div className={className}>
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
        <span>Progress</span>
        <div className="flex items-center gap-2">
          <span>{doneTasks}/{totalTasks}</span>
          <Badge
            variant="outline"
            className={cn("text-[10px] px-1.5 py-0 h-4 font-normal", SPRINT_STATUS_STYLE[status])}
          >
            {status}
          </Badge>
          {completionRate < sprintProgress && (
            <Badge
              variant="outline"
              className={cn("text-[10px] px-1.5 py-0 h-4 font-normal", getCompletionRateStyle(completionRate))}
            >
              {completionRate}% completed
            </Badge>
          )}
        </div>
      </div>
      <Progress value={completionRate} className="h-1.5" />
    </div>
  );
}
