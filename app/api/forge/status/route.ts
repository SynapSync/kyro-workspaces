import * as fs from "fs/promises";
import * as path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getWorkspacePath, resolveProjectRoot, handleError } from "@/lib/api";
import { resolveSprintMarkdownDirOnDisk } from "@/lib/project-layout";

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json(
        { error: "Missing 'projectId' query parameter" },
        { status: 400 },
      );
    }

    const workspacePath = getWorkspacePath();
    const projectRoot = await resolveProjectRoot(workspacePath, projectId);
    const sprintsDir = await resolveSprintMarkdownDirOnDisk(projectRoot);

    let sprintFiles: string[] = [];
    if (!sprintsDir) {
      return NextResponse.json({
        data: {
          sprintCount: 0,
          latestSprint: null,
          lastModified: null,
        },
      });
    }
    try {
      const entries = await fs.readdir(sprintsDir);
      sprintFiles = entries
        .filter((f) => f.startsWith("SPRINT-") && f.endsWith(".md"))
        .sort();
    } catch {
      // sprint-forge/ dir may not exist yet
    }

    let lastModified: string | null = null;
    const latestSprint = sprintFiles.length > 0 ? sprintFiles[sprintFiles.length - 1] : null;

    if (latestSprint) {
      const stat = await fs.stat(path.join(sprintsDir, latestSprint));
      lastModified = stat.mtime.toISOString();
    }

    return NextResponse.json({
      data: {
        sprintCount: sprintFiles.length,
        latestSprint,
        lastModified,
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
