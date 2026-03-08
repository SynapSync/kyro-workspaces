import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { openDatabase, closeDatabase, getDb, isIndexAvailable } from "../sqlite";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";

describe("SQLite Index", () => {
  const testDbDir = path.join(os.tmpdir(), `kyro-test-${Date.now()}`);

  beforeEach(() => {
    fs.mkdirSync(testDbDir, { recursive: true });
  });

  afterEach(() => {
    closeDatabase();
    fs.rmSync(testDbDir, { recursive: true, force: true });
  });

  describe("openDatabase", () => {
    it("creates database and initializes schema", () => {
      const db = openDatabase({ dbDir: testDbDir });
      expect(db).toBeDefined();
      expect(isIndexAvailable()).toBe(true);

      // Verify core tables exist
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .all() as { name: string }[];
      const tableNames = tables.map((t) => t.name);

      expect(tableNames).toContain("projects");
      expect(tableNames).toContain("sprints");
      expect(tableNames).toContain("tasks");
      expect(tableNames).toContain("findings");
      expect(tableNames).toContain("debt_items");
      expect(tableNames).toContain("documents");
      expect(tableNames).toContain("file_checksums");
    });

    it("creates FTS5 virtual tables", () => {
      const db = openDatabase({ dbDir: testDbDir });
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .all() as { name: string }[];
      const tableNames = tables.map((t) => t.name);

      expect(tableNames).toContain("tasks_fts");
      expect(tableNames).toContain("findings_fts");
      expect(tableNames).toContain("documents_fts");
      expect(tableNames).toContain("sprints_fts");
    });

    it("enables WAL mode by default", () => {
      const db = openDatabase({ dbDir: testDbDir });
      const result = db.pragma("journal_mode") as { journal_mode: string }[];
      expect(result[0].journal_mode).toBe("wal");
    });

    it("sets foreign keys on", () => {
      const db = openDatabase({ dbDir: testDbDir });
      const result = db.pragma("foreign_keys") as { foreign_keys: number }[];
      expect(result[0].foreign_keys).toBe(1);
    });
  });

  describe("getDb", () => {
    it("returns null before initialization", () => {
      expect(getDb()).toBeNull();
    });

    it("returns database after initialization", () => {
      openDatabase({ dbDir: testDbDir });
      expect(getDb()).toBeDefined();
    });
  });

  describe("closeDatabase", () => {
    it("clears the database and sets index unavailable", () => {
      openDatabase({ dbDir: testDbDir });
      expect(isIndexAvailable()).toBe(true);

      closeDatabase();
      expect(getDb()).toBeNull();
      expect(isIndexAvailable()).toBe(false);
    });
  });

  describe("schema structure", () => {
    it("projects table has correct columns", () => {
      const db = openDatabase({ dbDir: testDbDir });
      const columns = db.pragma("table_info(projects)") as { name: string }[];
      const colNames = columns.map((c) => c.name);

      expect(colNames).toContain("id");
      expect(colNames).toContain("name");
      expect(colNames).toContain("description");
      expect(colNames).toContain("color");
      expect(colNames).toContain("file_path");
      expect(colNames).toContain("checksum");
      expect(colNames).toContain("indexed_at");
    });

    it("tasks table has correct columns including task_ref", () => {
      const db = openDatabase({ dbDir: testDbDir });
      const columns = db.pragma("table_info(tasks)") as { name: string }[];
      const colNames = columns.map((c) => c.name);

      expect(colNames).toContain("id");
      expect(colNames).toContain("sprint_id");
      expect(colNames).toContain("project_id");
      expect(colNames).toContain("title");
      expect(colNames).toContain("status");
      expect(colNames).toContain("priority");
      expect(colNames).toContain("task_ref");
    });

    it("sprints table has file_path and checksum for invalidation", () => {
      const db = openDatabase({ dbDir: testDbDir });
      const columns = db.pragma("table_info(sprints)") as { name: string }[];
      const colNames = columns.map((c) => c.name);

      expect(colNames).toContain("file_path");
      expect(colNames).toContain("checksum");
      expect(colNames).toContain("indexed_at");
    });

    it("indexes exist for common query patterns", () => {
      const db = openDatabase({ dbDir: testDbDir });
      const indexes = db
        .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
        .all() as { name: string }[];
      const indexNames = indexes.map((i) => i.name);

      expect(indexNames).toContain("idx_tasks_status");
      expect(indexNames).toContain("idx_tasks_project");
      expect(indexNames).toContain("idx_sprints_project");
      expect(indexNames).toContain("idx_findings_severity");
    });
  });

  describe("FTS5 triggers", () => {
    it("auto-populates FTS on task insert", () => {
      const db = openDatabase({ dbDir: testDbDir });

      // Insert project first (foreign key)
      db.prepare(`INSERT INTO projects (id, name, description, file_path, checksum, indexed_at)
        VALUES ('proj1', 'Test Project', 'desc', '/tmp/proj', 'abc123', '2026-01-01')`).run();

      // Insert sprint
      db.prepare(`INSERT INTO sprints (id, project_id, name, status, file_path, checksum, indexed_at)
        VALUES ('sprint1', 'proj1', 'Sprint 1', 'active', '/tmp/sprint.md', 'def456', '2026-01-01')`).run();

      // Insert task
      db.prepare(`INSERT INTO tasks (id, sprint_id, project_id, title, description, priority, status, created_at, updated_at)
        VALUES ('task1', 'sprint1', 'proj1', 'Fix authentication bug', 'The login flow fails', 'high', 'pending', '2026-01-01', '2026-01-01')`).run();

      // FTS should find it
      const results = db.prepare("SELECT * FROM tasks_fts WHERE tasks_fts MATCH 'authentication'").all();
      expect(results.length).toBe(1);
    });

    it("auto-removes FTS on task delete", () => {
      const db = openDatabase({ dbDir: testDbDir });

      db.prepare(`INSERT INTO projects (id, name, description, file_path, checksum, indexed_at)
        VALUES ('proj1', 'Test Project', 'desc', '/tmp/proj', 'abc123', '2026-01-01')`).run();
      db.prepare(`INSERT INTO sprints (id, project_id, name, status, file_path, checksum, indexed_at)
        VALUES ('sprint1', 'proj1', 'Sprint 1', 'active', '/tmp/sprint.md', 'def456', '2026-01-01')`).run();
      db.prepare(`INSERT INTO tasks (id, sprint_id, project_id, title, description, priority, status, created_at, updated_at)
        VALUES ('task1', 'sprint1', 'proj1', 'Fix authentication bug', 'Login fails', 'high', 'pending', '2026-01-01', '2026-01-01')`).run();

      // Delete task
      db.prepare("DELETE FROM tasks WHERE id = 'task1'").run();

      // FTS should be empty
      const results = db.prepare("SELECT * FROM tasks_fts WHERE tasks_fts MATCH 'authentication'").all();
      expect(results.length).toBe(0);
    });

    it("auto-updates FTS on task update", () => {
      const db = openDatabase({ dbDir: testDbDir });

      db.prepare(`INSERT INTO projects (id, name, description, file_path, checksum, indexed_at)
        VALUES ('proj1', 'Test Project', 'desc', '/tmp/proj', 'abc123', '2026-01-01')`).run();
      db.prepare(`INSERT INTO sprints (id, project_id, name, status, file_path, checksum, indexed_at)
        VALUES ('sprint1', 'proj1', 'Sprint 1', 'active', '/tmp/sprint.md', 'def456', '2026-01-01')`).run();
      db.prepare(`INSERT INTO tasks (id, sprint_id, project_id, title, description, priority, status, created_at, updated_at)
        VALUES ('task1', 'sprint1', 'proj1', 'Fix authentication bug', 'Login fails', 'high', 'pending', '2026-01-01', '2026-01-01')`).run();

      // Update title
      db.prepare("UPDATE tasks SET title = 'Fix authorization logic' WHERE id = 'task1'").run();

      // Old term should not match
      const oldResults = db.prepare("SELECT * FROM tasks_fts WHERE tasks_fts MATCH 'authentication'").all();
      expect(oldResults.length).toBe(0);

      // New term should match
      const newResults = db.prepare("SELECT * FROM tasks_fts WHERE tasks_fts MATCH 'authorization'").all();
      expect(newResults.length).toBe(1);
    });
  });
});
