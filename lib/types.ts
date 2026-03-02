import { z } from "zod";

// --- Zod Schemas ---

export const TaskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const TaskStatusSchema = z.enum([
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
  "blocked",
  "skipped",
]);
export const SprintStatusSchema = z.enum(["planned", "active", "closed"]);
export const AgentActionTypeSchema = z.enum([
  "created_task",
  "moved_task",
  "edited_doc",
  "created_sprint",
  "completed_task",
]);

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: TaskPrioritySchema,
  status: TaskStatusSchema,
  assignee: z.string().optional(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ColumnSchema = z.object({
  id: TaskStatusSchema,
  title: z.string(),
  tasks: z.array(TaskSchema),
});

// --- Sprint Markdown Sections ---
// Each sprint can hold structured markdown content for retrospective,
// accumulated tech debt, execution metrics, findings, and recommendations.

export const SprintMarkdownSectionsSchema = z.object({
  retrospective: z.string().optional(),
  technicalDebt: z.string().optional(),
  executionMetrics: z.string().optional(),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
});

export const SprintSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  status: SprintStatusSchema,
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  version: z.string().optional(),
  objective: z.string().optional(),
  tasks: z.array(TaskSchema),
  sections: SprintMarkdownSectionsSchema.optional(),
});

export const DocumentSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  color: z.string().optional(),
  readme: z.string(),
  documents: z.array(DocumentSchema),
  sprints: z.array(SprintSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const TeamMemberSchema = z.object({
  id: z.string().optional(), // populated by the real API; absent in mock data
  name: z.string(),
  avatar: z.string(),
  color: z.string(),
});

export const AgentActivitySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  actionType: AgentActionTypeSchema,
  description: z.string(),
  timestamp: z.string(),
  metadata: z.record(z.string()).optional(),
});

// --- Git Types ---

export interface GitCommit {
  hash: string;       // full SHA-1
  shortHash: string;  // first 7 chars
  message: string;
  authorName: string;
  authorDate: string; // ISO 8601
}

// --- TypeScript Types ---

export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type SprintStatus = z.infer<typeof SprintStatusSchema>;
export type TeamMember = z.infer<typeof TeamMemberSchema>;
export type AgentActionType = z.infer<typeof AgentActionTypeSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Column = z.infer<typeof ColumnSchema>;
export type SprintMarkdownSections = z.infer<typeof SprintMarkdownSectionsSchema>;
export type Sprint = z.infer<typeof SprintSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type AgentActivity = z.infer<typeof AgentActivitySchema>;

// --- Async State ---

export interface LoadingState {
  isInitializing: boolean;
  initError: string | null;
}

// Sprint section metadata for rendering tabs
export interface SprintSectionMeta {
  key: keyof SprintMarkdownSections;
  label: string;
  description: string;
  placeholder: string;
}

// --- Markdown Format ---

export type MarkdownFormat =
  | "bold"
  | "italic"
  | "code"
  | "code_block"
  | "link"
  | "heading"
  | "bullet_list"
  | "ordered_list"
  | "quote";

// COLUMNS and SPRINT_SECTIONS constants live in lib/config.ts

// --- Workspace ---

export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  rootPath: z.string(),
  projects: z.array(ProjectSchema),
  members: z.array(TeamMemberSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Workspace = z.infer<typeof WorkspaceSchema>;

// --- Sprint Task Symbol System ---
// Maps the checkbox symbols used in sprint markdown files to TaskStatus values.

export type SprintTaskSymbol = " " | "~" | "x" | "!" | "-" | ">";

export const SYMBOL_TO_STATUS: Record<SprintTaskSymbol, TaskStatus> = {
  " ": "todo",        // [ ] Pending
  "~": "in_progress", // [~] In Progress
  "x": "done",        // [x] Done
  "!": "blocked",     // [!] Blocked
  "-": "skipped",     // [-] Skipped
  ">": "todo",        // [>] Carry-over (becomes todo in next sprint)
};

export function symbolToStatus(symbol: string): TaskStatus {
  if (symbol in SYMBOL_TO_STATUS) {
    return SYMBOL_TO_STATUS[symbol as SprintTaskSymbol];
  }
  return "todo";
}

export const STATUS_TO_SYMBOL: Partial<Record<TaskStatus, SprintTaskSymbol>> = {
  todo:        " ",
  in_progress: "~",
  done:        "x",
  blocked:     "!",
  skipped:     "-",
  backlog:     " ",
  review:      "~",
};
