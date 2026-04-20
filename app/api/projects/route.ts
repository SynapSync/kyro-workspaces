import * as fs from "fs/promises";
import { NextRequest } from "next/server";
import {
  getWorkspacePath,
  getRegistryPath,
  resolveProjectPath,
  fileExists,
  WorkspaceError,
  ok,
  handleError,
  validateBody,
} from "@/lib/api";
import { parseProjectReadme } from "@/lib/file-format/parsers";
import { loadSprintsFromDir } from "@/lib/api/load-sprints";
import { slugFromPath } from "@/lib/utils";
import {
  listProjects,
  addProject,
  validateSprintForgeDirectory,
} from "@/lib/file-format/registry";

export async function GET() {
  try {
    const workspacePath = getWorkspacePath();
    const registryPath = getRegistryPath(workspacePath);

    const entries = await listProjects(registryPath);
    const projects = [];

    for (const entry of entries) {
      const readmePath = resolveProjectPath(entry.path, "README.md");
      const readmeExists = await fileExists(readmePath);

      if (!readmeExists) {
        // Project dir may have been moved/deleted — include basic info from registry
        projects.push({
          id: entry.id,
          name: entry.name,
          description: "",
          readme: "",
          documents: [],
          sprints: [],
          createdAt: entry.addedAt,
          updatedAt: entry.addedAt,
          _registryPath: entry.path,
          _available: false,
        });
        continue;
      }

      const content = await fs.readFile(readmePath, "utf-8");
      const project = parseProjectReadme(content, entry.id);
      const sprints = await loadSprintsFromDir(entry.path);
      projects.push({
        ...project,
        documents: [],
        sprints,
        color: entry.color,
        _registryPath: entry.path,
        _available: true,
      });
    }

    return ok({ projects }, 200);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const workspacePath = getWorkspacePath();
    const registryPath = getRegistryPath(workspacePath);
    const body = await req.json();
    validateBody<{ path: string; name?: string; color?: string }>(body, ["path"]);

    // Validate the sprint-forge directory
    const validation = await validateSprintForgeDirectory(body.path);
    if (!validation.valid) {
      throw new WorkspaceError(
        "INVALID_FORMAT",
        `Invalid sprint-forge directory: ${validation.error}`
      );
    }

    // Use resolved path (may differ from input if parent dir auto-resolved)
    const projectPath = validation.resolvedPath ?? body.path;

    // Generate ID from path basename
    const id = slugFromPath(projectPath);
    const dirName = projectPath.split("/").filter(Boolean).pop() ?? "project";

    const now = new Date().toISOString();
    const entry = {
      id,
      name: body.name ?? validation.name ?? dirName,
      path: projectPath,
      color: body.color,
      addedAt: now,
    };

    await addProject(registryPath, entry);

    return ok({ project: entry }, 201);
  } catch (err) {
    return handleError(err);
  }
}
