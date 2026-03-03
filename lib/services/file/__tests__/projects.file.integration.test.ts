import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileProjectsService } from "@/lib/services/file/projects.file";
import { serializeSprintFile } from "@/lib/file-format/serializers";
import { installApiFetchMock } from "./api-test-router";

async function ensureWorkspace(workspacePath: string): Promise<void> {
  const response = await fetch("/api/workspace/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Integration Workspace" }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`workspace init failed (${response.status}): ${body}`);
  }
  await fs.writeFile(path.join(workspacePath, ".kyro", "activities.json"), "[]", "utf-8");
}

describe("FileProjectsService integration", () => {
  let workspacePath: string;
  let restoreFetch: (() => void) | null = null;

  beforeEach(async () => {
    workspacePath = await fs.mkdtemp(path.join(os.tmpdir(), "kyro-file-projects-"));
    process.env.KYRO_WORKSPACE_PATH = workspacePath;
    process.env.NEXT_PUBLIC_API_URL = "";

    const mocked = installApiFetchMock();
    restoreFetch = mocked.restore;

    await ensureWorkspace(workspacePath);
  });

  afterEach(async () => {
    if (restoreFetch) {
      restoreFetch();
      restoreFetch = null;
    }

    await fs.rm(workspacePath, { recursive: true, force: true });
  });

  it("creates project assets and lists nested sprints/documents", async () => {
    const service = new FileProjectsService();

    await service.createProject({
      id: "proj-alpha",
      name: "Alpha",
      description: "Alpha project",
    });

    await service.createSprint("proj-alpha", {
      id: "sprint-1",
      name: "Sprint 1",
      status: "planned",
      objective: "Initial sprint",
    });

    const sprintsDir = path.join(workspacePath, "projects", "proj-alpha", "sprints");
    const sprintFiles = (await fs.readdir(sprintsDir)).filter((file) =>
      file.endsWith(".md")
    );
    expect(sprintFiles).toHaveLength(1);
    expect(sprintFiles[0]).toMatch(/^SPRINT-01-sprint-1/i);

    const reentry = await fs.readFile(
      path.join(workspacePath, "projects", "proj-alpha", "RE-ENTRY-PROMPTS.md"),
      "utf-8"
    );
    expect(reentry).toContain(`sprints/${sprintFiles[0]}`);

    await service.createDocument("proj-alpha", {
      title: "Architecture",
      content: "# Architecture\n\nInitial notes",
    });

    await service.createTask("proj-alpha", "sprint-1", {
      title: "Implement API resolver",
      status: "todo",
    });

    const projects = await service.list();
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe("proj-alpha");
    expect(projects[0].sprints).toHaveLength(1);
    expect(projects[0].documents).toHaveLength(1);
    expect(projects[0].sprints[0].tasks).toHaveLength(1);

    await expect(
      fs.access(path.join(workspacePath, "projects", "proj-alpha", "README.md"))
    ).resolves.toBeUndefined();
    await expect(
      fs.access(path.join(workspacePath, "projects", "proj-alpha", "ROADMAP.md"))
    ).resolves.toBeUndefined();
    await expect(
      fs.access(path.join(workspacePath, "projects", "proj-alpha", "RE-ENTRY-PROMPTS.md"))
    ).resolves.toBeUndefined();
  });

  it("updates and deletes project via file-backed APIs", async () => {
    const service = new FileProjectsService();

    await service.createProject({ id: "proj-beta", name: "Beta" });
    await service.updateProject("proj-beta", { name: "Beta Updated" });

    const updated = await service.getProject("proj-beta");
    expect(updated?.name).toBe("Beta Updated");

    await service.deleteProject("proj-beta");
    const projects = await service.list();
    expect(projects).toHaveLength(0);

    const workspaceReadme = await fs.readFile(path.join(workspacePath, "README.md"), "utf-8");
    expect(workspaceReadme).toContain("Projects Index");
  });

  it("resolves legacy sprint files by sprint frontmatter id", async () => {
    const service = new FileProjectsService();

    await service.createProject({ id: "proj-legacy", name: "Legacy Project" });

    const legacySprint = {
      id: "legacy-sprint-id",
      name: "Legacy Sprint",
      status: "planned" as const,
      objective: "Legacy compatibility check",
      tasks: [],
      sections: undefined,
    };

    const legacyFilePath = path.join(
      workspacePath,
      "projects",
      "proj-legacy",
      "sprints",
      "SPRINT-88-legacy-compat.md"
    );
    await fs.writeFile(legacyFilePath, serializeSprintFile(legacySprint), "utf-8");

    const beforeDelete = await service.list();
    expect(beforeDelete[0].sprints.map((sprint) => sprint.id)).toContain("legacy-sprint-id");

    await service.deleteSprint("proj-legacy", "legacy-sprint-id");

    const afterDelete = await service.list();
    expect(afterDelete[0].sprints).toHaveLength(0);
  });
});
