import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileActivitiesService } from "@/lib/services/file/activities.file";
import { useAppStore } from "@/lib/store";
import { installApiFetchMock } from "./api-test-router";

async function ensureWorkspace(): Promise<void> {
  const response = await fetch("/api/workspace/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Trace Workspace" }),
  });

  if (!response.ok) {
    throw new Error(`workspace init failed: ${response.status}`);
  }
}

async function waitFor(predicate: () => Promise<boolean>, timeoutMs = 1500): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  throw new Error("Timed out waiting for condition");
}

describe("activities trace integration", () => {
  let workspacePath: string;
  let restoreFetch: (() => void) | null = null;

  beforeEach(async () => {
    workspacePath = await fs.mkdtemp(path.join(os.tmpdir(), "kyro-activities-trace-"));
    process.env.KYRO_WORKSPACE_PATH = workspacePath;
    process.env.NEXT_PUBLIC_API_URL = "";

    const mocked = installApiFetchMock();
    restoreFetch = mocked.restore;

    await ensureWorkspace();
    useAppStore.setState({ activities: [] });
  });

  afterEach(async () => {
    if (restoreFetch) {
      restoreFetch();
      restoreFetch = null;
    }
    await fs.rm(workspacePath, { recursive: true, force: true });
  });

  it("persists activities through FileActivitiesService.createActivity", async () => {
    const service = new FileActivitiesService();

    const created = await service.createActivity({
      projectId: "proj-service",
      actionType: "created_task",
      description: "service-level activity",
      metadata: { agent: "service-test" },
    });

    expect(created.projectId).toBe("proj-service");
    expect(created.description).toBe("service-level activity");

    const activitiesPath = path.join(workspacePath, ".kyro", "activities.json");
    const raw = await fs.readFile(activitiesPath, "utf-8");
    expect(raw).toContain("service-level activity");
  });

  it("persists activities triggered from store action", async () => {
    const timestamp = new Date().toISOString();

    useAppStore.getState().addActivity({
      id: "local-activity",
      projectId: "proj-store",
      actionType: "created_task",
      description: "store-level activity",
      timestamp,
      metadata: { agent: "store-test" },
    });

    const activitiesPath = path.join(workspacePath, ".kyro", "activities.json");

    await waitFor(async () => {
      const raw = await fs.readFile(activitiesPath, "utf-8");
      return raw.includes("store-level activity");
    });

    const persisted = JSON.parse(await fs.readFile(activitiesPath, "utf-8")) as Array<{
      description: string;
      metadata?: { agent?: string };
    }>;

    const found = persisted.find((entry) => entry.description === "store-level activity");
    expect(found).toBeDefined();
    expect(found?.metadata?.agent).toBe("store-test");
  });
});
