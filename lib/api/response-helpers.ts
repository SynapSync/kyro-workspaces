import { NextResponse } from "next/server";
import { WorkspaceError, toHttpResponse } from "./errors";

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function notFound(message: string): NextResponse {
  return NextResponse.json(
    { error: { code: "NOT_FOUND", message } },
    { status: 404 }
  );
}

export function validateBody<T extends object>(
  body: unknown,
  required: (keyof T)[]
): T {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new WorkspaceError("INVALID_FORMAT", "Request body must be a JSON object");
  }
  for (const field of required) {
    if ((body as Record<string, unknown>)[field as string] === undefined) {
      throw new WorkspaceError("INVALID_FORMAT", `Missing required field: ${String(field)}`);
    }
  }
  return body as T;
}

export function handleError(err: unknown): NextResponse {
  if (err instanceof WorkspaceError) {
    const { status, body } = toHttpResponse(err);
    return NextResponse.json(body, { status });
  }

  console.error("Unhandled error:", err);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
    { status: 500 }
  );
}
