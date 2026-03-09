import * as fs from "fs";
import * as path from "path";
import { NextResponse } from "next/server";
import { getDb, isIndexAvailable } from "@/lib/index";
import { getWatcherCount } from "@/lib/index";

export async function GET() {
  try {
    const db = getDb();
    let dbSizeBytes = 0;
    let projectCount = 0;
    let lastIndexedAt: string | null = null;

    if (db) {
      // Get database file size
      const dbPath = db.name;
      if (dbPath && dbPath !== ":memory:") {
        try {
          const stats = fs.statSync(dbPath);
          dbSizeBytes = stats.size;
        } catch {
          // DB file may not exist yet
        }
      }

      // Count indexed projects
      try {
        const row = db.prepare("SELECT COUNT(*) as count FROM projects").get() as { count: number } | undefined;
        projectCount = row?.count ?? 0;
      } catch {
        // Table may not exist yet
      }

      // Get latest indexation timestamp
      try {
        const row = db.prepare("SELECT MAX(updated_at) as latest FROM sprints").get() as { latest: string | null } | undefined;
        lastIndexedAt = row?.latest ?? null;
      } catch {
        // Table may not exist yet
      }
    }

    return NextResponse.json({
      data: {
        indexReady: isIndexAvailable(),
        watcherCount: getWatcherCount(),
        lastIndexedAt,
        dbSizeBytes,
        projectCount,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Health check failed" },
      { status: 500 },
    );
  }
}
