import type {
  ProjectsService,
  CreateProjectInput,
  UpdateProjectInput,
} from "../types";
import type { Project, Task, TaskStatus, Finding, RoadmapSprintEntry, GraphData } from "@/lib/types";
import { localFetch } from "./fetch";

export class FileProjectsService implements ProjectsService {
  async list(): Promise<Project[]> {
    const { projects } = await localFetch<{ projects: Project[] }>("/api/projects");
    return projects;
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

  async getFindings(projectId: string): Promise<Finding[]> {
    const { findings } = await localFetch<{ findings: Finding[] }>(
      `/api/projects/${projectId}/findings`
    );
    return findings;
  }

  async getRoadmap(projectId: string): Promise<{ raw: string; sprints: RoadmapSprintEntry[] }> {
    const { roadmap } = await localFetch<{
      roadmap: { raw: string; sprints: RoadmapSprintEntry[] };
    }>(`/api/projects/${projectId}/roadmap`);
    return roadmap;
  }

  async getReentryPrompts(projectId: string): Promise<string> {
    const { content } = await localFetch<{ content: string }>(
      `/api/projects/${projectId}/reentry-prompts`
    );
    return content;
  }

  async updateTaskStatus(
    projectId: string,
    sprintId: string,
    taskId: string,
    status: TaskStatus
  ): Promise<Task> {
    // Git safety net: auto-commit before mutation
    try {
      await localFetch("/api/workspace/git/commit", {
        method: "POST",
        body: JSON.stringify({ message: `kyro: auto-save before task status update [${taskId}]` }),
      });
    } catch {
      // Nothing to commit or git not initialized — proceed anyway
    }

    const { task } = await localFetch<{ task: Task }>(
      `/api/projects/${projectId}/sprints/${sprintId}/tasks/${taskId}`,
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      }
    );
    return task;
  }

  async updateTask(
    projectId: string,
    sprintId: string,
    taskId: string,
    updates: { title?: string; status?: TaskStatus }
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

  async getGraph(projectId: string): Promise<GraphData> {
    const { graph } = await localFetch<{ graph: GraphData }>(
      `/api/projects/${projectId}/graph`
    );
    return graph;
  }
}
