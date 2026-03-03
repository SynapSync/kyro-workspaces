import type { ActivitiesService, CreateActivityInput } from "../types";
import type { AgentActivity } from "@/lib/types";
import { localFetch } from "./fetch";

const ACTIVITY_CREATE_TIMEOUT_MS = 1500;

export class FileActivitiesService implements ActivitiesService {
  async list(): Promise<AgentActivity[]> {
    const { activities } = await localFetch<{ activities: AgentActivity[]; diagnostics: unknown }>(
      "/api/activities"
    );
    return activities;
  }

  async createActivity(data: CreateActivityInput): Promise<AgentActivity> {
    const { activity } = await localFetch<{ activity: AgentActivity }>(
      "/api/activities",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      { timeoutMs: ACTIVITY_CREATE_TIMEOUT_MS }
    );
    return activity;
  }
}
