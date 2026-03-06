// Configurable artificial delay to simulate network latency in development.
// Set NEXT_PUBLIC_MOCK_DELAY_MS in .env.local to enable (default: 0).
export const MOCK_DELAY_MS =
  typeof process !== "undefined"
    ? Number(process.env.NEXT_PUBLIC_MOCK_DELAY_MS ?? 0)
    : 0;

export const mockDelay = (ms: number = MOCK_DELAY_MS) =>
  ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve();
