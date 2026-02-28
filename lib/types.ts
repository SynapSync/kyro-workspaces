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

export const SprintSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  status: SprintStatusSchema,
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tasks: z.array(TaskSchema),
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
  readme: z.string(),
  documents: z.array(DocumentSchema),
  sprints: z.array(SprintSchema),
});

export const AgentActivitySchema = z.object({
  id: z.string(),
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
export type Sprint = z.infer<typeof SprintSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type AgentActivity = z.infer<typeof AgentActivitySchema>;

// --- Column Configuration ---

export const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: "backlog", title: "Backlog", color: "bg-muted-foreground/60" },
  { id: "todo", title: "Todo", color: "bg-blue-500" },
  { id: "in_progress", title: "In Progress", color: "bg-amber-500" },
  { id: "review", title: "Review", color: "bg-primary" },
  { id: "done", title: "Done", color: "bg-emerald-500" },
];
