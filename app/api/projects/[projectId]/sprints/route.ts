import * as fs from "fs/promises";
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
  parseSprintFile,
} from "@/lib/file-format/parsers";
import {
  serializeSprintFile,
} from "@/lib/file-format/serializers";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const workspacePath = getWorkspacePath();
    const sprintsDir = resolveAndGuard(workspacePath, "projects", projectId, "sprints");

    const dirExists = await fileExists(sprintsDir);
    if (!dirExists) {
      return ok({ sprints: [] }, 200);
    }

    const entries = await fs.readdir(sprintsDir, { withFileTypes: true });
    const sprints = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;

      const filePath = resolveAndGuard(sprintsDir, entry.name);
      const content = await fs.readFile(filePath, "utf-8");
      const sprint = parseSprintFile(content);
      sprints.push(sprint);
    }

    return ok({ sprints }, 200);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const workspacePath = getWorkspacePath();
    const body = await req.json();
    validateBody<{ id: string; name: string }>(body, ["id", "name"]);

    if (body.id.includes("/") || body.id.includes("..")) {
      throw new WorkspaceError(
        "PERMISSION_DENIED",
        "Sprint ID cannot contain '/' or '..'"
      );
    }

    const sprintsDir = resolveAndGuard(workspacePath, "projects", projectId, "sprints");
    await fs.mkdir(sprintsDir, { recursive: true });

    const now = new Date().toISOString();
    const sprint = {
      id: body.id,
      name: body.name ?? body.id,
      status: body.status ?? "planned",
      objective: body.objective ?? "",
      tasks: [],
      startDate: body.startDate,
      endDate: body.endDate,
      version: body.version,
    };

    const content = serializeSprintFile(sprint);
    const filePath = resolveAndGuard(sprintsDir, `${body.id}.md`);
    await fs.writeFile(filePath, content, "utf-8");

    return ok({ sprint }, 201);
  } catch (err) {
    return handleError(err);
  }
}
