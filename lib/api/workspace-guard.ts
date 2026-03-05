import * as fs from "fs/promises";
import * as path from "path";
import { WorkspaceError } from "./errors";

const WORKSPACE_ENV_VAR = "KYRO_WORKSPACE_PATH";

export function getWorkspacePath(): string {
  const workspacePath = process.env[WORKSPACE_ENV_VAR];
  if (!workspacePath) {
    throw new WorkspaceError(
      "WORKSPACE_NOT_CONFIGURED",
      `Environment variable ${WORKSPACE_ENV_VAR} is not set`
    );
  }
  return workspacePath;
}

export function resolveAndGuard(
  workspacePath: string,
  ...segments: string[]
): string {
  const joined = path.join(...segments);
  const resolved = path.resolve(workspacePath, joined);

  const normalizedWorkspace = path.resolve(workspacePath);
  if (!resolved.startsWith(normalizedWorkspace + path.sep) && resolved !== normalizedWorkspace) {
    throw new WorkspaceError(
      "PERMISSION_DENIED",
      "Path traversal detected"
    );
  }

  return resolved;
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}
