import * as fs from "fs/promises";
import { NextRequest } from "next/server";
import {
  getWorkspacePath,
  ok,
  notFound,
  handleError,
} from "@/lib/api";
import { resolveSprintFilePath } from "@/lib/api/sprint-files";
import {
  parseSprintFile,
} from "@/lib/file-format/parsers";
import {
  serializeSprintFile,
} from "@/lib/file-format/serializers";

interface RouteParams {
  params: Promise<{ projectId: string; sprintId: string; taskId: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, sprintId, taskId } = await params;
    const workspacePath = getWorkspacePath();
    const filePath = await resolveSprintFilePath(workspacePath, projectId, sprintId);

    const body = await req.json();
    const content = await fs.readFile(filePath, "utf-8");
    const sprint = parseSprintFile(content);

    const taskIndex = sprint.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return notFound("Task not found");
    }

    const existingTask = sprint.tasks[taskIndex];
    sprint.tasks[taskIndex] = {
      ...existingTask,
      title: body.title ?? existingTask.title,
      description: body.description ?? existingTask.description,
      priority: body.priority ?? existingTask.priority,
      status: body.status ?? existingTask.status,
      assignee: body.assigneeId ?? existingTask.assignee,
      tags: body.tags ?? existingTask.tags,
      updatedAt: new Date().toISOString(),
    };

    const newContent = serializeSprintFile(sprint);
    await fs.writeFile(filePath, newContent, "utf-8");

    return ok({ task: sprint.tasks[taskIndex] }, 200);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, sprintId, taskId } = await params;
    const workspacePath = getWorkspacePath();
    const filePath = await resolveSprintFilePath(workspacePath, projectId, sprintId);

    const content = await fs.readFile(filePath, "utf-8");
    const sprint = parseSprintFile(content);

    const taskIndex = sprint.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return notFound("Task not found");
    }

    sprint.tasks.splice(taskIndex, 1);

    const newContent = serializeSprintFile(sprint);
    await fs.writeFile(filePath, newContent, "utf-8");

    return ok({ deleted: true }, 200);
  } catch (err) {
    return handleError(err);
  }
}
