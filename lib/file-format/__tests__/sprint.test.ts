import { describe, it, expect } from "vitest";
import { parseSprintFile } from "@/lib/file-format/parsers";
import { serializeSprintFile } from "@/lib/file-format/serializers";
import type { Sprint } from "@/lib/types";

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

  it("serializes tasks grouped by phase", () => {
    const sprint: Sprint = {
      id: "sprint-99",
      name: "Grouped Sprint",
      status: "planned",
      objective: "Group by phase",
      tasks: [
        {
          id: "t1",
          title: "Setup repo",
          description: "[phase:Phase 1: Setup]",
          priority: "medium",
          status: "todo",
          tags: [],
          createdAt: "2026-03-01T00:00:00Z",
          updatedAt: "2026-03-01T00:00:00Z",
        },
        {
          id: "t2",
          title: "Run QA",
          description: "[phase:Phase 2: QA]",
          priority: "medium",
          status: "todo",
          tags: [],
          createdAt: "2026-03-01T00:00:00Z",
          updatedAt: "2026-03-01T00:00:00Z",
        },
      ],
      sections: undefined,
    };

    const md = serializeSprintFile(sprint);
    expect(md).toContain("### Phase 1: Setup");
    expect(md).toContain("### Phase 2: QA");
    expect(md).toContain("- [ ] Setup repo");
    expect(md).toContain("- [ ] Run QA");
  });
});
