import { NextRequest } from "next/server";
import {
  WorkspaceError,
  getWorkspacePath,
  handleError,
  ok,
  validateBody,
} from "@/lib/api";
import {
  appendActivity,
  isValidActionType,
  listActivities,
} from "@/lib/api/activities-log";

interface CreateActivityPayload {
  projectId: string;
  actionType: string;
  description: string;
  metadata?: Record<string, string>;
}

export async function GET() {
  try {
    const workspacePath = getWorkspacePath();
    const activities = await listActivities(workspacePath);
    return ok({ activities }, 200);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const workspacePath = getWorkspacePath();
    const body = await req.json();
    const payload = validateBody<CreateActivityPayload>(body, [
      "projectId",
      "actionType",
      "description",
    ]);

    if (!isValidActionType(payload.actionType)) {
      throw new WorkspaceError(
        "INVALID_FORMAT",
        `Unsupported actionType: ${payload.actionType}`
      );
    }

    const activity = await appendActivity(workspacePath, {
      projectId: payload.projectId,
      actionType: payload.actionType,
      description: payload.description,
      metadata: payload.metadata,
    });

    return ok({ activity }, 201);
  } catch (err) {
    return handleError(err);
  }
}
