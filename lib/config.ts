import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Zap,
  Bot,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TaskStatus, TaskPriority, SprintSectionMeta } from "@/lib/types";

// --- Priority Config ---

export interface PriorityConfig {
  label: string;
  className: string;
}

export const PRIORITY_CONFIG: Record<TaskPriority, PriorityConfig> = {
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", className: "bg-blue-500/10 text-blue-600" },
  high: { label: "High", className: "bg-amber-500/10 text-amber-600" },
  urgent: { label: "Urgent", className: "bg-red-500/10 text-red-600" },
};

// --- Nav Items ---

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "readme", label: "README", icon: FileText },
  { id: "documents", label: "Documents", icon: FolderOpen },
  { id: "sprints", label: "Sprints", icon: Zap },
  { id: "agents", label: "Agents Activity", icon: Bot },
];

// --- Kanban Columns ---

export const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: "backlog", title: "Backlog", color: "bg-muted-foreground/60" },
  { id: "todo", title: "Todo", color: "bg-blue-500" },
  { id: "in_progress", title: "In Progress", color: "bg-amber-500" },
  { id: "review", title: "Review", color: "bg-primary" },
  { id: "done", title: "Done", color: "bg-emerald-500" },
];

// --- Sprint Section Metadata ---

export const SPRINT_SECTIONS: SprintSectionMeta[] = [
  {
    key: "retrospective",
    label: "Retrospective",
    description: "What went well, what didn't, and surprises",
    placeholder:
      "## What Went Well\n\n- \n\n## What Didn't Go Well\n\n- \n\n## Surprises\n\n- ",
  },
  {
    key: "technicalDebt",
    label: "Technical Debt",
    description: "Accumulated debt items with status tracking",
    placeholder:
      "| # | Item | Origin | Priority | Status |\n|---|------|--------|----------|--------|\n| D1 | Description | Sprint X | HIGH | open |",
  },
  {
    key: "executionMetrics",
    label: "Execution Metrics",
    description: "Tests, performance, and sprint execution data",
    placeholder:
      "## Metrics\n\n- Tests: \n- Files modified: \n- Files created: \n\n## Results\n\n| Metric | Value |\n|--------|-------|\n| | |",
  },
  {
    key: "findings",
    label: "Findings",
    description: "Key discoveries and learnings from this sprint",
    placeholder:
      "## Key Findings\n\n1. **Finding 1**: Description\n2. **Finding 2**: Description",
  },
  {
    key: "recommendations",
    label: "Recommendations",
    description: "Suggestions and priorities for upcoming sprints",
    placeholder:
      "## Recommendations for Next Sprint\n\n1. **[CRITICAL]** Description\n2. **[HIGH]** Description\n3. **[MEDIUM]** Description",
  },
];
