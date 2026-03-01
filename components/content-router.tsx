"use client";

import { Loader2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { ProjectOverview } from "@/components/pages/project-overview";
import { ReadmePage } from "@/components/pages/readme-page";
import { DocumentsPage } from "@/components/pages/documents-page";
import { SprintsPage } from "@/components/pages/sprints-page";
import { SprintBoard } from "@/components/pages/sprint-board";
import { SprintDetailPage } from "@/components/pages/sprint-detail-page";
import { AgentsActivityPage } from "@/components/pages/agents-activity-page";
import { CommandPalette } from "@/components/command-palette";

export function ContentRouter() {
  const { activeSidebarItem, activeSprintId, activeSprintDetailId, isInitializing, initError } =
    useAppStore();

  if (isInitializing) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        <div className="flex flex-col items-center gap-2 text-center max-w-sm">
          <p className="text-sm font-medium">Failed to load app data</p>
          <p className="text-xs text-muted-foreground">{initError}</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (activeSprintDetailId) {
      return <SprintDetailPage sprintId={activeSprintDetailId} />;
    }
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
  };

  return (
    <>
      <CommandPalette />
      {renderContent()}
    </>
  );
}
