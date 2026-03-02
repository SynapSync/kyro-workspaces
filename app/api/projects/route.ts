import * as fs from "fs/promises";
import * as path from "path";
import { NextRequest } from "next/server";
import {
  getWorkspacePath,
  resolveAndGuard,
  fileExists,
  WorkspaceError,
  ok,
  handleError,
  validateBody,
} from "@/lib/api";
import {
  parseProjectReadme,
} from "@/lib/file-format/parsers";
import {
  serializeProjectReadme,
} from "@/lib/file-format/serializers";

export async function GET(req: NextRequest) {
  try {
    const workspacePath = getWorkspacePath();
    const projectsDir = resolveAndGuard(workspacePath, "projects");

    const dirExists = await fileExists(projectsDir);
    if (!dirExists) {
      return ok({ projects: [] }, 200);
    }

    const entries = await fs.readdir(projectsDir, { withFileTypes: true });
    const projects = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const readmePath = resolveAndGuard(projectsDir, entry.name, "README.md");
      const readmeExists = await fileExists(readmePath);

      if (!readmeExists) continue;

      const content = await fs.readFile(readmePath, "utf-8");
      const project = parseProjectReadme(content, entry.name);
      projects.push(project);
    }

    return ok({ projects }, 200);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const workspacePath = getWorkspacePath();
    const body = await req.json();
    validateBody<{ id: string; name?: string }>(body, ["id"]);

    if (body.id.includes("/") || body.id.includes("..")) {
      throw new WorkspaceError(
        "PERMISSION_DENIED",
        "Project ID cannot contain '/' or '..'"
      );
    }

    const projectsDir = resolveAndGuard(workspacePath, "projects");
    const projectDir = resolveAndGuard(projectsDir, body.id);

    const dirExists = await fileExists(projectDir);
    if (dirExists) {
      throw new WorkspaceError("ALREADY_EXISTS", "Project already exists");
    }

    await fs.mkdir(projectDir, { recursive: true });

    const now = new Date().toISOString();
    const readmeContent = serializeProjectReadme({
      id: body.id,
      name: body.name ?? body.id,
      description: body.description ?? "",
      readme: body.readme ?? "",
      createdAt: now,
      updatedAt: now,
    });

    const readmePath = resolveAndGuard(projectDir, "README.md");
    await fs.writeFile(readmePath, readmeContent, "utf-8");

    return ok({ project: { id: body.id, name: body.name ?? body.id } }, 201);
  } catch (err) {
    return handleError(err);
  }
}
