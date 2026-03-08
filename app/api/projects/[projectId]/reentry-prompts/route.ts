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

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const workspacePath = getWorkspacePath();
    const projectRoot = await resolveProjectRoot(workspacePath, projectId);
    const promptsPath = resolveProjectPath(projectRoot, "RE-ENTRY-PROMPTS.md");

    const exists = await fileExists(promptsPath);
    if (!exists) {
      return notFound("RE-ENTRY-PROMPTS.md not found");
    }

    const content = await fs.readFile(promptsPath, "utf-8");

    return ok({ content }, 200);
  } catch (err) {
    return handleError(err);
  }
}
