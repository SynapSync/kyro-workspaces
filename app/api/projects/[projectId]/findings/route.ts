import * as fs from "fs/promises";
import { NextRequest } from "next/server";
import {
  getWorkspacePath,
  resolveProjectRoot,
  resolveProjectPath,
  fileExists,
  ok,
  handleError,
} from "@/lib/api";
import { parseFindingFile } from "@/lib/file-format/sprint-forge-parsers";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const workspacePath = getWorkspacePath();
    const projectRoot = await resolveProjectRoot(workspacePath, projectId);
    const findingsDir = resolveProjectPath(projectRoot, "findings");

    const dirExists = await fileExists(findingsDir);
    if (!dirExists) {
      return ok({ findings: [] }, 200);
    }

    const entries = (await fs.readdir(findingsDir, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .sort((a, b) => a.name.localeCompare(b.name));

    const findings = [];
    for (const entry of entries) {
      const filePath = resolveProjectPath(findingsDir, entry.name);
      const content = await fs.readFile(filePath, "utf-8");
      findings.push(parseFindingFile(content, entry.name));
    }

    return ok({ findings }, 200);
  } catch (err) {
    return handleError(err);
  }
}
