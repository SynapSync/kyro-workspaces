/**
 * Index Builder — Populates and maintains the SQLite index from markdown files.
 *
 * Three operations:
 * - initIndex(): Full rebuild from all registered projects
 * - reindexFile(): Incremental single-file update
 * - reindexProject(): Project-level refresh with deleted file cleanup
 */

import * as fs from "fs/promises";
import * as path from "path";
import { createHash } from "crypto";
import { getDb } from "./sqlite";
import {
  getWorkspacePath,
  getRegistryPath,
  resolveProjectPath,
  fileExists,
} from "@/lib/api/workspace-guard";
import { listProjects } from "@/lib/file-format/registry";
import { parseProjectReadme } from "@/lib/file-format/parsers";
import {
  detectSprintFormat,
  parseSprintForgeFile,
  parseFindingFile,
} from "@/lib/file-format/sprint-forge-parsers";
import { parseSprintFile } from "@/lib/file-format/parsers";
import { buildProjectGraph, rebuildFileGraph } from "./graph-builder";
import type { Sprint, Finding } from "@/lib/types";

// --- Helpers ---

function md5(content: string): string {
  return createHash("md5").update(content).digest("hex");
}

function now(): string {
  return new Date().toISOString();
}

// --- Init Index ---

export interface InitIndexResult {
  projects: number;
  sprints: number;
  tasks: number;
  findings: number;
  documents: number;
  durationMs: number;
}

/**
 * Full index rebuild — scans all registered projects, parses all markdown files,
 * and populates all SQLite tables. Uses checksums for future invalidation.
 */
