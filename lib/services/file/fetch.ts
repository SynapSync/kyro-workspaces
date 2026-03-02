// lib/services/file/fetch.ts
export async function localFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  const url = `${base}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
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
