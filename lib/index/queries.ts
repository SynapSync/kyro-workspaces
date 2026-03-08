/**
 * Typed query wrappers for the SQLite index.
 * These replace direct filesystem reads for common operations.
 */

import { getDb } from "./sqlite";
import type {
  Task,
  TaskStatus,
  Sprint,
  Finding,
  FindingSeverity,
  DebtItem,
  DebtStatus,
} from "@/lib/types";
import type { SearchEntry, SearchEntryType } from "@/lib/search";

// --- Row Types (SQLite result shapes) ---

interface TaskRow {
  id: string;
  sprint_id: string;
  project_id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  assignee: string | null;
  task_ref: string | null;
  tags: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface SprintRow {
  id: string;
  project_id: string;
  name: string;
  status: string;
  version: string | null;
  objective: string | null;
  sprint_type: string | null;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  file_path: string;
  checksum: string;
  indexed_at: string;
  raw_content: string | null;
}

interface FindingRow {
  id: string;
  project_id: string;
  number: number;
  title: string;
  summary: string;
  severity: string;
  details: string | null;
  affected_files: string | null;
  recommendations: string | null;
  file_path: string;
}

interface DebtRow {
  number: number;
  sprint_id: string;
  project_id: string;
  item: string;
  origin: string;
  sprint_target: string;
  status: string;
  resolved_in: string | null;
}

interface DocumentRow {
  id: string;
  project_id: string;
  title: string;
  content: string | null;
}

// --- Row to Domain Mappers ---

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    priority: row.priority as Task["priority"],
    status: row.status as TaskStatus,
    assignee: row.assignee ?? undefined,
    taskRef: row.task_ref ?? undefined,
    tags: row.tags ? JSON.parse(row.tags) : [],
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
  };
}

function rowToSprint(row: SprintRow): Sprint {
  return {
    id: row.id,
    name: row.name,
    status: row.status as Sprint["status"],
    version: row.version ?? undefined,
    objective: row.objective ?? undefined,
    sprintType: row.sprint_type as Sprint["sprintType"],
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    progress: row.progress,
    tasks: [],
    rawContent: row.raw_content ?? undefined,
  };
}

function rowToFinding(row: FindingRow): Finding {
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    summary: row.summary,
    severity: row.severity as FindingSeverity,
    details: row.details ?? "",
    affectedFiles: row.affected_files ? JSON.parse(row.affected_files) : [],
    recommendations: row.recommendations ? JSON.parse(row.recommendations) : [],
  };
}

function rowToDebt(row: DebtRow): DebtItem {
  return {
    number: row.number,
    item: row.item,
    origin: row.origin,
    sprintTarget: row.sprint_target,
    status: row.status as DebtStatus,
    resolvedIn: row.resolved_in ?? undefined,
  };
}

// --- Query Functions ---

export function queryTasksByStatus(projectId: string, status: TaskStatus): Task[] {
  const db = getDb();
  if (!db) return [];

  const rows = db.prepare(
    "SELECT * FROM tasks WHERE project_id = ? AND status = ?"
  ).all(projectId, status) as TaskRow[];

  return rows.map(rowToTask);
}

export function queryBlockedTasks(projectId?: string): Task[] {
  const db = getDb();
  if (!db) return [];

  if (projectId) {
    const rows = db.prepare(
      "SELECT * FROM tasks WHERE project_id = ? AND status = 'blocked'"
    ).all(projectId) as TaskRow[];
    return rows.map(rowToTask);
  }

  const rows = db.prepare(
    "SELECT * FROM tasks WHERE status = 'blocked'"
  ).all() as TaskRow[];
  return rows.map(rowToTask);
}

export function querySprintsByProject(projectId: string): Sprint[] {
  const db = getDb();
  if (!db) return [];

  const sprintRows = db.prepare(
    "SELECT * FROM sprints WHERE project_id = ? ORDER BY id"
  ).all(projectId) as SprintRow[];

  return sprintRows.map((row) => {
    const sprint = rowToSprint(row);
    const taskRows = db.prepare(
      "SELECT * FROM tasks WHERE sprint_id = ? AND project_id = ?"
    ).all(row.id, projectId) as TaskRow[];
    sprint.tasks = taskRows.map(rowToTask);
    return sprint;
  });
}

