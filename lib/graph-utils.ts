/**
 * Graph Utilities -- Pure logic functions extracted from graph-canvas.tsx.
 *
 * These functions are testable without Canvas 2D or React dependencies.
 * The graph canvas component imports and delegates to these functions.
 */

import type { GraphNodeType } from "@/lib/types";

// --- Types ---

export interface NodeVisibilityInput {
  fileType: GraphNodeType;
  tags: string[];
}

export interface VisibilityFilters {
  hiddenTypes?: Set<GraphNodeType>;
  selectedTags?: string[];
}

// --- Node Visibility ---

/**
 * Determine if a node should be visible based on type and tag filters.
 *
 * A node is hidden if:
 * - Its type is in the hiddenTypes set, OR
 * - selectedTags is non-empty and the node does not have ALL selected tags (AND logic)
 */
export function isNodeVisible(
  node: NodeVisibilityInput,
  filters: VisibilityFilters
): boolean {
  if (filters.hiddenTypes && filters.hiddenTypes.size > 0 && filters.hiddenTypes.has(node.fileType)) {
    return false;
  }
  if (filters.selectedTags && filters.selectedTags.length > 0) {
    for (const tag of filters.selectedTags) {
      if (!node.tags.includes(tag)) return false;
    }
  }
  return true;
}

// --- Highlight Logic ---

/**
 * Determine if a node is highlighted.
 *
 * Priority order:
 * 1. Search highlights (highlightedNodeIds) -- if non-empty, only highlighted nodes are bright
 * 2. Hover highlights -- if a node is hovered, it and its neighbors are bright
 * 3. No active highlight -- all nodes are bright (returns true)
 */
export function isNodeHighlighted(
  nodeId: string,
  options: {
    highlightedNodeIds: Set<string> | null;
    hoveredNodeId: string | null;
    adjacencyMap: Map<string, Set<string>>;
  }
): boolean {
  const { highlightedNodeIds, hoveredNodeId, adjacencyMap } = options;

  // Search highlight takes priority
  if (highlightedNodeIds && highlightedNodeIds.size > 0) {
    return highlightedNodeIds.has(nodeId);
  }

  // Hover highlight
  if (!hoveredNodeId) return true;
  if (nodeId === hoveredNodeId) return true;
  return adjacencyMap.get(hoveredNodeId)?.has(nodeId) ?? false;
}

// --- Visible Node IDs ---

/**
 * Compute the set of visible node IDs for O(1) link visibility checks.
 * Returns a Set of node IDs that pass the visibility filters.
 */
export function computeVisibleNodeIds(
  nodes: NodeVisibilityInput[],
  filters: VisibilityFilters
): Set<string> {
  const ids = new Set<string>();
  for (const node of nodes as Array<NodeVisibilityInput & { id: string }>) {
    if (isNodeVisible(node, filters)) {
      ids.add(node.id);
    }
  }
  return ids;
}
