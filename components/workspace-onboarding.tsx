"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type OnboardingState = "loading" | "needs_onboarding" | "needs_init" | "ready_empty" | "error";

interface WorkspaceOnboardingProps {
  initError?: string | null;
  onInitialized: () => void | Promise<void>;
}

export function WorkspaceOnboarding({ initError, onInitialized }: WorkspaceOnboardingProps) {
  const [state, setState] = useState<OnboardingState>("loading");
  const [workspaceName, setWorkspaceName] = useState("Kyro Workspace");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadStatus = async () => {
      try {
        const response = await fetch("/api/workspace");
        const json = (await response.json()) as {
          data?: {
            workspace?: { name?: string };
            needsOnboarding?: boolean;
            needsInit?: boolean;
          };
          error?: { message?: string };
        };

        if (!mounted) return;

        if (response.ok && json.data?.workspace) {
          setWorkspaceName(json.data.workspace.name ?? "Kyro Workspace");
          setState("ready_empty");
          return;
        }

        if (response.status === 503 && json.data?.needsOnboarding) {
          setState("needs_onboarding");
          return;
        }

        if (response.status === 404 && json.data?.needsInit) {
          setState("needs_init");
          return;
        }

        setState("error");
        setError(json.error?.message ?? initError ?? "Unknown workspace error");
      } catch (err) {
        if (!mounted) return;
        setState("error");
        setError(err instanceof Error ? err.message : "Failed to fetch workspace status");
      }
    };

    void loadStatus();
    return () => {
      mounted = false;
    };
  }, [initError]);

  const handleInit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/workspace/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName.trim() || "Kyro Workspace" }),
      });

      if (!response.ok) {
        const json = (await response.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Workspace initialization failed");
      }

      await onInitialized();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Initialization failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (state === "loading") {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Checking workspace status...</p>
        </div>
      </div>
    );
  }

  if (state === "needs_onboarding") {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="max-w-lg rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-semibold">Workspace path is not configured</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Set <code className="rounded bg-muted px-1 py-0.5">KYRO_WORKSPACE_PATH</code> in
            <code className="ml-1 rounded bg-muted px-1 py-0.5">.env.local</code> and restart the app.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Example: <code>KYRO_WORKSPACE_PATH=/Users/you/kyro-workspace</code>
          </p>
        </div>
      </div>
    );
  }

  if (state === "needs_init") {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <FolderPlus className="h-4 w-4" />
            <p className="text-sm font-semibold">Initialize workspace</p>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Kyro found the workspace path, but this workspace has not been initialized yet.
          </p>
          <div className="mb-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Workspace name</p>
            <Input
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="Kyro Workspace"
            />
          </div>
          {error && <p className="mb-3 text-xs text-destructive">{error}</p>}
          <Button onClick={handleInit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create workspace files
          </Button>
        </div>
      </div>
    );
  }

  if (state === "ready_empty") {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="max-w-lg rounded-xl border bg-card p-6 text-center shadow-sm">
          <p className="text-sm font-semibold">Workspace is ready</p>
          <p className="mt-2 text-sm text-muted-foreground">
            No projects found yet. Create your first project from the sidebar to start.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="max-w-lg rounded-xl border bg-card p-6 text-center shadow-sm">
        <p className="text-sm font-semibold text-destructive">Workspace error</p>
        <p className="mt-2 text-sm text-muted-foreground">{error ?? initError ?? "Unknown error"}</p>
      </div>
    </div>
  );
}
