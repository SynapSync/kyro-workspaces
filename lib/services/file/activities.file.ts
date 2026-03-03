import type { ActivitiesService } from "../types";
import type { AgentActivity } from "@/lib/types";
import { localFetch } from "./fetch";

export class FileActivitiesService implements ActivitiesService {
  async list(): Promise<AgentActivity[]> {
    const { activities } = await localFetch<{ activities: AgentActivity[] }>(
      "/api/activities"
    );
    return activities;
  }
}
