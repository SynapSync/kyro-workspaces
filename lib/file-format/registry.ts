/**
 * Project registry management for external sprint-forge directories.
 * The registry is stored at $WORKSPACE/.kyro/projects.json and maps
 * project IDs to external filesystem paths.
 */

import * as fs from "fs/promises";
import * as path from "path";
import type { ProjectRegistry, ProjectRegistryEntry } from "@/lib/types";
import { ProjectRegistrySchema } from "@/lib/types";
import { WorkspaceError } from "@/lib/api/errors";
import { parseSprintForgeReadme } from "./sprint-forge-parsers";
import {
  LEGACY_SPRINT_MARKDOWN_DIR,
  resolveSprintMarkdownDirOnDisk,
  SPRINT_MARKDOWN_DIR,
} from "@/lib/project-layout";

const EMPTY_REGISTRY: ProjectRegistry = { version: 1, projects: [] };

// ---------------------------------------------------------------------------
// Parse / Serialize
// ---------------------------------------------------------------------------

export function parseProjectRegistry(json: string): ProjectRegistry {
  if (!json.trim()) return EMPTY_REGISTRY;
  const raw = JSON.parse(json);
  return ProjectRegistrySchema.parse(raw);
}

export function serializeProjectRegistry(registry: ProjectRegistry): string {
  return JSON.stringify(registry, null, 2) + "\n";
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export async function validateSprintForgeDirectory(
  dirPath: string,
): Promise<{ valid: boolean; name?: string; resolvedPath?: string; error?: string }> {
  try {
    const resolved = path.resolve(dirPath);

    // Check directory exists
    try {
      const stat = await fs.stat(resolved);
      if (!stat.isDirectory()) {
        return { valid: false, error: "Path is not a directory" };
      }
    } catch {
      return { valid: false, error: "Directory does not exist" };
    }

    // Check for README.md directly in the path
    const readmePath = path.join(resolved, "README.md");
    let name: string | undefined;
    let actualPath = resolved;

    try {
      const readmeContent = await fs.readFile(readmePath, "utf-8");
      const parsed = parseSprintForgeReadme(readmeContent);
      name = parsed.name;
    } catch {
      // README.md not found — check if this is a parent directory with a single
      // sprint-forge subdirectory (e.g., user passed .agents/sprint-forge/ instead
      // of .agents/sprint-forge/my-project/)
      try {
        const entries = await fs.readdir(resolved, { withFileTypes: true });
        const subdirs = entries.filter((e) => e.isDirectory());
        const candidates: string[] = [];

        for (const sub of subdirs) {
          const subReadme = path.join(resolved, sub.name, "README.md");
          try {
            await fs.access(subReadme);
            candidates.push(sub.name);
          } catch {
            // not a sprint-forge dir
          }
        }

        if (candidates.length === 1) {
          // Auto-resolve to the single subdirectory
          actualPath = path.join(resolved, candidates[0]);
          const subReadmeContent = await fs.readFile(
            path.join(actualPath, "README.md"),
            "utf-8",
          );
          const parsed = parseSprintForgeReadme(subReadmeContent);
          name = parsed.name;
        } else if (candidates.length > 1) {
          const parentName = path.basename(resolved);
          const examplePaths = candidates
            .slice(0, 6)
            .map((c) => path.join(resolved, c))
            .join(" | ");
          const registryHint =
            parentName === "sprint-forge"
              ? ` You opened the shared parent ".agents/sprint-forge" (or similar). Kyro registers one scope at a time — open the folder for a single scope (it must contain README.md plus "${SPRINT_MARKDOWN_DIR}/" or legacy "${LEGACY_SPRINT_MARKDOWN_DIR}/").`
              : " Open one project folder (the one that contains README.md at its root), not a directory that lists several such projects.";
          return {
            valid: false,
            error: `Several scope projects were found under "${resolved}".${registryHint} Example full paths: ${examplePaths}`,
          };
        } else {
          return { valid: false, error: "README.md not found or unreadable" };
        }
      } catch {
        return { valid: false, error: "README.md not found or unreadable" };
      }
    }

    // Check for sprint markdown directory (sprint-forge/ or legacy sprints/)
    const sprintMdDir = await resolveSprintMarkdownDirOnDisk(actualPath);
    if (!sprintMdDir) {
      return {
        valid: false,
        error: `No sprint markdown directory found: add "${SPRINT_MARKDOWN_DIR}/" or "${LEGACY_SPRINT_MARKDOWN_DIR}/" with sprint .md files next to README.md.`,
      };
    }

    return { valid: true, name, resolvedPath: actualPath };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// CRUD Helpers
// ---------------------------------------------------------------------------

async function readRegistry(registryPath: string): Promise<ProjectRegistry> {
  try {
    const content = await fs.readFile(registryPath, "utf-8");
    return parseProjectRegistry(content);
  } catch {
    return EMPTY_REGISTRY;
  }
}

async function writeRegistry(
  registryPath: string,
  registry: ProjectRegistry,
): Promise<void> {
  await fs.writeFile(registryPath, serializeProjectRegistry(registry), "utf-8");
}

export async function listProjects(
  registryPath: string,
): Promise<ProjectRegistryEntry[]> {
  const registry = await readRegistry(registryPath);
  return registry.projects;
}

export async function getProject(
  registryPath: string,
  projectId: string,
): Promise<ProjectRegistryEntry | undefined> {
  const registry = await readRegistry(registryPath);
  return registry.projects.find((p) => p.id === projectId);
}

export async function addProject(
  registryPath: string,
  entry: ProjectRegistryEntry,
): Promise<void> {
  const registry = await readRegistry(registryPath);

  const existing = registry.projects.find((p) => p.id === entry.id);
  if (existing) {
    throw new WorkspaceError(
      "ALREADY_EXISTS",
      `Project "${entry.id}" already exists in registry`,
    );
  }

  registry.projects.push(entry);
  await writeRegistry(registryPath, registry);
}

export async function removeProject(
  registryPath: string,
  projectId: string,
): Promise<boolean> {
  const registry = await readRegistry(registryPath);
  const index = registry.projects.findIndex((p) => p.id === projectId);
  if (index === -1) return false;

  registry.projects.splice(index, 1);
  await writeRegistry(registryPath, registry);
  return true;
}

export async function updateProject(
  registryPath: string,
  projectId: string,
  updates: Partial<
    Pick<ProjectRegistryEntry, "name" | "color" | "lastOpenedAt">
  >,
): Promise<ProjectRegistryEntry | undefined> {
  const registry = await readRegistry(registryPath);
  const entry = registry.projects.find((p) => p.id === projectId);
  if (!entry) return undefined;

  if (updates.name !== undefined) entry.name = updates.name;
  if (updates.color !== undefined) entry.color = updates.color;
  if (updates.lastOpenedAt !== undefined)
    entry.lastOpenedAt = updates.lastOpenedAt;

  await writeRegistry(registryPath, registry);
  return entry;
}

export async function updateLastOpened(
  registryPath: string,
  projectId: string,
): Promise<void> {
  await updateProject(registryPath, projectId, {
    lastOpenedAt: new Date().toISOString(),
  });
}
