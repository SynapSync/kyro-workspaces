import * as fs from "fs/promises";
import {
  getWorkspacePath,
  getRegistryPath,
  resolveProjectPath,
  resolveProjectRoot,
  fileExists,
} from "@/lib/api/workspace-guard";
import { parseProjectReadme } from "@/lib/file-format/parsers";
import { loadSprintsFromDir } from "@/lib/api/load-sprints";
import { listProjects } from "@/lib/file-format/registry";
import type { Project, Sprint } from "@/lib/types";

export type ServerProject = Pick<
  Project,
  "id" | "name" | "description" | "readme" | "createdAt" | "updatedAt"
> & {
  sprints: Sprint[];
  color?: string;
};

/**
 * Load a single project from the filesystem by ID.
 * Intended for Server Component data fetching — bypasses API routes.
 * Returns null if the project is not found.
 */
export async function loadProject(
  projectId: string
): Promise<ServerProject | null> {
  try {
    const workspacePath = getWorkspacePath();
    const projectRoot = await resolveProjectRoot(workspacePath, projectId);

    const readmePath = resolveProjectPath(projectRoot, "README.md");
    if (!(await fileExists(readmePath))) {
      return null;
    }

    const content = await fs.readFile(readmePath, "utf-8");
    const project = parseProjectReadme(content, projectId);
    const sprints = await loadSprintsFromDir(projectRoot);

    return { ...project, sprints };
  } catch {
    return null;
  }
}

/**
 * Load all projects from the workspace registry.
 * Intended for Server Component data fetching at the workspace level.
 */
export async function loadAllProjects(): Promise<ServerProject[]> {
  try {
    const workspacePath = getWorkspacePath();
    const registryPath = getRegistryPath(workspacePath);
    const entries = await listProjects(registryPath);

    const projects: ServerProject[] = [];

    for (const entry of entries) {
      const readmePath = resolveProjectPath(entry.path, "README.md");
      if (!(await fileExists(readmePath))) {
        continue;
      }

      const content = await fs.readFile(readmePath, "utf-8");
      const project = parseProjectReadme(content, entry.id);
      const sprints = await loadSprintsFromDir(entry.path);

      projects.push({ ...project, sprints, color: entry.color });
    }

    return projects;
  } catch {
    return [];
  }
}
