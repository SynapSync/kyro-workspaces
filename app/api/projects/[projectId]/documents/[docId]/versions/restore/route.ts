import * as fs from "fs/promises";
import * as path from "path";
import { NextRequest } from "next/server";
import {
  getWorkspacePath,
  resolveAndGuard,
  ok,
  handleError,
  validateBody,
} from "@/lib/api";
import { WorkspaceError } from "@/lib/api";
import { getGit } from "@/lib/git";

interface RouteParams {
  params: Promise<{ projectId: string; docId: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, docId } = await params;
    const workspacePath = getWorkspacePath();
    const filePath = resolveAndGuard(workspacePath, "projects", projectId, "documents", `${docId}.md`);

    const body = await req.json();
    const { hash } = validateBody<{ hash: string }>(body, ["hash"]);

    // Validate hash format: 7-40 hex characters
    if (!/^[0-9a-f]{7,40}$/i.test(hash)) {
      throw new WorkspaceError("INVALID_FORMAT", "Invalid commit hash format: must be 7-40 hex characters");
    }

    const relativePath = path.relative(workspacePath, filePath);

    try {
      const git = getGit();
      await git.checkout([hash, "--", relativePath]);
    } catch {
      throw new WorkspaceError("NOT_FOUND", `Could not restore version: commit ${hash} not found or file not in history`);
    }

    const content = await fs.readFile(filePath, "utf-8");

    return ok({ content });
  } catch (err) {
    return handleError(err);
  }
}
