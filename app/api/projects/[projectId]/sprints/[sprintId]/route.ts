import * as fs from "fs/promises";
import { NextRequest } from "next/server";
import {
  getWorkspacePath,
  ok,
  handleError,
  validateBody,
} from "@/lib/api";
import { resolveSprintFilePath } from "@/lib/api/sprint-files";
import {
  parseSprintFile,
} from "@/lib/file-format/parsers";
import {
  serializeSprintFile,
} from "@/lib/file-format/serializers";
import { syncProjectReentryPrompts } from "@/lib/file-format/templates";

interface RouteParams {
  params: Promise<{ projectId: string; sprintId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, sprintId } = await params;
    const workspacePath = getWorkspacePath();
    const filePath = await resolveSprintFilePath(workspacePath, projectId, sprintId);

    const content = await fs.readFile(filePath, "utf-8");
    const sprint = parseSprintFile(content);

    return ok({ sprint }, 200);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, sprintId } = await params;
    const workspacePath = getWorkspacePath();
    const filePath = await resolveSprintFilePath(workspacePath, projectId, sprintId);

    await fs.unlink(filePath);
    await syncProjectReentryPrompts(workspacePath, projectId);
    return ok({ deleted: true }, 200);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, sprintId } = await params;
    const workspacePath = getWorkspacePath();
    const filePath = await resolveSprintFilePath(workspacePath, projectId, sprintId);

    const body = await req.json();
    validateBody<{ status?: string }>(body, []);
    const existingContent = await fs.readFile(filePath, "utf-8");
    const existing = parseSprintFile(existingContent);

    const updated = {
      ...existing,
      name: body.name ?? existing.name,
      status: body.status ?? existing.status,
      objective: body.objective ?? existing.objective,
      startDate: body.startDate ?? existing.startDate,
      endDate: body.endDate ?? existing.endDate,
      version: body.version ?? existing.version,
      tasks: body.tasks ?? existing.tasks,
    };

    const newContent = serializeSprintFile(updated);
    await fs.writeFile(filePath, newContent, "utf-8");
    await syncProjectReentryPrompts(workspacePath, projectId);

    return ok({ sprint: updated }, 200);
  } catch (err) {
    return handleError(err);
  }
}
