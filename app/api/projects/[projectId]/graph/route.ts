import { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api";
import { queryGraphData } from "@/lib/index/queries";
import type { GraphData } from "@/lib/types";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;

    const { nodes, edges } = queryGraphData(projectId);

    // Build clusters by file type
    const typeClusterMap = new Map<string, string[]>();
    for (const node of nodes) {
      const existing = typeClusterMap.get(node.fileType) ?? [];
      existing.push(node.id);
      typeClusterMap.set(node.fileType, existing);
    }

    const typeClusters = Array.from(typeClusterMap.entries()).map(
      ([type, nodeIds]) => ({
        id: `cluster-type-${type}`,
        label: type.charAt(0).toUpperCase() + type.slice(1) + "s",
        nodeIds,
        clusterType: "type" as const,
      })
    );

    // Build clusters by directory
    const dirClusterMap = new Map<string, string[]>();
    for (const node of nodes) {
      const parts = node.filePath.replace(/\\/g, "/").split("/");
      // Use the immediate parent directory name as the cluster key
      const parentDir = parts.length >= 2 ? parts[parts.length - 2] : "root";
      const existing = dirClusterMap.get(parentDir) ?? [];
      existing.push(node.id);
      dirClusterMap.set(parentDir, existing);
    }

    const dirClusters = Array.from(dirClusterMap.entries())
      .filter(([, nodeIds]) => nodeIds.length >= 2)
      .map(([dir, nodeIds]) => ({
        id: `cluster-dir-${dir}`,
        label: dir.charAt(0).toUpperCase() + dir.slice(1),
        nodeIds,
        clusterType: "directory" as const,
      }));

    // Build clusters by shared tags (groups of 2+ nodes sharing the same tag)
    const tagClusterMap = new Map<string, string[]>();
    for (const node of nodes) {
      for (const tag of node.tags) {
        const existing = tagClusterMap.get(tag) ?? [];
        existing.push(node.id);
        tagClusterMap.set(tag, existing);
      }
    }

    const tagClusters = Array.from(tagClusterMap.entries())
      .filter(([, nodeIds]) => nodeIds.length >= 2)
      .map(([tag, nodeIds]) => ({
        id: `cluster-tag-${tag}`,
        label: `#${tag}`,
        nodeIds,
        clusterType: "tag" as const,
      }));

    const clusters = [...typeClusters, ...dirClusters, ...tagClusters];

    const graphData: GraphData = {
      nodes: nodes.map((n) => ({
        id: n.id,
        label: n.label,
        filePath: n.filePath,
        fileType: n.fileType,
        tags: n.tags,
        metadata: n.metadata,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        edgeType: e.edgeType,
        label: e.label,
        weight: e.weight,
      })),
      clusters,
      metadata: {
        projectId,
        projectName: projectId,
        buildTimestamp: new Date().toISOString(),
        nodeCount: nodes.length,
        edgeCount: edges.length,
      },
    };

    return ok({ graph: graphData }, 200);
  } catch (err) {
    return handleError(err);
  }
}
