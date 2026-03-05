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
import type { Project, Sprint, Task, Document, TaskStatus } from "@/lib/types";
import { localFetch } from "./fetch";

export class FileProjectsService implements ProjectsService {
  async list(): Promise<Project[]> {
    const { projects } = await localFetch<{ projects: Project[] }>("/api/projects");

    return Promise.all(
      projects.map(async (project) => {
        const [{ sprints }, { documents }] = await Promise.all([
          localFetch<{ sprints: Sprint[] }>(`/api/projects/${project.id}/sprints`),
          localFetch<{ documents: Document[] }>(`/api/projects/${project.id}/documents`),
        ]);
        return { ...project, sprints, documents };
      })
    );
  }

  async getProject(id: string): Promise<Project | null> {
    try {
      const { project } = await localFetch<{ project: Project }>(`/api/projects/${id}`);
      return project;
    } catch {
      return null;
    }
  }

  async createProject(data: CreateProjectInput): Promise<Project> {
    const { project } = await localFetch<{ project: Project }>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return project;
  }

  async updateProject(id: string, updates: UpdateProjectInput): Promise<Project> {
    const { project } = await localFetch<{ project: Project }>(`/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await localFetch(`/api/projects/${id}`, { method: "DELETE" });
  }

  async createSprint(projectId: string, data: CreateSprintInput): Promise<Sprint> {
    const { sprint } = await localFetch<{ sprint: Sprint }>(
      `/api/projects/${projectId}/sprints`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return sprint;
  }

  async updateSprint(
    projectId: string,
    sprintId: string,
    updates: UpdateSprintInput
  ): Promise<Sprint> {
    const { sprint } = await localFetch<{ sprint: Sprint }>(
      `/api/projects/${projectId}/sprints/${sprintId}`,
      {
        method: "PUT",
        body: JSON.stringify(updates),
      }
    );
    return sprint;
  }

  async deleteSprint(projectId: string, sprintId: string): Promise<void> {
    await localFetch(`/api/projects/${projectId}/sprints/${sprintId}`, {
      method: "DELETE",
    });
  }

  async createTask(
    projectId: string,
    sprintId: string,
    data: CreateTaskInput
  ): Promise<Task> {
    const { task } = await localFetch<{ task: Task }>(
      `/api/projects/${projectId}/sprints/${sprintId}/tasks`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return task;
  }

  async updateTask(
    projectId: string,
    sprintId: string,
    taskId: string,
    updates: UpdateTaskInput
  ): Promise<Task> {
    const { task } = await localFetch<{ task: Task }>(
      `/api/projects/${projectId}/sprints/${sprintId}/tasks/${taskId}`,
      {
        method: "PUT",
        body: JSON.stringify(updates),
      }
    );
    return task;
  }

  async moveTask(
    projectId: string,
    sprintId: string,
    taskId: string,
    newStatus: TaskStatus
  ): Promise<Task> {
    return this.updateTask(projectId, sprintId, taskId, { status: newStatus });
  }

  async deleteTask(projectId: string, sprintId: string, taskId: string): Promise<void> {
    await localFetch(
      `/api/projects/${projectId}/sprints/${sprintId}/tasks/${taskId}`,
      { method: "DELETE" }
    );
  }

  async createDocument(
    projectId: string,
    data: CreateDocumentInput
  ): Promise<Document> {
    const { document } = await localFetch<{ document: Document }>(
      `/api/projects/${projectId}/documents`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return document;
  }

  async updateDocument(
    projectId: string,
    docId: string,
    updates: UpdateDocumentInput
  ): Promise<Document> {
    const { document } = await localFetch<{ document: Document }>(
      `/api/projects/${projectId}/documents/${docId}`,
      {
        method: "PUT",
        body: JSON.stringify(updates),
      }
    );
    return document;
  }

  async deleteDocument(projectId: string, docId: string): Promise<void> {
    await localFetch(`/api/projects/${projectId}/documents/${docId}`, {
      method: "DELETE",
    });
  }
}
