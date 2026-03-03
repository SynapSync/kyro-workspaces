import type { ActivitiesService, CreateActivityInput } from "../types";
import { mockActivities } from "@/lib/mock-data";

const DELAY_MS =
  typeof process !== "undefined"
    ? Number(process.env.NEXT_PUBLIC_MOCK_DELAY_MS ?? 0)
    : 0;

const delay = (ms: number) =>
  ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve();

const inMemoryActivities = [...mockActivities];

export class MockActivitiesService implements ActivitiesService {
  async list() {
    await delay(DELAY_MS);
    return inMemoryActivities;
  }

  async createActivity(data: CreateActivityInput) {
    await delay(DELAY_MS);
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
