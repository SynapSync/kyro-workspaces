"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";

export function DocumentsPage() {
  const { getActiveProject } = useAppStore();
  const project = getActiveProject();
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  const activeDoc = project.documents.find((d) => d.id === activeDocId);

  // Document Viewer
  if (activeDoc) {
    return (
      <div className="p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setActiveDocId(null)} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to documents</span>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {activeDoc.title}
          </h1>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Last updated{" "}
          {formatDistanceToNow(new Date(activeDoc.updatedAt), {
            addSuffix: true,
          })}
        </p>
        <div className="prose prose-sm max-w-none rounded-xl border bg-card p-6 dark:prose-invert prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none">
          <ReactMarkdown>{activeDoc.content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  // Document List View
  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Documents
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {project.documents.length} document
          {project.documents.length !== 1 ? "s" : ""} in this project
        </p>
      </div>

      <div className="grid gap-3">
        {project.documents.map((doc) => (
          <Card
            key={doc.id}
            className="border shadow-sm hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => setActiveDocId(doc.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {doc.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Updated{" "}
                    {formatDistanceToNow(new Date(doc.updatedAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {project.documents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No documents yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Documents are read from sprint-forge project directories.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
