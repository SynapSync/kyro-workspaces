/**
 * File Watcher — monitors project directories for markdown file changes
 * and triggers incremental re-indexation.
 *
 * Uses Node.js fs.watch() with recursive option (supported on macOS and Windows).
 * Debounces changes by 500ms to batch rapid modifications (git operations).
 */

import * as fs from "fs";
import * as path from "path";
import { reindexFile } from "./builder";
import { getDb } from "./sqlite";

// --- Types ---

export type WatcherEventType = "change" | "rename";

export interface FileChangeEvent {
  projectId: string;
  filePath: string;
  eventType: WatcherEventType;
}

export type IndexUpdateListener = (event: {
  projectId: string;
  files: string[];
}) => void;

// --- Watcher State ---

const watchers = new Map<string, fs.FSWatcher>();
const listeners = new Set<IndexUpdateListener>();
const pendingChanges = new Map<string, { projectId: string; filePath: string }>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const DEBOUNCE_MS = 500;

// --- Public API ---

/**
 * Start watching a project directory for markdown file changes.
 * Calls reindexFile() on change and notifies listeners.
 */
export function watchProject(projectId: string, projectPath: string): void {
  if (watchers.has(projectId)) return; // Already watching

  try {
    const watcher = fs.watch(projectPath, { recursive: true }, (eventType, filename) => {
      if (!filename) return;

      // Only watch markdown files
      if (!filename.endsWith(".md")) return;

      // Only watch sprint-forge directories
      const normalized = filename.replace(/\\/g, "/");
      const isRelevant =
        normalized.includes("sprints/") ||
        normalized.includes("findings/") ||
        normalized.includes("documents/") ||
        normalized === "README.md";

      if (!isRelevant) return;

      const fullPath = path.join(projectPath, filename);
      const changeKey = `${projectId}:${fullPath}`;

      pendingChanges.set(changeKey, { projectId, filePath: fullPath });
      scheduleDebouncedFlush();
    });

    watchers.set(projectId, watcher);
  } catch (err) {
    console.warn(`[kyro-watcher] Failed to watch ${projectPath}:`, err);
  }
}

/**
 * Stop watching a project directory.
 */
export function unwatchProject(projectId: string): void {
  const watcher = watchers.get(projectId);
  if (watcher) {
    watcher.close();
    watchers.delete(projectId);
  }
}

/**
 * Stop all watchers and clean up.
 */
export function unwatchAll(): void {
  for (const [id, watcher] of watchers) {
    watcher.close();
    watchers.delete(id);
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  pendingChanges.clear();
}

/**
 * Register a listener for index update events.
 * Called after files are re-indexed with the list of affected files.
 */
export function onIndexUpdate(listener: IndexUpdateListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Get the number of actively watched projects.
 */
export function getWatcherCount(): number {
  return watchers.size;
}

// --- Internal ---

function scheduleDebouncedFlush(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(flushPendingChanges, DEBOUNCE_MS);
}

async function flushPendingChanges(): Promise<void> {
  debounceTimer = null;

  if (pendingChanges.size === 0) return;
  if (!getDb()) return;

  // Snapshot and clear pending changes
  const changes = new Map(pendingChanges);
  pendingChanges.clear();

  // Group by project
  const byProject = new Map<string, string[]>();
  for (const { projectId, filePath } of changes.values()) {
    const files = byProject.get(projectId) ?? [];
    files.push(filePath);
    byProject.set(projectId, files);
  }

  // Re-index each changed file
  for (const [projectId, files] of byProject) {
    const updatedFiles: string[] = [];

    for (const filePath of files) {
      try {
        const changed = await reindexFile(filePath, projectId);
        if (changed) {
          updatedFiles.push(filePath);
        }
      } catch (err) {
        console.warn(`[kyro-watcher] Failed to reindex ${filePath}:`, err);
      }
    }

    if (updatedFiles.length > 0) {
      // Notify listeners
      const event = { projectId, files: updatedFiles };
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (err) {
          console.warn("[kyro-watcher] Listener error:", err);
        }
      }
    }
  }
}
