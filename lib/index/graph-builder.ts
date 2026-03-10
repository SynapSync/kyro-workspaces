/**
 * Graph Builder — Orchestrates the construction of the project knowledge graph.
 *
 * Scans all markdown files in a project, extracts cross-file references,
 * resolves targets to node IDs, and writes nodes/edges to SQLite.
 *
 * Supports:
 * - Full project graph build (during initIndex)
 * - Incremental file graph rebuild (during reindexFile)
 */

import * as fs from "fs/promises";
import * as path from "path";
import { getDb } from "./sqlite";
import { extractFileReferences } from "@/lib/file-format/graph-parser";
import { fileExists } from "@/lib/api/workspace-guard";
import type { GraphNodeType, GraphEdgeType } from "@/lib/types";

// --- Configurable Constants ---

/** Maximum number of files in a directory before structural edges are skipped. */
export const STRUCTURAL_EDGE_DIR_CAP = 10;

/** Minimum number of shared tags required to create a tag-similarity edge. */
export const TAG_SIMILARITY_THRESHOLD = 2;

// --- Types ---

interface GraphNodeInput {
  id: string;
  label: string;
  filePath: string;
  fileType: GraphNodeType;
  tags: string[];
  metadata?: Record<string, string>;
}

interface GraphEdgeInput {
  id: string;
  source: string;
  target: string;
  edgeType: GraphEdgeType;
  label?: string;
  weight: number;
}

// --- Public API ---

/**
 * Build the complete graph for a project. Scans all markdown files,
 * creates nodes, extracts references, resolves targets, creates edges.
 *
 * Call after all files are indexed in initIndex().
 */
