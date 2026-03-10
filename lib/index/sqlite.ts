import Database from "better-sqlite3";
import path from "path";

// --- Types ---

export interface IndexConfig {
  /** Directory for the SQLite database file */
  dbDir: string;
  /** Database filename (default: "kyro-index.db") */
  dbName?: string;
  /** Enable WAL mode for concurrent reads (default: true) */
  walMode?: boolean;
}

// --- Singleton ---

let db: Database.Database | null = null;
let indexAvailable = false;

/**
 * Get the database instance. Returns null if not initialized.
 */
export function getDb(): Database.Database | null {
  return db;
}

/**
 * Whether the SQLite index is available for queries.
 * Used by the service factory to decide between index and file service.
 */
export function isIndexAvailable(): boolean {
  return indexAvailable;
}

/**
 * Open (or create) the SQLite database and initialize the schema.
 * Called once during application startup.
 */
export function openDatabase(config: IndexConfig): Database.Database {
  const dbName = config.dbName ?? "kyro-index.db";
  const dbPath = path.join(config.dbDir, dbName);

  db = new Database(dbPath);

  // Performance pragmas
  if (config.walMode !== false) {
    db.pragma("journal_mode = WAL");
  }
  db.pragma("synchronous = NORMAL");
  db.pragma("cache_size = -64000"); // 64MB cache
  db.pragma("foreign_keys = ON");

  createSchema(db);
  indexAvailable = true;

  return db;
}

