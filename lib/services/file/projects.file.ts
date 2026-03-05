import type {
  ProjectsService,
  CreateProjectInput,
  UpdateProjectInput,
} from "../types";
import type { Project, Finding, RoadmapSprintEntry } from "@/lib/types";
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
}
