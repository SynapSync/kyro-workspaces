"use client";

import ReactMarkdown from "react-markdown";
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
      <div className="prose prose-sm max-w-none rounded-xl border bg-card p-6 dark:prose-invert prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none">
        <ReactMarkdown>{project.readme}</ReactMarkdown>
      </div>
    </div>
  );
}
