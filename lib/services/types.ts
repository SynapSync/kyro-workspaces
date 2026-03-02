import type {
  Project,
  Sprint,
  Task,
  TaskStatus,
  Document,
  TeamMember,
  AgentActivity,
} from "@/lib/types";

// --- Input Types ---

export interface CreateProjectInput {
  id: string;
  name: string;
  description?: string;
  readme?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  readme?: string;
}

export interface CreateSprintInput {
  id: string;
  name: string;
  objective?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  version?: string;
}

export interface UpdateSprintInput {
  name?: string;
  objective?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  version?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: string;
  assignee?: string;
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: string;
  assignee?: string;
  tags?: string[];
}

export interface CreateDocumentInput {
  title: string;
  content?: string;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: string;
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

// --- Service Interfaces ---
// These contracts must be implemented by both mock and real (file) services.
// All methods are async to ensure file implementations can be swapped in without
// changing the store or components.

export interface ProjectsService {
  list(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(data: CreateProjectInput): Promise<Project>;
  updateProject(id: string, updates: UpdateProjectInput): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  createSprint(projectId: string, data: CreateSprintInput): Promise<Sprint>;
  updateSprint(projectId: string, sprintId: string, updates: UpdateSprintInput): Promise<Sprint>;
  deleteSprint(projectId: string, sprintId: string): Promise<void>;

  createTask(projectId: string, sprintId: string, data: CreateTaskInput): Promise<Task>;
  updateTask(projectId: string, sprintId: string, taskId: string, updates: UpdateTaskInput): Promise<Task>;
  moveTask(projectId: string, sprintId: string, taskId: string, newStatus: TaskStatus): Promise<Task>;
  deleteTask(projectId: string, sprintId: string, taskId: string): Promise<void>;

  createDocument(projectId: string, data: CreateDocumentInput): Promise<Document>;
  updateDocument(projectId: string, docId: string, updates: UpdateDocumentInput): Promise<Document>;
  deleteDocument(projectId: string, docId: string): Promise<void>;
}

export interface MembersService {
  list(): Promise<TeamMember[]>;
  createMember(data: CreateMemberInput): Promise<TeamMember>;
  updateMember(id: string, updates: UpdateMemberInput): Promise<TeamMember>;
  deleteMember(id: string): Promise<void>;
}

export interface ActivitiesService {
  list(): Promise<AgentActivity[]>;
}

// Registry type used by the service factory
export interface AppServices {
  projects: ProjectsService;
  members: MembersService;
  activities: ActivitiesService;
}
