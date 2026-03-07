"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Check,
  Search,
  AlertTriangle,
  Settings,
  Eye,
  Loader2,
  Rocket,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FINDING_SEVERITY_COLORS, SPRINT_TYPE_COLORS } from "@/lib/config";
import type { SprintForgeContext } from "@/lib/forge/context";
import type { ForgePromptSelections } from "@/lib/forge/prompt-composer";
import { composeSprintForgePrompt } from "@/lib/forge/prompt-composer";

interface SprintForgeWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: SprintForgeContext | null;
  onRefreshProject?: () => void;
}

type WizardStep = 0 | 1 | 2 | 3;

const STEP_LABELS = [
  { label: "Findings", icon: Search },
  { label: "Debt", icon: AlertTriangle },
  { label: "Config", icon: Settings },
  { label: "Preview", icon: Eye },
] as const;

const SPRINT_TYPES = ["feature", "refactor", "bugfix", "audit", "debt"] as const;

export function SprintForgeWizard({
  open,
  onOpenChange,
  context,
  onRefreshProject,
}: SprintForgeWizardProps) {
  const [step, setStep] = useState<WizardStep>(0);
  const [selectedFindingIds, setSelectedFindingIds] = useState<string[]>([]);
  const [selectedDebtNumbers, setSelectedDebtNumbers] = useState<number[]>([]);
  const [versionTarget, setVersionTarget] = useState("");
  const [sprintType, setSprintType] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [copied, setCopied] = useState(false);

  // Generate & Monitor state
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [monitoring, setMonitoring] = useState(false);
  const [monitorMessage, setMonitorMessage] = useState<string | null>(null);
  const [generationComplete, setGenerationComplete] = useState(false);
  const baselineSprintCount = useRef<number | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!context) return;
    setGenerating(true);
    setGenerateError(null);

    try {
      const res = await fetch("/api/forge/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: context.projectId,
          prompt: composeSprintForgePrompt(context, {
            selectedFindingIds,
            selectedDebtNumbers,
            versionTarget,
            sprintType,
            customNotes,
          }),
          triggerCli: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setGenerateError(json.error ?? "Failed to write prompt");
        setGenerating(false);
        return;
      }

      // Start monitoring
      setGenerating(false);
      setMonitoring(true);
      setMonitorMessage("Prompt written. Watching for new sprint files...");

      // Get baseline count
      const statusRes = await fetch(`/api/forge/status?projectId=${context.projectId}`);
      const statusJson = await statusRes.json();
      baselineSprintCount.current = statusJson.data?.sprintCount ?? 0;

      // Poll every 5 seconds
      pollIntervalRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/forge/status?projectId=${context.projectId}`);
          const pollJson = await pollRes.json();
          const currentCount = pollJson.data?.sprintCount ?? 0;

          if (baselineSprintCount.current !== null && currentCount > baselineSprintCount.current) {
            // New sprint detected
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setMonitoring(false);
            setGenerationComplete(true);
            setMonitorMessage(`New sprint detected: ${pollJson.data?.latestSprint}`);
            onRefreshProject?.();
          }
        } catch {
          // Polling error — continue silently
        }
      }, 5000);
    } catch {
      setGenerateError("Failed to reach the server");
      setGenerating(false);
    }
  }, [context, selectedFindingIds, selectedDebtNumbers, versionTarget, sprintType, customNotes, onRefreshProject]);

  const handleStopMonitoring = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setMonitoring(false);
    setMonitorMessage(null);
  }, []);

  // Reset state when dialog opens
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen && context) {
        setStep(0);
        setSelectedFindingIds([]);
        setSelectedDebtNumbers([]);
        setVersionTarget(context.nextSprint?.version ?? "");
        setSprintType(context.nextSprint?.type ?? "feature");
        setCustomNotes("");
        setCopied(false);
        setGenerating(false);
        setGenerateError(null);
        setMonitoring(false);
        setMonitorMessage(null);
        setGenerationComplete(false);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      }
      onOpenChange(isOpen);
    },
    [context, onOpenChange],
  );

  const selections: ForgePromptSelections = useMemo(
    () => ({
      selectedFindingIds,
      selectedDebtNumbers,
      versionTarget,
      sprintType,
      customNotes,
    }),
    [selectedFindingIds, selectedDebtNumbers, versionTarget, sprintType, customNotes],
  );

  const composedPrompt = useMemo(() => {
    if (!context) return "";
    return composeSprintForgePrompt(context, selections);
  }, [context, selections]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(composedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [composedPrompt]);

  const toggleFinding = (id: string) => {
    setSelectedFindingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleDebt = (num: number) => {
    setSelectedDebtNumbers((prev) =>
      prev.includes(num) ? prev.filter((x) => x !== num) : [...prev, num],
    );
  };

  if (!context) return null;

  const nextSprintNumber =
    context.nextSprint?.number ??
    (context.lastSprint ? context.lastSprint.number + 1 : 1);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Generate Sprint {nextSprintNumber}</DialogTitle>
          <DialogDescription>
            Compose a sprint-forge prompt to generate the next sprint
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1 border-b pb-3">
          {STEP_LABELS.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => setStep(i as WizardStep)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  step === i
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Step content */}
        <div className="flex-1 min-h-0 overflow-auto py-2">
          {/* Step 0: Select findings */}
          {step === 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                Select findings to address in the next sprint
              </p>
              {context.allFindings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No findings available
                </p>
              ) : (
                context.allFindings.map((f) => (
                  <label
                    key={f.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                      selectedFindingIds.includes(f.id)
                        ? "border-primary/50 bg-primary/5"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-muted-foreground/30"
                      checked={selectedFindingIds.includes(f.id)}
                      onChange={() => toggleFinding(f.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium truncate">
                          {f.title}
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] h-5 border-0",
                            FINDING_SEVERITY_COLORS[f.severity] ?? "",
                          )}
                        >
                          {f.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {f.summary}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          )}

          {/* Step 1: Select debt items */}
          {step === 1 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                Select open debt items to resolve
              </p>
              {context.openDebtItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No open debt items
                </p>
              ) : (
                context.openDebtItems.map((d) => (
                  <label
                    key={d.number}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                      selectedDebtNumbers.includes(d.number)
                        ? "border-primary/50 bg-primary/5"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-muted-foreground/30"
                      checked={selectedDebtNumbers.includes(d.number)}
                      onChange={() => toggleDebt(d.number)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] h-5 font-mono">
                          D{d.number}
                        </Badge>
                        <span className="text-sm">{d.item}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Origin: {d.origin} | Target: {d.sprintTarget}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          )}

          {/* Step 2: Config */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">
                  Version Target
                </label>
                <input
                  type="text"
                  value={versionTarget}
                  onChange={(e) => setVersionTarget(e.target.value)}
                  placeholder="e.g. 2.2.0"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">
                  Sprint Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {SPRINT_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSprintType(t)}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-medium border transition-colors",
                        sprintType === t
                          ? cn("border-primary/50", SPRINT_TYPE_COLORS[t])
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">
                  Additional Notes (optional)
                </label>
                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Any extra context or constraints for the sprint..."
                  rows={3}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 3: Preview & Copy / Generate */}
          {step === 3 && (
            <div className="space-y-3">
              {generationComplete ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  <p className="text-sm font-medium text-foreground">Sprint Generated</p>
                  <p className="text-xs text-muted-foreground">{monitorMessage}</p>
                </div>
              ) : monitoring ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-medium text-foreground">Monitoring...</p>
                  <p className="text-xs text-muted-foreground">{monitorMessage}</p>
                  <Button size="sm" variant="outline" onClick={handleStopMonitoring}>
                    Stop Monitoring
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Review the prompt, then copy or generate directly
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={copied ? "outline" : "secondary"}
                        onClick={handleCopy}
                        className="gap-1.5"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <ClipboardCopy className="h-3.5 w-3.5" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={handleGenerate}
                        disabled={generating}
                        className="gap-1.5"
                      >
                        {generating ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Writing...
                          </>
                        ) : (
                          <>
                            <Rocket className="h-3.5 w-3.5" />
                            Generate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  {generateError && (
                    <p className="text-xs text-destructive">{generateError}</p>
                  )}
                  <pre className="rounded-lg border bg-muted/30 p-4 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-[50vh]">
                    {composedPrompt}
                  </pre>
                </>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => Math.max(0, s - 1) as WizardStep)}
            disabled={step === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </Button>

          <div className="text-xs text-muted-foreground">
            Step {step + 1} of 4
          </div>

          {step < 3 ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => setStep((s) => Math.min(3, s + 1) as WizardStep)}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              variant={copied ? "outline" : "default"}
              size="sm"
              onClick={handleCopy}
              className="gap-1"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <ClipboardCopy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
