import * as fs from "fs/promises";
import { NextRequest } from "next/server";
import {
  getWorkspacePath,
  resolveProjectRoot,
  resolveProjectPath,
  fileExists,
  ok,
  notFound,
  handleError,
} from "@/lib/api";
import { parseRoadmapSprintSummary } from "@/lib/file-format/sprint-forge-parsers";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const workspacePath = getWorkspacePath();
    const projectRoot = await resolveProjectRoot(workspacePath, projectId);
    const roadmapPath = resolveProjectPath(projectRoot, "ROADMAP.md");

    const exists = await fileExists(roadmapPath);
    if (!exists) {
      return notFound("ROADMAP.md not found");
    }

    const content = await fs.readFile(roadmapPath, "utf-8");
    const sprints = parseRoadmapSprintSummary(content);

    return ok({ roadmap: { raw: content, sprints } }, 200);
  } catch (err) {
    return handleError(err);
  }
}