/**
 * Close the database connection. Called during shutdown.
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    indexAvailable = false;
  }
}

// --- Schema ---

function createSchema(database: Database.Database): void {
  database.exec(`
    -- Projects table
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      color TEXT,
      readme_path TEXT,
      file_path TEXT NOT NULL,
      checksum TEXT NOT NULL,
      indexed_at TEXT NOT NULL
    );

    -- Sprints table
    CREATE TABLE IF NOT EXISTS sprints (
      id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'planned',
      version TEXT,
      objective TEXT,
      sprint_type TEXT,
      start_date TEXT,
      end_date TEXT,
      progress INTEGER DEFAULT 0,
      file_path TEXT NOT NULL,
      checksum TEXT NOT NULL,
      indexed_at TEXT NOT NULL,
      raw_content TEXT,
      PRIMARY KEY (id, project_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    -- Tasks table
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT NOT NULL,
      sprint_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'pending',
      assignee TEXT,
      task_ref TEXT,
      tags TEXT, -- JSON array
      created_at TEXT,
      updated_at TEXT,
      PRIMARY KEY (id, sprint_id, project_id),
      FOREIGN KEY (sprint_id, project_id) REFERENCES sprints(id, project_id) ON DELETE CASCADE
    );

    -- Findings table
    CREATE TABLE IF NOT EXISTS findings (
      id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      number INTEGER NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'medium',
      details TEXT,
      affected_files TEXT, -- JSON array
      recommendations TEXT, -- JSON array
      file_path TEXT NOT NULL,
      checksum TEXT NOT NULL,
      indexed_at TEXT NOT NULL,
      PRIMARY KEY (id, project_id)
    );

    -- Debt items table
    CREATE TABLE IF NOT EXISTS debt_items (
      number INTEGER NOT NULL,
      sprint_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      item TEXT NOT NULL,
      origin TEXT NOT NULL,
      sprint_target TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      resolved_in TEXT,
      PRIMARY KEY (number, sprint_id, project_id),
      FOREIGN KEY (sprint_id, project_id) REFERENCES sprints(id, project_id) ON DELETE CASCADE
    );

    -- Documents table
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      file_path TEXT,
      checksum TEXT,
      indexed_at TEXT NOT NULL,
      PRIMARY KEY (id, project_id)
    );

    -- Indexes for common query patterns
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_sprint ON tasks(sprint_id, project_id);
    CREATE INDEX IF NOT EXISTS idx_sprints_project ON sprints(project_id);
    CREATE INDEX IF NOT EXISTS idx_findings_project ON findings(project_id);
    CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
    CREATE INDEX IF NOT EXISTS idx_debt_items_status ON debt_items(status);
    CREATE INDEX IF NOT EXISTS idx_debt_items_project ON debt_items(project_id);
    CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);

    -- File checksums for incremental invalidation
    CREATE TABLE IF NOT EXISTS file_checksums (
      file_path TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      project_id TEXT NOT NULL,
      file_type TEXT NOT NULL, -- 'sprint', 'finding', 'document', 'readme'
      indexed_at TEXT NOT NULL
    );

    -- FTS5 virtual tables for full-text search
    CREATE VIRTUAL TABLE IF NOT EXISTS tasks_fts USING fts5(
      title, description, content='tasks', content_rowid='rowid'
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS findings_fts USING fts5(
      title, summary, details, content='findings', content_rowid='rowid'
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
      title, content, content='documents', content_rowid='rowid'
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS sprints_fts USING fts5(
      name, objective, content='sprints', content_rowid='rowid'
    );

    -- FTS triggers to keep virtual tables in sync
    CREATE TRIGGER IF NOT EXISTS tasks_ai AFTER INSERT ON tasks BEGIN
      INSERT INTO tasks_fts(rowid, title, description) VALUES (new.rowid, new.title, new.description);
    END;
    CREATE TRIGGER IF NOT EXISTS tasks_ad AFTER DELETE ON tasks BEGIN
      INSERT INTO tasks_fts(tasks_fts, rowid, title, description) VALUES ('delete', old.rowid, old.title, old.description);
    END;
    CREATE TRIGGER IF NOT EXISTS tasks_au AFTER UPDATE ON tasks BEGIN
      INSERT INTO tasks_fts(tasks_fts, rowid, title, description) VALUES ('delete', old.rowid, old.title, old.description);
      INSERT INTO tasks_fts(rowid, title, description) VALUES (new.rowid, new.title, new.description);
    END;

    CREATE TRIGGER IF NOT EXISTS findings_ai AFTER INSERT ON findings BEGIN
      INSERT INTO findings_fts(rowid, title, summary, details) VALUES (new.rowid, new.title, new.summary, new.details);
    END;
    CREATE TRIGGER IF NOT EXISTS findings_ad AFTER DELETE ON findings BEGIN
      INSERT INTO findings_fts(findings_fts, rowid, title, summary, details) VALUES ('delete', old.rowid, old.title, old.summary, old.details);
    END;
    CREATE TRIGGER IF NOT EXISTS findings_au AFTER UPDATE ON findings BEGIN
      INSERT INTO findings_fts(findings_fts, rowid, title, summary, details) VALUES ('delete', old.rowid, old.title, old.summary, old.details);
      INSERT INTO findings_fts(rowid, title, summary, details) VALUES (new.rowid, new.title, new.summary, new.details);
    END;

    CREATE TRIGGER IF NOT EXISTS documents_ai AFTER INSERT ON documents BEGIN
      INSERT INTO documents_fts(rowid, title, content) VALUES (new.rowid, new.title, new.content);
    END;
    CREATE TRIGGER IF NOT EXISTS documents_ad AFTER DELETE ON documents BEGIN
      INSERT INTO documents_fts(documents_fts, rowid, title, content) VALUES ('delete', old.rowid, old.title, old.content);
    END;
    CREATE TRIGGER IF NOT EXISTS documents_au AFTER UPDATE ON documents BEGIN
      INSERT INTO documents_fts(documents_fts, rowid, title, content) VALUES ('delete', old.rowid, old.title, old.content);
      INSERT INTO documents_fts(rowid, title, content) VALUES (new.rowid, new.title, new.content);
    END;

    CREATE TRIGGER IF NOT EXISTS sprints_ai AFTER INSERT ON sprints BEGIN
      INSERT INTO sprints_fts(rowid, name, objective) VALUES (new.rowid, new.name, new.objective);
    END;
    CREATE TRIGGER IF NOT EXISTS sprints_ad AFTER DELETE ON sprints BEGIN
      INSERT INTO sprints_fts(sprints_fts, rowid, name, objective) VALUES ('delete', old.rowid, old.name, old.objective);
    END;
    CREATE TRIGGER IF NOT EXISTS sprints_au AFTER UPDATE ON sprints BEGIN
      INSERT INTO sprints_fts(sprints_fts, rowid, name, objective) VALUES ('delete', old.rowid, old.name, old.objective);
      INSERT INTO sprints_fts(rowid, name, objective) VALUES (new.rowid, new.name, new.objective);
    END;
  `);
}
