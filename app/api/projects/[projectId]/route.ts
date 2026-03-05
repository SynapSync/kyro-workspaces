import * as fs from "fs/promises";
import { NextRequest } from "next/server";
import {
  getWorkspacePath,
  getRegistryPath,
  resolveProjectRoot,
  resolveProjectPath,
  fileExists,
  ok,
  notFound,
  handleError,
  validateBody,
} from "@/lib/api";
import { parseProjectReadme } from "@/lib/file-format/parsers";
import { loadSprintsFromDir } from "@/lib/api/load-sprints";
import {
  getProject as getProjectEntry,
  removeProject,
  updateProject,
  updateLastOpened,
} from "@/lib/file-format/registry";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const workspacePath = getWorkspacePath();
    const projectRoot = await resolveProjectRoot(workspacePath, projectId);
    const registryPath = getRegistryPath(workspacePath);

    const readmePath = resolveProjectPath(projectRoot, "README.md");
    const readmeExists = await fileExists(readmePath);

    if (!readmeExists) {
      return notFound("Project README not found at registered path");
    }

    const content = await fs.readFile(readmePath, "utf-8");
    const project = parseProjectReadme(content, projectId);
    const entry = await getProjectEntry(registryPath, projectId);
    const sprints = await loadSprintsFromDir(projectRoot);

    // Update last opened timestamp
    await updateLastOpened(registryPath, projectId);

    return ok({
      project: {
        ...project,
        documents: [],
        sprints,
        color: entry?.color,
      },
    }, 200);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const workspacePath = getWorkspacePath();
    const registryPath = getRegistryPath(workspacePath);

    const body = await req.json();
    validateBody<{ name?: string; color?: string }>(body, []);

    const updated = await updateProject(registryPath, projectId, {
      name: body.name,
      color: body.color,
    });

    if (!updated) {
      return notFound("Project not found in registry");
    }

    return ok({ project: updated }, 200);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const workspacePath = getWorkspacePath();
    const registryPath = getRegistryPath(workspacePath);

    const removed = await removeProject(registryPath, projectId);
    if (!removed) {
      return notFound("Project not found in registry");
    }

    return ok({ deleted: true }, 200);
  } catch (err) {
    return handleError(err);
  }
}
