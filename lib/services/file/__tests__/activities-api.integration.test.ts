import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ACTIVITY_LIMITS } from "@/lib/api/activities-constraints";
import {
  ACTIVITIES_RETENTION_ENV_KEY,
  DEFAULT_MAX_ACTIVITY_ENTRIES,
} from "@/lib/api/activities-log";
import { installApiFetchMock } from "./api-test-router";

async function ensureWorkspace(): Promise<void> {
  const response = await fetch("/api/workspace/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Activities API Workspace" }),
  });
  if (!response.ok) {
    throw new Error(`workspace init failed: ${response.status}`);
  }
}

describe("/api/activities integration", () => {
  let workspacePath: string;
  let restoreFetch: (() => void) | null = null;
  let previousRetentionEnv: string | undefined;

  beforeEach(async () => {
    workspacePath = await fs.mkdtemp(path.join(os.tmpdir(), "kyro-activities-api-"));
    process.env.KYRO_WORKSPACE_PATH = workspacePath;
    process.env.NEXT_PUBLIC_API_URL = "";
    previousRetentionEnv = process.env[ACTIVITIES_RETENTION_ENV_KEY];
    delete process.env[ACTIVITIES_RETENTION_ENV_KEY];

    const mocked = installApiFetchMock();
    restoreFetch = mocked.restore;

    await ensureWorkspace();
  });

  afterEach(async () => {
    if (previousRetentionEnv === undefined) {
      delete process.env[ACTIVITIES_RETENTION_ENV_KEY];
    } else {
      process.env[ACTIVITIES_RETENTION_ENV_KEY] = previousRetentionEnv;
    }
    if (restoreFetch) {
      restoreFetch();
      restoreFetch = null;
    }
    await fs.rm(workspacePath, { recursive: true, force: true });
  });

  it("returns INVALID_FORMAT for unsupported actionType and empty required strings", async () => {
    const invalidType = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj-api",
        actionType: "unknown_action",
        description: "invalid action type",
      }),
    });

    expect(invalidType.status).toBe(400);
    const invalidTypeBody = await invalidType.json();
    expect(invalidTypeBody.error.code).toBe("INVALID_FORMAT");
    expect(invalidTypeBody.error.message).toContain("Unsupported actionType");

    const emptyDescription = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj-api",
        actionType: "created_task",
        description: "   ",
      }),
    });

    expect(emptyDescription.status).toBe(400);
    const emptyDescriptionBody = await emptyDescription.json();
    expect(emptyDescriptionBody.error.code).toBe("INVALID_FORMAT");
    expect(emptyDescriptionBody.error.message).toContain("description");

    const emptyProjectId = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "",
        actionType: "created_task",
        description: "valid description",
      }),
    });

    expect(emptyProjectId.status).toBe(400);
    const emptyProjectIdBody = await emptyProjectId.json();
    expect(emptyProjectIdBody.error.code).toBe("INVALID_FORMAT");
    expect(emptyProjectIdBody.error.message).toContain("projectId");
  });

  it("accepts missing or partial metadata and persists valid activities", async () => {
    const withoutMetadata = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj-api",
        actionType: "created_task",
        description: "without metadata",
      }),
    });
    expect(withoutMetadata.status).toBe(201);

    const partialMetadata = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj-api",
        actionType: "created_sprint",
        description: "with partial metadata",
        metadata: { agent: "Sprint Forge" },
      }),
    });
    expect(partialMetadata.status).toBe(201);
    const partialBody = await partialMetadata.json();
    expect(partialBody.data.activity.metadata.agent).toBe("Sprint Forge");

    const activitiesPath = path.join(workspacePath, ".kyro", "activities.json");
    const persisted = JSON.parse(await fs.readFile(activitiesPath, "utf-8")) as Array<{
      description: string;
      metadata?: Record<string, string>;
    }>;

    expect(persisted.length).toBe(2);
    expect(persisted.some((entry) => entry.description === "without metadata")).toBe(true);
    expect(
      persisted.some(
        (entry) =>
          entry.description === "with partial metadata" &&
          entry.metadata?.agent === "Sprint Forge"
      )
    ).toBe(true);
  });

  it("returns activities sorted by timestamp descending", async () => {
    const activitiesPath = path.join(workspacePath, ".kyro", "activities.json");
    await fs.writeFile(
      activitiesPath,
      JSON.stringify(
        [
          {
            id: "act-old",
            projectId: "proj-1",
            actionType: "created_task",
            description: "older",
            timestamp: "2026-03-01T10:00:00.000Z",
            metadata: { agent: "older" },
          },
          {
            id: "act-new",
            projectId: "proj-1",
            actionType: "created_sprint",
            description: "newer",
            timestamp: "2026-03-02T10:00:00.000Z",
            metadata: { agent: "newer" },
          },
        ],
        null,
        2
      ),
      "utf-8"
    );

    const response = await fetch("/api/activities");
    expect(response.status).toBe(200);
    const body = await response.json();
    const descriptions = body.data.activities.map((activity: { description: string }) => activity.description);
    expect(descriptions).toEqual(["newer", "older"]);
    expect(body.data.diagnostics.retentionLimit).toBe(DEFAULT_MAX_ACTIVITY_ENTRIES);
    expect(body.data.diagnostics.pruneMetrics.pruneEvents).toBe(0);
  });

  it("enforces payload length boundaries for description and metadata", async () => {
    const maxDescription = "d".repeat(ACTIVITY_LIMITS.descriptionMaxLength);
    const validMetadataKey = "k".repeat(ACTIVITY_LIMITS.metadataKeyMaxLength);
    const validMetadataValue = "v".repeat(ACTIVITY_LIMITS.metadataValueMaxLength);

    const validPayload = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj-lengths",
        actionType: "created_task",
        description: maxDescription,
        metadata: {
          [validMetadataKey]: validMetadataValue,
        },
      }),
    });
    expect(validPayload.status).toBe(201);

    const tooLongDescription = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj-lengths",
        actionType: "created_task",
        description: "x".repeat(ACTIVITY_LIMITS.descriptionMaxLength + 1),
      }),
    });
    expect(tooLongDescription.status).toBe(400);
    const tooLongDescriptionBody = await tooLongDescription.json();
    expect(tooLongDescriptionBody.error.message).toContain("description");

    const tooLongMetadataKey = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj-lengths",
        actionType: "created_task",
        description: "valid description",
        metadata: {
          ["k".repeat(ACTIVITY_LIMITS.metadataKeyMaxLength + 1)]: "value",
        },
      }),
    });
    expect(tooLongMetadataKey.status).toBe(400);
    const tooLongMetadataKeyBody = await tooLongMetadataKey.json();
    expect(tooLongMetadataKeyBody.error.message).toContain("Metadata key length");

    const tooLongMetadataValue = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj-lengths",
        actionType: "created_task",
        description: "valid description",
        metadata: {
          key: "v".repeat(ACTIVITY_LIMITS.metadataValueMaxLength + 1),
        },
      }),
    });
    expect(tooLongMetadataValue.status).toBe(400);
    const tooLongMetadataValueBody = await tooLongMetadataValue.json();
    expect(tooLongMetadataValueBody.error.message).toContain("Metadata value");

    const excessiveMetadataEntries = Object.fromEntries(
      Array.from({ length: ACTIVITY_LIMITS.metadataEntriesMax + 1 }, (_, index) => [
        `k${index}`,
        "v",
      ])
    );
    const tooManyMetadataEntries = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj-lengths",
        actionType: "created_task",
        description: "valid description",
        metadata: excessiveMetadataEntries,
      }),
    });
    expect(tooManyMetadataEntries.status).toBe(400);
    const tooManyMetadataEntriesBody = await tooManyMetadataEntries.json();
    expect(tooManyMetadataEntriesBody.error.message).toContain("max entries");
  });

  it("retains only the latest activity entries based on default retention policy", async () => {
    const activitiesPath = path.join(workspacePath, ".kyro", "activities.json");
    const seeded = Array.from({ length: DEFAULT_MAX_ACTIVITY_ENTRIES + 5 }, (_, index) => ({
      id: `seed-${index}`,
      projectId: "proj-retention",
      actionType: "created_task",
      description: `seed-${index}`,
      timestamp: new Date(1_700_000_000_000 + index * 1_000).toISOString(),
      metadata: { agent: "seed" },
    }));
    await fs.writeFile(activitiesPath, JSON.stringify(seeded, null, 2), "utf-8");

    const create = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj-retention",
        actionType: "created_sprint",
        description: "latest-event",
        metadata: { agent: "retention-test" },
      }),
    });
    expect(create.status).toBe(201);

    const persisted = JSON.parse(await fs.readFile(activitiesPath, "utf-8")) as Array<{
      id: string;
      description: string;
    }>;
    expect(persisted).toHaveLength(DEFAULT_MAX_ACTIVITY_ENTRIES);
    expect(persisted[0]?.description).toBe("latest-event");
    expect(persisted.some((entry) => entry.id === "seed-0")).toBe(false);
  });

  it("tracks prune diagnostics and exposes them via GET /api/activities", async () => {
    process.env[ACTIVITIES_RETENTION_ENV_KEY] = "3";
    const activitiesPath = path.join(workspacePath, ".kyro", "activities.json");
    const seeded = Array.from({ length: 6 }, (_, index) => ({
      id: `seed-prune-${index}`,
      projectId: "proj-prune",
      actionType: "created_task",
      description: `seed-prune-${index}`,
      timestamp: new Date(1_700_100_000_000 + index * 1_000).toISOString(),
      metadata: { agent: "seed" },
    }));
    await fs.writeFile(activitiesPath, JSON.stringify(seeded, null, 2), "utf-8");

    const create = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj-prune",
        actionType: "created_sprint",
        description: "prune-trigger",
        metadata: { agent: "diagnostics" },
      }),
    });
    expect(create.status).toBe(201);

    const getResponse = await fetch("/api/activities");
    expect(getResponse.status).toBe(200);
    const getBody = await getResponse.json();
    expect(getBody.data.activities).toHaveLength(3);
    expect(getBody.data.diagnostics.retentionLimit).toBe(3);
    expect(getBody.data.diagnostics.retentionSource).toBe("env");
    expect(getBody.data.diagnostics.pruneMetrics.pruneEvents).toBe(1);
    expect(getBody.data.diagnostics.pruneMetrics.prunedEntriesTotal).toBe(4);
    expect(typeof getBody.data.diagnostics.pruneMetrics.lastPrunedAt).toBe("string");
  });

  it("applies retention config with default, valid env, and invalid env fallback", async () => {
    const activitiesPath = path.join(workspacePath, ".kyro", "activities.json");
    const seedEntries = async (count: number) => {
      const entries = Array.from({ length: count }, (_, index) => ({
        id: `seed-config-${index}`,
        projectId: "proj-config",
        actionType: "created_task",
        description: `seed-config-${index}`,
        timestamp: new Date(1_700_200_000_000 + index * 1_000).toISOString(),
        metadata: { agent: "seed" },
      }));
      await fs.writeFile(activitiesPath, JSON.stringify(entries, null, 2), "utf-8");
    };

    await seedEntries(DEFAULT_MAX_ACTIVITY_ENTRIES + 3);
    let create = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj-config",
        actionType: "created_task",
        description: "default-retention",
      }),
    });
    expect(create.status).toBe(201);
    let persisted = JSON.parse(await fs.readFile(activitiesPath, "utf-8")) as Array<{ id: string }>;
    expect(persisted).toHaveLength(DEFAULT_MAX_ACTIVITY_ENTRIES);
    let diagnosticsRes = await fetch("/api/activities");
    let diagnosticsBody = await diagnosticsRes.json();
    expect(diagnosticsBody.data.diagnostics.retentionSource).toBe("default");

    process.env[ACTIVITIES_RETENTION_ENV_KEY] = "5";
    await seedEntries(10);
    create = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj-config",
        actionType: "created_task",
        description: "valid-env-retention",
      }),
    });
    expect(create.status).toBe(201);
    persisted = JSON.parse(await fs.readFile(activitiesPath, "utf-8")) as Array<{ id: string }>;
    expect(persisted).toHaveLength(5);
    diagnosticsRes = await fetch("/api/activities");
    diagnosticsBody = await diagnosticsRes.json();
    expect(diagnosticsBody.data.diagnostics.retentionSource).toBe("env");
    expect(diagnosticsBody.data.diagnostics.retentionLimit).toBe(5);

    process.env[ACTIVITIES_RETENTION_ENV_KEY] = "invalid";
    await seedEntries(DEFAULT_MAX_ACTIVITY_ENTRIES + 2);
    create = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj-config",
        actionType: "created_task",
        description: "invalid-env-retention",
      }),
    });
    expect(create.status).toBe(201);
    persisted = JSON.parse(await fs.readFile(activitiesPath, "utf-8")) as Array<{ id: string }>;
    expect(persisted).toHaveLength(DEFAULT_MAX_ACTIVITY_ENTRIES);
    diagnosticsRes = await fetch("/api/activities");
    diagnosticsBody = await diagnosticsRes.json();
    expect(diagnosticsBody.data.diagnostics.retentionSource).toBe("default_invalid_env");
    expect(diagnosticsBody.data.diagnostics.retentionRawValue).toBe("invalid");
  });
});
