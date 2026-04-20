import { onIndexUpdate } from "@/lib/index/file-watcher";
import { isIndexAvailable } from "@/lib/index/sqlite";
import { ensureIndex } from "@/lib/index/startup";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureIndex();

  if (!isIndexAvailable()) {
    return new Response("Index not available", { status: 503 });
  }

  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode("event: connected\ndata: {}\n\n"));

      // Heartbeat every 30s to keep the connection alive
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          // Connection likely closed
        }
      }, 30_000);

      // Listen for index update events
      unsubscribe = onIndexUpdate((event) => {
        try {
          const data = JSON.stringify({
            projectId: event.projectId,
            files: event.files,
            timestamp: new Date().toISOString(),
          });
          controller.enqueue(encoder.encode(`event: index:updated\ndata: ${data}\n\n`));
        } catch {
          // Connection closed
        }
      });
    },
    cancel() {
      // Client disconnected — clean up
      if (heartbeat) clearInterval(heartbeat);
      if (unsubscribe) unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
