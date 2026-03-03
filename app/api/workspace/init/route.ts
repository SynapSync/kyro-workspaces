import * as fs from "fs/promises";
import * as path from "path";
import { NextRequest } from "next/server";
import {
  getWorkspacePath,
  ensureDir,
  ok,
  handleError,
  validateBody,
} from "@/lib/api";
import {
  serializeWorkspaceConfig,
  serializeMembersFile,
  serializeActivitiesFile,
} from "@/lib/file-format/serializers";
import { syncWorkspaceAgentDocs } from "@/lib/file-format/templates";

export async function POST(req: NextRequest) {
  try {
    const workspacePath = getWorkspacePath();
    const body = await req.json();
    validateBody<{ name: string }>(body, ["name"]);

    const now = new Date().toISOString();
    const workspaceId = `ws-${Date.now().toString(36)}`;

    const kyroDir = path.join(workspacePath, ".kyro");
    await ensureDir(kyroDir);

    const configContent = serializeWorkspaceConfig({
      id: workspaceId,
      name: body.name,
      description: body.description ?? "",
      rootPath: workspacePath,
      createdAt: now,
      updatedAt: now,
    });

    await fs.writeFile(path.join(kyroDir, "config.json"), configContent, "utf-8");

    const membersContent = serializeMembersFile([]);
    await fs.writeFile(path.join(kyroDir, "members.json"), membersContent, "utf-8");

    const activitiesContent = serializeActivitiesFile([]);
    await fs.writeFile(path.join(kyroDir, "activities.json"), activitiesContent, "utf-8");
    await fs.writeFile(
      path.join(kyroDir, "activities-metrics.json"),
      JSON.stringify({ pruneEvents: 0, prunedEntriesTotal: 0 }, null, 2),
      "utf-8"
    );

    const projectsDir = path.join(workspacePath, "projects");
    await ensureDir(projectsDir);

    await syncWorkspaceAgentDocs(workspacePath);

    return ok({ initialized: true }, 201);
  } catch (err) {
    return handleError(err);
  }
}
