import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileMembersService } from "@/lib/services/file/members.file";
import { FileActivitiesService } from "@/lib/services/file/activities.file";
import { installApiFetchMock } from "./api-test-router";

async function ensureWorkspace(): Promise<void> {
  const response = await fetch("/api/workspace/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Members Workspace" }),
  });
  if (!response.ok) {
    throw new Error(`workspace init failed: ${response.status}`);
  }
}

describe("FileMembersService + FileActivitiesService integration", () => {
  let workspacePath: string;
  let restoreFetch: (() => void) | null = null;

  beforeEach(async () => {
    workspacePath = await fs.mkdtemp(path.join(os.tmpdir(), "kyro-file-members-"));
    process.env.KYRO_WORKSPACE_PATH = workspacePath;
    process.env.NEXT_PUBLIC_API_URL = "";

    const mocked = installApiFetchMock();
    restoreFetch = mocked.restore;

    await ensureWorkspace();
  });

  afterEach(async () => {
    if (restoreFetch) {
      restoreFetch();
      restoreFetch = null;
    }
    await fs.rm(workspacePath, { recursive: true, force: true });
  });

  it("performs CRUD on members through file service", async () => {
    const membersService = new FileMembersService();

    const created = await membersService.createMember({
      name: "Alice",
      avatar: "AL",
      color: "#00AAFF",
    });

    expect(created.id).toMatch(/^member-/);

    const updated = await membersService.updateMember(created.id ?? "", {
      name: "Alice Cooper",
    });

    expect(updated.name).toBe("Alice Cooper");

    const listed = await membersService.list();
    expect(listed).toHaveLength(1);
    expect(listed[0].name).toBe("Alice Cooper");

    await membersService.deleteMember(created.id ?? "");
    const empty = await membersService.list();
    expect(empty).toHaveLength(0);
  });

  it("reads activities logged through /api/activities", async () => {
    const activitiesService = new FileActivitiesService();

    const create = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj-activities",
        actionType: "created_sprint",
        description: "Sprint Forge created Sprint 5",
        metadata: { agent: "Sprint Forge" },
      }),
    });

    expect(create.ok).toBe(true);

    const activities = await activitiesService.list();
    expect(activities.length).toBe(1);
    expect(activities[0].actionType).toBe("created_sprint");
    expect(activities[0].metadata?.agent).toBe("Sprint Forge");
  });
});
