import * as fs from "fs/promises";
import { fileExists, resolveAndGuard } from "@/lib/api";
import { parseActivitiesFile } from "@/lib/file-format/parsers";
import { serializeActivitiesFile } from "@/lib/file-format/serializers";
import type { AgentActionType, AgentActivity } from "@/lib/types";

export const DEFAULT_MAX_ACTIVITY_ENTRIES = 200;
// Kept for backward compatibility with existing imports/tests.
export const MAX_ACTIVITY_ENTRIES = DEFAULT_MAX_ACTIVITY_ENTRIES;
export const ACTIVITIES_RETENTION_ENV_KEY = "KYRO_ACTIVITIES_RETENTION_MAX_ENTRIES";
export const ACTIVITIES_RETENTION_MIN_ENTRIES = 1;
export const ACTIVITIES_RETENTION_MAX_ENTRIES = 5000;

type ActivityRetentionSource = "default" | "env" | "default_invalid_env";

interface ActivityRetentionConfig {
  limit: number;
  source: ActivityRetentionSource;
  rawValue?: string;
}

interface PersistedPruneMetrics {
  pruneEvents: number;
  prunedEntriesTotal: number;
  lastPrunedAt?: string;
}

export interface ActivitiesDiagnostics {
  retentionLimit: number;
  retentionSource: ActivityRetentionSource;
  retentionEnvKey: string;
  retentionRawValue?: string;
  pruneMetrics: PersistedPruneMetrics;
}

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

const DEFAULT_PRUNE_METRICS: PersistedPruneMetrics = {
  pruneEvents: 0,
  prunedEntriesTotal: 0,
};

function resolveRetentionConfig(): ActivityRetentionConfig {
  const rawValue = process.env[ACTIVITIES_RETENTION_ENV_KEY];
  if (rawValue === undefined) {
    return { limit: DEFAULT_MAX_ACTIVITY_ENTRIES, source: "default" };
  }

  const normalized = rawValue.trim();
  if (!/^\d+$/.test(normalized)) {
    return {
      limit: DEFAULT_MAX_ACTIVITY_ENTRIES,
      source: "default_invalid_env",
      rawValue,
    };
  }

  const parsed = Number.parseInt(normalized, 10);
  if (
    !Number.isSafeInteger(parsed) ||
    parsed < ACTIVITIES_RETENTION_MIN_ENTRIES ||
    parsed > ACTIVITIES_RETENTION_MAX_ENTRIES
  ) {
    return {
      limit: DEFAULT_MAX_ACTIVITY_ENTRIES,
      source: "default_invalid_env",
      rawValue,
    };
  }

  return { limit: parsed, source: "env", rawValue };
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

function isValidPruneMetrics(value: unknown): value is PersistedPruneMetrics {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Partial<PersistedPruneMetrics>;
  const pruneEventsValid =
    typeof candidate.pruneEvents === "number" &&
    Number.isFinite(candidate.pruneEvents) &&
    candidate.pruneEvents >= 0;
  const totalValid =
    typeof candidate.prunedEntriesTotal === "number" &&
    Number.isFinite(candidate.prunedEntriesTotal) &&
    candidate.prunedEntriesTotal >= 0;
  const lastPrunedAtValid =
    candidate.lastPrunedAt === undefined || typeof candidate.lastPrunedAt === "string";

  return pruneEventsValid && totalValid && lastPrunedAtValid;
}

function getMetricsPath(workspacePath: string): string {
  return resolveAndGuard(workspacePath, ".kyro", "activities-metrics.json");
}

async function readPruneMetrics(workspacePath: string): Promise<PersistedPruneMetrics> {
  const metricsPath = getMetricsPath(workspacePath);
  if (!(await fileExists(metricsPath))) {
    return DEFAULT_PRUNE_METRICS;
  }

  const content = await fs.readFile(metricsPath, "utf-8");
  if (!content.trim()) {
    return DEFAULT_PRUNE_METRICS;
  }

  try {
    const parsed: unknown = JSON.parse(content);
    if (!isValidPruneMetrics(parsed)) {
      return DEFAULT_PRUNE_METRICS;
    }
    return parsed;
  } catch {
    return DEFAULT_PRUNE_METRICS;
  }
}

async function writePruneMetrics(
  workspacePath: string,
  metrics: PersistedPruneMetrics
): Promise<void> {
  const metricsPath = getMetricsPath(workspacePath);
  await fs.writeFile(metricsPath, JSON.stringify(metrics, null, 2), "utf-8");
}

export async function getActivitiesDiagnostics(
  workspacePath: string
): Promise<ActivitiesDiagnostics> {
  const retention = resolveRetentionConfig();
  const pruneMetrics = await readPruneMetrics(workspacePath);
  return {
    retentionLimit: retention.limit,
    retentionSource: retention.source,
    retentionEnvKey: ACTIVITIES_RETENTION_ENV_KEY,
    retentionRawValue: retention.rawValue,
    pruneMetrics,
  };
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
  const retention = resolveRetentionConfig();

  const activity: AgentActivity = {
    id: `act-${Date.now().toString(36)}`,
    projectId: input.projectId,
    actionType: input.actionType,
    description: input.description,
    timestamp: new Date().toISOString(),
    metadata: input.metadata,
  };

  const sorted = sortActivitiesByTimestampDesc([activity, ...activities]);
  const retained = sorted.slice(0, retention.limit);
  const prunedCount = Math.max(0, sorted.length - retained.length);
  await fs.writeFile(activitiesPath, serializeActivitiesFile(retained), "utf-8");

  if (prunedCount > 0) {
    const previous = await readPruneMetrics(workspacePath);
    await writePruneMetrics(workspacePath, {
      pruneEvents: previous.pruneEvents + 1,
      prunedEntriesTotal: previous.prunedEntriesTotal + prunedCount,
      lastPrunedAt: activity.timestamp,
    });
  }

  return activity;
}
