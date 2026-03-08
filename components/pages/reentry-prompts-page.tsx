"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Copy, Check } from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EntitySkeleton } from "@/components/ui/entity-skeleton";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Scenario {
  number: string;
  title: string;
  description: string;
  prompt: string;
}

function parseScenarios(content: string): { preamble: string; scenarios: Scenario[] } {
  // Split on ## Scenario headings
  const scenarioPattern = /^## Scenario (\d+) — (.+)$/gm;
  const matches = [...content.matchAll(scenarioPattern)];

  if (matches.length === 0) {
    return { preamble: content, scenarios: [] };
  }

  const preamble = content.slice(0, matches[0].index).trimEnd();
  const scenarios: Scenario[] = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const start = match.index! + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : content.length;
    const body = content.slice(start, end).trim();

    // Extract the code block (the prompt to copy)
    const codeBlockMatch = body.match(/```\n([\s\S]*?)```/);
    const prompt = codeBlockMatch ? codeBlockMatch[1].trim() : "";

    // Everything before the code block is the description
    const descEnd = codeBlockMatch ? body.indexOf(codeBlockMatch[0]) : body.length;
    const description = body.slice(0, descEnd).replace(/^---\s*$/gm, "").trim();

    scenarios.push({
      number: match[1],
      title: match[2],
      description,
      prompt,
    });
  }

  return { preamble, scenarios };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        copied
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-primary/10 text-primary hover:bg-primary/20"
      )}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy Prompt
        </>
      )}
    </button>
  );
}

export function ReentryPromptsPage() {
  const {
    activeProjectId,
    reentryPrompts,
    reentryLoading,
    loadReentryPrompts,
  } = useAppStore();

  const content = reentryPrompts[activeProjectId] ?? "";
  const isLoading = reentryLoading[activeProjectId] ?? false;

  useEffect(() => {
    if (activeProjectId && reentryPrompts[activeProjectId] === undefined) {
      loadReentryPrompts(activeProjectId);
    }
  }, [activeProjectId, reentryPrompts, loadReentryPrompts]);

  const { preamble, scenarios } = useMemo(
    () => (content ? parseScenarios(content) : { preamble: "", scenarios: [] }),
    [content]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Re-entry Prompts
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Context recovery prompts from the project&apos;s RE-ENTRY-PROMPTS.md
        </p>
      </div>
      <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
        <div className="max-w-5xl">
          {isLoading ? (
            <EntitySkeleton rows={5} />
          ) : content ? (
            <>
              {/* Preamble (everything before scenarios) */}
              {preamble && (
                <MarkdownRenderer
                  content={preamble}
                  className="rounded-xl border bg-card p-6 mb-6"
                />
              )}

              {/* Scenario cards */}
              {scenarios.length > 0 && (
                <div className="grid gap-4">
                  {scenarios.map((scenario) => (
                    <Card key={scenario.number} className="border shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-2.5">
                            <Badge
                              variant="outline"
                              className="text-xs font-mono h-6 px-2"
                            >
                              #{scenario.number}
                            </Badge>
                            <h3 className="font-semibold text-sm text-foreground">
                              {scenario.title}
                            </h3>
                          </div>
                          {scenario.prompt && (
                            <CopyButton text={scenario.prompt} />
                          )}
                        </div>

                        {scenario.description && (
                          <p className="text-xs text-muted-foreground mb-3">
                            {scenario.description}
                          </p>
                        )}

                        {scenario.prompt && (
                          <pre className="rounded-lg bg-muted/50 p-4 text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap break-words">
                            {scenario.prompt}
                          </pre>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Fallback: no scenarios detected, show full markdown */}
              {scenarios.length === 0 && !preamble && (
                <MarkdownRenderer
                  content={content}
                  className="rounded-xl border bg-card p-6"
                />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No re-entry prompts available
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Re-entry prompts are loaded from the project&apos;s RE-ENTRY-PROMPTS.md file.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
