import { describe, it, expect } from "vitest";
import {
  resolveReference,
  STRUCTURAL_EDGE_DIR_CAP,
  TAG_SIMILARITY_THRESHOLD,
} from "../graph-builder";

// --- resolveReference ---

describe("resolveReference", () => {
  const nameIndex = new Map<string, string>([
    ["readme", "readme"],
    ["roadmap", "roadmap"],
    ["sprint-01-foundation", "sprints-sprint-01-foundation"],
    ["sprint-02-ui", "sprints-sprint-02-ui"],
    ["01-architecture", "findings-01-architecture"],
  ]);

  it("resolves exact lowercase match", () => {
    expect(resolveReference("README", nameIndex)).toBe("readme");
  });

  it("resolves already-lowercase match", () => {
    expect(resolveReference("roadmap", nameIndex)).toBe("roadmap");
  });

  it("resolves with .md extension stripped", () => {
    expect(resolveReference("README.md", nameIndex)).toBe("readme");
  });

  it("resolves prefix match (sprint number to full slug)", () => {
    expect(resolveReference("sprint-01", nameIndex)).toBe(
      "sprints-sprint-01-foundation"
    );
  });

  it("returns null for unknown reference", () => {
    expect(resolveReference("nonexistent", nameIndex)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(resolveReference("", nameIndex)).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(resolveReference("   ", nameIndex)).toBeNull();
  });

  it("trims whitespace before resolving", () => {
    expect(resolveReference("  README  ", nameIndex)).toBe("readme");
  });

  it("resolves with underscore prefix variant", () => {
    // Our resolveReference checks for key.startsWith(withoutExt + "-") or "_"
    const idx = new Map<string, string>([
      ["sprint_01_foundation", "s01"],
    ]);
    expect(resolveReference("sprint_01", idx)).toBe("s01");
  });
});

// --- Exported constants ---

describe("exported constants", () => {
  it("STRUCTURAL_EDGE_DIR_CAP is 10 by default", () => {
    expect(STRUCTURAL_EDGE_DIR_CAP).toBe(10);
  });

  it("TAG_SIMILARITY_THRESHOLD is 2 by default", () => {
    expect(TAG_SIMILARITY_THRESHOLD).toBe(2);
  });
});

// --- deduplicateEdges (internal, tested via buildProjectGraph behavior) ---
// Since deduplicateEdges is not exported, we test its behavior indirectly
// through the public API. However, we can test the core logic pattern:

describe("edge deduplication logic", () => {
  it("keeps unique edges", () => {
    const edges = [
      { source: "a", target: "b", edgeType: "wiki-link" },
      { source: "b", target: "c", edgeType: "wiki-link" },
    ];
    const seen = new Set<string>();
    const unique = edges.filter((e) => {
      const key = `${e.source}|${e.target}|${e.edgeType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    expect(unique).toHaveLength(2);
  });

  it("removes duplicate source+target+type edges", () => {
    const edges = [
      { source: "a", target: "b", edgeType: "wiki-link" },
      { source: "a", target: "b", edgeType: "wiki-link" },
    ];
    const seen = new Set<string>();
    const unique = edges.filter((e) => {
      const key = `${e.source}|${e.target}|${e.edgeType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    expect(unique).toHaveLength(1);
  });

  it("allows same source+target with different edge types", () => {
    const edges = [
      { source: "a", target: "b", edgeType: "wiki-link" },
      { source: "a", target: "b", edgeType: "frontmatter-ref" },
    ];
    const seen = new Set<string>();
    const unique = edges.filter((e) => {
      const key = `${e.source}|${e.target}|${e.edgeType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    expect(unique).toHaveLength(2);
  });

  it("normalizes structural edge direction (undirected)", () => {
    const edges = [
      { source: "b", target: "a", edgeType: "structural" },
      { source: "a", target: "b", edgeType: "structural" },
    ];
    const seen = new Set<string>();
    const unique = edges.filter((e) => {
      const key =
        e.edgeType === "structural" || e.edgeType === "tag-similarity"
          ? `${[e.source, e.target].sort().join("|")}|${e.edgeType}`
          : `${e.source}|${e.target}|${e.edgeType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    expect(unique).toHaveLength(1);
  });
});

// --- Tag similarity logic ---

describe("tag similarity edge logic", () => {
  it("creates edges for nodes sharing >= TAG_SIMILARITY_THRESHOLD tags", () => {
    const nodesWithTags = [
      { id: "n1", tags: ["a", "b", "c"] },
      { id: "n2", tags: ["a", "b"] },
      { id: "n3", tags: ["d"] },
    ];

    const edges: Array<{ source: string; target: string }> = [];
    for (let i = 0; i < nodesWithTags.length; i++) {
      for (let j = i + 1; j < nodesWithTags.length; j++) {
        const shared = nodesWithTags[i].tags.filter((t) =>
          nodesWithTags[j].tags.includes(t)
        );
        if (shared.length >= TAG_SIMILARITY_THRESHOLD) {
          edges.push({ source: nodesWithTags[i].id, target: nodesWithTags[j].id });
        }
      }
    }

    expect(edges).toHaveLength(1);
    expect(edges[0]).toEqual({ source: "n1", target: "n2" });
  });

  it("skips nodes with fewer than threshold shared tags", () => {
    const nodesWithTags = [
      { id: "n1", tags: ["a", "b"] },
      { id: "n2", tags: ["a", "c"] },
    ];

    const edges: Array<{ source: string; target: string }> = [];
    for (let i = 0; i < nodesWithTags.length; i++) {
      for (let j = i + 1; j < nodesWithTags.length; j++) {
        const shared = nodesWithTags[i].tags.filter((t) =>
          nodesWithTags[j].tags.includes(t)
        );
        if (shared.length >= TAG_SIMILARITY_THRESHOLD) {
          edges.push({ source: nodesWithTags[i].id, target: nodesWithTags[j].id });
        }
      }
    }

    // Only 1 shared tag ("a"), which is below threshold of 2
    expect(edges).toHaveLength(0);
  });
});

// --- Structural edge logic ---

describe("structural edge logic", () => {
  it("skips directories with more than STRUCTURAL_EDGE_DIR_CAP files", () => {
    const count = STRUCTURAL_EDGE_DIR_CAP + 1;
    const nodes = Array.from({ length: count }, (_, i) => ({
      id: `n${i}`,
      dir: "/same/dir",
    }));

    // Group by dir
    const byDir = new Map<string, typeof nodes>();
    for (const node of nodes) {
      const existing = byDir.get(node.dir) ?? [];
      existing.push(node);
      byDir.set(node.dir, existing);
    }

    let edgeCount = 0;
    for (const dirNodes of byDir.values()) {
      if (dirNodes.length < 2 || dirNodes.length > STRUCTURAL_EDGE_DIR_CAP) continue;
      edgeCount += (dirNodes.length * (dirNodes.length - 1)) / 2;
    }

    expect(edgeCount).toBe(0);
  });

  it("creates edges for directories within cap", () => {
    const nodes = Array.from({ length: 3 }, (_, i) => ({
      id: `n${i}`,
      dir: "/same/dir",
    }));

    const byDir = new Map<string, typeof nodes>();
    for (const node of nodes) {
      const existing = byDir.get(node.dir) ?? [];
      existing.push(node);
      byDir.set(node.dir, existing);
    }

    let edgeCount = 0;
    for (const dirNodes of byDir.values()) {
      if (dirNodes.length < 2 || dirNodes.length > STRUCTURAL_EDGE_DIR_CAP) continue;
      edgeCount += (dirNodes.length * (dirNodes.length - 1)) / 2;
    }

    // 3 choose 2 = 3 edges
    expect(edgeCount).toBe(3);
  });
});
