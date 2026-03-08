"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Sidebar,
  Zap,
  CheckSquare,
  Search,
  AlertTriangle,
  FileText,
  Layers,
  Terminal,
  RefreshCw,
  ArrowRightLeft,
  Wand2,
  Sparkles,
  Loader2,
  Circle,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Navigation,
  Play,
  SkipForward,
  Square,
  RotateCcw,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { NAV_ITEMS } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useSearchIndex, groupByType, type SearchEntryType, type SearchEntry } from "@/lib/search";
import { SprintForgeWizard } from "@/components/dialogs/sprint-forge-wizard";
import { assembleSprintContext } from "@/lib/forge/context";
import type { ActionIntent, ActionChain, ChainExecutionState, ChainStepStatus, SupportedAction, ProjectContext } from "@/lib/ai/interpret";

type PaletteTab = "search" | "commands";

const ACTION_ICONS: Record<SupportedAction, typeof Zap> = {
  update_task_status: ArrowRightLeft,
  generate_sprint: Wand2,
  refresh_project: RefreshCw,
  navigate: Navigation,
  search: Search,
};

const DESTRUCTIVE_ACTIONS: SupportedAction[] = ["update_task_status", "generate_sprint"];

function StepStatusIcon({ status }: { status: ChainStepStatus }) {
  switch (status) {
    case "pending":
      return <Circle className="h-3.5 w-3.5 text-muted-foreground" />;
    case "executing":
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
    case "done":
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    case "failed":
      return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    case "cancelled":
      return <MinusCircle className="h-3.5 w-3.5 text-muted-foreground" />;
    case "confirm":
      return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />;
  }
}

const TYPE_CONFIG: Record<
  SearchEntryType,
  { label: string; icon: typeof Zap }
> = {
  sprint: { label: "Sprints", icon: Zap },
  task: { label: "Tasks", icon: CheckSquare },
  finding: { label: "Findings", icon: Search },
  debt: { label: "Debt", icon: AlertTriangle },
  document: { label: "Documents", icon: FileText },
  phase: { label: "Phases", icon: Layers },
};

const SEARCH_GROUP_ORDER: SearchEntryType[] = [
  "sprint",
  "task",
  "finding",
  "debt",
  "document",
  "phase",
];

