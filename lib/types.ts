import { z } from "zod";

// --- Zod Schemas ---

export const TaskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const TaskStatusSchema = z.enum([
  "pending",
  "in_progress",
  "done",
  "blocked",
  "skipped",
  "carry_over",
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
  // Sprint-forge extensions (optional for backward compatibility)
  taskRef: z.string().optional(), // e.g. "T1.1", "TE.1"
  files: z.array(z.string()).optional(),
  evidence: z.string().optional(),
  verification: z.string().optional(),
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
  sprintObjective: z.string().optional(),
  disposition: z.string().optional(),
  phases: z.string().optional(),
  emergentPhases: z.string().optional(),
  findingsConsolidation: z.string().optional(),
  technicalDebt: z.string().optional(),
  definitionOfDone: z.string().optional(),
  retrospective: z.string().optional(),
  recommendations: z.string().optional(),
});

// --- Sprint-Forge Domain Types ---

export const SprintTypeSchema = z.enum([
  "audit",
  "refactor",
  "feature",
  "bugfix",
  "debt",
]);

export const FindingSeveritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
]);

export const FindingSchema = z.object({
  id: z.string(),
  number: z.number(),
  title: z.string(),
  summary: z.string(),
  severity: FindingSeveritySchema,
  details: z.string(),
  affectedFiles: z.array(z.string()),
  recommendations: z.array(z.string()),
  linkedSprints: z.array(z.string()).optional(),
  rawContent: z.string().optional(),
});

export const DebtStatusSchema = z.enum([
  "open",
  "in-progress",
  "resolved",
  "deferred",
  "carry-over",
]);

export const DebtItemSchema = z.object({
  number: z.number(),
  item: z.string(),
  origin: z.string(),
  sprintTarget: z.string(),
  status: DebtStatusSchema,
  resolvedIn: z.string().optional(),
});

export const PhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  objective: z.string(),
  isEmergent: z.boolean(),
  tasks: z.array(TaskSchema),
});

export const DispositionActionSchema = z.enum([
  "incorporated",
  "deferred",
  "resolved",
  "n/a",
  "converted-to-phase",
]);

export const DispositionEntrySchema = z.object({
  number: z.number(),
  recommendation: z.string(),
  action: DispositionActionSchema,
  where: z.string(),
  justification: z.string(),
});

export const FindingsConsolidationEntrySchema = z.object({
  number: z.number(),
  finding: z.string(),
  originPhase: z.string(),
  impact: z.enum(["high", "medium", "low"]),
  actionTaken: z.string(),
});


export const SprintSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  status: SprintStatusSchema,
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  version: z.string().optional(),
  objective: z.string().optional(),
  sprintType: SprintTypeSchema.optional(),
  tasks: z.array(TaskSchema),
  sections: SprintMarkdownSectionsSchema.optional(),
  rawContent: z.string().optional(),
  // Sprint-forge structured data (optional — populated when parsed from sprint-forge files)
  source: z.string().optional(),
  previousSprint: z.string().optional(),
  phases: z.array(PhaseSchema).optional(),
  disposition: z.array(DispositionEntrySchema).optional(),
  debtItems: z.array(DebtItemSchema).optional(),
  findingsConsolidation: z.array(FindingsConsolidationEntrySchema).optional(),
  definitionOfDone: z.array(z.string()).optional(),
  carryOverCount: z.number().optional(),
  executionDate: z.string().optional(),
  executedBy: z.string().optional(),
  agents: z.array(z.string()).optional(),
  updatedAt: z.string().optional(),
  progress: z.number().optional(),
  previousDoc: z.string().optional(),
  nextDoc: z.string().optional(),
});

export const RoadmapSprintEntrySchema = z.object({
  number: z.number(),
  sprintId: z.string(),
  findingSource: z.string(),
  version: z.string(),
  type: SprintTypeSchema,
  focus: z.string(),
  dependencies: z.array(z.string()),
  status: z.string(),
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

// --- Project Registry (external directory pointers) ---

export const ProjectRegistryEntrySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  path: z.string().min(1),
  color: z.string().optional(),
  addedAt: z.string(),
  lastOpenedAt: z.string().optional(),
});

export const ProjectRegistrySchema = z.object({
  version: z.number(),
  projects: z.array(ProjectRegistryEntrySchema),
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

// Sprint-forge types
export type SprintType = z.infer<typeof SprintTypeSchema>;
export type FindingSeverity = z.infer<typeof FindingSeveritySchema>;
export type Finding = z.infer<typeof FindingSchema>;
export type DebtStatus = z.infer<typeof DebtStatusSchema>;
export type DebtItem = z.infer<typeof DebtItemSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
export type DispositionAction = z.infer<typeof DispositionActionSchema>;
export type DispositionEntry = z.infer<typeof DispositionEntrySchema>;
export type FindingsConsolidationEntry = z.infer<
  typeof FindingsConsolidationEntrySchema
>;
export type RoadmapSprintEntry = z.infer<typeof RoadmapSprintEntrySchema>;
export type ProjectRegistryEntry = z.infer<typeof ProjectRegistryEntrySchema>;
export type ProjectRegistry = z.infer<typeof ProjectRegistrySchema>;

// --- Activities Diagnostics ---

export type ActivityRetentionSource = "default" | "env" | "default_invalid_env";

export interface PruneMetrics {
  pruneEvents: number;
  prunedEntriesTotal: number;
  lastPrunedAt?: string;
}

export interface ActivitiesDiagnostics {
  retentionLimit: number;
  retentionSource: ActivityRetentionSource;
  retentionEnvKey: string;
  retentionRawValue?: string;
  pruneMetrics: PruneMetrics;
}

export interface ActivitiesListResult {
  activities: AgentActivity[];
  diagnostics: ActivitiesDiagnostics | null;
}

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
  " ": "pending",     // [ ] Pending
  "~": "in_progress", // [~] In Progress
  "x": "done",        // [x] Done
  "!": "blocked",     // [!] Blocked
  "-": "skipped",     // [-] Skipped
  ">": "carry_over",  // [>] Carry-over
};

export function symbolToStatus(symbol: string): TaskStatus {
  if (symbol in SYMBOL_TO_STATUS) {
    return SYMBOL_TO_STATUS[symbol as SprintTaskSymbol];
  }
  return "pending";
}

export const STATUS_TO_SYMBOL: Record<TaskStatus, SprintTaskSymbol> = {
  pending:      " ",
  in_progress:  "~",
  done:         "x",
  blocked:      "!",
  skipped:      "-",
  carry_over:   ">",
};
