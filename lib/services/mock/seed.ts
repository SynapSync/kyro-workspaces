// Synchronous seed data for store initialization.
// This is the ONLY file that imports directly from mock-data.
// Mock services use this data; the real API services will ignore it.

import { mockProjects, mockActivities, teamMembers } from "@/lib/mock-data";
import type { Project, TeamMember, AgentActivity } from "@/lib/types";

export function getInitialState(): {
  projects: Project[];
  members: TeamMember[];
  activities: AgentActivity[];
} {
  return {
    projects: mockProjects,
    members: teamMembers,
    activities: mockActivities,
  };
}
