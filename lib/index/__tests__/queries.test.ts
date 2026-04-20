import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { openDatabase, closeDatabase, getDb } from "../sqlite";
import {
  queryTasksByStatus,
  queryBlockedTasks,
  querySprintsByProject,
  queryFindingsBySeverity,
  queryAllFindings,
  queryDebtItems,
  queryProjectSummary,
  searchIndex,
} from "../queries";

function seedTestData() {
  const database = getDb();
  if (!database) throw new Error("DB not initialized");

  // Project
  database.prepare(`INSERT INTO projects (id, name, description, file_path, checksum, indexed_at)
    VALUES ('kyro', 'Kyro', 'Sprint viewer', '/tmp/kyro', 'abc', '2026-01-01')`).run();

  database.prepare(`INSERT INTO projects (id, name, description, file_path, checksum, indexed_at)
    VALUES ('other', 'Other', 'Another project', '/tmp/other', 'def', '2026-01-01')`).run();

  // Sprints
  database.prepare(`INSERT INTO sprints (id, project_id, name, status, version, objective, sprint_type, file_path, checksum, indexed_at)
    VALUES ('sprint-1', 'kyro', 'Sprint 1 — AST Writer', 'closed', '3.1.0', 'Replace regex writes with AST', 'refactor', '/tmp/s1.md', 'c1', '2026-01-01')`).run();

  database.prepare(`INSERT INTO sprints (id, project_id, name, status, version, objective, sprint_type, file_path, checksum, indexed_at)
    VALUES ('sprint-2', 'kyro', 'Sprint 2 — E2E Tests', 'active', '3.1.1', 'Fix E2E tests', 'debt', '/tmp/s2.md', 'c2', '2026-01-01')`).run();

  // Tasks
  const insertTask = database.prepare(`INSERT INTO tasks (id, sprint_id, project_id, title, description, priority, status, task_ref, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  insertTask.run("t1", "sprint-1", "kyro", "Implement AST parser", "Build the parser", "high", "done", "T1.1", "[]", "2026-01-01", "2026-01-01");
  insertTask.run("t2", "sprint-1", "kyro", "Write unit tests", "Test coverage", "medium", "done", "T1.2", "[]", "2026-01-01", "2026-01-01");
  insertTask.run("t3", "sprint-2", "kyro", "Fix Playwright config", "Production build", "high", "blocked", "T2.1", "[]", "2026-01-01", "2026-01-01");
  insertTask.run("t4", "sprint-2", "kyro", "Add finding drill-down test", "E2E coverage", "medium", "pending", "T2.2", "[]", "2026-01-01", "2026-01-01");

  // Findings
  database.prepare(`INSERT INTO findings (id, project_id, number, title, summary, severity, details, affected_files, recommendations, file_path, checksum, indexed_at)
    VALUES ('f1', 'kyro', 1, 'AST Writer Regex', 'Regex writes are fragile', 'high', 'Details here', '["lib/ast.ts"]', '["Use unified"]', '/tmp/f1.md', 'fc1', '2026-01-01')`).run();

  database.prepare(`INSERT INTO findings (id, project_id, number, title, summary, severity, details, affected_files, recommendations, file_path, checksum, indexed_at)
    VALUES ('f2', 'kyro', 2, 'E2E Tests Outdated', 'Tests are broken', 'medium', 'Many failures', '["tests/"]', '["Fix helpers"]', '/tmp/f2.md', 'fc2', '2026-01-01')`).run();

  // Debt items
  database.prepare(`INSERT INTO debt_items (number, sprint_id, project_id, item, origin, sprint_target, status, resolved_in)
    VALUES (1, 'sprint-1', 'kyro', 'AI tests missing', 'Predecessor', 'Sprint 2', 'resolved', 'Sprint 2')`).run();
  database.prepare(`INSERT INTO debt_items (number, sprint_id, project_id, item, origin, sprint_target, status, resolved_in)
    VALUES (2, 'sprint-1', 'kyro', 'Action chaining', 'Predecessor', 'Sprint 5', 'open', NULL)`).run();
  database.prepare(`INSERT INTO debt_items (number, sprint_id, project_id, item, origin, sprint_target, status, resolved_in)
    VALUES (1, 'sprint-2', 'kyro', 'AI tests missing', 'Predecessor', 'Sprint 2', 'resolved', 'Sprint 2')`).run();
  database.prepare(`INSERT INTO debt_items (number, sprint_id, project_id, item, origin, sprint_target, status, resolved_in)
    VALUES (2, 'sprint-2', 'kyro', 'Action chaining', 'Predecessor', 'Sprint 5', 'open', NULL)`).run();

  // Documents
  database.prepare(`INSERT INTO documents (id, project_id, title, content, file_path, checksum, indexed_at)
    VALUES ('arch', 'kyro', 'architecture', 'The system uses Next.js with SQLite', '/tmp/arch.md', 'dc1', '2026-01-01')`).run();
}

describe("Query Layer", () => {
  const testDbDir = path.join(os.tmpdir(), `kyro-query-test-${Date.now()}`);

  beforeEach(() => {
    fs.mkdirSync(testDbDir, { recursive: true });
    openDatabase({ dbDir: testDbDir });
    seedTestData();
  });

  afterEach(() => {
    closeDatabase();
    fs.rmSync(testDbDir, { recursive: true, force: true });
  });

  describe("queryTasksByStatus", () => {
    it("returns tasks with matching status", () => {
      const tasks = queryTasksByStatus("kyro", "done");
      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe("Implement AST parser");
      expect(tasks[1].title).toBe("Write unit tests");
    });

    it("returns empty for non-matching status", () => {
      const tasks = queryTasksByStatus("kyro", "skipped");
      expect(tasks).toHaveLength(0);
    });

    it("filters by project", () => {
      const tasks = queryTasksByStatus("other", "done");
      expect(tasks).toHaveLength(0);
    });
  });

  describe("queryBlockedTasks", () => {
    it("returns blocked tasks for project", () => {
      const tasks = queryBlockedTasks("kyro");
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe("Fix Playwright config");
    });

    it("returns all blocked tasks across projects", () => {
      const tasks = queryBlockedTasks();
      expect(tasks).toHaveLength(1);
    });
  });

  describe("querySprintsByProject", () => {
    it("returns sprints with tasks populated", () => {
      const sprints = querySprintsByProject("kyro");
      expect(sprints).toHaveLength(2);
      expect(sprints[0].name).toBe("Sprint 1 — AST Writer");
      expect(sprints[0].tasks).toHaveLength(2);
      expect(sprints[1].tasks).toHaveLength(2);
    });

    it("returns empty for unknown project", () => {
      const sprints = querySprintsByProject("nonexistent");
      expect(sprints).toHaveLength(0);
    });
  });

  describe("queryFindingsBySeverity", () => {
    it("returns findings matching severity", () => {
      const findings = queryFindingsBySeverity("kyro", "high");
      expect(findings).toHaveLength(1);
      expect(findings[0].title).toBe("AST Writer Regex");
    });

    it("returns empty for non-matching severity", () => {
      const findings = queryFindingsBySeverity("kyro", "critical");
      expect(findings).toHaveLength(0);
    });
  });

  describe("queryAllFindings", () => {
    it("returns all findings for a project", () => {
      const findings = queryAllFindings("kyro");
      expect(findings).toHaveLength(2);
      expect(findings[0].affectedFiles).toEqual(["lib/ast.ts"]);
    });
  });

  describe("queryDebtItems", () => {
    it("returns latest version of each debt item", () => {
      const items = queryDebtItems();
      expect(items).toHaveLength(2);
    });

    it("filters by status", () => {
      const open = queryDebtItems("open");
      expect(open).toHaveLength(1);
      expect(open[0].item).toBe("Action chaining");

      const resolved = queryDebtItems("resolved");
      expect(resolved).toHaveLength(1);
      expect(resolved[0].item).toBe("AI tests missing");
    });
  });

  describe("queryProjectSummary", () => {
    it("returns project summary with counts", () => {
      const summary = queryProjectSummary("kyro");
      expect(summary).not.toBeNull();
      expect(summary!.projectName).toBe("Kyro");
      expect(summary!.totalSprints).toBe(2);
      expect(summary!.totalTasks).toBe(4);
      expect(summary!.totalFindings).toBe(2);
      expect(summary!.totalDocuments).toBe(1);
      expect(summary!.tasksByStatus).toHaveProperty("done", 2);
      expect(summary!.tasksByStatus).toHaveProperty("blocked", 1);
      expect(summary!.tasksByStatus).toHaveProperty("pending", 1);
    });

    it("returns null for unknown project", () => {
      expect(queryProjectSummary("nonexistent")).toBeNull();
    });
  });
});

describe("FTS5 Search", () => {
  const testDbDir = path.join(os.tmpdir(), `kyro-fts-test-${Date.now()}`);

  beforeEach(() => {
    fs.mkdirSync(testDbDir, { recursive: true });
    openDatabase({ dbDir: testDbDir });
    seedTestData();
  });

  afterEach(() => {
    closeDatabase();
    fs.rmSync(testDbDir, { recursive: true, force: true });
  });

  it("searches tasks by title", () => {
    const results = searchIndex("AST parser");
    const tasks = results.filter((r) => r.type === "task");
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0].title).toBe("Implement AST parser");
  });

  it("searches sprints by name", () => {
    const results = searchIndex("E2E Tests");
    const sprints = results.filter((r) => r.type === "sprint");
    expect(sprints.length).toBeGreaterThan(0);
  });

  it("searches findings by summary", () => {
    const results = searchIndex("fragile");
    const findings = results.filter((r) => r.type === "finding");
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].title).toContain("AST Writer Regex");
  });

  it("searches documents by content", () => {
    const results = searchIndex("SQLite");
    const docs = results.filter((r) => r.type === "document");
    expect(docs.length).toBeGreaterThan(0);
  });

  it("filters by type", () => {
    const results = searchIndex("AST", { type: "sprint" });
    expect(results.every((r) => r.type === "sprint")).toBe(true);
  });

  it("filters by project", () => {
    const results = searchIndex("AST", { projectId: "other" });
    expect(results).toHaveLength(0);
  });

  it("returns empty for no matches", () => {
    const results = searchIndex("xyznonexistent");
    expect(results).toHaveLength(0);
  });

  it("handles empty query", () => {
    const results = searchIndex("");
    expect(results).toHaveLength(0);
  });

  it("handles special characters", () => {
    const results = searchIndex("test's");
    // Should not throw, may return results
    expect(Array.isArray(results)).toBe(true);
  });

  it("returns SearchEntry with correct navigateTo paths", () => {
    const results = searchIndex("Playwright");
    const task = results.find((r) => r.type === "task");
    expect(task).toBeDefined();
    expect(task!.navigateTo).toBe("/kyro/sprints/sprint-2/detail");
  });
});
