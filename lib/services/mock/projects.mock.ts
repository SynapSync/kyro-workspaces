import type {
  ProjectsService,
  CreateProjectInput,
  UpdateProjectInput,
  CreateSprintInput,
  UpdateSprintInput,
  CreateTaskInput,
  UpdateTaskInput,
  CreateDocumentInput,
  UpdateDocumentInput,
} from "../types";
import type { Project, Sprint, Task, TaskStatus, Document } from "@/lib/types";
import { mockProjects } from "@/lib/mock-data";

// Configurable artificial delay to simulate network latency in development.
// Set NEXT_PUBLIC_MOCK_DELAY_MS in .env.local to enable (default: 0).
const DELAY_MS =
  typeof process !== "undefined"
    ? Number(process.env.NEXT_PUBLIC_MOCK_DELAY_MS ?? 0)
    : 0;

const delay = (ms: number) =>
  ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve();

export class MockProjectsService implements ProjectsService {
  async list() {
    await delay(DELAY_MS);
    return mockProjects;
  }

  async getProject(_id: string): Promise<Project | null> {
    throw new Error("MockProjectsService: getProject not implemented");
  }

  async createProject(_data: CreateProjectInput): Promise<Project> {
    throw new Error("MockProjectsService: createProject not implemented");
  }

  async updateProject(_id: string, _updates: UpdateProjectInput): Promise<Project> {
    throw new Error("MockProjectsService: updateProject not implemented");
  }

  async deleteProject(_id: string): Promise<void> {
    throw new Error("MockProjectsService: deleteProject not implemented");
  }

  async createSprint(_projectId: string, _data: CreateSprintInput): Promise<Sprint> {
    throw new Error("MockProjectsService: createSprint not implemented");
  }

  async updateSprint(_projectId: string, _sprintId: string, _updates: UpdateSprintInput): Promise<Sprint> {
    throw new Error("MockProjectsService: updateSprint not implemented");
  }

  async deleteSprint(_projectId: string, _sprintId: string): Promise<void> {
    throw new Error("MockProjectsService: deleteSprint not implemented");
  }

  async createTask(_projectId: string, _sprintId: string, _data: CreateTaskInput): Promise<Task> {
    throw new Error("MockProjectsService: createTask not implemented");
  }

  async updateTask(_projectId: string, _sprintId: string, _taskId: string, _updates: UpdateTaskInput): Promise<Task> {
    throw new Error("MockProjectsService: updateTask not implemented");
  }

  async moveTask(_projectId: string, _sprintId: string, _taskId: string, _newStatus: TaskStatus): Promise<Task> {
    throw new Error("MockProjectsService: moveTask not implemented");
  }

  async deleteTask(_projectId: string, _sprintId: string, _taskId: string): Promise<void> {
    throw new Error("MockProjectsService: deleteTask not implemented");
  }

  async createDocument(_projectId: string, _data: CreateDocumentInput): Promise<Document> {
    throw new Error("MockProjectsService: createDocument not implemented");
  }

  async updateDocument(_projectId: string, _docId: string, _updates: UpdateDocumentInput): Promise<Document> {
    throw new Error("MockProjectsService: updateDocument not implemented");
  }

  async deleteDocument(_projectId: string, _docId: string): Promise<void> {
    throw new Error("MockProjectsService: deleteDocument not implemented");
  }
}
