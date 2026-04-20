import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { installApiFetchMock } from "./api-test-router";

const SF_FIXTURE = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "file-format",
  "__tests__",
  "fixtures",
  "sprint-forge-project"
);

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

async function createTempSprintForgeDir(): Promise<string> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sf-integration-"));
  await fs.cp(SF_FIXTURE, tmpDir, { recursive: true });
  return tmpDir;
}

async function registerProject(
  sfDir: string,
  opts?: { name?: string; color?: string }
): Promise<Record<string, unknown>> {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: sfDir, ...opts }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`register failed (${res.status}): ${body}`);
  }
  const json = (await res.json()) as { data: { project: Record<string, unknown> } };
  return json.data.project;
}

describe("FileProjectsService integration (registry model)", () => {
  let workspacePath: string;
  let sfDir: string;
  let restoreFetch: (() => void) | null = null;

  beforeEach(async () => {
    workspacePath = await fs.mkdtemp(path.join(os.tmpdir(), "kyro-file-projects-"));
    sfDir = await createTempSprintForgeDir();
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
    await fs.rm(sfDir, { recursive: true, force: true });
  });

  it("registers an external sprint-forge directory and lists it", async () => {
    const project = await registerProject(sfDir, { name: "Alpha" });
    expect(project.name).toBe("Alpha");
    expect(project.path).toBe(sfDir);

    const listRes = await fetch("/api/projects");
    expect(listRes.ok).toBe(true);
    const { data } = (await listRes.json()) as { data: { projects: Array<Record<string, unknown>> } };
    expect(data.projects).toHaveLength(1);
    expect(data.projects[0]._available).toBe(true);
  });

  it("reads sprints from external sprint-forge directory", async () => {
    const project = await registerProject(sfDir);
    const projectId = project.id as string;

    const res = await fetch(`/api/projects/${projectId}/sprints`);
    expect(res.ok).toBe(true);
    const { data } = (await res.json()) as { data: { sprints: Array<Record<string, unknown>> } };
    expect(data.sprints.length).toBeGreaterThanOrEqual(1);
    expect(data.sprints[0].name).toBeDefined();
  });

  it("reads findings from external sprint-forge directory", async () => {
    const project = await registerProject(sfDir);
    const projectId = project.id as string;

    const res = await fetch(`/api/projects/${projectId}/findings`);
    expect(res.ok).toBe(true);
    const { data } = (await res.json()) as { data: { findings: Array<Record<string, unknown>> } };
    expect(data.findings.length).toBeGreaterThanOrEqual(1);
  });

  it("reads roadmap from external sprint-forge directory", async () => {
    const project = await registerProject(sfDir);
    const projectId = project.id as string;

    const res = await fetch(`/api/projects/${projectId}/roadmap`);
    expect(res.ok).toBe(true);
    const { data } = (await res.json()) as { data: { roadmap: Record<string, unknown> } };
    expect(data.roadmap.raw).toBeDefined();
  });

  it("updates project metadata in registry without touching external dir", async () => {
    const project = await registerProject(sfDir);
    const projectId = project.id as string;

    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Alpha Updated", color: "#ff0000" }),
    });
    expect(res.ok).toBe(true);
    const { data } = (await res.json()) as { data: { project: Record<string, unknown> } };
    expect(data.project.name).toBe("Alpha Updated");
    expect(data.project.color).toBe("#ff0000");
  });

  it("deletes project from registry without deleting external directory", async () => {
    const project = await registerProject(sfDir);
    const projectId = project.id as string;

    const delRes = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    expect(delRes.ok).toBe(true);

    const listRes = await fetch("/api/projects");
    const { data } = (await listRes.json()) as { data: { projects: Array<Record<string, unknown>> } };
    expect(data.projects).toHaveLength(0);

    // External directory should still exist
    const readmeExists = await fs.access(path.join(sfDir, "README.md")).then(() => true, () => false);
    expect(readmeExists).toBe(true);
  });

  it("rejects registration of invalid directory", async () => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "/non/existent/path" }),
    });
    expect(res.ok).toBe(false);
  });

  it("rejects duplicate project registration", async () => {
    await registerProject(sfDir);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: sfDir }),
    });
    expect(res.ok).toBe(false);
  });
});
