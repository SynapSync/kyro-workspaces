import * as fs from "fs";
import * as path from "path";
import { NextRequest } from "next/server";
import {
  getWorkspacePath,
  resolveAndGuard,
  ok,
  handleError,
} from "@/lib/api";
import { getGit } from "@/lib/git";
import type { GitCommit } from "@/lib/types";

interface RouteParams {
  params: Promise<{ projectId: string; docId: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, docId } = await params;
    const workspacePath = getWorkspacePath();
    const filePath = resolveAndGuard(workspacePath, "projects", projectId, "documents", `${docId}.md`);

    // Check if .git exists in workspace
    const gitDir = path.join(workspacePath, ".git");
    if (!fs.existsSync(gitDir)) {
      return ok([]);
    }

    const relativePath = path.relative(workspacePath, filePath);

    try {
      const git = getGit();
      const log = await git.log({ file: relativePath, maxCount: 20 });

      const commits: GitCommit[] = log.all.map((entry) => ({
        hash: entry.hash,
        shortHash: entry.hash.substring(0, 7),
        message: entry.message,
        authorName: entry.author_name,
        authorDate: entry.date,
      }));

      return ok(commits);
    } catch {
      // File has no git history
      return ok([]);
    }
  } catch (err) {
    return handleError(err);
  }
}
