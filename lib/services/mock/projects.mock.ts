import type {
  ProjectsService,
  CreateProjectInput,
  UpdateProjectInput,
} from "../types";
import type { Project, Task, TaskStatus, Finding, RoadmapSprintEntry, GraphData, GraphNode, GraphEdge } from "@/lib/types";
import { mockProjects, mockFindings, mockRoadmapSprints, mockReentryPrompts } from "@/lib/mock-data";
import { mockDelay } from "./delay";
import { slugFromPath } from "@/lib/utils";

export class MockProjectsService implements ProjectsService {
  private projects = [...mockProjects];

  async list(): Promise<Project[]> {
    await mockDelay();
    return this.projects;
  }

  async getProject(id: string): Promise<Project | null> {
    await mockDelay();
    return this.projects.find((p) => p.id === id) ?? null;
  }

  async createProject(data: CreateProjectInput): Promise<Project> {
    await mockDelay();
    const now = new Date().toISOString();
    const id = slugFromPath(data.path);
    const project: Project = {
      id,
      name: data.name ?? data.path.split("/").filter(Boolean).pop() ?? "project",
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
    await mockDelay();
    const project = this.projects.find((p) => p.id === id);
    if (!project) throw new Error(`Project ${id} not found`);
    if (updates.name !== undefined) project.name = updates.name;
    if (updates.color !== undefined) project.color = updates.color;
    project.updatedAt = new Date().toISOString();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await mockDelay();
    this.projects = this.projects.filter((p) => p.id !== id);
  }

  async getFindings(projectId: string): Promise<Finding[]> {
    await mockDelay();
    return mockFindings[projectId] ?? [];
  }

  async getRoadmap(projectId: string): Promise<{ raw: string; sprints: RoadmapSprintEntry[] }> {
    await mockDelay();
    return mockRoadmapSprints[projectId] ?? { raw: "", sprints: [] };
  }

  async getReentryPrompts(projectId: string): Promise<string> {
    await mockDelay();
    return mockReentryPrompts[projectId] ?? "";
  }

  async updateTaskStatus(
    projectId: string,
    sprintId: string,
    taskId: string,
    status: TaskStatus
  ): Promise<Task> {
    await mockDelay();
    const project = this.projects.find((p) => p.id === projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const sprint = project.sprints.find((s) => s.id === sprintId);
    if (!sprint) throw new Error(`Sprint ${sprintId} not found`);

    const task = sprint.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.status = status;
    task.updatedAt = new Date().toISOString();
    return task;
  }

  async updateTask(
    projectId: string,
    sprintId: string,
    taskId: string,
    updates: { title?: string; status?: TaskStatus }
  ): Promise<Task> {
    await mockDelay();
    const project = this.projects.find((p) => p.id === projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);
    const sprint = project.sprints.find((s) => s.id === sprintId);
    if (!sprint) throw new Error(`Sprint ${sprintId} not found`);
    const task = sprint.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    if (updates.title) task.title = updates.title;
    if (updates.status) task.status = updates.status;
    task.updatedAt = new Date().toISOString();
    return task;
  }

  async getGraph(projectId: string): Promise<GraphData> {
    await mockDelay();
    const project = this.projects.find((p) => p.id === projectId);
    const pName = project?.name ?? projectId;

    // Generate mock graph from project sprints and structure
    const nodes: GraphNode[] = [
      { id: "readme", label: "README", filePath: "README.md", fileType: "readme", tags: [projectId] },
      { id: "roadmap", label: "ROADMAP", filePath: "ROADMAP.md", fileType: "roadmap", tags: [projectId, "plan"] },
    ];

    const edges: GraphEdge[] = [
      { id: "e-1", source: "readme", target: "roadmap", edgeType: "wiki-link", label: "ROADMAP", weight: 1.0 },
    ];

    // Add sprint nodes
    if (project) {
      for (const sprint of project.sprints) {
        nodes.push({
          id: sprint.id,
          label: sprint.name,
          filePath: `sprint-forge/${sprint.id}.md`,
          fileType: "sprint",
          tags: [projectId, "sprint"],
        });
        edges.push({
          id: `e-${sprint.id}-roadmap`,
          source: sprint.id,
          target: "roadmap",
          edgeType: "frontmatter-ref",
          label: "ROADMAP",
          weight: 0.8,
        });
      }
    }

    return {
      nodes,
      edges,
      clusters: [
        { id: "cluster-sprint", label: "Sprints", nodeIds: nodes.filter((n) => n.fileType === "sprint").map((n) => n.id), clusterType: "type" as const },
      ],
      metadata: {
        projectId,
        projectName: pName,
        buildTimestamp: new Date().toISOString(),
        nodeCount: nodes.length,
        edgeCount: edges.length,
      },
    };
  }
}
