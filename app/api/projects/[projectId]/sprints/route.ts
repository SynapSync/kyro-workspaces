import { NextRequest } from "next/server";
import {
  getWorkspacePath,
  resolveProjectRoot,
  ok,
  handleError,
} from "@/lib/api";
import { loadSprintsFromDir } from "@/lib/api/load-sprints";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const workspacePath = getWorkspacePath();
    const projectRoot = await resolveProjectRoot(workspacePath, projectId);
    const sprints = await loadSprintsFromDir(projectRoot);

    return ok({ sprints }, 200);
  } catch (err) {
    return handleError(err);
  }
}
