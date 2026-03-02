import * as fs from "fs/promises";
import { NextRequest } from "next/server";
import {
  getWorkspacePath,
  resolveAndGuard,
  fileExists,
  WorkspaceError,
  ok,
  handleError,
} from "@/lib/api";
import {
  parseDocumentFile,
} from "@/lib/file-format/parsers";
import {
  serializeDocumentFile,
} from "@/lib/file-format/serializers";
import type { Document } from "@/lib/types";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const workspacePath = getWorkspacePath();
    const docsDir = resolveAndGuard(workspacePath, "projects", projectId, "documents");

    const dirExists = await fileExists(docsDir);
    if (!dirExists) {
      return ok({ documents: [] }, 200);
    }

    const entries = await fs.readdir(docsDir, { withFileTypes: true });
    const documents = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;

      const filePath = resolveAndGuard(docsDir, entry.name);
      const content = await fs.readFile(filePath, "utf-8");
      const docId = entry.name.replace(/\.md$/, "");
      const doc = parseDocumentFile(content, docId);
      documents.push({
        id: doc.id,
        title: doc.title,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      });
    }

    return ok({ documents }, 200);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const workspacePath = getWorkspacePath();
    const body = await req.json();

    if (!body.title || typeof body.title !== "string") {
      throw new WorkspaceError("INVALID_FORMAT", "Title is required");
    }

    const docsDir = resolveAndGuard(workspacePath, "projects", projectId, "documents");
    await fs.mkdir(docsDir, { recursive: true });

    const docId = body.id ?? slugify(body.title);
    const filePath = resolveAndGuard(docsDir, `${docId}.md`);

    const fileExistsResult = await fileExists(filePath);
    if (fileExistsResult) {
      throw new WorkspaceError("ALREADY_EXISTS", "Document already exists");
    }

    const now = new Date().toISOString();
    const newDoc: Document = {
      id: docId,
      title: body.title,
      content: body.content ?? "",
      createdAt: now,
      updatedAt: now,
    };

    const content = serializeDocumentFile(newDoc);
    await fs.writeFile(filePath, content, "utf-8");

    return ok({ document: newDoc }, 201);
  } catch (err) {
    return handleError(err);
  }
}