export function CommandPalette() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PaletteTab>("search");

  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    toggleCommandPalette,
    activeProjectId,
    projects,
    findings,
    toggleSidebar,
    setAddProjectDialogOpen,
    getActiveProject,
    updateTaskStatus,
    refreshProject,
    roadmaps,
    addActivity,
  } = useAppStore();

  const [forgeWizardOpen, setForgeWizardOpen] = useState(false);

  // AI smart mode state
  const [aiPending, setAiPending] = useState(false);
  const [aiChain, setAiChain] = useState<ActionChain | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [chainState, setChainState] = useState<ChainExecutionState | null>(null);
  const [chainMode, setChainMode] = useState<"auto" | "step">("auto");
  const chainCancelledRef = useRef(false);
  const inputRef = useRef("");

  // Sub-mode for "Update Task Status" action flow
  type ActionSubMode = "none" | "pick-task" | "pick-status";
  const [actionSubMode, setActionSubMode] = useState<ActionSubMode>("none");
  const [selectedTaskForUpdate, setSelectedTaskForUpdate] = useState<{
    taskId: string;
    taskTitle: string;
    sprintId: string;
  } | null>(null);

  // Filter to active project only
  const activeProjectsForSearch = useMemo(
    () => projects.filter((p) => p.id === activeProjectId),
    [projects, activeProjectId]
  );
  const activeFindingsForSearch = useMemo(
    () => (activeProjectId ? { [activeProjectId]: findings[activeProjectId] ?? [] } : {}),
    [findings, activeProjectId]
  );
  const clientSearchIndex = useSearchIndex(activeProjectsForSearch, activeFindingsForSearch);
  const clientGrouped = useMemo(() => groupByType(clientSearchIndex), [clientSearchIndex]);

  // Server-side FTS5 search (debounced)
  const [serverResults, setServerResults] = useState<SearchEntry[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setServerResults(null);
      return;
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    searchTimerRef.current = setTimeout(async () => {
      try {
        const projectParam = activeProjectId ? `&project=${encodeURIComponent(activeProjectId)}` : "";
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}&limit=50${projectParam}`);
        if (res.ok) {
          const { results } = await res.json();
          setServerResults(results as SearchEntry[]);
        }
      } catch {
        // Server search unavailable — client-side fallback active
      }
    }, 200);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, activeProjectId]);

  // Use server results when available, otherwise client-side
  const grouped = useMemo(() => {
    if (serverResults && searchQuery.trim()) {
      return groupByType(serverResults);
    }
    return clientGrouped;
  }, [serverResults, searchQuery, clientGrouped]);

  // Get tasks from active project's sprints for the task picker
  const activeProject = getActiveProject();
  const activeSprints = useMemo(() => {
    if (!activeProject) return [];
    return activeProject.sprints.filter((s) => s.status !== "closed");
  }, [activeProject]);

  const allTasks = useMemo(() => {
    return activeSprints.flatMap((s) =>
      s.tasks.map((t) => ({ ...t, sprintId: s.id, sprintName: s.name }))
    );
  }, [activeSprints]);

  const STATUS_OPTIONS: { id: string; label: string }[] = [
    { id: "pending", label: "Pending" },
    { id: "in_progress", label: "In Progress" },
    { id: "done", label: "Done" },
    { id: "blocked", label: "Blocked" },
    { id: "skipped", label: "Skipped" },
    { id: "carry_over", label: "Carry-over" },
  ];

  const forgeContext = useMemo(() => {
    if (!activeProject) return null;
    const roadmap = roadmaps[activeProjectId];
    if (!roadmap) return null;
    return assembleSprintContext(
      activeProject,
      findings[activeProjectId] ?? [],
      roadmap.sprints,
    );
  }, [activeProject, activeProjectId, roadmaps, findings]);

  // Reset tab and sub-mode when palette opens
  useEffect(() => {
    if (commandPaletteOpen) {
      setActiveTab("search");
      setActionSubMode("none");
      setSelectedTaskForUpdate(null);
      setAiChain(null);
      setAiError(null);
      setAiPending(false);
      setChainState(null);
      setChainMode("auto");
      chainCancelledRef.current = false;
      setServerResults(null);
      setSearchQuery("");
    }
  }, [commandPaletteOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleCommandPalette();
      }
      // ⌘J to toggle tab while palette is open
      if ((e.metaKey || e.ctrlKey) && e.key === "j" && commandPaletteOpen) {
        e.preventDefault();
        setActiveTab((t) => (t === "search" ? "commands" : "search"));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCommandPalette, commandPaletteOpen]);

  const handleCreateProject = () => {
    setCommandPaletteOpen(false);
    setAddProjectDialogOpen(true);
  };

  const handleNavigate = (item: string) => {
    const navItem = NAV_ITEMS.find((n) => n.id === item);
    if (navItem && activeProjectId) {
      router.push(`/${activeProjectId}${navItem.href}`);
    }
    setCommandPaletteOpen(false);
  };

  const handleSearchResult = (navigateTo: string) => {
    router.push(navigateTo);
    setCommandPaletteOpen(false);
  };

  const handleToggleSidebar = () => {
    toggleSidebar();
    setCommandPaletteOpen(false);
  };

  const handleRefreshProject = useCallback(async () => {
    if (activeProjectId) {
      await refreshProject(activeProjectId);
    }
    setCommandPaletteOpen(false);
  }, [activeProjectId, refreshProject, setCommandPaletteOpen]);

  const handleOpenForgeWizard = () => {
    setCommandPaletteOpen(false);
    setForgeWizardOpen(true);
  };

  const buildProjectContext = useCallback((): ProjectContext | null => {
    if (!activeProject) return null;
    const taskCounts = activeProject.sprints.flatMap((s) => s.tasks).reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const taskSummary = Object.entries(taskCounts)
      .map(([s, c]) => `${c} ${s.replace("_", " ")}`)
      .join(", ") || "no tasks";
    const roadmap = roadmaps[activeProjectId];
    return {
      projectName: activeProject.name,
      projectId: activeProject.id,
      sprintNames: activeProject.sprints.map((s) => s.name),
      taskSummary,
      hasRoadmap: !!roadmap,
      hasPendingSprints: roadmap?.sprints.some((s) => s.status !== "completed") ?? false,
    };
  }, [activeProject, activeProjectId, roadmaps]);

  const handleAskAi = useCallback(async () => {
    const query = inputRef.current.trim();
    if (!query) return;
    const ctx = buildProjectContext();
    if (!ctx) return;

    setAiPending(true);
    setAiChain(null);
    setAiError(null);

    try {
      const res = await fetch("/api/ai/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: query, context: ctx }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAiError(json.error ?? "AI request failed");
      } else {
        setAiChain(json.data as ActionChain);
      }
    } catch {
      setAiError("Failed to reach AI service");
    } finally {
      setAiPending(false);
    }
  }, [buildProjectContext]);

  // Execute a single action step. Returns true if palette should stay open.
  const executeStep = useCallback(
    async (intent: ActionIntent): Promise<{ success: boolean; terminal?: boolean; error?: string }> => {
      try {
        switch (intent.action) {
          case "update_task_status": {
            setActionSubMode("pick-task");
            return { success: true, terminal: true };
          }
          case "generate_sprint":
            setCommandPaletteOpen(false);
            setForgeWizardOpen(true);
            return { success: true, terminal: true };
          case "refresh_project":
            if (activeProjectId) await refreshProject(activeProjectId);
            return { success: true };
          case "navigate": {
            const page = intent.params.page;
            const navItem = NAV_ITEMS.find((n) => n.id === page);
            if (navItem && activeProjectId) {
              router.push(`/${activeProjectId}${navItem.href}`);
            }
            return { success: true };
          }
          case "search":
            inputRef.current = intent.params.query ?? "";
            setActiveTab("search");
            setSearchQuery(intent.params.query ?? "");
            return { success: true };
        }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Step failed" };
      }
    },
    [activeProjectId, refreshProject, router, setCommandPaletteOpen],
  );

  const getStepStatus = useCallback(
    (index: number): ChainStepStatus => {
      if (!chainState) return "pending";
      if (chainState.results[index]) {
        return chainState.results[index].success ? "done" : "failed";
      }
      if (index === chainState.currentStep) {
        if (chainState.status === "paused") {
          const step = chainState.chain.steps[index];
          return DESTRUCTIVE_ACTIONS.includes(step.action) ? "confirm" : "pending";
        }
        return chainState.status === "executing" ? "executing" : "pending";
      }
      if (chainState.status === "cancelled" && index > chainState.currentStep) {
        return "cancelled";
      }
      return "pending";
    },
    [chainState],
  );

  const logChainActivity = useCallback(
    (chainId: string, step: number, description: string) => {
      if (!activeProjectId) return;
      addActivity({
        id: `${chainId}-step-${step}`,
        projectId: activeProjectId,
        actionType: "moved_task",
        description,
        timestamp: new Date().toISOString(),
        metadata: { source: "ai-chain" },
        chainId,
        chainStep: step,
      });
    },
    [activeProjectId, addActivity],
  );

  const runChainSteps = useCallback(
    async (chain: ActionChain, startFrom: number, mode: "auto" | "step") => {
      chainCancelledRef.current = false;

      // Log chain start (only on first step)
      if (startFrom === 0) {
        logChainActivity(
          chain.id,
          -1,
          `Chain started: ${chain.steps.length} step${chain.steps.length > 1 ? "s" : ""} — ${chain.steps.map((s) => s.preview).join(", ")}`,
        );
      }

      for (let i = startFrom; i < chain.steps.length; i++) {
        if (chainCancelledRef.current) {
          logChainActivity(chain.id, -2, `Chain cancelled at step ${i + 1} of ${chain.steps.length}`);
          setChainState((prev) => prev ? { ...prev, status: "cancelled" } : null);
          return;
        }

        const step = chain.steps[i];
        const isDestructive = DESTRUCTIVE_ACTIONS.includes(step.action);

        // In auto mode, pause at destructive steps for confirmation
        if (mode === "auto" && isDestructive && i > startFrom) {
          setChainState((prev) => prev ? { ...prev, currentStep: i, status: "paused" } : null);
          return; // User must confirm to continue
        }

        // In step mode, pause after each step (except the first one being executed)
        if (mode === "step" && i > startFrom) {
          setChainState((prev) => prev ? { ...prev, currentStep: i, status: "paused" } : null);
          return;
        }

        // Execute the step
        setChainState((prev) => prev ? { ...prev, currentStep: i, status: "executing" } : null);
        const result = await executeStep(step);

        // Log step result
        logChainActivity(
          chain.id,
          i,
          result.success
            ? `Step ${i + 1}: ${step.preview}`
            : `Step ${i + 1} failed: ${step.preview} — ${result.error ?? "unknown error"}`,
        );

        setChainState((prev) => {
          if (!prev) return null;
          const newResults = { ...prev.results, [i]: { success: result.success, error: result.error } };
          return { ...prev, results: newResults };
        });

        if (!result.success || result.terminal) {
          setChainState((prev) => {
            if (!prev) return null;
            const finalStatus = result.terminal ? "completed" : "paused";
            return { ...prev, status: finalStatus };
          });
          if (result.terminal && i === chain.steps.length - 1) {
            logChainActivity(chain.id, -3, `Chain completed: all ${chain.steps.length} steps done`);
          }
          return;
        }
      }

      // All steps completed
      logChainActivity(chain.id, -3, `Chain completed: all ${chain.steps.length} steps done`);
      setChainState((prev) => prev ? { ...prev, status: "completed" } : null);
    },
    [executeStep, logChainActivity],
  );

  const handleExecuteChain = useCallback(
    (mode: "auto" | "step") => {
      if (!aiChain) return;
      setChainMode(mode);
      setChainState({
        chain: aiChain,
        currentStep: 0,
        results: {},
        status: "executing",
      });
      runChainSteps(aiChain, 0, mode);
    },
    [aiChain, runChainSteps],
  );

  const handleContinueChain = useCallback(() => {
    if (!chainState) return;
    setChainState((prev) => prev ? { ...prev, status: "executing" } : null);
    runChainSteps(chainState.chain, chainState.currentStep, chainMode);
  }, [chainState, chainMode, runChainSteps]);

  const handleRetryStep = useCallback(() => {
    if (!chainState) return;
    const newResults = { ...chainState.results };
    delete newResults[chainState.currentStep];
    setChainState({ ...chainState, results: newResults, status: "executing" });
    runChainSteps(chainState.chain, chainState.currentStep, chainMode);
  }, [chainState, chainMode, runChainSteps]);

  const handleSkipStep = useCallback(() => {
    if (!chainState) return;
    const newResults = { ...chainState.results, [chainState.currentStep]: { success: true } };
    const nextStep = chainState.currentStep + 1;
    if (nextStep >= chainState.chain.steps.length) {
      setChainState({ ...chainState, results: newResults, status: "completed" });
    } else {
      setChainState({ ...chainState, results: newResults, currentStep: nextStep, status: "executing" });
      runChainSteps(chainState.chain, nextStep, chainMode);
    }
  }, [chainState, chainMode, runChainSteps]);

  const handleCancelChain = useCallback(() => {
    chainCancelledRef.current = true;
    setChainState((prev) => prev ? { ...prev, status: "cancelled" } : null);
  }, []);

  // Legacy single-action execution (for non-chain contexts)
  const executeActionIntent = useCallback(
    (intent: ActionIntent) => {
      executeStep(intent).then(() => {
        setAiChain(null);
      });
    },
    [executeStep],
  );

  const handleStartUpdateTask = () => {
    setActionSubMode("pick-task");
  };

  const handleSelectTask = (taskId: string, taskTitle: string, sprintId: string) => {
    setSelectedTaskForUpdate({ taskId, taskTitle, sprintId });
    setActionSubMode("pick-status");
  };

  const handleSelectStatus = (status: string) => {
    if (!selectedTaskForUpdate || !activeProjectId) return;
    updateTaskStatus(
      activeProjectId,
      selectedTaskForUpdate.sprintId,
      selectedTaskForUpdate.taskId,
      status as import("@/lib/types").TaskStatus
    );
    setActionSubMode("none");
    setSelectedTaskForUpdate(null);
    setCommandPaletteOpen(false);
  };

  return (
    <>
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      {/* Toggle tab button — positioned next to the close (X) button */}
      <button
        type="button"
        onClick={() => setActiveTab(activeTab === "search" ? "commands" : "search")}
        className="absolute top-3 right-10 z-10 flex items-center gap-1.5 rounded-md bg-primary/10 px-1.5 py-1 text-primary transition-colors hover:bg-primary/20"
        aria-label={activeTab === "search" ? "Switch to commands" : "Switch to search"}
      >
        {activeTab === "search" ? (
          <Terminal className="h-3.5 w-3.5" />
        ) : (
          <Search className="h-3.5 w-3.5" />
        )}
        <kbd className="text-[10px] font-mono opacity-70">⌘J</kbd>
      </button>

      <CommandInput
        placeholder={
          activeTab === "search"
            ? "Search tasks, findings, sprints, debt..."
            : "Type a command..."
        }
        onValueChange={(v) => { inputRef.current = v; if (activeTab === "search") setSearchQuery(v); }}
      />

      {/* Tab switcher — hidden, toggle via icon button next to close */}
      <div className="hidden grid-cols-2 border-b">
        <button
          type="button"
          className={cn(
            "flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
            activeTab === "search"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("search")}
        >
          <Search className="h-3.5 w-3.5" />
          Search
        </button>
        <button
          type="button"
          className={cn(
            "flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
            activeTab === "commands"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("commands")}
        >
          <Terminal className="h-3.5 w-3.5" />
          Commands
        </button>
      </div>

      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-3 py-4">
            {aiPending ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Interpreting...
              </div>
            ) : (aiChain || chainState) ? (
              <div className="w-full px-2">
                <div className="rounded-lg border bg-muted/50 p-3 text-left">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary">
                      {chainState ? (
                        chainState.status === "completed" ? "Chain Complete" :
                        chainState.status === "cancelled" ? "Chain Cancelled" :
                        chainState.status === "paused" ? `Step ${chainState.currentStep + 1} of ${chainState.chain.steps.length}` :
                        `Executing ${chainState.currentStep + 1} of ${chainState.chain.steps.length}`
                      ) : (
                        aiChain && aiChain.steps.length > 1
                          ? `AI Chain — ${aiChain.steps.length} steps`
                          : "AI Suggestion"
                      )}
                    </span>
                    {!chainState && aiChain && (
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {Math.round(
                          aiChain.steps.reduce((sum, s) => sum + s.confidence, 0) / aiChain.steps.length * 100
                        )}% avg confidence
                      </span>
                    )}
                  </div>

                  {/* Steps list */}
                  <div className="space-y-1.5">
                    {(chainState?.chain ?? aiChain)?.steps.map((step, i) => {
                      const ActionIcon = ACTION_ICONS[step.action];
                      const status = chainState ? getStepStatus(i) : "pending";
                      const stepResult = chainState?.results[i];

                      return (
                        <div
                          key={i}
                          className={cn(
                            "flex items-start gap-2 rounded-md px-2 py-1.5 text-sm",
                            status === "executing" && "bg-primary/5",
                            status === "confirm" && "bg-yellow-500/5",
                            status === "failed" && "bg-destructive/5",
                          )}
                        >
                          <div className="mt-0.5 shrink-0">
                            <StepStatusIcon status={status} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <ActionIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                              <span className="truncate">{step.preview}</span>
                            </div>
                            {stepResult && !stepResult.success && stepResult.error && (
                              <p className="mt-0.5 text-xs text-destructive">{stepResult.error}</p>
                            )}
                          </div>
                          <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                            {i + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Controls */}
                  <div className="flex gap-2 mt-3">
                    {/* Preview state — no execution yet */}
                    {!chainState && aiChain && (
                      <>
                        {aiChain.steps.length === 1 ? (
                          <button
                            type="button"
                            onClick={() => handleExecuteChain("auto")}
                            className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                          >
                            Execute
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleExecuteChain("auto")}
                              className="flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                            >
                              <Play className="h-3 w-3" />
                              Execute All
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExecuteChain("step")}
                              className="flex items-center gap-1 rounded-md border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                            >
                              <SkipForward className="h-3 w-3" />
                              Step
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => { setAiChain(null); setChainState(null); }}
                          className="rounded-md border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {/* Paused — waiting for confirmation or next step */}
                    {chainState?.status === "paused" && (
                      <>
                        <button
                          type="button"
                          onClick={handleContinueChain}
                          className="flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          {getStepStatus(chainState.currentStep) === "confirm" ? "Confirm" : "Next"}
                        </button>
                        <button
                          type="button"
                          onClick={handleSkipStep}
                          className="rounded-md border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          Skip
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelChain}
                          className="flex items-center gap-1 rounded-md border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                          <Square className="h-3 w-3" />
                          Cancel
                        </button>
                      </>
                    )}

                    {/* Failed — show retry/skip/cancel */}
                    {chainState?.status === "paused" && chainState.results[chainState.currentStep]?.success === false && (
                      <>
                        <button
                          type="button"
                          onClick={handleRetryStep}
                          className="flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Retry
                        </button>
                        <button
                          type="button"
                          onClick={handleSkipStep}
                          className="rounded-md border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          Skip
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelChain}
                          className="flex items-center gap-1 rounded-md border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {/* Completed or cancelled — dismiss */}
                    {(chainState?.status === "completed" || chainState?.status === "cancelled") && (
                      <button
                        type="button"
                        onClick={() => { setAiChain(null); setChainState(null); }}
                        className="rounded-md border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : aiError ? (
              <div className="text-sm text-destructive">{aiError}</div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "search" ? "No results found." : "No commands match."}
                </p>
                {activeProject && (
                  <button
                    type="button"
                    onClick={handleAskAi}
                    className="flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Ask AI
                  </button>
                )}
              </>
            )}
          </div>
        </CommandEmpty>

        {activeTab === "search" && (
          <>
            {SEARCH_GROUP_ORDER.map((type) => {
              const entries = grouped[type];
              if (entries.length === 0) return null;
              const config = TYPE_CONFIG[type];
              const Icon = config.icon;
              return (
                <CommandGroup
                  key={type}
                  heading={
                    <span className="flex items-center gap-1.5">
                      <Icon className="h-3 w-3" />
                      {config.label}
                      <Badge
                        variant="secondary"
                        className="ml-1 h-4 rounded-full px-1.5 text-[10px] font-normal"
                      >
                        {entries.length}
                      </Badge>
                    </span>
                  }
                >
                  {entries.map((entry, i) => (
                    <CommandItem
                      key={`${type}-${entry.projectId}-${i}`}
                      value={`${entry.title} ${entry.description} ${Object.values(entry.metadata).join(" ")}`}
                      onSelect={() => handleSearchResult(entry.navigateTo)}
                    >
                      <Icon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex flex-col gap-0 min-w-0">
                        <span className="truncate text-sm">{entry.title}</span>
                        {entry.description && (
                          <span className="truncate text-xs text-muted-foreground">
                            {entry.description.slice(0, 80)}
                          </span>
                        )}
                      </div>
                      {projects.length > 1 && (
                        <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                          {entry.projectName}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </>
        )}

        {activeTab === "commands" && actionSubMode === "none" && (
          <>
            <CommandGroup heading="Actions">
              <CommandItem onSelect={handleCreateProject}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Add Project</span>
              </CommandItem>
              <CommandItem onSelect={handleStartUpdateTask}>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                <span>Update Task Status</span>
              </CommandItem>
              <CommandItem onSelect={handleRefreshProject}>
                <RefreshCw className="mr-2 h-4 w-4" />
                <span>Refresh Project</span>
              </CommandItem>
              {forgeContext && (
                <CommandItem onSelect={handleOpenForgeWizard}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  <span>Generate Sprint</span>
                </CommandItem>
              )}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Navigation">
              {NAV_ITEMS.map((item) => (
                <CommandItem key={item.id} onSelect={() => handleNavigate(item.id)}>
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>Go to {item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Board">
              <CommandItem onSelect={handleToggleSidebar}>
                <Sidebar className="mr-2 h-4 w-4" />
                <span>Toggle Sidebar</span>
                <span className="ml-auto text-muted-foreground text-xs">⌘B</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {activeTab === "commands" && actionSubMode === "pick-task" && (
          <CommandGroup heading="Select a Task">
            {allTasks.map((task) => (
              <CommandItem
                key={task.id}
                value={`${task.title} ${task.taskRef ?? ""} ${task.sprintName}`}
                onSelect={() => handleSelectTask(task.id, task.title, task.sprintId)}
              >
                <CheckSquare className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col gap-0 min-w-0">
                  <span className="truncate text-sm">
                    {task.taskRef && <span className="font-mono text-xs text-muted-foreground mr-1.5">{task.taskRef}</span>}
                    {task.title}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {task.sprintName} — {task.status.replace("_", " ")}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {activeTab === "commands" && actionSubMode === "pick-status" && selectedTaskForUpdate && (
          <CommandGroup heading={`New status for "${selectedTaskForUpdate.taskTitle}"`}>
            {STATUS_OPTIONS.map((opt) => (
              <CommandItem
                key={opt.id}
                onSelect={() => handleSelectStatus(opt.id)}
              >
                <ArrowRightLeft className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{opt.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>

    <SprintForgeWizard
      open={forgeWizardOpen}
      onOpenChange={setForgeWizardOpen}
      context={forgeContext}
      onRefreshProject={() => {
        if (activeProjectId) refreshProject(activeProjectId);
      }}
    />
    </>
  );
}
