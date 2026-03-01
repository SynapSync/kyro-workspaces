"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { RotateCcw, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DocumentVersion } from "@/lib/types";

interface VersionHistoryProps {
  versions: DocumentVersion[];
  onRestore: (version: DocumentVersion) => void;
  currentContent: string;
}

export function VersionHistory({
  versions,
  onRestore,
  currentContent,
}: VersionHistoryProps) {
  const [open, setOpen] = useState(false);

  const handleRestore = (version: DocumentVersion) => {
    onRestore(version);
    setOpen(false);
  };

  const getPreview = (content: string) => {
    const firstLine = content.split("\n")[0].replace(/^#+\s*/, "");
    return firstLine.slice(0, 50) + (firstLine.length > 50 ? "..." : "");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          History
          {versions.length > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({versions.length})
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>
        {versions.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No previous versions</p>
            <p className="text-xs">Versions are created when you save</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {version.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {getPreview(version.content)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(version.createdAt), {
                        addSuffix: true,
                      })}
                      {index === 0 && " (current)"}
                    </p>
                  </div>
                  {index !== 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestore(version)}
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
