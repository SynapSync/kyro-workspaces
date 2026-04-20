import { describe, it, expect } from "vitest";
import {
  isNodeVisible,
  isNodeHighlighted,
  computeVisibleNodeIds,
} from "../graph-utils";
import type { GraphNodeType } from "@/lib/types";

// --- Test helpers ---

function makeNode(id: string, fileType: GraphNodeType, tags: string[] = []) {
  return { id, fileType, tags };
}

// --- isNodeVisible ---

describe("isNodeVisible", () => {
  it("returns true when no filters are applied", () => {
    const node = makeNode("n1", "sprint");
    expect(isNodeVisible(node, {})).toBe(true);
  });

  it("returns true when hiddenTypes is empty set", () => {
    const node = makeNode("n1", "sprint");
    expect(isNodeVisible(node, { hiddenTypes: new Set() })).toBe(true);
  });

  it("returns false when node type is hidden", () => {
    const node = makeNode("n1", "sprint");
    expect(isNodeVisible(node, { hiddenTypes: new Set(["sprint"]) })).toBe(false);
  });

  it("returns true when different type is hidden", () => {
    const node = makeNode("n1", "sprint");
    expect(isNodeVisible(node, { hiddenTypes: new Set(["finding"]) })).toBe(true);
  });

  it("returns false when node lacks a selected tag (AND logic)", () => {
    const node = makeNode("n1", "sprint", ["alpha"]);
    expect(isNodeVisible(node, { selectedTags: ["alpha", "beta"] })).toBe(false);
  });

  it("returns true when node has all selected tags", () => {
    const node = makeNode("n1", "sprint", ["alpha", "beta", "gamma"]);
    expect(isNodeVisible(node, { selectedTags: ["alpha", "beta"] })).toBe(true);
  });

  it("returns true when selectedTags is empty", () => {
    const node = makeNode("n1", "sprint", []);
    expect(isNodeVisible(node, { selectedTags: [] })).toBe(true);
  });

  it("applies both hiddenTypes and selectedTags", () => {
    const node = makeNode("n1", "sprint", ["alpha"]);
    expect(
      isNodeVisible(node, {
        hiddenTypes: new Set(["sprint"]),
        selectedTags: ["alpha"],
      })
    ).toBe(false);
  });

  it("hiddenTypes takes priority over tags", () => {
    const node = makeNode("n1", "finding", ["alpha", "beta"]);
    expect(
      isNodeVisible(node, {
        hiddenTypes: new Set(["finding"]),
        selectedTags: ["alpha"],
      })
    ).toBe(false);
  });
});

// --- isNodeHighlighted ---

describe("isNodeHighlighted", () => {
  const emptyAdj = new Map<string, Set<string>>();

  it("returns true when no highlights and no hover", () => {
    expect(
      isNodeHighlighted("n1", {
        highlightedNodeIds: null,
        hoveredNodeId: null,
        adjacencyMap: emptyAdj,
      })
    ).toBe(true);
  });

  it("returns true when search highlights include the node", () => {
    expect(
      isNodeHighlighted("n1", {
        highlightedNodeIds: new Set(["n1", "n2"]),
        hoveredNodeId: null,
        adjacencyMap: emptyAdj,
      })
    ).toBe(true);
  });

  it("returns false when search highlights exclude the node", () => {
    expect(
      isNodeHighlighted("n3", {
        highlightedNodeIds: new Set(["n1", "n2"]),
        hoveredNodeId: null,
        adjacencyMap: emptyAdj,
      })
    ).toBe(false);
  });

  it("search highlights take priority over hover", () => {
    // n1 is hovered and n3 is its neighbor, but search only highlights n2
    const adj = new Map([["n1", new Set(["n3"])]]);
    expect(
      isNodeHighlighted("n3", {
        highlightedNodeIds: new Set(["n2"]),
        hoveredNodeId: "n1",
        adjacencyMap: adj,
      })
    ).toBe(false);
  });

  it("returns true for hovered node (no search highlights)", () => {
    expect(
      isNodeHighlighted("n1", {
        highlightedNodeIds: null,
        hoveredNodeId: "n1",
        adjacencyMap: emptyAdj,
      })
    ).toBe(true);
  });

  it("returns true for neighbor of hovered node", () => {
    const adj = new Map([["n1", new Set(["n2"])]]);
    expect(
      isNodeHighlighted("n2", {
        highlightedNodeIds: null,
        hoveredNodeId: "n1",
        adjacencyMap: adj,
      })
    ).toBe(true);
  });

  it("returns false for non-neighbor when a node is hovered", () => {
    const adj = new Map([["n1", new Set(["n2"])]]);
    expect(
      isNodeHighlighted("n3", {
        highlightedNodeIds: null,
        hoveredNodeId: "n1",
        adjacencyMap: adj,
      })
    ).toBe(false);
  });

  it("handles empty search highlight set as no-highlight", () => {
    // Empty set should behave like null (no active search)
    expect(
      isNodeHighlighted("n1", {
        highlightedNodeIds: new Set(),
        hoveredNodeId: null,
        adjacencyMap: emptyAdj,
      })
    ).toBe(true);
  });
});

// --- computeVisibleNodeIds ---

describe("computeVisibleNodeIds", () => {
  it("returns all node IDs when no filters", () => {
    const nodes = [
      makeNode("n1", "sprint"),
      makeNode("n2", "finding"),
      makeNode("n3", "document"),
    ];
    const result = computeVisibleNodeIds(nodes, {});
    expect(result.size).toBe(3);
    expect(result.has("n1")).toBe(true);
    expect(result.has("n2")).toBe(true);
    expect(result.has("n3")).toBe(true);
  });

  it("filters out hidden types", () => {
    const nodes = [
      makeNode("n1", "sprint"),
      makeNode("n2", "finding"),
      makeNode("n3", "sprint"),
    ];
    const result = computeVisibleNodeIds(nodes, {
      hiddenTypes: new Set(["sprint"]),
    });
    expect(result.size).toBe(1);
    expect(result.has("n2")).toBe(true);
  });

  it("filters by selected tags with AND logic", () => {
    const nodes = [
      makeNode("n1", "sprint", ["alpha", "beta"]),
      makeNode("n2", "sprint", ["alpha"]),
      makeNode("n3", "sprint", ["beta"]),
    ];
    const result = computeVisibleNodeIds(nodes, {
      selectedTags: ["alpha", "beta"],
    });
    expect(result.size).toBe(1);
    expect(result.has("n1")).toBe(true);
  });

  it("returns empty set when all nodes are hidden", () => {
    const nodes = [
      makeNode("n1", "sprint"),
      makeNode("n2", "sprint"),
    ];
    const result = computeVisibleNodeIds(nodes, {
      hiddenTypes: new Set(["sprint"]),
    });
    expect(result.size).toBe(0);
  });
});
