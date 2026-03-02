import type { ActivitiesService } from "../types";
import type { AgentActivity } from "@/lib/types";

export class FileActivitiesService implements ActivitiesService {
  async list(): Promise<AgentActivity[]> {
    // Activities API not yet implemented — return empty array
    // Will be implemented in Sprint 5 (Agent Infrastructure)
    return [];
  }
}
