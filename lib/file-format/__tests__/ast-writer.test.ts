import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  updateTaskStatus,
  appendTask,
  updateSprintStatus,
  updateFrontmatterField,
  deleteTask,
} from "../ast-writer";

// ---------------------------------------------------------------------------
// Format preservation — operations on real sprint files
// ---------------------------------------------------------------------------

const SPRINTS_DIR = path.resolve(
  __dirname,
  "../../../.agents/sprint-forge/kyro-sprint-forge-reader/sprints",
);

const sprintFiles = fs.existsSync(SPRINTS_DIR)
  ? fs.readdirSync(SPRINTS_DIR).filter((f) => f.endsWith(".md"))
  : [];

describe("format preservation", () => {
  it.each(sprintFiles)(
    "updateTaskStatus on %s preserves all non-target content",
    (file) => {
      const original = fs.readFileSync(path.join(SPRINTS_DIR, file), "utf-8");
      // Find a task title in the file to test with
      const taskMatch = original.match(
        /- \[.\] \*\*\w[\w.]*\*\*: (.+)/,
      );
      if (!taskMatch) return; // skip files without task refs

      const taskTitle = taskMatch[1].trim();
      const result = updateTaskStatus(original, taskTitle, "done");

      // Only the checkbox character should change — everything else identical
      const diffCount = countCharDiffs(original, result);
      expect(diffCount).toBeLessThanOrEqual(1);
    },
  );
});

/** Count the number of character positions that differ between two strings. */
function countCharDiffs(a: string, b: string): number {
  if (a.length !== b.length) return Math.abs(a.length - b.length) + 1;
  let diffs = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diffs++;
  }
  return diffs;
}

// ---------------------------------------------------------------------------
// updateTaskStatus
// ---------------------------------------------------------------------------

const SAMPLE_SPRINT = `---
title: "Sprint 1 — Test"
status: active
---

# Sprint 1 — Test

## Phase 1 — Setup

**Tasks**:

- [ ] **T1.1**: Create type schemas
- [~] **T1.2**: Implement parser
- [x] **T1.3**: Write tests

## Phase 2 — Integration

**Tasks**:

- [ ] **T2.1**: Wire up API routes
- [!] **T2.2**: Fix blocked dependency
`;

