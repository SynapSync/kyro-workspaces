"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Search, X, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GRAPH_NODE_HEX_COLORS } from "@/lib/config";
import type { GraphNodeType, GraphData } from "@/lib/types";

// ---------- Types ----------

export interface GraphFilterState {
  hiddenTypes: Set<GraphNodeType>;
  selectedTags: string[];
  searchQuery: string;
}

export const DEFAULT_FILTER_STATE: GraphFilterState = {
  hiddenTypes: new Set(),
  selectedTags: [],
  searchQuery: "",
};

interface GraphFiltersProps {
  graph: GraphData;
  filterState: GraphFilterState;
  onFilterChange: (state: GraphFilterState) => void;
}

// ---------- Constants ----------

const NODE_TYPE_LABELS: Record<GraphNodeType, string> = {
  sprint: "Sprint",
  finding: "Finding",
  document: "Document",
  readme: "README",
  roadmap: "Roadmap",
};

const ALL_NODE_TYPES: GraphNodeType[] = [
  "sprint",
  "finding",
  "document",
  "readme",
  "roadmap",
];

const MAX_VISIBLE_TAGS = 20;

// ---------- Component ----------

export function GraphFilters({
  graph,
  filterState,
  onFilterChange,
}: GraphFiltersProps) {
  const [expanded, setExpanded] = useState(true);
  const [showAllTags, setShowAllTags] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- Counts per type ---
  const typeCounts = useMemo(() => {
    const counts = new Map<GraphNodeType, number>();
    for (const node of graph.nodes) {
      counts.set(node.fileType, (counts.get(node.fileType) ?? 0) + 1);
    }
    return counts;
  }, [graph.nodes]);

  // --- All unique tags sorted ---
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const node of graph.nodes) {
      for (const tag of node.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [graph.nodes]);

  const visibleTags = showAllTags
    ? allTags
    : allTags.slice(0, MAX_VISIBLE_TAGS);

  // --- Handlers ---
  const toggleType = useCallback(
    (type: GraphNodeType) => {
      const next = new Set(filterState.hiddenTypes);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      onFilterChange({ ...filterState, hiddenTypes: next });
    },
    [filterState, onFilterChange]
  );

  const toggleTag = useCallback(
    (tag: string) => {
      const idx = filterState.selectedTags.indexOf(tag);
      const next =
        idx >= 0
          ? filterState.selectedTags.filter((t) => t !== tag)
          : [...filterState.selectedTags, tag];
      onFilterChange({ ...filterState, selectedTags: next });
    },
    [filterState, onFilterChange]
  );

  const clearTags = useCallback(() => {
    onFilterChange({ ...filterState, selectedTags: [] });
  }, [filterState, onFilterChange]);

  const setSearchQuery = useCallback(
    (query: string) => {
      onFilterChange({ ...filterState, searchQuery: query });
    },
    [filterState, onFilterChange]
  );

  const clearSearch = useCallback(() => {
    onFilterChange({ ...filterState, searchQuery: "" });
  }, [filterState, onFilterChange]);

  // --- Keyboard shortcut: "/" to focus search ---
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        setExpanded(true);
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const hasActiveFilters =
    filterState.hiddenTypes.size > 0 ||
    filterState.selectedTags.length > 0 ||
    filterState.searchQuery.length > 0;

  return (
    <div
      className="absolute top-4 left-4 z-10 w-48 rounded-lg border bg-background/90 shadow-md backdrop-blur-sm"
      role="region"
      aria-label="Graph filters"
    >
      <Button
        variant="ghost"
        size="sm"
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="flex items-center gap-1.5">
          <Filter className="h-3 w-3" />
          Filters
          {hasActiveFilters && (
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </span>
        {expanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </Button>

      {expanded && (
        <div className="space-y-3 px-3 pb-3">
          {/* Search */}
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Search{" "}
              <span className="font-normal text-muted-foreground/60">
                (/)
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={filterState.searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find nodes..."
                className="h-7 pl-7 pr-7 text-xs"
              />
              {filterState.searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Node Types */}
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Node Types
            </div>
            <div className="space-y-0.5">
              {ALL_NODE_TYPES.map((type) => {
                const hidden = filterState.hiddenTypes.has(type);
                const count = typeCounts.get(type) ?? 0;
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    aria-pressed={!hidden}
                    aria-label={`${NODE_TYPE_LABELS[type]}: ${count} nodes, ${hidden ? "hidden" : "visible"}`}
                    className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-xs transition-colors hover:bg-muted/50"
                  >
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full transition-opacity"
                      style={{
                        backgroundColor: GRAPH_NODE_HEX_COLORS[type],
                        opacity: hidden ? 0.2 : 1,
                      }}
                    />
                    <span
                      className={
                        hidden
                          ? "text-muted-foreground/40 line-through"
                          : "text-foreground"
                      }
                    >
                      {NODE_TYPE_LABELS[type]}
                    </span>
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tags
                </span>
                {filterState.selectedTags.length > 0 && (
                  <button
                    onClick={clearTags}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {visibleTags.map((tag) => {
                  const selected = filterState.selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`rounded px-1.5 py-0.5 text-[10px] transition-colors ${
                        selected
                          ? "bg-primary/15 text-primary font-medium"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              {allTags.length > MAX_VISIBLE_TAGS && (
                <button
                  onClick={() => setShowAllTags(!showAllTags)}
                  className="mt-1 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  {showAllTags
                    ? "Show less"
                    : `+${allTags.length - MAX_VISIBLE_TAGS} more`}
                </button>
              )}
            </div>
          )}
          {/* Screen reader status */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {hasActiveFilters
              ? `Filters active: ${filterState.hiddenTypes.size} types hidden, ${filterState.selectedTags.length} tags selected${filterState.searchQuery ? `, searching for "${filterState.searchQuery}"` : ""}`
              : "No filters active"}
          </div>
        </div>
      )}
    </div>
  );
}
