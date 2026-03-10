"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import type { GraphData, GraphEdgeType, GraphNodeType } from "@/lib/types";
import type { ForceGraphMethods, NodeObject, LinkObject } from "react-force-graph-2d";
import { isNodeVisible, isNodeHighlighted } from "@/lib/graph-utils";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
      Loading graph renderer...
    </div>
  ),
});

// ---------- Types ----------

interface GraphNodeDatum {
  id: string;
  label: string;
  filePath: string;
  fileType: GraphNodeType;
  tags: string[];
  edgeCount: number;
  x?: number;
  y?: number;
  fx?: number | undefined;
  fy?: number | undefined;
}

interface GraphLinkDatum {
  source: string;
  target: string;
  edgeType: GraphEdgeType;
  label?: string;
  weight: number;
}

export interface HoveredNodeInfo {
  label: string;
  fileType: GraphNodeType;
  edgeCount: number;
  tags: string[];
  screenX: number;
  screenY: number;
}

export interface GraphCanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  unpinAll: () => void;
  centerAt: (x: number, y: number) => void;
}

interface GraphCanvasProps {
  graph: GraphData;
  width: number;
  height: number;
  hiddenTypes?: Set<GraphNodeType>;
  selectedTags?: string[];
  highlightedNodeIds?: Set<string> | null;
  visibleNodeIds?: Set<string> | null;
  onHoveredNodeChange?: (info: HoveredNodeInfo | null) => void;
}

// ---------- Muted Obsidian-style colors ----------

const NODE_COLORS: Record<GraphNodeType, { light: string; dark: string }> = {
  sprint:   { light: "#7c93b4", dark: "#8da4c4" },
  finding:  { light: "#c4a46a", dark: "#d4b47a" },
  document: { light: "#6aad8c", dark: "#7abd9c" },
  readme:   { light: "#9a85b8", dark: "#aa95c8" },
  roadmap:  { light: "#b87a7a", dark: "#c88a8a" },
};

const EDGE_COLORS: Record<GraphEdgeType, { light: string; dark: string }> = {
  "wiki-link":       { light: "#b0b0b0", dark: "#555555" },
  "markdown-link":   { light: "#c0c0c0", dark: "#4a4a4a" },
  "frontmatter-ref": { light: "#d0d0d0", dark: "#404040" },
  "tag-similarity":  { light: "#e0e0e0", dark: "#353535" },
  "structural":      { light: "#e8e8e8", dark: "#303030" },
};

const EDGE_DASH: Record<GraphEdgeType, number[] | null> = {
  "wiki-link":       null,
  "markdown-link":   null,
  "frontmatter-ref": [4, 2],
  "tag-similarity":  [2, 2],
  "structural":      [1, 3],
};

const EDGE_WIDTH: Record<GraphEdgeType, number> = {
  "wiki-link":       0.5,
  "markdown-link":   0.4,
  "frontmatter-ref": 0.3,
  "tag-similarity":  0.2,
  "structural":      0.15,
};

// ---------- Dark mode detection ----------

function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

// ---------- Component ----------

