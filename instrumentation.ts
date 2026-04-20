export async function register() {
  // Only run on the server (not in Edge runtime or client)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureIndex } = await import("@/lib/index/startup");
    // Initialize asynchronously — don't block server startup
    ensureIndex().catch((err) => {
      console.warn("[kyro-index] Background initialization failed:", err);
    });
  }
}
