import * as fs from "fs/promises";
import * as path from "path";
import { NextRequest } from "next/server";
import {
  getWorkspacePath,
  resolveAndGuard,
  fileExists,
  WorkspaceError,
  ok,
  notFound,
  handleError,
  validateBody,
} from "@/lib/api";
import {
  parseProjectReadme,
} from "@/lib/file-format/parsers";
import {
  serializeProjectReadme,
} from "@/lib/file-format/serializers";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const workspacePath = getWorkspacePath();
    const projectDir = resolveAndGuard(workspacePath, "projects", projectId);

    const readmePath = resolveAndGuard(projectDir, "README.md");
    const readmeExists = await fileExists(readmePath);

    if (!readmeExists) {
      return notFound("Project not found");
    }

    const content = await fs.readFile(readmePath, "utf-8");
    const project = parseProjectReadme(content, projectId);

    return ok({ project }, 200);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const workspacePath = getWorkspacePath();
    const projectDir = resolveAndGuard(workspacePath, "projects", projectId);

    const readmePath = resolveAndGuard(projectDir, "README.md");
    const readmeExists = await fileExists(readmePath);

    if (!readmeExists) {
      return notFound("Project not found");
    }

    const body = await req.json();
    validateBody<{ name?: string }>(body, []);
    const existingContent = await fs.readFile(readmePath, "utf-8");
    const existing = parseProjectReadme(existingContent, projectId);

    const updated = {
      ...existing,
      name: body.name ?? existing.name,
      description: body.description ?? existing.description,
      readme: body.readme ?? existing.readme,
      updatedAt: new Date().toISOString(),
    };

    const newContent = serializeProjectReadme(updated);
    await fs.writeFile(readmePath, newContent, "utf-8");

    return ok({ project: updated }, 200);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const workspacePath = getWorkspacePath();
    const projectDir = resolveAndGuard(workspacePath, "projects", projectId);

    const dirExists = await fileExists(projectDir);

    if (!dirExists) {
      return notFound("Project not found");
    }

    await fs.rm(projectDir, { recursive: true });

    return ok({ deleted: true }, 200);
  } catch (err) {
    return handleError(err);
  }
}
