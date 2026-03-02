import * as fs from "fs/promises";
import * as path from "path";
import { NextRequest } from "next/server";
import {
  getWorkspacePath,
  resolveAndGuard,
  fileExists,
  ok,
  notFound,
  handleError,
} from "@/lib/api";
import { getGit } from "@/lib/git";
import {
  parseDocumentFile,
} from "@/lib/file-format/parsers";
import {
  serializeDocumentFile,
} from "@/lib/file-format/serializers";

interface RouteParams {
  params: Promise<{ projectId: string; docId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, docId } = await params;
    const workspacePath = getWorkspacePath();
    const filePath = resolveAndGuard(workspacePath, "projects", projectId, "documents", `${docId}.md`);

    const fileExistsResult = await fileExists(filePath);
    if (!fileExistsResult) {
      return notFound("Document not found");
    }

    const content = await fs.readFile(filePath, "utf-8");
    const document = parseDocumentFile(content, docId);

    return ok({ document }, 200);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, docId } = await params;
    const workspacePath = getWorkspacePath();
    const filePath = resolveAndGuard(workspacePath, "projects", projectId, "documents", `${docId}.md`);

    const fileExistsResult = await fileExists(filePath);
    if (!fileExistsResult) {
      return notFound("Document not found");
    }

    const body = await req.json();
    const existingContent = await fs.readFile(filePath, "utf-8");
    const existing = parseDocumentFile(existingContent, docId);

    const updated = {
      ...existing,
      title: body.title ?? existing.title,
      content: body.content ?? existing.content,
      updatedAt: new Date().toISOString(),
    };

    const newContent = serializeDocumentFile(updated);
    await fs.writeFile(filePath, newContent, "utf-8");

    // Auto-commit document changes to git
    try {
      const git = getGit();
      const relativePath = path.relative(workspacePath, filePath);
      await git.add(relativePath);
      await git.commit(`docs: update ${updated.title}`);
    } catch {
      // Git errors should not fail the document save
    }

    return ok({ document: updated }, 200);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, docId } = await params;
    const workspacePath = getWorkspacePath();
    const filePath = resolveAndGuard(workspacePath, "projects", projectId, "documents", `${docId}.md`);

    const fileExistsResult = await fileExists(filePath);
    if (!fileExistsResult) {
      return notFound("Document not found");
    }

    await fs.unlink(filePath);

    return ok({ deleted: true }, 200);
  } catch (err) {
    return handleError(err);
  }
}