export function queryFindingsBySeverity(projectId: string, severity: FindingSeverity): Finding[] {
  const db = getDb();
  if (!db) return [];

  const rows = db.prepare(
    "SELECT * FROM findings WHERE project_id = ? AND severity = ? ORDER BY number"
  ).all(projectId, severity) as FindingRow[];

  return rows.map(rowToFinding);
}

export function queryAllFindings(projectId: string): Finding[] {
  const db = getDb();
  if (!db) return [];

  const rows = db.prepare(
    "SELECT * FROM findings WHERE project_id = ? ORDER BY number"
  ).all(projectId) as FindingRow[];

  return rows.map(rowToFinding);
}

export function queryDebtItems(status?: DebtStatus): DebtItem[] {
  const db = getDb();
  if (!db) return [];

  if (status) {
    // Get latest version of each debt item (from the latest sprint)
    const rows = db.prepare(`
      SELECT d.* FROM debt_items d
      INNER JOIN (
        SELECT number, project_id, MAX(sprint_id) as latest_sprint
        FROM debt_items
        WHERE status = ?
        GROUP BY number, project_id
      ) latest ON d.number = latest.number AND d.project_id = latest.project_id AND d.sprint_id = latest.latest_sprint
      ORDER BY d.number
    `).all(status) as DebtRow[];
    return rows.map(rowToDebt);
  }

  // Get latest version of all debt items
  const rows = db.prepare(`
    SELECT d.* FROM debt_items d
    INNER JOIN (
      SELECT number, project_id, MAX(sprint_id) as latest_sprint
      FROM debt_items
      GROUP BY number, project_id
    ) latest ON d.number = latest.number AND d.project_id = latest.project_id AND d.sprint_id = latest.latest_sprint
    ORDER BY d.number
  `).all() as DebtRow[];

  return rows.map(rowToDebt);
}

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  totalSprints: number;
  totalTasks: number;
  tasksByStatus: Record<string, number>;
  totalFindings: number;
  totalDocuments: number;
  openDebt: number;
}

export function queryProjectSummary(projectId: string): ProjectSummary | null {
  const db = getDb();
  if (!db) return null;

  const project = db.prepare("SELECT id, name FROM projects WHERE id = ?").get(projectId) as { id: string; name: string } | undefined;
  if (!project) return null;

  const sprintCount = db.prepare("SELECT COUNT(*) as count FROM sprints WHERE project_id = ?").get(projectId) as { count: number };
  const taskCount = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE project_id = ?").get(projectId) as { count: number };
  const findingCount = db.prepare("SELECT COUNT(*) as count FROM findings WHERE project_id = ?").get(projectId) as { count: number };
  const documentCount = db.prepare("SELECT COUNT(*) as count FROM documents WHERE project_id = ?").get(projectId) as { count: number };

  // Tasks by status
  const statusRows = db.prepare(
    "SELECT status, COUNT(*) as count FROM tasks WHERE project_id = ? GROUP BY status"
  ).all(projectId) as { status: string; count: number }[];
  const tasksByStatus: Record<string, number> = {};
  for (const row of statusRows) {
    tasksByStatus[row.status] = row.count;
  }

  // Open debt count (latest version per debt item)
  const openDebt = db.prepare(`
    SELECT COUNT(DISTINCT d.number) as count FROM debt_items d
    INNER JOIN (
      SELECT number, project_id, MAX(sprint_id) as latest_sprint
      FROM debt_items
      WHERE project_id = ?
      GROUP BY number, project_id
    ) latest ON d.number = latest.number AND d.project_id = latest.project_id AND d.sprint_id = latest.latest_sprint
    WHERE d.status IN ('open', 'in-progress')
  `).get(projectId) as { count: number };

  return {
    projectId: project.id,
    projectName: project.name,
    totalSprints: sprintCount.count,
    totalTasks: taskCount.count,
    tasksByStatus,
    totalFindings: findingCount.count,
    totalDocuments: documentCount.count,
    openDebt: openDebt.count,
  };
}

// --- Full-Text Search ---

export interface SearchOptions {
  type?: SearchEntryType;
  projectId?: string;
  limit?: number;
}

