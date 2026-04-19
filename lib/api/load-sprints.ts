import * as fs from "fs/promises";
import { resolveProjectPath } from "./workspace-guard";
import { parseSprintFile } from "@/lib/file-format/parsers";
import {
  detectSprintFormat,
  parseSprintForgeFile,
} from "@/lib/file-format/sprint-forge-parsers";
import type { Sprint } from "@/lib/types";
import { resolveSprintMarkdownDirOnDisk } from "@/lib/project-layout";

/**
 * Load all sprint markdown files from the project's sprint markdown directory
 * (`sprint-forge/` preferred, or legacy `sprints/`). Returns an empty array if neither exists.
 */
export async function loadSprintsFromDir(projectRoot: string): Promise<Sprint[]> {
  const sprintsDir = await resolveSprintMarkdownDirOnDisk(projectRoot);

  if (!sprintsDir) {
    return [];
  }

  const entries = (await fs.readdir(sprintsDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .sort((a, b) => {
      const numA = parseInt(a.name.match(/(\d+)/)?.[1] ?? "0", 10);
      const numB = parseInt(b.name.match(/(\d+)/)?.[1] ?? "0", 10);
      return numA - numB || a.name.localeCompare(b.name);
    });

  const sprints: Sprint[] = [];

  for (const entry of entries) {
    const filePath = resolveProjectPath(sprintsDir, entry.name);
    const content = await fs.readFile(filePath, "utf-8");

    if (detectSprintFormat(content) === "sprint-forge") {
      sprints.push({ ...parseSprintForgeFile(content), rawContent: content });
    } else {
      sprints.push({ ...parseSprintFile(content), rawContent: content });
    }
  }

  return sprints;
}
