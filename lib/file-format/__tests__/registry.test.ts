import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import {
  parseProjectRegistry,
  serializeProjectRegistry,
  validateSprintForgeDirectory,
  addProject,
  removeProject,
  getProject,
  listProjects,
  updateLastOpened,
} from "../registry";
import type { ProjectRegistry, ProjectRegistryEntry } from "@/lib/types";
import { SPRINT_MARKDOWN_DIR } from "@/lib/project-layout";

const FIXTURES = path.join(__dirname, "fixtures");
const SF_PROJECT = path.join(FIXTURES, "sprint-forge-project");

describe("parseProjectRegistry", () => {
  it("parses a valid registry JSON", () => {
    const json = JSON.stringify({
      version: 1,
      projects: [
        {
          id: "test",
          name: "Test Project",
          path: "/some/path",
          addedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    const registry = parseProjectRegistry(json);
    expect(registry.version).toBe(1);
    expect(registry.projects).toHaveLength(1);
    expect(registry.projects[0].id).toBe("test");
  });

  it("returns empty registry for empty string", () => {
    const registry = parseProjectRegistry("");
    expect(registry.projects).toEqual([]);
  });
});

describe("serializeProjectRegistry", () => {
  it("round-trips correctly", () => {
    const registry: ProjectRegistry = {
      version: 1,
      projects: [
        {
          id: "test",
          name: "Test",
          path: "/path",
          addedAt: "2026-01-01",
          color: "#ff0000",
        },
      ],
    };
    const json = serializeProjectRegistry(registry);
    const parsed = parseProjectRegistry(json);
    expect(parsed).toEqual(registry);
  });
});

describe("validateSprintForgeDirectory", () => {
  it("validates a real sprint-forge directory", async () => {
    const result = await validateSprintForgeDirectory(SF_PROJECT);
    expect(result.valid).toBe(true);
    expect(result.name).toBe("project-name");
  });

  it("rejects a non-existent directory", async () => {
    const result = await validateSprintForgeDirectory("/non/existent/path");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("does not exist");
  });

  it("rejects a directory without README.md", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sf-test-"));
    await fs.mkdir(path.join(tmpDir, "notes"));
    const result = await validateSprintForgeDirectory(tmpDir);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("README.md");
    await fs.rm(tmpDir, { recursive: true });
  });

  it(`rejects a directory without ${SPRINT_MARKDOWN_DIR}/`, async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sf-test-"));
    await fs.writeFile(
      path.join(tmpDir, "README.md"),
      "# test — Project\n\n> Type: refactor\n> Created: 2026-01-01\n> Codebase: `/test`\n\n## What Is This\n\nTest."
    );
    const result = await validateSprintForgeDirectory(tmpDir);
    expect(result.valid).toBe(false);
    expect(result.error).toContain(SPRINT_MARKDOWN_DIR);
    await fs.rm(tmpDir, { recursive: true });
  });
});

describe("registry CRUD", () => {
  let tmpDir: string;
  let registryPath: string;

  const entry: ProjectRegistryEntry = {
    id: "test-project",
    name: "Test Project",
    path: "/some/path",
    addedAt: "2026-01-01T00:00:00.000Z",
  };

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "registry-test-"));
    registryPath = path.join(tmpDir, "projects.json");
    await fs.writeFile(
      registryPath,
      serializeProjectRegistry({ version: 1, projects: [] })
    );
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true });
  });

  it("adds a project", async () => {
    await addProject(registryPath, entry);
    const projects = await listProjects(registryPath);
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe("test-project");
  });

  it("rejects duplicate project ID", async () => {
    await addProject(registryPath, entry);
    await expect(addProject(registryPath, entry)).rejects.toThrow(
      "already exists"
    );
  });

  it("gets a project by ID", async () => {
    await addProject(registryPath, entry);
    const found = await getProject(registryPath, "test-project");
    expect(found).toBeDefined();
    expect(found!.name).toBe("Test Project");
  });

  it("returns undefined for unknown project", async () => {
    const found = await getProject(registryPath, "unknown");
    expect(found).toBeUndefined();
  });

  it("removes a project", async () => {
    await addProject(registryPath, entry);
    const removed = await removeProject(registryPath, "test-project");
    expect(removed).toBe(true);
    const projects = await listProjects(registryPath);
    expect(projects).toHaveLength(0);
  });

  it("returns false when removing non-existent project", async () => {
    const removed = await removeProject(registryPath, "unknown");
    expect(removed).toBe(false);
  });

  it("updates lastOpenedAt", async () => {
    await addProject(registryPath, entry);
    await updateLastOpened(registryPath, "test-project");
    const found = await getProject(registryPath, "test-project");
    expect(found!.lastOpenedAt).toBeDefined();
  });
});
