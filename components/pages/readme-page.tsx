"use client";

import { MarkdownRenderer } from "@/components/markdown-renderer";
import { useAppStore } from "@/lib/store";

export function ReadmePage() {
  const { getActiveProject } = useAppStore();
  const project = getActiveProject();

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          README
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Project documentation and getting started guide
        </p>
      </div>
      <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
        <div className="max-w-4xl">
          <MarkdownRenderer
            content={project.readme}
            className="rounded-xl border bg-card p-6"
          />
        </div>
      </div>
    </div>
  );
}