describe("updateTaskStatus", () => {
  it("changes pending to done", () => {
    const result = updateTaskStatus(SAMPLE_SPRINT, "Create type schemas", "done");
    expect(result).toContain("- [x] **T1.1**: Create type schemas");
  });

  it("changes done to pending", () => {
    const result = updateTaskStatus(SAMPLE_SPRINT, "Write tests", "pending");
    expect(result).toContain("- [ ] **T1.3**: Write tests");
  });

  it("changes to in_progress", () => {
    const result = updateTaskStatus(SAMPLE_SPRINT, "Create type schemas", "in_progress");
    expect(result).toContain("- [~] **T1.1**: Create type schemas");
  });

  it("changes to blocked", () => {
    const result = updateTaskStatus(SAMPLE_SPRINT, "Create type schemas", "blocked");
    expect(result).toContain("- [!] **T1.1**: Create type schemas");
  });

  it("changes to skipped", () => {
    const result = updateTaskStatus(SAMPLE_SPRINT, "Create type schemas", "skipped");
    expect(result).toContain("- [-] **T1.1**: Create type schemas");
  });

  it("changes to carry_over", () => {
    const result = updateTaskStatus(SAMPLE_SPRINT, "Create type schemas", "carry_over");
    expect(result).toContain("- [>] **T1.1**: Create type schemas");
  });

  it("changes non-standard symbol (in_progress) to done", () => {
    const result = updateTaskStatus(SAMPLE_SPRINT, "Implement parser", "done");
    expect(result).toContain("- [x] **T1.2**: Implement parser");
    expect(result).not.toContain("- [~]");
  });

  it("changes non-standard symbol (blocked) to done", () => {
    const result = updateTaskStatus(SAMPLE_SPRINT, "Fix blocked dependency", "done");
    expect(result).toContain("- [x] **T2.2**: Fix blocked dependency");
  });

  it("returns original content if task not found", () => {
    const result = updateTaskStatus(SAMPLE_SPRINT, "Nonexistent task", "done");
    expect(result).toBe(SAMPLE_SPRINT);
  });

  it("handles title with special characters", () => {
    const content = `---
status: active
---

- [ ] **T1.1**: Create "type [schemas]" for (test)
`;
    const result = updateTaskStatus(content, 'Create "type [schemas]" for (test)', "done");
    expect(result).toContain('- [x] **T1.1**: Create "type [schemas]" for (test)');
  });

  it("handles plain title without task ref", () => {
    const content = `---
status: active
---

- [ ] A plain task without ref
`;
    const result = updateTaskStatus(content, "A plain task without ref", "done");
    expect(result).toContain("- [x] A plain task without ref");
  });

  it("preserves rest of file unchanged", () => {
    const result = updateTaskStatus(SAMPLE_SPRINT, "Create type schemas", "done");
    // Only 1 char should differ (the checkbox symbol)
    expect(countCharDiffs(SAMPLE_SPRINT, result)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// appendTask
// ---------------------------------------------------------------------------

describe("appendTask", () => {
  it("appends task with ref to last phase", () => {
    const result = appendTask(SAMPLE_SPRINT, "New integration task", "T2.3");
    expect(result).toContain("- [ ] **T2.3**: New integration task");
    // Should be after T2.2 (last task in Phase 2)
    const lines = result.split("\n");
    const t22Index = lines.findIndex((l) => l.includes("T2.2"));
    const newIndex = lines.findIndex((l) => l.includes("T2.3"));
    expect(newIndex).toBeGreaterThan(t22Index);
  });

  it("appends task without ref", () => {
    const result = appendTask(SAMPLE_SPRINT, "A quick task");
    expect(result).toContain("- [ ] A quick task");
  });

  it("returns original content when no task lists exist", () => {
    const noTasks = `---
status: active
---

# Sprint 1

Just some text, no tasks.
`;
    const result = appendTask(noTasks, "New task");
    expect(result).toBe(noTasks);
  });
});

// ---------------------------------------------------------------------------
// updateSprintStatus
// ---------------------------------------------------------------------------

describe("updateSprintStatus", () => {
  it("updates status in frontmatter", () => {
    const result = updateSprintStatus(SAMPLE_SPRINT, "completed");
    expect(result).toContain("status: completed");
    expect(result).not.toContain("status: active");
  });

  it("preserves other frontmatter fields", () => {
    const result = updateSprintStatus(SAMPLE_SPRINT, "completed");
    expect(result).toContain('title: "Sprint 1 — Test"');
  });

  it("preserves content outside frontmatter", () => {
    const result = updateSprintStatus(SAMPLE_SPRINT, "completed");
    expect(result).toContain("## Phase 1 — Setup");
    expect(result).toContain("- [ ] **T1.1**: Create type schemas");
  });

  it("returns original when no frontmatter", () => {
    const noFm = "# Sprint\n\nSome content\n";
    const result = updateSprintStatus(noFm, "completed");
    expect(result).toBe(noFm);
  });
});

// ---------------------------------------------------------------------------
// updateFrontmatterField
// ---------------------------------------------------------------------------

const FM_SAMPLE = `---
title: "Sprint 1 — Test"
status: active
progress: 50
version: 3.1.0
agents:
  - claude-opus-4-6
---

# Sprint 1

Content here.
`;

describe("updateFrontmatterField", () => {
  it("updates a string field", () => {
    const result = updateFrontmatterField(FM_SAMPLE, "status", "completed");
    expect(result).toContain("status: completed");
    expect(result).not.toContain("status: active");
  });

  it("updates a number field", () => {
    const result = updateFrontmatterField(FM_SAMPLE, "progress", 100);
    expect(result).toContain("progress: 100");
    expect(result).not.toContain("progress: 50");
  });

  it("updates a boolean field", () => {
    const result = updateFrontmatterField(FM_SAMPLE, "status", true);
    expect(result).toContain("status: true");
  });

  it("updates an array field", () => {
    const result = updateFrontmatterField(FM_SAMPLE, "agents", [
      "claude-opus-4-6",
      "gpt-4o",
    ]);
    expect(result).toContain("agents:");
    expect(result).toContain("  - claude-opus-4-6");
    expect(result).toContain("  - gpt-4o");
  });

  it("updates array field to empty array", () => {
    const result = updateFrontmatterField(FM_SAMPLE, "agents", []);
    expect(result).toContain("agents: []");
  });

  it("adds a new field when it doesn't exist", () => {
    const result = updateFrontmatterField(FM_SAMPLE, "type", "feature");
    expect(result).toContain("type: feature");
    expect(result).toContain("status: active"); // existing fields preserved
    expect(result).toContain('title: "Sprint 1 — Test"');
  });

  it("preserves other frontmatter fields", () => {
    const result = updateFrontmatterField(FM_SAMPLE, "status", "completed");
    expect(result).toContain('title: "Sprint 1 — Test"');
    expect(result).toContain("progress: 50");
    expect(result).toContain("version: 3.1.0");
  });

  it("preserves content outside frontmatter", () => {
    const result = updateFrontmatterField(FM_SAMPLE, "status", "completed");
    expect(result).toContain("# Sprint 1");
    expect(result).toContain("Content here.");
  });

  it("returns original when no frontmatter exists", () => {
    const noFm = "# Sprint\n\nSome content\n";
    const result = updateFrontmatterField(noFm, "status", "completed");
    expect(result).toBe(noFm);
  });

  it("quotes strings with special characters", () => {
    const result = updateFrontmatterField(FM_SAMPLE, "title", "Sprint: The Beginning");
    expect(result).toContain('title: "Sprint: The Beginning"');
  });

  it("quotes numeric-looking strings", () => {
    const result = updateFrontmatterField(FM_SAMPLE, "version", "123");
    expect(result).toContain('version: "123"');
  });

  it("handles updateSprintStatus delegation", () => {
    // updateSprintStatus now delegates to updateFrontmatterField
    const result = updateSprintStatus(FM_SAMPLE, "closed");
    expect(result).toContain("status: closed");
    expect(result).not.toContain("status: active");
    expect(result).toContain('title: "Sprint 1 — Test"');
  });
});

// ---------------------------------------------------------------------------
// deleteTask
// ---------------------------------------------------------------------------

describe("deleteTask", () => {
  it("deletes task by title", () => {
    const result = deleteTask(SAMPLE_SPRINT, "Implement parser");
    expect(result).not.toContain("Implement parser");
    expect(result).toContain("Create type schemas");
    expect(result).toContain("Write tests");
  });

  it("deletes task with ref format", () => {
    const result = deleteTask(SAMPLE_SPRINT, "Wire up API routes");
    expect(result).not.toContain("Wire up API routes");
    expect(result).toContain("Fix blocked dependency");
  });

  it("returns original if task not found", () => {
    const result = deleteTask(SAMPLE_SPRINT, "Nonexistent task");
    expect(result).toBe(SAMPLE_SPRINT);
  });
});
