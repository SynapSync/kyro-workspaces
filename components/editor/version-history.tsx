"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { RotateCcw, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GitCommit } from "@/lib/types";

interface VersionHistoryProps {
  projectId: string;
  docId: string;
  onRestore: (content: string) => void;
}

export function VersionHistory({
  projectId,
  docId,
  onRestore,
}: VersionHistoryProps) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<GitCommit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/projects/${projectId}/documents/${docId}/versions`)
      .then((res) => res.json())
      .then((json) => setVersions(json.data ?? []))
      .catch(() => setVersions([]))
      .finally(() => setLoading(false));
  }, [open, projectId, docId]);

  const handleRestore = async (commit: GitCommit) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/documents/${docId}/versions/restore`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hash: commit.hash }),
        }
      );
      const json = await res.json();
      if (json.data?.content) {
        onRestore(json.data.content);
        setOpen(false);
      }
    } catch (err) {
      console.error("[VersionHistory] restore failed:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-8 w-8 mb-2 animate-spin opacity-50" />
            <p className="text-sm">Loading history...</p>
          </div>
        ) : versions.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No previous versions</p>
            <p className="text-xs">Versions are created when you save</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {versions.map((commit, index) => (
                <div
                  key={commit.hash}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      <span className="font-mono text-xs text-muted-foreground mr-1.5">
                        {commit.shortHash}
                      </span>
                      {commit.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(commit.authorDate), {
                        addSuffix: true,
                      })}
                      {index === 0 && " (latest)"}
                    </p>
                  </div>
                  {index !== 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { handleRestore(commit); }}
                      className="ml-2 shrink-0"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
