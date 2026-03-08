import type { ActivitiesService, CreateActivityInput } from "../types";
import type { ActivitiesListResult } from "@/lib/types";
import { mockActivities } from "@/lib/mock-data";
import { mockDelay } from "./delay";

const inMemoryActivities = [...mockActivities];

export class MockActivitiesService implements ActivitiesService {
  async list(): Promise<ActivitiesListResult> {
    await mockDelay();
    return { activities: inMemoryActivities, diagnostics: null };
  }

  async createActivity(data: CreateActivityInput) {
    await mockDelay();
    const activity = {
      id: `mock-act-${Date.now().toString(36)}`,
      projectId: data.projectId,
      actionType: data.actionType,
      description: data.description,
      timestamp: new Date().toISOString(),
      metadata: data.metadata,
    };
    inMemoryActivities.unshift(activity);
    return activity;
  }
}
