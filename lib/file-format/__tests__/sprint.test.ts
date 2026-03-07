import { describe, it, expect } from "vitest";
import { parseSprintFile } from "@/lib/file-format/parsers";
import {
  patchTaskStatusInMarkdown,
  patchSprintStatusInMarkdown,
  appendTaskToMarkdown,
} from "@/lib/file-format/serializers";

const SAMPLE_SPRINT_MD = `---
id: sprint-01
name: Foundation Sprint
status: active
startDate: 2026-03-01
endDate: 2026-03-08
version: 1.0.0
objective: Build the file system foundation.
---

# Foundation Sprint

## Objetivo
Build the file system foundation.

## Tareas

### Phase 1: Setup
- [x] Completed task
- [~] In progress task
- [ ] Pending task
- [!] Blocked task
- [-] Skipped task
- [>] Carry-over task

### Phase 2: QA
- [ ] QA checklist task
`;

describe("parseSprintFile", () => {
  it("parses frontmatter metadata correctly", () => {
    const sprint = parseSprintFile(SAMPLE_SPRINT_MD);
    expect(sprint.id).toBe("sprint-01");
    expect(sprint.name).toBe("Foundation Sprint");
    expect(sprint.status).toBe("active");
    expect(sprint.startDate).toBe("2026-03-01");
    expect(sprint.endDate).toBe("2026-03-08");
    expect(sprint.version).toBe("1.0.0");
    expect(sprint.objective).toBe("Build the file system foundation.");
  });

  it("extracts all tasks from the sprint body", () => {
    const sprint = parseSprintFile(SAMPLE_SPRINT_MD);
    expect(sprint.tasks).toHaveLength(7);
  });

  it("maps task symbols to correct TaskStatus", () => {
    const sprint = parseSprintFile(SAMPLE_SPRINT_MD);
    const statuses = sprint.tasks.map((t) => t.status);
    expect(statuses[0]).toBe("done");        // [x]
    expect(statuses[1]).toBe("in_progress"); // [~]
    expect(statuses[2]).toBe("pending");      // [ ]
    expect(statuses[3]).toBe("blocked");     // [!]
    expect(statuses[4]).toBe("skipped");     // [-]
    expect(statuses[5]).toBe("carry_over");  // [>]
  });

  it("extracts task titles correctly", () => {
    const sprint = parseSprintFile(SAMPLE_SPRINT_MD);
    expect(sprint.tasks[0].title).toBe("Completed task");
    expect(sprint.tasks[2].title).toBe("Pending task");
    expect(sprint.tasks[3].title).toBe("Blocked task");
  });

  it("preserves phase metadata in task descriptions", () => {
    const sprint = parseSprintFile(SAMPLE_SPRINT_MD);
    expect(sprint.tasks[0].description).toBe("[phase:Phase 1: Setup]");
    expect(sprint.tasks[6].description).toBe("[phase:Phase 2: QA]");
  });

  it("handles sprint with no tasks gracefully", () => {
    const empty = `---\nid: sprint-00\nname: Empty Sprint\nstatus: planned\n---\n\n# Empty Sprint\n\nNo tasks yet.\n`;
    const sprint = parseSprintFile(empty);
    expect(sprint.tasks).toHaveLength(0);
    expect(sprint.id).toBe("sprint-00");
  });

  it("patches task status with task ref (sprint-forge format)", () => {
    const md = `### Phase 1\n\n- [ ] **T1.1**: Setup repo\n- [x] **T1.2**: Run tests\n`;
    const patched = patchTaskStatusInMarkdown(md, "Setup repo", "done");
    expect(patched).toContain("- [x] **T1.1**: Setup repo");
    expect(patched).toContain("- [x] **T1.2**: Run tests");
  });

  it("patches task status without task ref (simple format)", () => {
    const md = `- [ ] Pending task\n- [x] Done task\n`;
    const patched = patchTaskStatusInMarkdown(md, "Pending task", "in_progress");
    expect(patched).toContain("- [~] Pending task");
  });

  it("returns content unchanged when no match found", () => {
    const md = `- [ ] Some task\n`;
    const patched = patchTaskStatusInMarkdown(md, "Nonexistent task", "done");
    expect(patched).toBe(md);
  });

  it("patches correct task when multiple tasks have similar names", () => {
    const md = `- [ ] **T1.1**: Create user service\n- [ ] **T1.2**: Create user controller\n`;
    const patched = patchTaskStatusInMarkdown(md, "Create user controller", "done");
    expect(patched).toContain("- [ ] **T1.1**: Create user service");
    expect(patched).toContain("- [x] **T1.2**: Create user controller");
  });
});

describe("patchSprintStatusInMarkdown", () => {
  it("patches status in YAML frontmatter", () => {
    const md = `---\nid: sprint-1\nstatus: active\n---\n\n# Sprint 1\n`;
    const patched = patchSprintStatusInMarkdown(md, "closed");
    expect(patched).toContain("status: closed");
    expect(patched).not.toContain("status: active");
  });

  it("returns unchanged content when no frontmatter status found", () => {
    const md = `# Sprint 1\n\nNo frontmatter here\n`;
    const patched = patchSprintStatusInMarkdown(md, "closed");
    expect(patched).toBe(md);
  });
});

describe("appendTaskToMarkdown", () => {
  it("appends task after the last task line", () => {
    const md = `### Phase 1\n\n- [ ] **T1.1**: First task\n- [x] **T1.2**: Second task\n\n---\n`;
    const patched = appendTaskToMarkdown(md, "New task", "T1.3");
    expect(patched).toContain("- [ ] **T1.3**: New task");
    // Should appear after T1.2
    const lines = patched.split("\n");
    const t12Index = lines.findIndex((l) => l.includes("T1.2"));
    const newIndex = lines.findIndex((l) => l.includes("T1.3"));
    expect(newIndex).toBeGreaterThan(t12Index);
  });

  it("appends task without task ref", () => {
    const md = `- [ ] First task\n- [x] Second task\n`;
    const patched = appendTaskToMarkdown(md, "Simple task");
    expect(patched).toContain("- [ ] Simple task");
  });

  it("returns unchanged content when no task lines exist", () => {
    const md = `# No tasks here\n\nJust text.\n`;
    const patched = appendTaskToMarkdown(md, "New task");
    expect(patched).toBe(md);
  });

  it("skips sub-items when finding insert position", () => {
    const md = `- [ ] **T1.1**: Task with details\n  - Files: lib/foo.ts\n  - Verification: tsc passes\n\n---\n`;
    const patched = appendTaskToMarkdown(md, "Next task", "T1.2");
    const lines = patched.split("\n");
    const verIndex = lines.findIndex((l) => l.includes("Verification"));
    const newIndex = lines.findIndex((l) => l.includes("T1.2"));
    expect(newIndex).toBeGreaterThan(verIndex);
  });
});
