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
