import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Zap,
  Bot,
  BookOpen,
  AlertTriangle,
  Search,
  Lightbulb,
  Target,
  ArrowRightLeft,
  Layers,
  CheckSquare,
  Bold,
  Italic,
  Code,
  Square,
  Link2,
  Heading,
  List,
  ListOrdered,
  Quote,
  Map,
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
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, href: "/overview" },
  { id: "readme", label: "README", icon: FileText, href: "/readme" },
  { id: "sprints", label: "Sprints", icon: Zap, href: "/sprints" },
  { id: "findings", label: "Findings", icon: Search, href: "/findings" },
  { id: "roadmap", label: "Roadmap", icon: Map, href: "/roadmap" },
  { id: "debt", label: "Debt", icon: AlertTriangle, href: "/debt" },
  { id: "documents", label: "Documents", icon: FolderOpen, href: "/documents" },
  { id: "reentry", label: "Re-entry Prompts", icon: BookOpen, href: "/reentry" },
  { id: "agents", label: "Agents Activity", icon: Bot, href: "/agents" },
];

// --- Kanban Columns ---

export const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: "pending", title: "Pending", color: "bg-blue-500" },
  { id: "in_progress", title: "In Progress", color: "bg-amber-500" },
  { id: "blocked", title: "Blocked", color: "bg-red-500" },
  { id: "skipped", title: "Skipped", color: "bg-muted-foreground/60" },
  { id: "carry_over", title: "Carry-over", color: "bg-purple-500" },
  { id: "done", title: "Done", color: "bg-emerald-500" },
];

// --- Sprint Section Metadata ---

export const SPRINT_SECTIONS: SprintSectionMeta[] = [
  {
    key: "sprintObjective",
    label: "Objective",
    description: "The sprint's primary goal and expected outcome",
  },
  {
    key: "disposition",
    label: "Disposition",
    description: "How previous sprint's recommendations were handled",
  },
  {
    key: "phases",
    label: "Phases",
    description: "Planned work phases with tasks",
  },
  {
    key: "emergentPhases",
    label: "Emergent Phases",
    description: "Work discovered during execution",
  },
  {
    key: "findingsConsolidation",
    label: "Findings",
    description: "Key discoveries and learnings from this sprint",
  },
  {
    key: "technicalDebt",
    label: "Technical Debt",
    description: "Accumulated debt items with status tracking",
  },
  {
    key: "definitionOfDone",
    label: "Definition of Done",
    description: "Completion criteria checklist",
  },
  {
    key: "retrospective",
    label: "Retrospective",
    description: "What went well, what didn't, and surprises",
  },
  {
    key: "recommendations",
    label: "Recommendations",
    description: "Suggestions and priorities for upcoming sprints",
  },
];

// --- App Identity ---

export const APP_NAME = "Kyro";
export const APP_DESCRIPTION =
  "Kyro is an agentic execution kernel for structured work. A self-optimizing system where AI agents and humans collaborate through markdown files inside a shared workspace.";

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

export const ZEN_COLUMNS: TaskStatus[] = ["in_progress", "done"];

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
  | "sprintObjective"
  | "disposition"
  | "phases"
  | "emergentPhases"
  | "findingsConsolidation"
  | "technicalDebt"
  | "definitionOfDone"
  | "retrospective"
  | "recommendations";

export const SPRINT_SECTION_ICONS: Record<SprintSectionKey, LucideIcon> = {
  sprintObjective: Target,
  disposition: ArrowRightLeft,
  phases: Layers,
  emergentPhases: Layers,
  findingsConsolidation: Search,
  technicalDebt: AlertTriangle,
  definitionOfDone: CheckSquare,
  retrospective: BookOpen,
  recommendations: Lightbulb,
};

// --- Sprint Type Colors ---

export const AGENT_BADGE_STYLE = "bg-violet-500/10 text-violet-600 border-violet-200";

export const SPRINT_TYPE_COLORS: Record<string, string> = {
  refactor: "bg-blue-500/10 text-blue-600",
  feature: "bg-emerald-500/10 text-emerald-600",
  bugfix: "bg-red-500/10 text-red-600",
  audit: "bg-purple-500/10 text-purple-600",
  debt: "bg-orange-500/10 text-orange-600",
};

// --- Finding Severity Colors ---

export const FINDING_SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/10 text-red-600",
  high: "bg-orange-500/10 text-orange-600",
  medium: "bg-amber-500/10 text-amber-600",
  low: "bg-blue-500/10 text-blue-600",
  info: "bg-muted text-muted-foreground",
};

// --- Finding Impact Colors (Findings Consolidation) ---

export const FINDING_IMPACT_COLORS: Record<string, string> = {
  high: "bg-red-500/10 text-red-600",
  medium: "bg-amber-500/10 text-amber-600",
  low: "bg-blue-500/10 text-blue-600",
};

// --- Debt Status Styles ---

export interface StatusStyle {
  label: string;
  className: string;
}

export const DEBT_STATUS_STYLES: Record<string, StatusStyle> = {
  open: { label: "Open", className: "bg-red-500/10 text-red-600" },
  "in-progress": { label: "In Progress", className: "bg-amber-500/10 text-amber-600" },
  resolved: { label: "Resolved", className: "bg-emerald-500/10 text-emerald-600" },
  deferred: { label: "Deferred", className: "bg-muted text-muted-foreground" },
  "carry-over": { label: "Carry-over", className: "bg-blue-500/10 text-blue-600" },
};

// --- Disposition Action Styles ---

export const DISPOSITION_ACTION_STYLES: Record<string, StatusStyle> = {
  incorporated: { label: "Incorporated", className: "bg-emerald-500/10 text-emerald-600" },
  deferred: { label: "Deferred", className: "bg-amber-500/10 text-amber-600" },
  resolved: { label: "Resolved", className: "bg-blue-500/10 text-blue-600" },
  "n/a": { label: "N/A", className: "bg-muted text-muted-foreground" },
  "converted-to-phase": { label: "Converted to Phase", className: "bg-purple-500/10 text-purple-600" },
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
