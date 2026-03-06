"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileCode, Search } from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EntitySkeleton } from "@/components/ui/entity-skeleton";
import { useAppStore } from "@/lib/store";
import { FINDING_SEVERITY_COLORS } from "@/lib/config";
import type { Finding } from "@/lib/types";
import { cn } from "@/lib/utils";

function FindingDetail({ finding, onBack }: { finding: Finding; onBack: () => void }) {
  return (
    <div className="p-6 max-w-4xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 text-muted-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to findings
      </Button>

      <div className="flex items-center gap-3 mb-4">
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

      <p className="text-sm text-muted-foreground mb-6">{finding.summary}</p>

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
              <li key={i}>{rec}</li>
            ))}
          </ol>
        </div>
      )}
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

  useEffect(() => {
    if (activeProjectId && !findings[activeProjectId]) {
      loadFindings(activeProjectId);
    }
  }, [activeProjectId, findings, loadFindings]);

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
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Findings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Analysis findings from the sprint-forge project
        </p>
      </div>

      {isLoading ? (
        <EntitySkeleton rows={4} />
      ) : projectFindings.length > 0 ? (
        <div className="grid gap-3">
          {projectFindings.map((finding) => (
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
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {finding.summary}
                    </p>
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
  );
}
