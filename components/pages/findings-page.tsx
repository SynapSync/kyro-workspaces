"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileCode, FileText, Search, X } from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { InlineMarkdown } from "@/components/inline-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EntitySkeleton } from "@/components/ui/entity-skeleton";
import { useAppStore } from "@/lib/store";
import { FINDING_SEVERITY_COLORS } from "@/lib/config";
import type { Finding, FindingSeverity } from "@/lib/types";
import { cn } from "@/lib/utils";

const SEVERITY_OPTIONS: FindingSeverity[] = ["critical", "high", "medium", "low"];

function FindingDetail({ finding, onBack }: { finding: Finding; onBack: () => void }) {
  const [viewRaw, setViewRaw] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 text-muted-foreground"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to findings
          </Button>
          {finding.rawContent && (
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
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground">
            #{String(finding.number).padStart(2, "0")}
          </span>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {finding.title}
          </h1>
          <Badge
            variant="secondary"
            className={cn("text-[10px] h-5 border-0", FINDING_SEVERITY_COLORS[finding.severity])}
          >
            {finding.severity}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          <InlineMarkdown content={finding.summary} />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
      <div className="max-w-4xl">

      {finding.details && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-2">Details</h2>
          <MarkdownRenderer
            content={finding.details}
            className="bg-muted/50 rounded-lg p-4"
          />
        </div>
      )}

      {finding.affectedFiles.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-2">
            Affected Files ({finding.affectedFiles.length})
          </h2>
          <div className="space-y-1">
            {finding.affectedFiles.map((file) => (
              <div
                key={file}
                className="flex items-center gap-2 text-xs font-mono text-muted-foreground py-1 px-2 rounded bg-muted/50"
              >
                <FileCode className="h-3 w-3 shrink-0" />
                {file}
              </div>
            ))}
          </div>
        </div>
      )}

      {finding.recommendations.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-2">Recommendations</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            {finding.recommendations.map((rec, i) => (
              <li key={i}><InlineMarkdown content={rec} /></li>
            ))}
          </ol>
        </div>
      )}
      </div>
      </div>

      {/* Raw markdown modal */}
      <Dialog open={viewRaw} onOpenChange={setViewRaw}>
        <DialogContent className="sm:max-w-5xl h-[85vh] flex flex-col !p-0 !gap-0">
          <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
            <DialogTitle>#{String(finding.number).padStart(2, "0")} {finding.title} — Raw Markdown</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 py-6">
              <MarkdownRenderer content={finding.rawContent ?? ""} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function FindingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFindingId = searchParams.get("finding");

  const {
    activeProjectId,
    findings,
    findingsLoading,
    loadFindings,
  } = useAppStore();

  const projectFindings = findings[activeProjectId] ?? [];
  const isLoading = findingsLoading[activeProjectId] ?? false;

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSeverity, setActiveSeverity] = useState<FindingSeverity | null>(null);

  useEffect(() => {
    if (activeProjectId && !findings[activeProjectId]) {
      loadFindings(activeProjectId);
    }
  }, [activeProjectId, findings, loadFindings]);

  const filteredFindings = useMemo(() => {
    let result = projectFindings;

    if (activeSeverity) {
      result = result.filter((f) => f.severity === activeSeverity);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.summary.toLowerCase().includes(q)
      );
    }

    return result;
  }, [projectFindings, searchQuery, activeSeverity]);

  const hasActiveFilters = searchQuery.trim() !== "" || activeSeverity !== null;

  const clearFilters = () => {
    setSearchQuery("");
    setActiveSeverity(null);
  };

  const activeFinding = activeFindingId
    ? projectFindings.find((f) => f.id === activeFindingId)
    : null;

  if (activeFinding) {
    return (
      <FindingDetail
        finding={activeFinding}
        onBack={() => router.push(`/${activeProjectId}/findings`)}
      />
    );
  }

  const handleFindingClick = (findingId: string) => {
    router.push(`/${activeProjectId}/findings?finding=${findingId}`);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Findings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Analysis findings from the sprint-forge project
        </p>

        {/* Search & Filter Controls */}
        {projectFindings.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search findings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* Severity filter badges */}
            <div className="flex items-center gap-1.5">
              {SEVERITY_OPTIONS.map((severity) => (
                <button
                  key={severity}
                  type="button"
                  onClick={() =>
                    setActiveSeverity(activeSeverity === severity ? null : severity)
                  }
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    activeSeverity === severity
                      ? FINDING_SEVERITY_COLORS[severity]
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {severity}
                </button>
              ))}
            </div>

            {/* Active filter status */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {filteredFindings.length} of {projectFindings.length}
                </span>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
      <div className="max-w-5xl">

      {isLoading ? (
        <EntitySkeleton rows={4} />
      ) : filteredFindings.length > 0 ? (
        <div className="grid gap-3">
          {filteredFindings.map((finding) => (
            <Card
              key={finding.id}
              className="border shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleFindingClick(finding.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Search className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        #{String(finding.number).padStart(2, "0")}
                      </span>
                      <h3 className="font-medium text-sm text-foreground">
                        {finding.title}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={cn("text-[10px] h-5 border-0", FINDING_SEVERITY_COLORS[finding.severity])}
                      >
                        {finding.severity}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      <InlineMarkdown content={finding.summary} />
                    </div>
                    {finding.affectedFiles.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                        {finding.affectedFiles.length} affected file{finding.affectedFiles.length !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hasActiveFilters ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium text-foreground">
            No findings match your filters
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search or clearing filters.
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No findings available
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Findings are loaded from the project&apos;s sprint-forge directory.
          </p>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}
