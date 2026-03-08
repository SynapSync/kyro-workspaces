"use client";

import { useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { Providers } from "@/components/providers";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { CommandPalette } from "@/components/command-palette";
import { WorkspaceOnboarding } from "@/components/workspace-onboarding";
import { useAppStore } from "@/lib/store";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";

function WorkspaceShell({ children }: { children: React.ReactNode }) {
  useRealtimeSync();
  const {
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
      <div className="flex h-screen items-center justify-center text-muted-foreground">
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
      <div className="flex h-screen items-center justify-center">
        <WorkspaceOnboarding
          initError={initError}
          onInitialized={() => initializeApp()}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar />
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <CommandPalette />
          {children}
        </main>
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

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <WorkspaceShell>{children}</WorkspaceShell>
    </Providers>
  );
}
