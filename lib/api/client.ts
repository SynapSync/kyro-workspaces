// API client — configure baseURL and default headers here.
// Auth headers (e.g. Bearer token) will be added when the auth layer is ready.
//
// Set NEXT_PUBLIC_API_URL in .env.local (e.g. http://localhost:3001/api).

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status, `${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
