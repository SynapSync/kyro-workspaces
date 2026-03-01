// Service factory — returns the correct implementation based on environment.
//
// Currently: always returns mock implementations (no backend yet).
// When a real API is ready:
//   1. Create ApiProjectsService, ApiMembersService, ApiActivitiesService
//   2. Set NEXT_PUBLIC_USE_MOCK_DATA=false in .env.local (or .env.production)
//   3. Add the `else` branch below to return the API implementations

import type { AppServices } from "./types";
import { MockProjectsService } from "./mock/projects.mock";
import { MockMembersService } from "./mock/members.mock";
import { MockActivitiesService } from "./mock/activities.mock";

function createServices(): AppServices {
  // Future: if (process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "true") return apiServices;
  return {
    projects: new MockProjectsService(),
    members: new MockMembersService(),
    activities: new MockActivitiesService(),
  };
}

export const services = createServices();

// Re-export types for consumers
export type { AppServices, ProjectsService, MembersService, ActivitiesService } from "./types";
