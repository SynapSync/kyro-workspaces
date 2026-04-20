"use client";

import { useEffect, useRef, useState, useCallback, useMemo, useLayoutEffect } from "react";
import { Network, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/lib/store";
import { GRAPH_NODE_COLORS } from "@/lib/config";
import {
  GraphCanvas,
  GraphControls,
  GraphFilters,
  GraphLegend,
  GraphMinimap,
  GraphTooltip,
  DEFAULT_FILTER_STATE,
} from "@/components/graph";
import type { GraphCanvasHandle, GraphFilterState, HoveredNodeInfo } from "@/components/graph";
import type { GraphNodeType } from "@/lib/types";
import { computeVisibleNodeIds } from "@/lib/graph-utils";

export function GraphViewPage() {
  const { activeProjectId, graphData, graphLoading, loadGraph } = useAppStore();
  const graph = graphData[activeProjectId];
  const isLoading = graphLoading[activeProjectId] ?? false;

  const [statsOpen, setStatsOpen] = useState(false);
  const [filterState, setFilterState] = useState<GraphFilterState>(
    DEFAULT_FILTER_STATE
  );
  const [hoveredNode, setHoveredNode] = useState<HoveredNodeInfo | null>(null);
  const canvasRef = useRef<GraphCanvasHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? Math.max(window.innerHeight - 200, 600) : 768,
  }));
  const [graphViewport, setGraphViewport] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const handleViewportChange = useCallback(
    (next: { x: number; y: number; width: number; height: number }) => {
      setGraphViewport((prev) => {
        if (
          prev &&
          Math.abs(prev.x - next.x) < 0.1 &&
          Math.abs(prev.y - next.y) < 0.1 &&
          Math.abs(prev.width - next.width) < 0.1 &&
          Math.abs(prev.height - next.height) < 0.1
        ) {
          return prev;
        }
        return next;
      });
    },
    []
  );

  useEffect(() => {
    if (activeProjectId && !graph) {
      loadGraph(activeProjectId);
    }
  }, [activeProjectId, graph, loadGraph]);

  // Reset filters when project changes
  const prevProjectRef = useRef(activeProjectId);
  useEffect(() => {
    if (activeProjectId !== prevProjectRef.current) {
      setFilterState(DEFAULT_FILTER_STATE);
      prevProjectRef.current = activeProjectId;
    }
  }, [activeProjectId]);

  // --- Compute search-highlighted node IDs ---
  const highlightedNodeIds = useMemo(() => {
    if (!graph || !filterState.searchQuery) return null;
    const query = filterState.searchQuery.toLowerCase();
    const ids = new Set<string>();
    for (const node of graph.nodes) {
      if (node.label.toLowerCase().includes(query)) {
        ids.add(node.id);
      }
    }
    return ids.size > 0 ? ids : null;
  }, [graph, filterState.searchQuery]);

  // --- Compute visible node IDs for O(1) link visibility checks ---
  const visibleNodeIds = useMemo(() => {
    if (!graph) return null;
    const hasFilters =
      filterState.hiddenTypes.size > 0 || filterState.selectedTags.length > 0;
    if (!hasFilters) return null; // null = all visible, skip Set allocation
    return computeVisibleNodeIds(
      graph.nodes.map((n) => ({ id: n.id, fileType: n.fileType, tags: n.tags })),
      { hiddenTypes: filterState.hiddenTypes, selectedTags: filterState.selectedTags }
    );
  }, [graph, filterState.hiddenTypes, filterState.selectedTags]);

  // --- Responsive sizing via ResizeObserver ---
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    };

    // Initial measure asap + after paint
    measure();
    requestAnimationFrame(measure);

    const observer = new ResizeObserver(() => measure());
    observer.observe(el, { box: "border-box" as ResizeObserverBoxOptions });
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const handleRefresh = useCallback(() => {
    if (activeProjectId) {
      loadGraph(activeProjectId);
    }
  }, [activeProjectId, loadGraph]);

  const handleMinimapPan = useCallback((x: number, y: number) => {
    canvasRef.current?.centerAt(x, y);
  }, []);

  // --- Loading state ---
  if (isLoading && !graph) {
    return (
      <div className="flex h-full flex-col overflow-auto">
        <div className="shrink-0 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <Network className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Graph View
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Loading graph data...
          </p>
        </div>
        <div className="flex-1 px-6 pb-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  // --- Empty state ---
  if (!graph) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Network className="h-12 w-12 text-muted-foreground/50" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          No Graph Data
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Graph data will be generated automatically when the project is
          indexed.
        </p>
      </div>
    );
  }

  // --- Aggregate stats ---
  const nodesByType = new Map<GraphNodeType, number>();
  for (const node of graph.nodes) {
    nodesByType.set(
      node.fileType,
      (nodesByType.get(node.fileType) ?? 0) + 1
    );
  }

  const edgesByType = new Map<string, number>();
  for (const edge of graph.edges) {
    edgesByType.set(
      edge.edgeType,
      (edgesByType.get(edge.edgeType) ?? 0) + 1
    );
  }

  // Is this a background refresh (graph exists but loading)?
  const isRefreshing = isLoading && !!graph;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Network className="h-6 w-6 text-muted-foreground" />
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Graph View
              </h1>
              {isRefreshing && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  Updating...
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {graph.metadata.nodeCount} nodes, {graph.metadata.edgeCount}{" "}
              edges
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStatsOpen(!statsOpen)}
            className="text-xs text-muted-foreground"
          >
            {statsOpen ? "Hide Stats" : "Show Stats"}
            {statsOpen ? (
              <ChevronUp className="ml-1 h-3 w-3" />
            ) : (
              <ChevronDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Collapsible Summary Cards */}
      {statsOpen && (
        <div className="shrink-0 px-6 pb-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Nodes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {graph.metadata.nodeCount}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from(nodesByType.entries()).map(([type, count]) => (
                    <Badge
                      key={type}
                      variant="outline"
                      className={GRAPH_NODE_COLORS[type]}
                    >
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Edges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {graph.metadata.edgeCount}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from(edgesByType.entries()).map(([type, count]) => (
                    <Badge key={type} variant="outline">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Clusters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {graph.clusters.length}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {graph.clusters.map((cluster) => (
                    <Badge key={cluster.id} variant="outline">
                      {cluster.label} ({cluster.nodeIds.length})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Graph Canvas */}
      <div
        className="relative flex-1 min-h-0 w-full"
        ref={containerRef}
        role="img"
        aria-label={`Knowledge graph with ${graph.metadata.nodeCount} nodes and ${graph.metadata.edgeCount} edges`}
      >
        <GraphCanvas
          ref={canvasRef}
          graph={graph}
          width={dimensions.width}
          height={dimensions.height}
          hiddenTypes={filterState.hiddenTypes}
          selectedTags={filterState.selectedTags}
          highlightedNodeIds={highlightedNodeIds}
          visibleNodeIds={visibleNodeIds}
          onHoveredNodeChange={setHoveredNode}
          onViewportChange={handleViewportChange}
        />
        <GraphTooltip
          label={hoveredNode?.label ?? ""}
          fileType={hoveredNode?.fileType ?? "document"}
          edgeCount={hoveredNode?.edgeCount ?? 0}
          tags={hoveredNode?.tags ?? []}
          x={hoveredNode?.screenX ?? 0}
          y={hoveredNode?.screenY ?? 0}
          visible={hoveredNode !== null}
          containerWidth={dimensions.width}
          containerHeight={dimensions.height}
        />
        <GraphFilters
          graph={graph}
          filterState={filterState}
          onFilterChange={setFilterState}
        />
        <GraphLegend filterState={filterState} />
        <GraphMinimap
          graph={graph}
          viewport={graphViewport}
          onPan={handleMinimapPan}
        />
        <GraphControls
          onZoomIn={() => canvasRef.current?.zoomIn()}
          onZoomOut={() => canvasRef.current?.zoomOut()}
          onZoomToFit={() => canvasRef.current?.zoomToFit()}
          onUnpinAll={() => canvasRef.current?.unpinAll()}
          onRefresh={handleRefresh}
          isRefreshing={isLoading}
        />
      </div>
    </div>
  );
}
