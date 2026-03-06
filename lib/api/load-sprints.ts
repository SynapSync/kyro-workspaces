import * as fs from "fs/promises";
import { resolveProjectPath, fileExists } from "./workspace-guard";
import { parseSprintFile } from "@/lib/file-format/parsers";
import {
  detectSprintFormat,
  parseSprintForgeFile,
} from "@/lib/file-format/sprint-forge-parsers";
import type { Sprint } from "@/lib/types";

/**
 * Load all sprint markdown files from a project's sprints/ directory.
 * Returns an empty array if the directory doesn't exist.
 */
export async function loadSprintsFromDir(projectRoot: string): Promise<Sprint[]> {
  const sprintsDir = resolveProjectPath(projectRoot, "sprints");

  if (!(await fileExists(sprintsDir))) {
    return [];
  }

  const entries = (await fs.readdir(sprintsDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .sort((a, b) => a.name.localeCompare(b.name));

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
