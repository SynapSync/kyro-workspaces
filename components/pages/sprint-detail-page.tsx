"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import {
  ArrowLeft,
  Target,
  FileText,
  Bot,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SprintProgressBar } from "@/components/sprint/sprint-progress-bar";
import { DispositionTable } from "@/components/sprint/disposition-table";
import { DebtTable } from "@/components/sprint/debt-table";
import { DoDChecklist } from "@/components/sprint/dod-checklist";
import { FindingsConsolidationTable } from "@/components/sprint/findings-consolidation-table";
import { PhasesList } from "@/components/sprint/phases-list";
import { useAppStore } from "@/lib/store";
import { computeSprintProgress } from "@/lib/config";
import { SPRINT_SECTIONS, SPRINT_SECTION_ICONS, SPRINT_STATUS_CONFIG, AGENT_BADGE_STYLE } from "@/lib/config";
import type { SprintSectionKey } from "@/lib/config";
import type { SprintMarkdownSections } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SprintDetailPageProps {
  sprintId: string;
}

export function SprintDetailPage({ sprintId }: SprintDetailPageProps) {
  const router = useRouter();
  const { getActiveProject, activeProjectId } = useAppStore();

  const project = getActiveProject();
  const sprint = project.sprints.find((s) => s.id === sprintId);

  const [activeSection, setActiveSection] = useState<keyof SprintMarkdownSections>("sprintObjective");
  const [viewRaw, setViewRaw] = useState(false);

  if (!sprint) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Sprint not found</p>
      </div>
    );
  }

  const currentSectionMeta = SPRINT_SECTIONS.find((s) => s.key === activeSection) ?? SPRINT_SECTIONS[0];
  const currentContent = sprint.sections?.[activeSection] ?? "";

  const handleBack = () => {
    router.push(`/${activeProjectId}/sprints`);
  };

  const sprintIndex = project.sprints.findIndex((s) => s.id === sprintId);
  const prevSprint = sprintIndex > 0 ? project.sprints[sprintIndex - 1] : null;
  const nextSprint = sprintIndex < project.sprints.length - 1 ? project.sprints[sprintIndex + 1] : null;

  const progressData = computeSprintProgress(sprint.tasks);

  const filledSections = SPRINT_SECTIONS.filter(
    (s) => sprint.sections?.[s.key] && (sprint.sections[s.key] ?? "").trim().length > 0
  ).length;

  // Render structured content for sections that have parsed data
  const renderSectionContent = () => {
    // Disposition table
    if (activeSection === "disposition" && sprint.disposition && sprint.disposition.length > 0) {
      return <DispositionTable entries={sprint.disposition} />;
    }

    // Technical debt table
    if (activeSection === "technicalDebt" && sprint.debtItems && sprint.debtItems.length > 0) {
      return <DebtTable items={sprint.debtItems} />;
    }

    // Definition of done checklist
    if (activeSection === "definitionOfDone" && sprint.definitionOfDone && sprint.definitionOfDone.length > 0) {
      return <DoDChecklist items={sprint.definitionOfDone} />;
    }

    // Findings consolidation table
    if (activeSection === "findingsConsolidation" && sprint.findingsConsolidation && sprint.findingsConsolidation.length > 0) {
      return <FindingsConsolidationTable entries={sprint.findingsConsolidation} />;
    }

    // Phases list
    if (activeSection === "phases" && sprint.phases) {
      const regularPhases = sprint.phases.filter((p) => !p.isEmergent);
      if (regularPhases.length > 0) return <PhasesList phases={regularPhases} />;
    }

    // Emergent phases list
    if (activeSection === "emergentPhases" && sprint.phases) {
      const emergentPhases = sprint.phases.filter((p) => p.isEmergent);
      if (emergentPhases.length > 0) return <PhasesList phases={emergentPhases} />;
    }

    // Fallback to markdown rendering
    if (currentContent) {
      return (
        <MarkdownRenderer
          content={currentContent}
          className="rounded-xl border bg-card p-6"
        />
      );
    }

    // Empty state
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
          {(() => {
            const Icon = SPRINT_SECTION_ICONS[activeSection as SprintSectionKey];
            return <Icon className="h-6 w-6 text-muted-foreground" />;
          })()}
        </div>
        <p className="text-sm font-medium text-foreground">
          No {currentSectionMeta.label.toLowerCase()} documented yet
        </p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          {currentSectionMeta.description}
        </p>
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to sprints</span>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-foreground">
                  {sprint.name}
                </h1>
                <Badge
                  variant={SPRINT_STATUS_CONFIG[sprint.status].variant}
                  className="text-[10px] h-5"
                >
                  {SPRINT_STATUS_CONFIG[sprint.status].label}
                </Badge>
                {sprint.version && (
                  <Badge variant="outline" className="text-[10px] h-5 font-mono">
                    v{sprint.version}
                  </Badge>
                )}
                {sprint.agents?.map((agent) => (
                  <Badge key={agent} variant="outline" className={cn("text-[10px] h-5 font-mono", AGENT_BADGE_STYLE)}>
                    <Bot className="h-3 w-3 mr-1" />{agent}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {progressData.totalTasks} tasks
                </span>
                <span className="text-xs text-muted-foreground">
                  {filledSections}/{SPRINT_SECTIONS.length} sections documented
                </span>
                {sprint.updatedAt && (
                  <span className="text-xs text-muted-foreground">Updated {sprint.updatedAt}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {prevSprint && (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href={`/${activeProjectId}/sprints/${prevSprint.id}/detail`}>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous sprint</span>
                </Link>
              </Button>
            )}
            {nextSprint && (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href={`/${activeProjectId}/sprints/${nextSprint.id}/detail`}>
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next sprint</span>
                </Link>
              </Button>
            )}
            {sprint.rawContent && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setViewRaw(true)}
              >
                <FileText className="h-3.5 w-3.5" />
                View Raw
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <Link href={`/${activeProjectId}/sprints/${sprintId}`}>
                <Target className="h-3.5 w-3.5" />
                Open Board
              </Link>
            </Button>
          </div>
        </div>

        <SprintProgressBar data={progressData} status={sprint.status} className="mt-4 max-w-3xl" />
      </div>

      {/* Content: section tabs + viewer */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Section Tabs (vertical) */}
        <div className="w-56 shrink-0 border-r border-border bg-muted/20">
          <ScrollArea className="h-full">
            <div className="p-3 flex flex-col gap-1">
              <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sprint Sections
              </p>
              {SPRINT_SECTIONS.map((section) => {
                const Icon = SPRINT_SECTION_ICONS[section.key as SprintSectionKey];
                const hasContent =
                  sprint.sections?.[section.key] &&
                  (sprint.sections[section.key] ?? "").trim().length > 0;
                const isActive = activeSection === section.key;

                return (
                  <button
                    key={section.key}
                    onClick={() => setActiveSection(section.key)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors text-left",
                      isActive
                        ? "bg-card text-foreground font-medium shadow-sm border border-border"
                        : "text-muted-foreground hover:bg-card hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{section.label}</span>
                    {hasContent && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Section Content */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="border-b border-border px-6 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              {currentSectionMeta.label}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentSectionMeta.description}
            </p>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-6 max-w-4xl">
              {renderSectionContent()}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Raw markdown modal */}
      <Dialog open={viewRaw} onOpenChange={setViewRaw}>
        <DialogContent className="sm:max-w-5xl h-[85vh] flex flex-col !p-0 !gap-0">
          <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
            <DialogTitle>{sprint.name} — Raw Markdown</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 py-6">
              <MarkdownRenderer content={sprint.rawContent ?? ""} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