export async function buildProjectGraph(
  projectId: string,
  projectPath: string
): Promise<{ nodes: number; edges: number }> {
  const db = getDb();
  if (!db) return { nodes: 0, edges: 0 };

  // Clear existing graph data for this project
  db.prepare("DELETE FROM graph_edges WHERE project_id = ?").run(projectId);
  db.prepare("DELETE FROM graph_nodes WHERE project_id = ?").run(projectId);

  // Step 1: Discover all markdown files and create nodes
  const nodes: GraphNodeInput[] = [];
  const fileContents = new Map<string, string>();

  // README.md
  const readmePath = path.join(projectPath, "README.md");
  if (await fileExists(readmePath)) {
    const content = await fs.readFile(readmePath, "utf-8");
    const nodeId = makeNodeId(projectPath, readmePath);
    nodes.push({
      id: nodeId,
      label: "README",
      filePath: readmePath,
      fileType: "readme",
      tags: [],
      metadata: {},
    });
    fileContents.set(readmePath, content);
  }

  // ROADMAP.md
  const roadmapPath = path.join(projectPath, "ROADMAP.md");
  if (await fileExists(roadmapPath)) {
    const content = await fs.readFile(roadmapPath, "utf-8");
    const nodeId = makeNodeId(projectPath, roadmapPath);
    nodes.push({
      id: nodeId,
      label: "ROADMAP",
      filePath: roadmapPath,
      fileType: "roadmap",
      tags: [],
      metadata: {},
    });
    fileContents.set(roadmapPath, content);
  }

  // Scan subdirectories
  const subdirs: { dir: string; type: GraphNodeType }[] = [
    { dir: "sprints", type: "sprint" },
    { dir: "findings", type: "finding" },
    { dir: "documents", type: "document" },
  ];

  for (const { dir, type } of subdirs) {
    const dirPath = path.join(projectPath, dir);
    if (!(await fileExists(dirPath))) continue;

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const mdFiles = entries
      .filter((e) => e.isFile() && e.name.endsWith(".md"))
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const file of mdFiles) {
      const filePath = path.join(dirPath, file.name);
      const content = await fs.readFile(filePath, "utf-8");
      const nodeId = makeNodeId(projectPath, filePath);
      const label = file.name.replace(/\.md$/, "");

      // Extract tags from frontmatter for the node
      const refs = extractFileReferences(content, filePath);

      nodes.push({
        id: nodeId,
        label,
        filePath,
        fileType: type,
        tags: refs.tags,
        metadata: {},
      });
      fileContents.set(filePath, content);
    }
  }

  // Step 2: Insert all nodes
  const insertNode = db.prepare(`
    INSERT OR REPLACE INTO graph_nodes (id, project_id, label, file_path, file_type, tags, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const node of nodes) {
    insertNode.run(
      node.id,
      projectId,
      node.label,
      node.filePath,
      node.fileType,
      JSON.stringify(node.tags),
      node.metadata ? JSON.stringify(node.metadata) : null
    );
  }

  // Step 3: Build name-to-node index for reference resolution
  const nameIndex = buildNameIndex(nodes);

  // Step 4: Extract references and create edges
  const edges: GraphEdgeInput[] = [];
  let edgeCounter = 0;

  for (const node of nodes) {
    const content = fileContents.get(node.filePath);
    if (!content) continue;

    const refs = extractFileReferences(content, node.filePath);

    // Wiki-link edges
    for (const target of refs.wikiLinks) {
      const targetNodeId = resolveReference(target, nameIndex);
      if (targetNodeId && targetNodeId !== node.id) {
        edges.push({
          id: `e-${projectId}-${edgeCounter++}`,
          source: node.id,
          target: targetNodeId,
          edgeType: "wiki-link",
          label: target,
          weight: 1.0,
        });
      }
    }

    // Markdown link edges
    for (const link of refs.markdownLinks) {
      const resolvedPath = resolveRelativePath(node.filePath, link.href);
      const targetNodeId = resolvePathReference(resolvedPath, nodes);
      if (targetNodeId && targetNodeId !== node.id) {
        edges.push({
          id: `e-${projectId}-${edgeCounter++}`,
          source: node.id,
          target: targetNodeId,
          edgeType: "markdown-link",
          label: link.text,
          weight: 1.0,
        });
      }
    }

    // Frontmatter reference edges
    for (const ref of refs.frontmatterRefs) {
      const targetNodeId = resolveReference(ref, nameIndex);
      if (targetNodeId && targetNodeId !== node.id) {
        // Avoid duplicate edges (frontmatter refs overlap with wiki-links)
        const existingEdge = edges.find(
          (e) => e.source === node.id && e.target === targetNodeId && e.edgeType === "wiki-link"
        );
        if (!existingEdge) {
          edges.push({
            id: `e-${projectId}-${edgeCounter++}`,
            source: node.id,
            target: targetNodeId,
            edgeType: "frontmatter-ref",
            label: ref,
            weight: 0.8,
          });
        }
      }
    }
  }

  // Step 5: Create tag-similarity edges (files sharing 2+ tags)
  const tagSimilarityEdges = buildTagSimilarityEdges(nodes, projectId, edgeCounter);
  edgeCounter += tagSimilarityEdges.length;
  edges.push(...tagSimilarityEdges);

  // Step 6: Create structural edges (files in same directory)
  const structuralEdges = buildStructuralEdges(nodes, projectId, edgeCounter);
  edges.push(...structuralEdges);

  // Step 7: Deduplicate edges (same source+target+type)
  const uniqueEdges = deduplicateEdges(edges);

  // Step 8: Insert all edges
  const insertEdge = db.prepare(`
    INSERT OR REPLACE INTO graph_edges (id, project_id, source_id, target_id, edge_type, label, weight)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const edge of uniqueEdges) {
    insertEdge.run(
      edge.id,
      projectId,
      edge.source,
      edge.target,
      edge.edgeType,
      edge.label ?? null,
      edge.weight
    );
  }

  return { nodes: nodes.length, edges: uniqueEdges.length };
}

/**
 * Rebuild the graph for a single file. Used during incremental reindexing.
 * Removes old edges where this file is the source, re-parses, and creates new edges.
 */
