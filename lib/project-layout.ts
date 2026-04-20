import * as fs from "fs/promises";
import * as path from "path";

/**
 * Canonical directory name (under each sprint-forge project root) where sprint
 * markdown files (*.md) are stored on disk.
 */
export const SPRINT_MARKDOWN_DIR = "sprint-forge";

/**
 * Legacy directory name used by kyro-workflow templates (`sprints/*.md`).
 */
export const LEGACY_SPRINT_MARKDOWN_DIR = "sprints";

async function isDirectory(dir: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Resolves the absolute path to the sprint markdown directory on disk, if present.
 * Prefers {@link SPRINT_MARKDOWN_DIR}, then {@link LEGACY_SPRINT_MARKDOWN_DIR}.
 *
 * @param projectRoot: Absolute or relative root of one scope project (README lives here) [string].
 *
 * @returns: Absolute path to the sprint markdown directory, or null if neither exists [string | null].
 */
export async function resolveSprintMarkdownDirOnDisk(
  projectRoot: string,
): Promise<string | null> {
  const root = path.resolve(projectRoot);
  const modern = path.join(root, SPRINT_MARKDOWN_DIR);
  if (await isDirectory(modern)) return modern;
  const legacy = path.join(root, LEGACY_SPRINT_MARKDOWN_DIR);
  if (await isDirectory(legacy)) return legacy;
  return null;
}
