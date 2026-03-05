"use client";

import { useEffect } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EntitySkeleton } from "@/components/ui/entity-skeleton";
import { useAppStore } from "@/lib/store";
import { FINDING_SEVERITY_COLORS } from "@/lib/config";

export function FindingsPage() {
  const {
    getActiveProject,
    activeProjectId,
    findings,
    findingsLoading,
    loadFindings,
  } = useAppStore();

  const project = getActiveProject();
  const projectFindings = findings[activeProjectId] ?? [];
  const isLoading = findingsLoading[activeProjectId] ?? false;

  useEffect(() => {
    if (activeProjectId && !findings[activeProjectId]) {
      loadFindings(activeProjectId);
    }
  }, [activeProjectId, findings, loadFindings]);

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
            <Card key={finding.id} className="border shadow-sm">
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
                        className={`text-[10px] h-5 border-0 ${FINDING_SEVERITY_COLORS[finding.severity] ?? ""}`}
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