export async function rebuildFileGraph(
  filePath: string,
  projectId: string
): Promise<void> {
  const db = getDb();
  if (!db) return;

  const nodeId = db.prepare(
    "SELECT id FROM graph_nodes WHERE file_path = ? AND project_id = ?"
  ).get(filePath, projectId) as { id: string } | undefined;

  if (!(await fileExists(filePath))) {
    // File deleted: remove node and all associated edges
    if (nodeId) {
      db.prepare(
        "DELETE FROM graph_edges WHERE (source_id = ? OR target_id = ?) AND project_id = ?"
      ).run(nodeId.id, nodeId.id, projectId);
      db.prepare(
        "DELETE FROM graph_nodes WHERE id = ? AND project_id = ?"
      ).run(nodeId.id, projectId);
    }
    return;
  }

  const content = await fs.readFile(filePath, "utf-8");
  const refs = extractFileReferences(content, filePath);

  // Determine file type and label
  const fileType = detectGraphFileType(filePath);
  const label = path.basename(filePath, ".md");

  // Upsert the node
  const currentNodeId = nodeId?.id ?? makeNodeIdFromPath(filePath);
  db.prepare(`
    INSERT OR REPLACE INTO graph_nodes (id, project_id, label, file_path, file_type, tags, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    currentNodeId,
    projectId,
    label,
    filePath,
    fileType,
    JSON.stringify(refs.tags),
    null
  );

  // Remove old edges where this node is source
  db.prepare(
    "DELETE FROM graph_edges WHERE source_id = ? AND project_id = ?"
  ).run(currentNodeId, projectId);

  // Get all nodes for resolution
  const allNodes = db.prepare(
    "SELECT id, label, file_path, file_type FROM graph_nodes WHERE project_id = ?"
  ).all(projectId) as { id: string; label: string; file_path: string; file_type: string }[];

  const nameIndex = new Map<string, string>();
  for (const n of allNodes) {
    nameIndex.set(n.label.toLowerCase(), n.id);
    // Also index without common prefixes
    const baseName = path.basename(n.file_path, ".md").toLowerCase();
    nameIndex.set(baseName, n.id);
  }

  // Create new edges
  const insertEdge = db.prepare(`
    INSERT OR REPLACE INTO graph_edges (id, project_id, source_id, target_id, edge_type, label, weight)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  let edgeCounter = Date.now(); // Use timestamp for unique IDs in incremental mode

  // Wiki-link edges
  for (const target of refs.wikiLinks) {
    const targetNodeId = resolveReference(target, nameIndex);
    if (targetNodeId && targetNodeId !== currentNodeId) {
      insertEdge.run(
        `e-${projectId}-inc-${edgeCounter++}`,
        projectId,
        currentNodeId,
        targetNodeId,
        "wiki-link",
        target,
        1.0
      );
    }
  }

  // Markdown link edges
  for (const link of refs.markdownLinks) {
    const resolvedPath = resolveRelativePath(filePath, link.href);
    const targetNode = allNodes.find((n) => n.file_path === resolvedPath);
    if (targetNode && targetNode.id !== currentNodeId) {
      insertEdge.run(
        `e-${projectId}-inc-${edgeCounter++}`,
        projectId,
        currentNodeId,
        targetNode.id,
        "markdown-link",
        link.text,
        1.0
      );
    }
  }

  // Frontmatter reference edges
  for (const ref of refs.frontmatterRefs) {
    const targetNodeId = resolveReference(ref, nameIndex);
    if (targetNodeId && targetNodeId !== currentNodeId) {
      insertEdge.run(
        `e-${projectId}-inc-${edgeCounter++}`,
        projectId,
        currentNodeId,
        targetNodeId,
        "frontmatter-ref",
        ref,
        0.8
      );
    }
  }
}

// --- Internal Helpers ---

/**
 * Create a stable node ID from a file path relative to the project root.
 */
function makeNodeId(projectPath: string, filePath: string): string {
  const relative = path.relative(projectPath, filePath);
  return relative
    .replace(/\.md$/, "")
    .replace(/[/\\]/g, "-")
    .toLowerCase();
}

/**
 * Create a node ID from an absolute path (fallback for incremental mode).
 */
function makeNodeIdFromPath(filePath: string): string {
  return path.basename(filePath, ".md").toLowerCase();
}

/**
 * Build a name-to-node-ID index for reference resolution.
 * Maps multiple variations of each file name to its node ID.
 */
function buildNameIndex(nodes: GraphNodeInput[]): Map<string, string> {
  const index = new Map<string, string>();

  for (const node of nodes) {
    // Exact label (lowercase)
    index.set(node.label.toLowerCase(), node.id);

    // Basename without extension
    const baseName = path.basename(node.filePath, ".md").toLowerCase();
    index.set(baseName, node.id);

    // ID itself
    index.set(node.id, node.id);
  }

  return index;
}

/**
 * Resolve a reference name to a node ID using the name index.
 * Tries: exact match, lowercase match, prefix match.
 */
export function resolveReference(
  ref: string,
  nameIndex: Map<string, string>
): string | null {
  const lower = ref.toLowerCase().trim();
  if (!lower) return null;

  // Exact match
  if (nameIndex.has(lower)) return nameIndex.get(lower)!;

  // Try without .md extension
  const withoutExt = lower.replace(/\.md$/, "");
  if (nameIndex.has(withoutExt)) return nameIndex.get(withoutExt)!;

  // Try prefix match (e.g., "SPRINT-01" matches "sprint-01-architecture")
  for (const [key, id] of nameIndex) {
    if (key.startsWith(withoutExt + "-") || key.startsWith(withoutExt + "_")) {
      return id;
    }
  }

  return null;
}

/**
 * Resolve a relative path from a source file to an absolute path.
 */
function resolveRelativePath(sourceFilePath: string, href: string): string {
  const sourceDir = path.dirname(sourceFilePath);
  return path.resolve(sourceDir, href);
}

/**
 * Resolve a file path to a node ID by matching against known node file paths.
 */
function resolvePathReference(
  resolvedPath: string,
  nodes: GraphNodeInput[]
): string | null {
  const node = nodes.find((n) => n.filePath === resolvedPath);
  return node?.id ?? null;
}

/**
 * Detect the graph file type from a file path.
 */
function detectGraphFileType(filePath: string): GraphNodeType {
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.includes("/sprints/")) return "sprint";
  if (normalized.includes("/findings/")) return "finding";
  if (normalized.includes("/documents/")) return "document";
  if (path.basename(normalized) === "ROADMAP.md") return "roadmap";
  if (path.basename(normalized) === "README.md") return "readme";
  return "document"; // Default fallback
}