export async function initIndex(): Promise<InitIndexResult> {
  const db = getDb();
  if (!db) throw new Error("Database not initialized");

  const start = Date.now();
  let projectCount = 0;
  let sprintCount = 0;
  let taskCount = 0;
  let findingCount = 0;
  let documentCount = 0;

  const workspacePath = getWorkspacePath();
  const registryPath = getRegistryPath(workspacePath);
  const entries = await listProjects(registryPath);

  // Clear all data for full rebuild
  db.exec("DELETE FROM file_checksums");
  db.exec("DELETE FROM debt_items");
  db.exec("DELETE FROM tasks");
  db.exec("DELETE FROM findings");
  db.exec("DELETE FROM documents");
  db.exec("DELETE FROM sprints");
  db.exec("DELETE FROM projects");

  for (const entry of entries) {
    const readmePath = resolveProjectPath(entry.path, "README.md");
    if (!(await fileExists(readmePath))) continue;

    const readmeContent = await fs.readFile(readmePath, "utf-8");
    const project = parseProjectReadme(readmeContent, entry.id);
    const readmeChecksum = md5(readmeContent);
    const timestamp = now();

    // Insert project
    db.prepare(`
      INSERT OR REPLACE INTO projects (id, name, description, color, readme_path, file_path, checksum, indexed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(entry.id, project.name, project.description, entry.color ?? null, readmePath, entry.path, readmeChecksum, timestamp);

    db.prepare(`
      INSERT OR REPLACE INTO file_checksums (file_path, checksum, project_id, file_type, indexed_at)
      VALUES (?, ?, ?, 'readme', ?)
    `).run(readmePath, readmeChecksum, entry.id, timestamp);

    projectCount++;

    // Index sprints
    const sprintsDir = resolveProjectPath(entry.path, "sprints");
    if (await fileExists(sprintsDir)) {
      const sprintFiles = (await fs.readdir(sprintsDir, { withFileTypes: true }))
        .filter((e) => e.isFile() && e.name.endsWith(".md"))
        .sort((a, b) => {
          const numA = parseInt(a.name.match(/(\d+)/)?.[1] ?? "0", 10);
          const numB = parseInt(b.name.match(/(\d+)/)?.[1] ?? "0", 10);
          return numA - numB || a.name.localeCompare(b.name);
        });

      for (const file of sprintFiles) {
        const filePath = resolveProjectPath(sprintsDir, file.name);
        const content = await fs.readFile(filePath, "utf-8");
        const checksum = md5(content);

        const sprint = detectSprintFormat(content) === "sprint-forge"
          ? parseSprintForgeFile(content)
          : parseSprintFile(content);

        insertSprint(entry.id, sprint, filePath, checksum, content);
        sprintCount++;
        taskCount += sprint.tasks.length;
      }
    }

    // Index findings
    const findingsDir = resolveProjectPath(entry.path, "findings");
    if (await fileExists(findingsDir)) {
      const findingFiles = (await fs.readdir(findingsDir, { withFileTypes: true }))
        .filter((e) => e.isFile() && e.name.endsWith(".md"))
        .sort((a, b) => a.name.localeCompare(b.name));

      for (const file of findingFiles) {
        const filePath = resolveProjectPath(findingsDir, file.name);
        const content = await fs.readFile(filePath, "utf-8");
        const checksum = md5(content);

        const finding = parseFindingFile(content, file.name);
        insertFinding(entry.id, finding, filePath, checksum);
        findingCount++;
      }
    }

    // Index documents
    const documentsDir = resolveProjectPath(entry.path, "documents");
    if (await fileExists(documentsDir)) {
      const docFiles = (await fs.readdir(documentsDir, { withFileTypes: true }))
        .filter((e) => e.isFile() && e.name.endsWith(".md"))
        .sort((a, b) => a.name.localeCompare(b.name));

      for (const file of docFiles) {
        const filePath = resolveProjectPath(documentsDir, file.name);
        const content = await fs.readFile(filePath, "utf-8");
        const checksum = md5(content);
        const title = file.name.replace(/\.md$/, "").replace(/[-_]/g, " ");
        const docId = file.name.replace(/\.md$/, "");

        insertDocument(entry.id, docId, title, content, filePath, checksum);
        documentCount++;
      }
    }
  }

  // Build graph for each project
  let graphNodeCount = 0;
  let graphEdgeCount = 0;
  for (const entry of entries) {
    try {
      const graphResult = await buildProjectGraph(entry.id, entry.path);
      graphNodeCount += graphResult.nodes;
      graphEdgeCount += graphResult.edges;
    } catch (err) {
      console.warn(`[kyro-index] Failed to build graph for project ${entry.id}:`, err);
    }
  }

  const durationMs = Date.now() - start;
  console.log(
    `[kyro-index] Built index in ${durationMs}ms — ${projectCount} projects, ${sprintCount} sprints, ${taskCount} tasks, ${findingCount} findings, ${documentCount} documents, ${graphNodeCount} graph nodes, ${graphEdgeCount} graph edges`
  );

  return { projects: projectCount, sprints: sprintCount, tasks: taskCount, findings: findingCount, documents: documentCount, durationMs };
}

// --- Reindex Single File ---

/**
 * Re-parse a single file and update the index. Compares checksums to skip unchanged files.
 * Returns true if the file was re-indexed, false if unchanged.
 */
export async function reindexFile(filePath: string, projectId: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  if (!(await fileExists(filePath))) {
    // File was deleted — remove from index and graph
    removeFileFromIndex(filePath, projectId);
    try {
      await rebuildFileGraph(filePath, projectId);
    } catch {
      // Best-effort graph cleanup
    }
    return true;
  }

  const content = await fs.readFile(filePath, "utf-8");
  const newChecksum = md5(content);

  // Check stored checksum
  const stored = db.prepare("SELECT checksum FROM file_checksums WHERE file_path = ?").get(filePath) as { checksum: string } | undefined;
  if (stored && stored.checksum === newChecksum) {
    return false; // Unchanged
  }

  const fileType = detectFileType(filePath);
  const timestamp = now();

  switch (fileType) {
    case "sprint": {
      // Remove old sprint data for this file
      const oldSprint = db.prepare("SELECT id FROM sprints WHERE file_path = ? AND project_id = ?").get(filePath, projectId) as { id: string } | undefined;
      if (oldSprint) {
        db.prepare("DELETE FROM sprints WHERE id = ? AND project_id = ?").run(oldSprint.id, projectId);
      }

      const sprint = detectSprintFormat(content) === "sprint-forge"
        ? parseSprintForgeFile(content)
        : parseSprintFile(content);
      insertSprint(projectId, sprint, filePath, newChecksum, content);
      break;
    }
    case "finding": {
      const fileName = path.basename(filePath);
      db.prepare("DELETE FROM findings WHERE file_path = ? AND project_id = ?").run(filePath, projectId);
      const finding = parseFindingFile(content, fileName);
      insertFinding(projectId, finding, filePath, newChecksum);
      break;
    }
    case "document": {
      db.prepare("DELETE FROM documents WHERE file_path = ? AND project_id = ?").run(filePath, projectId);
      const fileName = path.basename(filePath);
      const title = fileName.replace(/\.md$/, "").replace(/[-_]/g, " ");
      const docId = fileName.replace(/\.md$/, "");
      insertDocument(projectId, docId, title, content, filePath, newChecksum);
      break;
    }
    case "readme": {
      const project = parseProjectReadme(content, projectId);
      db.prepare("UPDATE projects SET name = ?, description = ?, checksum = ?, indexed_at = ? WHERE id = ?")
        .run(project.name, project.description, newChecksum, timestamp, projectId);
      break;
    }
  }

  // Update checksum
  db.prepare(`
    INSERT OR REPLACE INTO file_checksums (file_path, checksum, project_id, file_type, indexed_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(filePath, newChecksum, projectId, fileType, timestamp);

  // Rebuild graph edges for this file
  try {
    await rebuildFileGraph(filePath, projectId);
  } catch (err) {
    console.warn(`[kyro-index] Failed to rebuild graph for ${filePath}:`, err);
  }

  return true;
}

// --- Reindex Project ---

/**
 * Scan all files in a project directory and re-index changed files.
 * Also detects deleted files (in index but not on disk) and removes their rows.
 */
export async function reindexProject(projectId: string): Promise<{ updated: number; removed: number }> {
  const db = getDb();
  if (!db) return { updated: 0, removed: 0 };

  const workspacePath = getWorkspacePath();
  const registryPath = getRegistryPath(workspacePath);
  const entries = await listProjects(registryPath);
  const entry = entries.find((e) => e.id === projectId);
  if (!entry) return { updated: 0, removed: 0 };

  let updated = 0;
  let removed = 0;

  // Collect all current files on disk
  const currentFiles = new Set<string>();

  const readmePath = resolveProjectPath(entry.path, "README.md");
  if (await fileExists(readmePath)) {
    currentFiles.add(readmePath);
  }

  for (const subdir of ["sprints", "findings", "documents"]) {
    const dirPath = resolveProjectPath(entry.path, subdir);
    if (await fileExists(dirPath)) {
      const files = (await fs.readdir(dirPath, { withFileTypes: true }))
        .filter((e) => e.isFile() && e.name.endsWith(".md"));
      for (const file of files) {
        currentFiles.add(resolveProjectPath(dirPath, file.name));
      }
    }
  }

  // Re-index each file
  for (const filePath of currentFiles) {
    const changed = await reindexFile(filePath, projectId);
    if (changed) updated++;
  }

  // Find and remove indexed files that no longer exist
  const indexedFiles = db.prepare(
    "SELECT file_path FROM file_checksums WHERE project_id = ?"
  ).all(projectId) as { file_path: string }[];

  for (const { file_path } of indexedFiles) {
    if (!currentFiles.has(file_path)) {
      removeFileFromIndex(file_path, projectId);
      removed++;
    }
  }

  return { updated, removed };
}

// --- Internal Helpers ---

function detectFileType(filePath: string): "sprint" | "finding" | "document" | "readme" {
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.includes("/sprints/")) return "sprint";
  if (normalized.includes("/findings/")) return "finding";
  if (normalized.includes("/documents/")) return "document";
  if (path.basename(normalized) === "README.md") return "readme";
  return "document"; // Default fallback
}

function removeFileFromIndex(filePath: string, projectId: string): void {
  const db = getDb();
  if (!db) return;

  const fileType = detectFileType(filePath);

  switch (fileType) {
    case "sprint": {
      const sprint = db.prepare("SELECT id FROM sprints WHERE file_path = ? AND project_id = ?").get(filePath, projectId) as { id: string } | undefined;
      if (sprint) {
        db.prepare("DELETE FROM sprints WHERE id = ? AND project_id = ?").run(sprint.id, projectId);
      }
      break;
    }
    case "finding":
      db.prepare("DELETE FROM findings WHERE file_path = ? AND project_id = ?").run(filePath, projectId);
      break;
    case "document":
      db.prepare("DELETE FROM documents WHERE file_path = ? AND project_id = ?").run(filePath, projectId);
      break;
    case "readme":
      // Don't delete the project — just mark it as needing re-index
      break;
  }

  db.prepare("DELETE FROM file_checksums WHERE file_path = ?").run(filePath);
}

function insertSprint(projectId: string, sprint: Sprint, filePath: string, checksum: string, rawContent: string): void {
  const db = getDb();
  if (!db) return;

  const timestamp = now();

  db.prepare(`
    INSERT OR REPLACE INTO sprints (id, project_id, name, status, version, objective, sprint_type, start_date, end_date, progress, file_path, checksum, indexed_at, raw_content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sprint.id, projectId, sprint.name, sprint.status,
    sprint.version ?? null, sprint.objective ?? null, sprint.sprintType ?? null,
    sprint.startDate ?? null, sprint.endDate ?? null, sprint.progress ?? 0,
    filePath, checksum, timestamp, rawContent
  );

  // Insert tasks
  const insertTask = db.prepare(`
    INSERT OR REPLACE INTO tasks (id, sprint_id, project_id, title, description, priority, status, assignee, task_ref, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const task of sprint.tasks) {
    insertTask.run(
      task.id, sprint.id, projectId, task.title, task.description ?? null,
      task.priority, task.status, task.assignee ?? null, task.taskRef ?? null,
      JSON.stringify(task.tags), task.createdAt, task.updatedAt
    );
  }

  // Insert debt items
  if (sprint.debtItems) {
    const insertDebt = db.prepare(`
      INSERT OR REPLACE INTO debt_items (number, sprint_id, project_id, item, origin, sprint_target, status, resolved_in)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const debt of sprint.debtItems) {
      insertDebt.run(
        debt.number, sprint.id, projectId, debt.item, debt.origin,
        debt.sprintTarget, debt.status, debt.resolvedIn ?? null
      );
    }
  }

  // Update file checksum
  db.prepare(`
    INSERT OR REPLACE INTO file_checksums (file_path, checksum, project_id, file_type, indexed_at)
    VALUES (?, ?, ?, 'sprint', ?)
  `).run(filePath, checksum, projectId, timestamp);
}

function insertFinding(projectId: string, finding: Finding, filePath: string, checksum: string): void {
  const db = getDb();
  if (!db) return;

  const timestamp = now();

  db.prepare(`
    INSERT OR REPLACE INTO findings (id, project_id, number, title, summary, severity, details, affected_files, recommendations, file_path, checksum, indexed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    finding.id, projectId, finding.number, finding.title, finding.summary,
    finding.severity, finding.details, JSON.stringify(finding.affectedFiles),
    JSON.stringify(finding.recommendations), filePath, checksum, timestamp
  );

  db.prepare(`
    INSERT OR REPLACE INTO file_checksums (file_path, checksum, project_id, file_type, indexed_at)
    VALUES (?, ?, ?, 'finding', ?)
  `).run(filePath, checksum, projectId, timestamp);
}

function insertDocument(projectId: string, docId: string, title: string, content: string, filePath: string, checksum: string): void {
  const db = getDb();
  if (!db) return;

  const timestamp = now();

  db.prepare(`
    INSERT OR REPLACE INTO documents (id, project_id, title, content, file_path, checksum, indexed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(docId, projectId, title, content, filePath, checksum, timestamp);

  db.prepare(`
    INSERT OR REPLACE INTO file_checksums (file_path, checksum, project_id, file_type, indexed_at)
    VALUES (?, ?, ?, 'document', ?)
  `).run(filePath, checksum, projectId, timestamp);
}
