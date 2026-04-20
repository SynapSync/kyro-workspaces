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
  getActivitiesDiagnostics,
  isValidActionType,
  listActivities,
} from "@/lib/api/activities-log";
import { ACTIVITY_LIMITS } from "@/lib/api/activities-constraints";

interface CreateActivityPayload {
  projectId: string;
  actionType: string;
  description: string;
  metadata?: Record<string, string>;
}

function requireNonEmptyString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new WorkspaceError(
      "INVALID_FORMAT",
      `Field '${field}' must be a non-empty string`
    );
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new WorkspaceError(
      "INVALID_FORMAT",
      `Field '${field}' exceeds max length (${maxLength})`
    );
  }
  return normalized;
}

function normalizeMetadata(value: unknown): Record<string, string> | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new WorkspaceError("INVALID_FORMAT", "Field 'metadata' must be an object");
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > ACTIVITY_LIMITS.metadataEntriesMax) {
    throw new WorkspaceError(
      "INVALID_FORMAT",
      `Field 'metadata' exceeds max entries (${ACTIVITY_LIMITS.metadataEntriesMax})`
    );
  }
  const metadata: Record<string, string> = {};

  for (const [key, entryValue] of entries) {
    if (key.length === 0 || key.length > ACTIVITY_LIMITS.metadataKeyMaxLength) {
      throw new WorkspaceError(
        "INVALID_FORMAT",
        `Metadata key length must be 1..${ACTIVITY_LIMITS.metadataKeyMaxLength}`
      );
    }
    if (typeof entryValue !== "string") {
      throw new WorkspaceError(
        "INVALID_FORMAT",
        `Metadata value for '${key}' must be a string`
      );
    }
    if (entryValue.length > ACTIVITY_LIMITS.metadataValueMaxLength) {
      throw new WorkspaceError(
        "INVALID_FORMAT",
        `Metadata value for '${key}' exceeds max length (${ACTIVITY_LIMITS.metadataValueMaxLength})`
      );
    }
    metadata[key] = entryValue;
  }

  return metadata;
}

export async function GET() {
  try {
    const workspacePath = getWorkspacePath();
    const [activities, diagnostics] = await Promise.all([
      listActivities(workspacePath),
      getActivitiesDiagnostics(workspacePath),
    ]);
    return ok({ activities, diagnostics }, 200);
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

    const projectId = requireNonEmptyString(
      payload.projectId,
      "projectId",
      ACTIVITY_LIMITS.projectIdMaxLength
    );
    const description = requireNonEmptyString(
      payload.description,
      "description",
      ACTIVITY_LIMITS.descriptionMaxLength
    );
    const metadata = normalizeMetadata(payload.metadata);

    if (!isValidActionType(payload.actionType)) {
      throw new WorkspaceError(
        "INVALID_FORMAT",
        `Unsupported actionType: ${payload.actionType}`
      );
    }

    const activity = await appendActivity(workspacePath, {
      projectId,
      actionType: payload.actionType,
      description,
      metadata,
    });

    return ok({ activity }, 201);
  } catch (err) {
    return handleError(err);
  }
}
