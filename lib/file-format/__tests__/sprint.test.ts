import { describe, it, expect } from "vitest";
import { parseSprintFile } from "@/lib/file-format/parsers";

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

  it("extracts all 6 tasks from the sprint body", () => {
    const sprint = parseSprintFile(SAMPLE_SPRINT_MD);
    expect(sprint.tasks).toHaveLength(6);
  });

  it("maps task symbols to correct TaskStatus", () => {
    const sprint = parseSprintFile(SAMPLE_SPRINT_MD);
    const statuses = sprint.tasks.map((t) => t.status);
    expect(statuses[0]).toBe("done");        // [x]
    expect(statuses[1]).toBe("in_progress"); // [~]
    expect(statuses[2]).toBe("todo");        // [ ]
    expect(statuses[3]).toBe("blocked");     // [!]
    expect(statuses[4]).toBe("skipped");     // [-]
    expect(statuses[5]).toBe("todo");        // [>] carry-over → todo
  });

  it("extracts task titles correctly", () => {
    const sprint = parseSprintFile(SAMPLE_SPRINT_MD);
    expect(sprint.tasks[0].title).toBe("Completed task");
    expect(sprint.tasks[2].title).toBe("Pending task");
    expect(sprint.tasks[3].title).toBe("Blocked task");
  });

  it("handles sprint with no tasks gracefully", () => {
    const empty = `---\nid: sprint-00\nname: Empty Sprint\nstatus: planned\n---\n\n# Empty Sprint\n\nNo tasks yet.\n`;
    const sprint = parseSprintFile(empty);
    expect(sprint.tasks).toHaveLength(0);
    expect(sprint.id).toBe("sprint-00");
  });
});
