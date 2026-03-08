import * as fs from "fs/promises";
import * as path from "path";
import { WorkspaceError } from "./errors";
import { getProject } from "@/lib/file-format/registry";

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

/**
 * Resolve and guard paths relative to a project's external root directory.
 * Same traversal protection as resolveAndGuard but with any root path.
 */
export function resolveProjectPath(
  projectRoot: string,
  ...segments: string[]
): string {
  const joined = path.join(...segments);
  const resolved = path.resolve(projectRoot, joined);

  const normalizedRoot = path.resolve(projectRoot);
  if (!resolved.startsWith(normalizedRoot + path.sep) && resolved !== normalizedRoot) {
    throw new WorkspaceError(
      "PERMISSION_DENIED",
      "Path traversal detected"
    );
  }

  return resolved;
}

/**
 * Returns the path to $WORKSPACE/.kyro/projects.json
 */
export function getRegistryPath(workspacePath: string): string {
  return resolveAndGuard(workspacePath, ".kyro", "projects.json");
}

/**
 * Reads the registry, finds a project by ID, returns its external root path.
 * Throws NOT_FOUND if the project is not registered.
 */
export async function resolveProjectRoot(
  workspacePath: string,
  projectId: string
): Promise<string> {
  const registryPath = getRegistryPath(workspacePath);
  const entry = await getProject(registryPath, projectId);
  if (!entry) {
    throw new WorkspaceError("NOT_FOUND", `Project "${projectId}" not found in registry`);
  }
  return entry.path;
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}
