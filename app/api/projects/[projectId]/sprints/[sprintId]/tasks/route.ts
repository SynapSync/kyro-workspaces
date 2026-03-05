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
import type { Task } from "@/lib/types";

interface RouteParams {
  params: Promise<{ projectId: string; sprintId: string }>;
}

function generateTaskId(): string {
  return `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, sprintId } = await params;
    const workspacePath = getWorkspacePath();
    const filePath = await resolveSprintFilePath(workspacePath, projectId, sprintId);

    const content = await fs.readFile(filePath, "utf-8");
    const sprint = parseSprintFile(content);

    return ok({ tasks: sprint.tasks }, 200);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, sprintId } = await params;
    const workspacePath = getWorkspacePath();
    const filePath = await resolveSprintFilePath(workspacePath, projectId, sprintId);

    const body = await req.json();
    validateBody<{ title: string }>(body, ["title"]);
    const content = await fs.readFile(filePath, "utf-8");
    const sprint = parseSprintFile(content);

    const newTask: Task = {
      id: generateTaskId(),
      title: body.title ?? "New Task",
      description: body.description,
      priority: body.priority ?? "medium",
      status: body.status ?? "todo",
      assignee: body.assigneeId,
      tags: body.tags ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    sprint.tasks.push(newTask);

    const newContent = serializeSprintFile(sprint);
    await fs.writeFile(filePath, newContent, "utf-8");

    return ok({ task: newTask }, 201);
  } catch (err) {
    return handleError(err);
  }
}
