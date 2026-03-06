"use client";

import { MarkdownRenderer } from "@/components/markdown-renderer";
import { useAppStore } from "@/lib/store";

export function ReadmePage() {
  const { getActiveProject } = useAppStore();
  const project = getActiveProject();

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          README
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Project documentation and getting started guide
        </p>
      </div>
      <MarkdownRenderer
        content={project.readme}
        className="rounded-xl border bg-card p-6"
      />
    </div>
  );
}
