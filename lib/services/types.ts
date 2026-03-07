import type {
  Project,
  Task,
  TaskStatus,
  Finding,
  RoadmapSprintEntry,
  TeamMember,
  AgentActionType,
  AgentActivity,
  ActivitiesListResult,
} from "@/lib/types";

// --- Input Types ---

export interface CreateProjectInput {
  path: string;
  name?: string;
  color?: string;
}

export interface UpdateProjectInput {
  name?: string;
  color?: string;
}

export interface CreateMemberInput {
  name: string;
  avatar?: string;
  color?: string;
}

export interface UpdateMemberInput {
  name?: string;
  avatar?: string;
  color?: string;
}

export interface CreateActivityInput {
  projectId: string;
  actionType: AgentActionType;
  description: string;
  metadata?: Record<string, string>;
}

// --- Service Interfaces ---
// These contracts must be implemented by both mock and real (file) services.
// Sprint-forge directories are read-only — no write methods for sprints, tasks, or documents.

export interface ProjectsService {
  list(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(data: CreateProjectInput): Promise<Project>;
  updateProject(id: string, updates: UpdateProjectInput): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  getFindings(projectId: string): Promise<Finding[]>;
  getRoadmap(projectId: string): Promise<{ raw: string; sprints: RoadmapSprintEntry[] }>;
  getReentryPrompts(projectId: string): Promise<string>;

  // Write operations
  updateTaskStatus(projectId: string, sprintId: string, taskId: string, status: TaskStatus): Promise<Task>;
}

export interface MembersService {
  list(): Promise<TeamMember[]>;
  createMember(data: CreateMemberInput): Promise<TeamMember>;
  updateMember(id: string, updates: UpdateMemberInput): Promise<TeamMember>;
  deleteMember(id: string): Promise<void>;
}

export interface ActivitiesService {
  list(): Promise<ActivitiesListResult>;
  createActivity(data: CreateActivityInput): Promise<AgentActivity>;
}

// Registry type used by the service factory
export interface AppServices {
  projects: ProjectsService;
  members: MembersService;
  activities: ActivitiesService;
}
