import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Zap,
  Bot,
  BookOpen,
  AlertTriangle,
  BarChart2,
  Search,
  Lightbulb,
  Bold,
  Italic,
  Code,
  Square,
  Link2,
  Heading,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  TaskStatus,
  TaskPriority,
  SprintStatus,
  SprintSectionMeta,
  MarkdownFormat,
} from "@/lib/types";

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

// --- App Identity ---

export const APP_NAME = "Kyro";
export const APP_DESCRIPTION =
  "An AI-native Kanban project management platform with intelligent task automation and sprint planning.";

// --- Sprint Status Config ---

export interface SprintStatusConfig {
  label: string;
  variant: "default" | "secondary" | "outline";
}
export const SPRINT_STATUS_CONFIG: Record<SprintStatus, SprintStatusConfig> = {
  planned: { label: "Planned", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  closed: { label: "Closed", variant: "outline" },
};

// --- Zen Mode Columns ---

export const ZEN_COLUMNS: TaskStatus[] = ["in_progress", "review"];

// --- Task Tag Config ---

export const TASK_TAGS = {
  BLOCKED: "blocked",
  AI_CREATED: "ai-created",
} as const;

export type TaskTagKey = (typeof TASK_TAGS)[keyof typeof TASK_TAGS];

export interface TagStyle {
  label: string;
  badgeClassName: string;
}
export const TAG_CONFIG: Record<TaskTagKey, TagStyle> = {
  blocked: {
    label: "Blocked",
    badgeClassName: "bg-red-500/10 text-red-600 border-red-200",
  },
  "ai-created": {
    label: "AI",
    badgeClassName: "bg-purple-500/10 text-purple-600 border-purple-200",
  },
};

// --- Sprint Section Icons ---

export type SprintSectionKey =
  | "retrospective"
  | "technicalDebt"
  | "executionMetrics"
  | "findings"
  | "recommendations";

export const SPRINT_SECTION_ICONS: Record<SprintSectionKey, LucideIcon> = {
  retrospective: BookOpen,
  technicalDebt: AlertTriangle,
  executionMetrics: BarChart2,
  findings: Search,
  recommendations: Lightbulb,
};

// --- Markdown Toolbar Items ---

export interface ToolbarItem {
  format: MarkdownFormat;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
}
export const MARKDOWN_TOOLBAR_ITEMS: ToolbarItem[] = [
  { format: "bold", label: "Bold", icon: Bold, shortcut: "⌘B" },
  { format: "italic", label: "Italic", icon: Italic, shortcut: "⌘I" },
  { format: "code", label: "Inline Code", icon: Code },
  { format: "code_block", label: "Code Block", icon: Square },
  { format: "link", label: "Link", icon: Link2 },
  { format: "heading", label: "Heading", icon: Heading },
  { format: "bullet_list", label: "Bullet List", icon: List },
  { format: "ordered_list", label: "Ordered List", icon: ListOrdered },
  { format: "quote", label: "Quote", icon: Quote },
];

// --- Entity Defaults ---

export const DEFAULT_DOCUMENT = {
  title: "Untitled Document",
  content: "# New Document\n\nStart writing here...",
} as const;

export const DEFAULT_PROJECT = {
  name: "New Project",
  description: "A new project",
  readme: "# New Project\n\nWelcome!",
} as const;

export const DEFAULT_SPRINT_NAME_PREFIX = "Sprint";

// --- Timing / UI Constants ---

export const NEW_TASK_THRESHOLD_MS = 5000;
export const DEFAULT_WORDS_PER_MINUTE = 200;
export const QUERY_STALE_TIME_MS = 60 * 1_000; // 60 seconds

// --- Workspace ---

export const DEFAULT_WORKSPACE_PATH =
  process.env.KYRO_WORKSPACE_PATH ??
  `${process.env.HOME ?? "~"}/kyro-workspace`;
