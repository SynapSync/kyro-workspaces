// lib/services/file/fetch.ts
export interface LocalFetchConfig {
  timeoutMs?: number;
}

export async function localFetch<T>(
  path: string,
  options?: RequestInit,
  config?: LocalFetchConfig
): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  const url = `${base}${path}`;
  const timeoutMs = config?.timeoutMs;
  const timeoutEnabled = typeof timeoutMs === "number" && timeoutMs > 0;
  const controller = timeoutEnabled ? new AbortController() : null;
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  let onAbort: (() => void) | null = null;

  if (controller && options?.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      onAbort = () => controller.abort();
      options.signal.addEventListener("abort", onAbort, { once: true });
    }
  }

  if (controller) {
    timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      signal: controller?.signal ?? options?.signal,
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
  } catch (err) {
    if (timeoutEnabled && err instanceof Error && err.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
    if (onAbort && options?.signal) {
      options.signal.removeEventListener("abort", onAbort);
    }
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.error?.message) message = body.error.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const json = await res.json();
  return json.data as T;
}
