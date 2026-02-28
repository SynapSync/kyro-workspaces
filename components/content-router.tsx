"use client";

import { useAppStore } from "@/lib/store";
import { ProjectOverview } from "@/components/pages/project-overview";
import { ReadmePage } from "@/components/pages/readme-page";
import { DocumentsPage } from "@/components/pages/documents-page";
import { SprintsPage } from "@/components/pages/sprints-page";
import { SprintBoard } from "@/components/pages/sprint-board";
import { AgentsActivityPage } from "@/components/pages/agents-activity-page";

export function ContentRouter() {
  const { activeSidebarItem, activeSprintId } = useAppStore();

  if (activeSprintId) {
    return <SprintBoard sprintId={activeSprintId} />;
  }

  switch (activeSidebarItem) {
    case "overview":
      return <ProjectOverview />;
    case "readme":
      return <ReadmePage />;
    case "documents":
      return <DocumentsPage />;
    case "sprints":
      return <SprintsPage />;
    case "agents":
      return <AgentsActivityPage />;
    default:
      return <ProjectOverview />;
  }
}
