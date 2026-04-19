"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, FolderOpen, FolderSearch, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type OnboardingState = "loading" | "needs_env" | "ready" | "error";

interface WorkspaceOnboardingProps {
  initError?: string | null;
}

const COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-red-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-orange-500",
];

export function WorkspaceOnboarding({ initError }: WorkspaceOnboardingProps) {
  const { addProject, initializeApp } = useAppStore();
  const [state, setState] = useState<OnboardingState>("loading");
  const [needsInit, setNeedsInit] = useState(false);
  const [path, setPath] = useState("");
  const [color, setColor] = useState("");
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkStatus = async () => {
      try {
        const response = await fetch("/api/workspace");
        const json = (await response.json()) as {
          data?: {
            workspace?: { name?: string };
            needsOnboarding?: boolean;
            needsInit?: boolean;
          };
        };

        if (!mounted) return;

        if (response.status === 503 && json.data?.needsOnboarding) {
          setState("needs_env");
          return;
        }

        if (response.status === 404 && json.data?.needsInit) {
          setNeedsInit(true);
        }

        setState("ready");
      } catch {
        if (!mounted) return;
        setState("error");
        setError(initError ?? "Failed to check workspace status");
      }
    };

    void checkStatus();
    return () => {
      mounted = false;
    };
  }, [initError]);

  const handleBrowse = async () => {
    setIsBrowsing(true);
    setError(null);
    try {
      const response = await fetch("/api/filesystem/browse", { method: "POST" });
      const json = (await response.json()) as {
        data?: { path?: string; cancelled?: boolean };
        error?: { message?: string };
      };

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Failed to open folder picker");
      }

      if (json.data?.cancelled) return;
      if (json.data?.path) {
        setPath(json.data.path);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to browse folders");
    } finally {
      setIsBrowsing(false);
    }
  };

  const handleOpenProject = async () => {
    if (!path.trim()) {
      setError("Path is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Auto-initialize workspace if needed
      if (needsInit) {
        const initResponse = await fetch("/api/workspace/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        if (!initResponse.ok) {
          const json = (await initResponse.json()) as { error?: { message?: string } };
          throw new Error(json.error?.message ?? "Workspace initialization failed");
        }
      }

      // Register the project
      await addProject(path.trim(), undefined, color || undefined);

      // Reload the full app state
      await initializeApp();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open project");
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

  if (state === "needs_env") {
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

  if (state === "error") {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="max-w-lg rounded-xl border bg-card p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-destructive">Workspace error</p>
          <p className="mt-2 text-sm text-muted-foreground">{error ?? initError ?? "Unknown error"}</p>
        </div>
      </div>
    );
  }

  // state === "ready" — show the open-project form
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <FolderOpen className="h-5 w-5" />
          <p className="text-base font-semibold">Open a sprint-forge project</p>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          Choose one scope folder (for example{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">.agents/sprint-forge/diskforge-v2-features/</code>
          ), not the parent <code className="rounded bg-muted px-1 py-0.5 text-xs">.agents/sprint-forge/</code> that
          lists several projects. That folder must contain{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">README.md</code> and either{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">sprint-forge/</code> or legacy{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">sprints/</code> with sprint markdown.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="onboarding-path" className="text-sm font-medium">
              Directory Path
            </Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="onboarding-path"
                value={path}
                onChange={(e) => {
                  setPath(e.target.value);
                  setError(null);
                }}
                placeholder="…/.agents/sprint-forge/your-scope-project"
                className="flex-1 font-mono text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleOpenProject()}
                autoFocus
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleBrowse}
                disabled={isBrowsing || isSubmitting}
                title="Browse folders"
              >
                {isBrowsing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FolderSearch className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Color (optional)</Label>
            <div className="flex gap-2 mt-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(color === c ? "" : c)}
                  className={cn(
                    "h-6 w-6 rounded-full transition-all",
                    c,
                    color === c
                      ? "ring-2 ring-offset-2 ring-primary scale-110"
                      : "hover:scale-110"
                  )}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleOpenProject}
            disabled={!path.trim() || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening project...
              </>
            ) : (
              "Open Project"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
