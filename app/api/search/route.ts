import { NextRequest, NextResponse } from "next/server";
import { isIndexAvailable } from "@/lib/index/sqlite";
import { ensureIndex } from "@/lib/index/startup";
import { searchIndex } from "@/lib/index/queries";
import type { SearchEntryType } from "@/lib/search";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  // Ensure index is initialized (lazy startup)
  await ensureIndex();

  if (!isIndexAvailable()) {
    return NextResponse.json(
      { error: "Search index not available" },
      { status: 503 }
    );
  }

  const type = req.nextUrl.searchParams.get("type") as SearchEntryType | null;
  const projectId = req.nextUrl.searchParams.get("project");
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  const results = searchIndex(q.trim(), {
    type: type ?? undefined,
    projectId: projectId ?? undefined,
    limit,
  });

  return NextResponse.json({ results });
}