/**
 * Build edges between files that share 2 or more tags.
 */
function buildTagSimilarityEdges(
  nodes: GraphNodeInput[],
  projectId: string,
  startCounter: number
): GraphEdgeInput[] {
  const edges: GraphEdgeInput[] = [];
  let counter = startCounter;

  // Only consider nodes with tags
  const taggedNodes = nodes.filter((n) => n.tags.length > 0);

  for (let i = 0; i < taggedNodes.length; i++) {
    for (let j = i + 1; j < taggedNodes.length; j++) {
      const shared = taggedNodes[i].tags.filter((t) =>
        taggedNodes[j].tags.includes(t)
      );
      if (shared.length >= TAG_SIMILARITY_THRESHOLD) {
        edges.push({
          id: `e-${projectId}-tag-${counter++}`,
          source: taggedNodes[i].id,
          target: taggedNodes[j].id,
          edgeType: "tag-similarity",
          label: shared.join(", "),
          weight: shared.length * 0.3,
        });
      }
    }
  }

  return edges;
}

/**
 * Build edges between files in the same directory.
 */
function buildStructuralEdges(
  nodes: GraphNodeInput[],
  projectId: string,
  startCounter: number
): GraphEdgeInput[] {
  const edges: GraphEdgeInput[] = [];
  let counter = startCounter;

  // Group nodes by directory
  const byDir = new Map<string, GraphNodeInput[]>();
  for (const node of nodes) {
    const dir = path.dirname(node.filePath);
    const existing = byDir.get(dir) ?? [];
    existing.push(node);
    byDir.set(dir, existing);
  }

  // Create edges between files in same directory (only for directories with 2+ files, capped to avoid clutter)
  for (const dirNodes of byDir.values()) {
    if (dirNodes.length < 2 || dirNodes.length > STRUCTURAL_EDGE_DIR_CAP) continue;
    for (let i = 0; i < dirNodes.length; i++) {
      for (let j = i + 1; j < dirNodes.length; j++) {
        edges.push({
          id: `e-${projectId}-struct-${counter++}`,
          source: dirNodes[i].id,
          target: dirNodes[j].id,
          edgeType: "structural",
          weight: 0.2,
        });
      }
    }
  }

  return edges;
}

/**
 * Deduplicate edges with the same source, target, and type.
 * Keeps the first occurrence.
 */
function deduplicateEdges(edges: GraphEdgeInput[]): GraphEdgeInput[] {
  const seen = new Set<string>();
  const unique: GraphEdgeInput[] = [];

  for (const edge of edges) {
    // Normalize direction for undirected edge types
    const key = edge.edgeType === "structural" || edge.edgeType === "tag-similarity"
      ? `${[edge.source, edge.target].sort().join("|")}|${edge.edgeType}`
      : `${edge.source}|${edge.target}|${edge.edgeType}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(edge);
    }
  }

  return unique;
}
