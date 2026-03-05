export type WorkspaceErrorCode =
  | "NOT_FOUND"
  | "INVALID_FORMAT"
  | "PERMISSION_DENIED"
  | "WORKSPACE_NOT_CONFIGURED"
  | "ALREADY_EXISTS";

export class WorkspaceError extends Error {
  readonly code: WorkspaceErrorCode;

  constructor(code: WorkspaceErrorCode, message: string) {
    super(message);
    this.name = "WorkspaceError";
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function toHttpResponse(err: WorkspaceError): {
  status: number;
  body: object;
} {
  const statusMap: Record<WorkspaceErrorCode, number> = {
    NOT_FOUND: 404,
    INVALID_FORMAT: 400,
    PERMISSION_DENIED: 403,
    WORKSPACE_NOT_CONFIGURED: 503,
    ALREADY_EXISTS: 409,
  };

  return {
    status: statusMap[err.code] ?? 500,
    body: {
      error: {
        code: err.code,
        message: err.message,
      },
    },
  };
}