export const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>(
  function GraphCanvas({ graph, width, height, hiddenTypes, selectedTags, highlightedNodeIds, visibleNodeIds, onHoveredNodeChange }, ref) {
    const router = useRouter();
    const activeProjectId = useAppStore((s) => s.activeProjectId);
    const isDark = useIsDarkMode();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fgRef = useRef<ForceGraphMethods<any, any> | undefined>(undefined);

    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

    // --- Build adjacency map for hover highlighting ---
    const adjacencyMap = useMemo(() => {
      const map = new Map<string, Set<string>>();
      for (const edge of graph.edges) {
        if (!map.has(edge.source)) map.set(edge.source, new Set());
        if (!map.has(edge.target)) map.set(edge.target, new Set());
        map.get(edge.source)!.add(edge.target);
        map.get(edge.target)!.add(edge.source);
      }
      return map;
    }, [graph.edges]);

    // --- Build edge count per node ---
    const edgeCounts = useMemo(() => {
      const counts = new Map<string, number>();
      for (const edge of graph.edges) {
        counts.set(edge.source, (counts.get(edge.source) ?? 0) + 1);
        counts.set(edge.target, (counts.get(edge.target) ?? 0) + 1);
      }
      return counts;
    }, [graph.edges]);

    // --- Transform GraphData -> ForceGraph format ---
    const graphInput = useMemo(() => {
      const nodes: GraphNodeDatum[] = graph.nodes.map((n) => ({
        id: n.id,
        label: n.label,
        filePath: n.filePath,
        fileType: n.fileType,
        tags: n.tags,
        edgeCount: edgeCounts.get(n.id) ?? 0,
      }));

      const links: GraphLinkDatum[] = graph.edges.map((e) => ({
        source: e.source,
        target: e.target,
        edgeType: e.edgeType,
        label: e.label,
        weight: e.weight,
      }));

      return { nodes, links };
    }, [graph.nodes, graph.edges, edgeCounts]);

    // --- Expose control methods to parent ---
    useImperativeHandle(ref, () => ({
      zoomIn: () => {
        const fg = fgRef.current;
        if (fg) fg.zoom(fg.zoom() * 1.4, 300);
      },
      zoomOut: () => {
        const fg = fgRef.current;
        if (fg) fg.zoom(fg.zoom() / 1.4, 300);
      },
      zoomToFit: () => {
        fgRef.current?.zoomToFit(400, 60);
      },
      unpinAll: () => {
        for (const node of graphInput.nodes) {
          node.fx = undefined;
          node.fy = undefined;
        }
        fgRef.current?.d3ReheatSimulation();
      },
      centerAt: (x: number, y: number) => {
        fgRef.current?.centerAt(x, y, 300);
      },
    }));

    // --- Fit graph on initial load ---
    const hasZoomed = useRef(false);
    const handleEngineStop = useCallback(() => {
      if (!hasZoomed.current && fgRef.current) {
        fgRef.current.zoomToFit(400, 60);
        hasZoomed.current = true;
      }
    }, []);

    // --- Click-to-navigate ---
    const handleNodeClick = useCallback(
      (rawNode: NodeObject) => {
        const node = rawNode as unknown as GraphNodeDatum;
        if (!activeProjectId) return;
        const base = `/${activeProjectId}`;
        switch (node.fileType) {
          case "readme":
            router.push(`${base}/readme`);
            break;
          case "roadmap":
            router.push(`${base}/roadmap`);
            break;
          case "finding":
            router.push(`${base}/findings`);
            break;
          case "sprint": {
            const fileName = node.filePath.split("/").pop() ?? "";
            const sprintSlug = fileName.replace(/\.md$/, "").toLowerCase();
            router.push(`${base}/sprints/${sprintSlug}`);
            break;
          }
          case "document":
            router.push(`${base}/documents`);
            break;
          default:
            router.push(`${base}/overview`);
        }
      },
      [activeProjectId, router]
    );

    // --- Hover handlers ---
    const handleNodeHover = useCallback(
      (rawNode: NodeObject | null) => {
        const node = rawNode as unknown as GraphNodeDatum | null;
        setHoveredNodeId(node?.id ?? null);

        if (node && onHoveredNodeChange && fgRef.current) {
          const screenCoords = fgRef.current.graph2ScreenCoords(node.x ?? 0, node.y ?? 0);
          onHoveredNodeChange({
            label: node.label,
            fileType: node.fileType,
            edgeCount: node.edgeCount,
            tags: node.tags,
            screenX: screenCoords.x,
            screenY: screenCoords.y,
          });
        } else if (onHoveredNodeChange) {
          onHoveredNodeChange(null);
        }
      },
      [onHoveredNodeChange]
    );

    // --- Node drag end: pin node ---
    const handleNodeDragEnd = useCallback((rawNode: NodeObject) => {
      const node = rawNode as unknown as GraphNodeDatum;
      node.fx = node.x;
      node.fy = node.y;
    }, []);

    // --- Visibility filters object (stable reference for extracted function) ---
    const visibilityFilters = useMemo(
      () => ({ hiddenTypes, selectedTags }),
      [hiddenTypes, selectedTags]
    );

    // --- Node visibility (type + tag filtering) ---
    const nodeVisibility = useCallback(
      (rawNode: NodeObject) => {
        const node = rawNode as unknown as GraphNodeDatum;
        return isNodeVisible(node, visibilityFilters);
      },
      [visibilityFilters]
    );

    // --- Link visibility (O(1) Set lookup via visibleNodeIds) ---
    const linkVisibility = useCallback(
      (rawLink: LinkObject) => {
        if (!visibleNodeIds) return true;
        const link = rawLink as unknown as GraphLinkDatum;
        const sourceId = typeof link.source === "object" ? (link.source as GraphNodeDatum).id : link.source;
        const targetId = typeof link.target === "object" ? (link.target as GraphNodeDatum).id : link.target;
        return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId);
      },
      [visibleNodeIds]
    );

    // --- Determine if a node is highlighted (uses extracted pure function) ---
    const highlightOptions = useMemo(
      () => ({ highlightedNodeIds: highlightedNodeIds ?? null, hoveredNodeId, adjacencyMap }),
      [highlightedNodeIds, hoveredNodeId, adjacencyMap]
    );

    const isHighlighted = useCallback(
      (nodeId: string): boolean => isNodeHighlighted(nodeId, highlightOptions),
      [highlightOptions]
    );

    // --- Custom node rendering (Obsidian-style) ---
    const nodeCanvasObject = useCallback(
      (rawNode: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const node = rawNode as unknown as GraphNodeDatum;
        const x = node.x ?? 0;
        const y = node.y ?? 0;

        // Small dot: 3px base, grows slightly with connections, max 7px
        const radius = Math.min(3 + Math.sqrt(node.edgeCount) * 0.6, 7);
        const highlighted = isHighlighted(node.id);
        const isHovered = node.id === hoveredNodeId;
        const colors = NODE_COLORS[node.fileType];
        const color = isDark ? colors.dark : colors.light;

        // Soft glow on hover
        if (isHovered) {
          ctx.beginPath();
          ctx.arc(x, y, radius * 2.5, 0, 2 * Math.PI);
          const glow = ctx.createRadialGradient(x, y, radius, x, y, radius * 2.5);
          glow.addColorStop(0, color + "30");
          glow.addColorStop(1, color + "00");
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        const alpha = highlighted ? 0.85 : 0.12;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Thin ring on hover
        if (isHovered) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Tooltip is rendered via React overlay (GraphTooltip); canvas skips labels to avoid overlap
      },
      [isDark, hoveredNodeId, isHighlighted]
    );

    // --- Node pointer area (for hit detection) ---
    const nodePointerAreaPaint = useCallback(
      (rawNode: NodeObject, color: string, ctx: CanvasRenderingContext2D) => {
        const node = rawNode as unknown as GraphNodeDatum;
        const x = node.x ?? 0;
        const y = node.y ?? 0;
        const radius = Math.min(3 + Math.sqrt(node.edgeCount) * 0.6, 7);
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      },
      []
    );

    // --- Edge color ---
    const linkColor = useCallback(
      (rawLink: LinkObject) => {
        const link = rawLink as unknown as GraphLinkDatum;
        const edgeType = link.edgeType as GraphEdgeType;
        const colors = EDGE_COLORS[edgeType] ?? EDGE_COLORS["structural"];
        const baseColor = isDark ? colors.dark : colors.light;
        if (hoveredNodeId) {
          const sourceId = typeof link.source === "object" ? (link.source as GraphNodeDatum).id : link.source;
          const targetId = typeof link.target === "object" ? (link.target as GraphNodeDatum).id : link.target;
          const connected = sourceId === hoveredNodeId || targetId === hoveredNodeId;
          return connected ? baseColor : (isDark ? "#222228" : "#f0f0f2");
        }
        return baseColor;
      },
      [isDark, hoveredNodeId]
    );

    // --- Edge width ---
    const linkWidth = useCallback((rawLink: LinkObject) => {
      const link = rawLink as unknown as GraphLinkDatum;
      return EDGE_WIDTH[link.edgeType as GraphEdgeType] ?? 0.2;
    }, []);

    // --- Edge dash ---
    const linkLineDash = useCallback((rawLink: LinkObject) => {
      const link = rawLink as unknown as GraphLinkDatum;
      return EDGE_DASH[link.edgeType as GraphEdgeType] ?? null;
    }, []);

    // --- Background ---
    const bgColor = isDark ? "#09090b" : "#fafafa";

    // --- Force layout: spread nodes apart + type-based clustering ---
    useEffect(() => {
      const fg = fgRef.current;
      if (!fg) return;
      fg.d3Force("charge")?.strength(-80);
      fg.d3Force("link")?.distance(60);
      fg.d3Force("center")?.strength(0.05);

      // Custom cluster force: gently pull same-type nodes toward their centroid
      const clusterForce = (alpha: number) => {
        const centroids = new Map<string, { x: number; y: number; count: number }>();
        for (const node of graphInput.nodes) {
          const n = node as GraphNodeDatum;
          if (n.x == null || n.y == null) continue;
          const existing = centroids.get(n.fileType) ?? { x: 0, y: 0, count: 0 };
          existing.x += n.x;
          existing.y += n.y;
          existing.count += 1;
          centroids.set(n.fileType, existing);
        }
        for (const c of centroids.values()) {
          if (c.count > 0) { c.x /= c.count; c.y /= c.count; }
        }
        const strength = 0.12 * alpha;
        for (const node of graphInput.nodes) {
          const n = node as GraphNodeDatum;
          const c = centroids.get(n.fileType);
          if (c && n.x != null && n.y != null) {
            n.x += (c.x - n.x) * strength;
            n.y += (c.y - n.y) * strength;
          }
        }
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fg.d3Force("cluster", clusterForce as any);
    });

    // --- Cluster labels rendered after each frame (throttled via position fingerprint) ---
    const NODE_TYPE_LABELS: Record<string, string> = {
      sprint: "Sprints", finding: "Findings", document: "Documents",
      readme: "README", roadmap: "Roadmap",
    };

    const cachedCentroids = useRef<Map<string, { x: number; y: number; count: number }>>(new Map());
    const cachedFingerprint = useRef<number>(0);

    const renderClusterLabels = useCallback(
      (ctx: CanvasRenderingContext2D, globalScale: number) => {
        // Only show at medium zoom
        if (globalScale > 2 || globalScale < 0.3) return;

        // Compute position fingerprint (sum of all node x+y, rounded to avoid float noise)
        let fingerprint = 0;
        for (const node of graphInput.nodes) {
          const n = node as GraphNodeDatum;
          if (n.x != null && n.y != null) {
            fingerprint += Math.round(n.x * 10) + Math.round(n.y * 10);
          }
        }

        // Only recompute centroids when positions have changed
        if (fingerprint !== cachedFingerprint.current) {
          cachedFingerprint.current = fingerprint;
          const centroids = new Map<string, { x: number; y: number; count: number }>();
          for (const node of graphInput.nodes) {
            const n = node as GraphNodeDatum;
            if (n.x == null || n.y == null) continue;
            if (hiddenTypes && hiddenTypes.has(n.fileType)) continue;
            const existing = centroids.get(n.fileType) ?? { x: 0, y: 0, count: 0 };
            existing.x += n.x;
            existing.y += n.y;
            existing.count += 1;
            centroids.set(n.fileType, existing);
          }
          for (const c of centroids.values()) {
            if (c.count > 0) { c.x /= c.count; c.y /= c.count; }
          }
          cachedCentroids.current = centroids;
        }

        // Draw cached centroids
        for (const [type, c] of cachedCentroids.current.entries()) {
          if (c.count < 2) continue;
          const label = NODE_TYPE_LABELS[type] ?? type;
          const fontSize = Math.max(14, 18 / globalScale);
          ctx.font = `500 ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = isDark ? "rgba(140, 140, 160, 0.15)" : "rgba(80, 80, 100, 0.1)";
          ctx.fillText(label, c.x, c.y - 20 / globalScale);
        }
      },
      [graphInput.nodes, isDark, hiddenTypes]
    );

    return (
      <ForceGraph2D
        key={`${width}x${height}`}
        ref={fgRef}
        graphData={graphInput}
        width={width}
        height={height}
        style={{ width: "100%", height: "100%" }}
        backgroundColor={bgColor}
        nodeRelSize={1}
        nodeVal={0.5}
        nodeCanvasObject={nodeCanvasObject}
        nodeCanvasObjectMode={() => "replace"}
        nodePointerAreaPaint={nodePointerAreaPaint}
        nodeVisibility={nodeVisibility}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onNodeDragEnd={handleNodeDragEnd}
        enableNodeDrag={true}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkLineDash={linkLineDash}
        linkVisibility={linkVisibility}
        onRenderFramePost={renderClusterLabels}
        cooldownTicks={100}
        onEngineStop={handleEngineStop}
        minZoom={0.2}
        maxZoom={10}
        warmupTicks={30}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />
    );
  }
);
