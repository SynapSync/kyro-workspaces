// Service factory — returns the correct implementation based on environment.
//
// NEXT_PUBLIC_USE_MOCK_DATA=true  → mock services (for development without a real workspace)
// NEXT_PUBLIC_USE_MOCK_DATA=false → file services (reads/writes markdown files via API routes)

import type { AppServices } from "./types";
import { MockProjectsService } from "./mock/projects.mock";
import { MockMembersService } from "./mock/members.mock";
import { MockActivitiesService } from "./mock/activities.mock";
import { FileProjectsService } from "./file/projects.file";
import { FileMembersService } from "./file/members.file";
import { FileActivitiesService } from "./file/activities.file";

function createServices(): AppServices {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "true") {
    return {
      projects: new FileProjectsService(),
      members: new FileMembersService(),
      activities: new FileActivitiesService(),
    };
  }
  return {
    projects: new MockProjectsService(),
    members: new MockMembersService(),
    activities: new MockActivitiesService(),
  };
}

export const services = createServices();

// Re-export types for consumers
export type { AppServices, ProjectsService, MembersService, ActivitiesService } from "./types";
export type {
  CreateProjectInput,
  UpdateProjectInput,
  CreateMemberInput,
  UpdateMemberInput,
  CreateActivityInput,
} from "./types";
