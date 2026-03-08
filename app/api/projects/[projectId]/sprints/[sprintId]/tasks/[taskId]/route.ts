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
  updateTaskStatus as astUpdateTaskStatus,
  deleteTask as astDeleteTask,
} from "@/lib/file-format/ast-writer";


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
    const newStatus = body.status ?? existingTask.status;

    // AST-based patch: locates task via AST, replaces only the checkbox character
    if (body.status && body.status !== existingTask.status) {
      const patched = astUpdateTaskStatus(content, existingTask.title, newStatus);
      await fs.writeFile(filePath, patched, "utf-8");
    }

    const updatedTask = {
      ...existingTask,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    return ok({ task: updatedTask }, 200);
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

    // AST-based delete: locates task via AST, removes the line range
    const task = sprint.tasks[taskIndex];
    const patched = astDeleteTask(content, task.title);
    await fs.writeFile(filePath, patched, "utf-8");

    return ok({ deleted: true }, 200);
  } catch (err) {
    return handleError(err);
  }
}
