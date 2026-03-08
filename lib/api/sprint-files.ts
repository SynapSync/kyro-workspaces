import * as fs from "fs/promises";
import {
  WorkspaceError,
  fileExists,
  resolveProjectPath,
  resolveProjectRoot,
} from "@/lib/api";
import { parseSprintFile } from "@/lib/file-format/parsers";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "sprint";
}

function formatSprintNumber(value: number): string {
  return String(value).padStart(2, "0");
}

export async function resolveSprintFilePath(
  workspacePath: string,
  projectId: string,
  sprintId: string
): Promise<string> {
  const projectRoot = await resolveProjectRoot(workspacePath, projectId);
  const sprintsDir = resolveProjectPath(projectRoot, "sprints");
  if (!(await fileExists(sprintsDir))) {
    throw new WorkspaceError("NOT_FOUND", "Sprint not found");
  }

  const directPath = resolveProjectPath(sprintsDir, `${sprintId}.md`);
  if (await fileExists(directPath)) {
    return directPath;
  }

  const entries = await fs.readdir(sprintsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;

    const filePath = resolveProjectPath(sprintsDir, entry.name);
    const basename = entry.name.replace(/\.md$/i, "");
    if (basename === sprintId) {
      return filePath;
    }

    try {
      const content = await fs.readFile(filePath, "utf-8");
      const sprint = parseSprintFile(content);
      if (sprint.id === sprintId) {
        return filePath;
      }
    } catch {
      // Skip malformed files while searching.
    }
  }

  throw new WorkspaceError("NOT_FOUND", "Sprint not found");
}

export async function buildCanonicalSprintFileName(
  workspacePath: string,
  projectId: string,
  sprintName: string
): Promise<string> {
  const projectRoot = await resolveProjectRoot(workspacePath, projectId);
  const sprintsDir = resolveProjectPath(projectRoot, "sprints");
  const entries = await fs.readdir(sprintsDir, { withFileTypes: true });

  let maxNumber = 0;
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const match = entry.name.match(/^SPRINT-(\d+)/i);
    if (!match) continue;
    const parsed = Number(match[1]);
    if (!Number.isNaN(parsed)) {
      maxNumber = Math.max(maxNumber, parsed);
    }
  }

  const nextNumber = maxNumber + 1;
  const base = `SPRINT-${formatSprintNumber(nextNumber)}-${slugify(sprintName)}`;
  let fileName = `${base}.md`;
  let suffix = 2;

  while (await fileExists(resolveProjectPath(sprintsDir, fileName))) {
    fileName = `${base}-${suffix}.md`;
    suffix += 1;
  }

  return fileName;
}
