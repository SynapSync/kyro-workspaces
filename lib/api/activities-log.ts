import * as fs from "fs/promises";
import { fileExists, resolveAndGuard } from "@/lib/api";
import { parseActivitiesFile } from "@/lib/file-format/parsers";
import { serializeActivitiesFile } from "@/lib/file-format/serializers";
import type { AgentActionType, AgentActivity } from "@/lib/types";

export const MAX_ACTIVITY_ENTRIES = 200;

const ACTION_TYPES: AgentActionType[] = [
  "created_task",
  "moved_task",
  "edited_doc",
  "created_sprint",
  "completed_task",
];

export function isValidActionType(value: string): value is AgentActionType {
  return ACTION_TYPES.includes(value as AgentActionType);
}

export interface AppendActivityInput {
  projectId: string;
  actionType: AgentActionType;
  description: string;
  metadata?: Record<string, string>;
}

async function readActivitiesFile(workspacePath: string): Promise<AgentActivity[]> {
  const activitiesPath = resolveAndGuard(workspacePath, ".kyro", "activities.json");
  if (!(await fileExists(activitiesPath))) {
    return [];
  }

  const content = await fs.readFile(activitiesPath, "utf-8");
  return parseActivitiesFile(content);
}

function sortActivitiesByTimestampDesc(activities: AgentActivity[]): AgentActivity[] {
  return [...activities].sort((a, b) => {
    const byTimestamp = b.timestamp.localeCompare(a.timestamp);
    if (byTimestamp !== 0) return byTimestamp;
    return b.id.localeCompare(a.id);
  });
}

export async function listActivities(workspacePath: string): Promise<AgentActivity[]> {
  const activities = await readActivitiesFile(workspacePath);
  return sortActivitiesByTimestampDesc(activities);
}

export async function appendActivity(
  workspacePath: string,
  input: AppendActivityInput
): Promise<AgentActivity> {
  const activitiesPath = resolveAndGuard(workspacePath, ".kyro", "activities.json");
  const activities = await readActivitiesFile(workspacePath);

  const activity: AgentActivity = {
    id: `act-${Date.now().toString(36)}`,
    projectId: input.projectId,
    actionType: input.actionType,
    description: input.description,
    timestamp: new Date().toISOString(),
    metadata: input.metadata,
  };

  const retained = sortActivitiesByTimestampDesc([activity, ...activities]).slice(
    0,
    MAX_ACTIVITY_ENTRIES
  );
  await fs.writeFile(activitiesPath, serializeActivitiesFile(retained), "utf-8");

  return activity;
}
