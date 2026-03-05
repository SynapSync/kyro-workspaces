import { describe, it, expect } from "vitest";
import { parseSprintFile, parseProjectReadme } from "../parsers";

describe("parseSprintFile — backward compatibility", () => {
  it("still parses YAML frontmatter sprint files", () => {
    const content = `---
id: sprint-1
name: Sprint 1
status: active
startDate: 2026-01-15
endDate: 2026-01-30
version: "1.0.0"
objective: Build the core API
---

### Phase 1 — Setup

- [x] Set up project structure
- [ ] Configure CI/CD
- [~] Write initial tests
`;

    const sprint = parseSprintFile(content);
    expect(sprint.id).toBe("sprint-1");
    expect(sprint.name).toBe("Sprint 1");
    expect(sprint.status).toBe("active");
    expect(sprint.version).toBe("1.0.0");
    expect(sprint.objective).toBe("Build the core API");
    expect(sprint.tasks).toHaveLength(3);
    expect(sprint.tasks[0].status).toBe("done");
    expect(sprint.tasks[1].status).toBe("todo");
    expect(sprint.tasks[2].status).toBe("in_progress");
  });

  it("auto-detects and parses sprint-forge format", () => {
    const content = `# Sprint 1 — Foundation

> Source: \`findings/01-arch.md\`
> Version Target: 0.2.0
> Type: refactor
> Carry-over: 0 items from previous sprint
> Execution Date: —
> Executed By: —

---

## Sprint Objective

Build the foundation.

---

## Phases

### Phase 1 — Types

**Objective**: Add types

**Tasks**:

- [ ] **T1.1**: Create type schemas
  - Files: \`lib/types.ts\`
  - Verification: tsc passes
`;

    const sprint = parseSprintFile(content);
    expect(sprint.id).toBe("sprint-1");
    expect(sprint.name).toBe("Sprint 1 — Foundation");
    expect(sprint.status).toBe("planned");
    expect(sprint.version).toBe("0.2.0");
    expect(sprint.tasks).toHaveLength(1);
    expect(sprint.tasks[0].title).toBe("Create type schemas");
  });
});

describe("parseProjectReadme — backward compatibility", () => {
  it("still parses YAML frontmatter README files", () => {
    const content = `---
id: my-project
name: My Project
description: A test project
createdAt: 2026-01-01
updatedAt: 2026-01-15
---

# My Project

Project documentation here.
`;

    const result = parseProjectReadme(content, "fallback-slug");
    expect(result.id).toBe("my-project");
    expect(result.name).toBe("My Project");
    expect(result.description).toBe("A test project");
    expect(result.readme).toContain("Project documentation here");
  });

  it("auto-detects and parses sprint-forge README", () => {
    const content = `# my-project — Working Project

> Type: refactor
> Created: 2026-03-01
> Codebase: \`/Users/dev/project\`

---

## What Is This

This is a sprint-forge working project.
`;

    const result = parseProjectReadme(content, "my-slug");
    expect(result.id).toBe("my-slug");
    expect(result.name).toBe("my-project");
    expect(result.description).toContain("sprint-forge working project");
  });
});