export function searchIndex(query: string, options: SearchOptions = {}): SearchEntry[] {
  const db = getDb();
  if (!db) return [];

  const results: SearchEntry[] = [];
  const limit = options.limit ?? 50;

  // Escape FTS5 special characters and add prefix matching
  const ftsQuery = query
    .replace(/['"]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => `"${term}"*`)
    .join(" ");

  if (!ftsQuery) return [];

  // Search tasks
  if (!options.type || options.type === "task") {
    let sql = `
      SELECT t.*, tf.rank
      FROM tasks_fts tf
      JOIN tasks t ON t.rowid = tf.rowid
      WHERE tasks_fts MATCH ?
    `;
    const params: (string | number)[] = [ftsQuery];
    if (options.projectId) {
      sql += " AND t.project_id = ?";
      params.push(options.projectId);
    }
    sql += " ORDER BY tf.rank LIMIT ?";
    params.push(limit);

    const rows = db.prepare(sql).all(...params) as (TaskRow & { rank: number })[];
    for (const row of rows) {
      const projectName = getProjectName(row.project_id);
      results.push({
        type: "task",
        title: row.title,
        description: row.description ?? "",
        metadata: { status: row.status, priority: row.priority, ...(row.task_ref ? { taskRef: row.task_ref } : {}) },
        projectId: row.project_id,
        projectName,
        navigateTo: `/${row.project_id}/sprints/${row.sprint_id}/detail`,
      });
    }
  }

  // Search sprints
  if (!options.type || options.type === "sprint") {
    let sql = `
      SELECT s.*, sf.rank
      FROM sprints_fts sf
      JOIN sprints s ON s.rowid = sf.rowid
      WHERE sprints_fts MATCH ?
    `;
    const params: (string | number)[] = [ftsQuery];
    if (options.projectId) {
      sql += " AND s.project_id = ?";
      params.push(options.projectId);
    }
    sql += " ORDER BY sf.rank LIMIT ?";
    params.push(limit);

    const rows = db.prepare(sql).all(...params) as (SprintRow & { rank: number })[];
    for (const row of rows) {
      const projectName = getProjectName(row.project_id);
      results.push({
        type: "sprint",
        title: row.name,
        description: row.objective ?? "",
        metadata: { status: row.status, ...(row.sprint_type ? { sprintType: row.sprint_type } : {}), ...(row.version ? { version: row.version } : {}) },
        projectId: row.project_id,
        projectName,
        navigateTo: `/${row.project_id}/sprints/${row.id}/detail`,
      });
    }
  }

  // Search findings
  if (!options.type || options.type === "finding") {
    let sql = `
      SELECT f.*, ff.rank
      FROM findings_fts ff
      JOIN findings f ON f.rowid = ff.rowid
      WHERE findings_fts MATCH ?
    `;
    const params: (string | number)[] = [ftsQuery];
    if (options.projectId) {
      sql += " AND f.project_id = ?";
      params.push(options.projectId);
    }
    sql += " ORDER BY ff.rank LIMIT ?";
    params.push(limit);

    const rows = db.prepare(sql).all(...params) as (FindingRow & { rank: number })[];
    for (const row of rows) {
      const projectName = getProjectName(row.project_id);
      results.push({
        type: "finding",
        title: `#${String(row.number).padStart(2, "0")} ${row.title}`,
        description: row.summary,
        metadata: { severity: row.severity, files: String(row.affected_files ? JSON.parse(row.affected_files).length : 0) },
        projectId: row.project_id,
        projectName,
        navigateTo: `/${row.project_id}/findings?finding=${row.id}`,
      });
    }
  }

  // Search documents
  if (!options.type || options.type === "document") {
    let sql = `
      SELECT d.*, df.rank
      FROM documents_fts df
      JOIN documents d ON d.rowid = df.rowid
      WHERE documents_fts MATCH ?
    `;
    const params: (string | number)[] = [ftsQuery];
    if (options.projectId) {
      sql += " AND d.project_id = ?";
      params.push(options.projectId);
    }
    sql += " ORDER BY df.rank LIMIT ?";
    params.push(limit);

    const rows = db.prepare(sql).all(...params) as (DocumentRow & { rank: number })[];
    for (const row of rows) {
      const projectName = getProjectName(row.project_id);
      results.push({
        type: "document",
        title: row.title,
        description: (row.content ?? "").slice(0, 200),
        metadata: {},
        projectId: row.project_id,
        projectName,
        navigateTo: `/${row.project_id}/documents`,
      });
    }
  }

  return results;
}

// --- Helpers ---

function getProjectName(projectId: string): string {
  const db = getDb();
  if (!db) return projectId;
  const row = db.prepare("SELECT name FROM projects WHERE id = ?").get(projectId) as { name: string } | undefined;
  return row?.name ?? projectId;
}
