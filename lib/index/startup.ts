/**
 * Index Startup — Initializes the SQLite index and file watcher during app startup.
 *
 * Called from Next.js instrumentation hook or on first API request.
 * Handles graceful degradation if SQLite fails.
 */

import * as path from "path";
import * as os from "os";
import { openDatabase, closeDatabase, isIndexAvailable } from "./sqlite";
import { initIndex } from "./builder";
import { watchProject, unwatchAll } from "./file-watcher";
import { getWorkspacePath, getRegistryPath } from "@/lib/api/workspace-guard";
import { listProjects } from "@/lib/file-format/registry";

let initialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the index and file watchers. Safe to call multiple times —
 * subsequent calls are no-ops. Returns immediately if already initialized.
 */
export async function ensureIndex(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = doInit();
  return initPromise;
}

async function doInit(): Promise<void> {
  try {
    // Determine database location — use OS temp dir to keep it ephemeral
    const dbDir = path.join(os.tmpdir(), "kyro-index");
    const { mkdirSync } = await import("fs");
    mkdirSync(dbDir, { recursive: true });

    openDatabase({ dbDir });

    // Build the full index
    const result = await initIndex();
    console.log(
      `[kyro-index] Ready — ${result.projects} projects, ${result.sprints} sprints, ${result.tasks} tasks indexed in ${result.durationMs}ms`
    );

    // Start file watchers for all registered projects
    try {
      const workspacePath = getWorkspacePath();
      const registryPath = getRegistryPath(workspacePath);
      const entries = await listProjects(registryPath);

      for (const entry of entries) {
        watchProject(entry.id, entry.path);
      }

      console.log(`[kyro-index] Watching ${entries.length} project(s) for changes`);
    } catch {
      console.warn("[kyro-index] File watchers not started — workspace not configured");
    }

    initialized = true;
  } catch (err) {
    console.warn("[kyro-index] Index initialization failed — falling back to file service:", err);
    // Graceful degradation: app works without SQLite
    closeDatabase();
    initialized = true; // Don't retry
  }
}

/**
 * Shutdown the index — close database and stop watchers.
 * Called during app shutdown/cleanup.
 */
export function shutdownIndex(): void {
  unwatchAll();
  closeDatabase();
  initialized = false;
  initPromise = null;
}

/**
 * Check if the index is ready for queries.
 */
export function isIndexReady(): boolean {
  return initialized && isIndexAvailable();
}
