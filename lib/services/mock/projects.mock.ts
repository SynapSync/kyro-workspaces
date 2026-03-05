import type {
  ProjectsService,
  CreateProjectInput,
  UpdateProjectInput,
} from "../types";
import type { Project, Finding, RoadmapSprintEntry } from "@/lib/types";
import { mockProjects, mockFindings, mockRoadmapSprints } from "@/lib/mock-data";

// Configurable artificial delay to simulate network latency in development.
// Set NEXT_PUBLIC_MOCK_DELAY_MS in .env.local to enable (default: 0).
const DELAY_MS =
  typeof process !== "undefined"
    ? Number(process.env.NEXT_PUBLIC_MOCK_DELAY_MS ?? 0)
    : 0;

const delay = (ms: number) =>
  ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve();

export class MockProjectsService implements ProjectsService {
  private projects = [...mockProjects];

  async list(): Promise<Project[]> {
    await delay(DELAY_MS);
    return this.projects;
  }

  async getProject(id: string): Promise<Project | null> {
    await delay(DELAY_MS);
    return this.projects.find((p) => p.id === id) ?? null;
  }

  async createProject(data: CreateProjectInput): Promise<Project> {
    await delay(DELAY_MS);
    const now = new Date().toISOString();
    const dirName = data.path.split("/").filter(Boolean).pop() ?? "project";
    const id = dirName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const project: Project = {
      id,
      name: data.name ?? dirName,
      description: "",
      color: data.color,
      readme: "",
      documents: [],
      sprints: [],
      createdAt: now,
      updatedAt: now,
    };
    this.projects.push(project);
    return project;
  }

  async updateProject(id: string, updates: UpdateProjectInput): Promise<Project> {
    await delay(DELAY_MS);
    const project = this.projects.find((p) => p.id === id);
    if (!project) throw new Error(`Project ${id} not found`);
    if (updates.name !== undefined) project.name = updates.name;
    if (updates.color !== undefined) project.color = updates.color;
    project.updatedAt = new Date().toISOString();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await delay(DELAY_MS);
    this.projects = this.projects.filter((p) => p.id !== id);
  }

  async getFindings(projectId: string): Promise<Finding[]> {
    await delay(DELAY_MS);
    return mockFindings[projectId] ?? [];
  }

  async getRoadmap(projectId: string): Promise<{ raw: string; sprints: RoadmapSprintEntry[] }> {
    await delay(DELAY_MS);
    return mockRoadmapSprints[projectId] ?? { raw: "", sprints: [] };
  }
}
