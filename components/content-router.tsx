"use client";

import { useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { NAV_ITEMS } from "@/lib/config";
import { ProjectOverviewPage } from "@/components/pages/project-overview";
import { ReadmePage } from "@/components/pages/readme-page";
import { DocumentsPage } from "@/components/pages/documents-page";
import { SprintsPage } from "@/components/pages/sprints-page";
import { SprintBoardPage } from "@/components/pages/sprint-board";
import { SprintDetailPage } from "@/components/pages/sprint-detail-page";
import { AgentsActivityPage } from "@/components/pages/agents-activity-page";
import { FindingsPage } from "@/components/pages/findings-page";
import { RoadmapPage } from "@/components/pages/roadmap-page";
import { DebtDashboardPage } from "@/components/pages/debt-dashboard-page";
import { CommandPalette } from "@/components/command-palette";
import { WorkspaceOnboarding } from "@/components/workspace-onboarding";

const PAGE_MAP: Record<string, React.ReactNode> = {
  overview:  <ProjectOverviewPage />,
  readme:    <ReadmePage />,
  sprints:   <SprintsPage />,
  findings:  <FindingsPage />,
  roadmap:   <RoadmapPage />,
  debt:      <DebtDashboardPage />,
  documents: <DocumentsPage />,
  agents:    <AgentsActivityPage />,
};

export function ContentRouter() {
  const {
    activeSidebarItem,
    activeSprintId,
    activeSprintDetailId,
    isInitializing,
    initError,
    initializeApp,
    projects,
    isSaving,
    saveError,
    setSaveError,
  } = useAppStore();

  useEffect(() => {
    if (saveError) {
      const timer = setTimeout(() => setSaveError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [saveError, setSaveError]);

  if (isInitializing) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading workspace...</p>
          <p className="text-xs text-muted-foreground">Reading projects from filesystem...</p>
        </div>
      </div>
    );
  }

  if (!isInitializing && (initError || projects.length === 0)) {
    return (
      <WorkspaceOnboarding
        initError={initError}
        onInitialized={() => initializeApp()}
      />
    );
  }

  const renderContent = () => {
    if (activeSprintDetailId) {
      return <SprintDetailPage sprintId={activeSprintDetailId} />;
    }
    if (activeSprintId) {
      return <SprintBoardPage sprintId={activeSprintId} />;
    }
    return PAGE_MAP[activeSidebarItem] ?? PAGE_MAP[NAV_ITEMS[0].id];
  };

  const needsOwnScroll = !!activeSprintDetailId || !!activeSprintId;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <CommandPalette />
      <div className={needsOwnScroll ? "flex-1 min-h-0 overflow-hidden" : "flex-1 min-h-0 overflow-auto"}>
        {renderContent()}
      </div>
      {/* Save indicator */}
      {(isSaving || saveError) && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md border bg-background px-3 py-2 shadow-md text-sm">
          {isSaving && !saveError && (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Saving...</span>
            </>
          )}
          {saveError && (
            <>
              <span className="text-destructive text-xs">{saveError}</span>
              <button onClick={() => setSaveError(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
