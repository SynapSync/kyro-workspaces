import { z } from "zod";

// --- Zod Schemas ---

export const TaskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const TaskStatusSchema = z.enum([
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
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

export const AgentActivitySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  actionType: AgentActionTypeSchema,
  description: z.string(),
  timestamp: z.string(),
  metadata: z.record(z.string()).optional(),
});

// --- TypeScript Types ---

export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type SprintStatus = z.infer<typeof SprintStatusSchema>;
export type AgentActionType = z.infer<typeof AgentActionTypeSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Column = z.infer<typeof ColumnSchema>;
export type SprintMarkdownSections = z.infer<typeof SprintMarkdownSectionsSchema>;
export type Sprint = z.infer<typeof SprintSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type AgentActivity = z.infer<typeof AgentActivitySchema>;

// Sprint section metadata for rendering tabs
export interface SprintSectionMeta {
  key: keyof SprintMarkdownSections;
  label: string;
  description: string;
  placeholder: string;
}

export const SPRINT_SECTIONS: SprintSectionMeta[] = [
  {
    key: "retrospective",
    label: "Retrospective",
    description: "What went well, what didn't, and surprises",
    placeholder: "## What Went Well\n\n- \n\n## What Didn't Go Well\n\n- \n\n## Surprises\n\n- ",
  },
  {
    key: "technicalDebt",
    label: "Technical Debt",
    description: "Accumulated debt items with status tracking",
    placeholder: "| # | Item | Origin | Priority | Status |\n|---|------|--------|----------|--------|\n| D1 | Description | Sprint X | HIGH | open |",
  },
  {
    key: "executionMetrics",
    label: "Execution Metrics",
    description: "Tests, performance, and sprint execution data",
    placeholder: "## Metrics\n\n- Tests: \n- Files modified: \n- Files created: \n\n## Results\n\n| Metric | Value |\n|--------|-------|\n| | |",
  },
  {
    key: "findings",
    label: "Findings",
    description: "Key discoveries and learnings from this sprint",
    placeholder: "## Key Findings\n\n1. **Finding 1**: Description\n2. **Finding 2**: Description",
  },
  {
    key: "recommendations",
    label: "Recommendations",
    description: "Suggestions and priorities for upcoming sprints",
    placeholder: "## Recommendations for Next Sprint\n\n1. **[CRITICAL]** Description\n2. **[HIGH]** Description\n3. **[MEDIUM]** Description",
  },
];

// --- Column Configuration ---

export const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: "backlog", title: "Backlog", color: "bg-muted-foreground/60" },
  { id: "todo", title: "Todo", color: "bg-blue-500" },
  { id: "in_progress", title: "In Progress", color: "bg-amber-500" },
  { id: "review", title: "Review", color: "bg-primary" },
  { id: "done", title: "Done", color: "bg-emerald-500" },
];
