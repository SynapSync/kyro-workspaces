import { describe, it, expect } from "vitest";
import type { Task, TaskStatus } from "@/lib/types";

/**
 * Board filter logic — extracted from sprint-board.tsx for testability.
 * This mirrors the filtering in the `columnTasks` useMemo.
 */
function filterTasks(
  tasks: Task[],
  searchQuery: string,
  activeStatusFilters: Set<TaskStatus>,
): Record<TaskStatus, Task[]> {
  const map: Record<TaskStatus, Task[]> = {
    pending: [],
    in_progress: [],
    done: [],
    blocked: [],
    skipped: [],
    carry_over: [],
  };

  const query = searchQuery.trim().toLowerCase();

  tasks.forEach((task) => {
    if (activeStatusFilters.size > 0 && !activeStatusFilters.has(task.status)) return;
    if (query && !task.title.toLowerCase().includes(query)) return;

    const bucket = map[task.status];
    if (bucket) {
      bucket.push(task);
    } else {
      map.pending.push(task);
    }
  });

  return map;
}

function makeTask(overrides: Partial<Task> & { id: string; title: string; status: TaskStatus }): Task {
  return {
    tags: [],
    description: "",
    phase: "",
    evidence: "",
    ...overrides,
  };
}

const TASKS: Task[] = [
  makeTask({ id: "t1", title: "Implement login form", status: "done" }),
  makeTask({ id: "t2", title: "Fix navigation bug", status: "in_progress" }),
  makeTask({ id: "t3", title: "Add unit tests for login", status: "pending" }),
  makeTask({ id: "t4", title: "Update documentation", status: "pending" }),
  makeTask({ id: "t5", title: "Deploy to staging", status: "blocked" }),
  makeTask({ id: "t6", title: "Review pull request", status: "skipped" }),
];

describe("board filter logic", () => {
  it("returns all tasks when no filters are active", () => {
    const result = filterTasks(TASKS, "", new Set());
    expect(result.done).toHaveLength(1);
    expect(result.in_progress).toHaveLength(1);
    expect(result.pending).toHaveLength(2);
    expect(result.blocked).toHaveLength(1);
    expect(result.skipped).toHaveLength(1);
    expect(result.carry_over).toHaveLength(0);
  });

  it("filters by keyword (case-insensitive)", () => {
    const result = filterTasks(TASKS, "login", new Set());
    expect(result.done).toHaveLength(1);
    expect(result.done[0].id).toBe("t1");
    expect(result.pending).toHaveLength(1);
    expect(result.pending[0].id).toBe("t3");
    expect(result.in_progress).toHaveLength(0);
    expect(result.blocked).toHaveLength(0);
  });

  it("filters by keyword with mixed case", () => {
    const result = filterTasks(TASKS, "LOGIN", new Set());
    expect(result.done).toHaveLength(1);
    expect(result.pending).toHaveLength(1);
  });

  it("filters by single status", () => {
    const result = filterTasks(TASKS, "", new Set<TaskStatus>(["pending"]));
    expect(result.pending).toHaveLength(2);
    expect(result.done).toHaveLength(0);
    expect(result.in_progress).toHaveLength(0);
    expect(result.blocked).toHaveLength(0);
  });

  it("filters by multiple statuses", () => {
    const result = filterTasks(TASKS, "", new Set<TaskStatus>(["pending", "done"]));
    expect(result.pending).toHaveLength(2);
    expect(result.done).toHaveLength(1);
    expect(result.in_progress).toHaveLength(0);
    expect(result.blocked).toHaveLength(0);
  });

  it("combines keyword and status filters", () => {
    const result = filterTasks(TASKS, "login", new Set<TaskStatus>(["pending"]));
    expect(result.pending).toHaveLength(1);
    expect(result.pending[0].id).toBe("t3");
    expect(result.done).toHaveLength(0); // "login form" is done but filtered out by status
  });

  it("returns empty results when nothing matches keyword", () => {
    const result = filterTasks(TASKS, "nonexistent", new Set());
    expect(result.pending).toHaveLength(0);
    expect(result.in_progress).toHaveLength(0);
    expect(result.done).toHaveLength(0);
    expect(result.blocked).toHaveLength(0);
    expect(result.skipped).toHaveLength(0);
    expect(result.carry_over).toHaveLength(0);
  });

  it("handles whitespace-only search query as no filter", () => {
    const result = filterTasks(TASKS, "   ", new Set());
    expect(result.done).toHaveLength(1);
    expect(result.in_progress).toHaveLength(1);
    expect(result.pending).toHaveLength(2);
  });

  it("handles empty task list", () => {
    const result = filterTasks([], "login", new Set<TaskStatus>(["pending"]));
    expect(result.pending).toHaveLength(0);
    expect(result.done).toHaveLength(0);
  });
});
