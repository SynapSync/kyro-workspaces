import { describe, it, expect } from "vitest";
import { WorkspaceError, toHttpResponse } from "../errors";

describe("errors", () => {
  describe("WorkspaceError", () => {
    it("creates error with correct code and message", () => {
      const error = new WorkspaceError("NOT_FOUND", "Project not found");
      expect(error.code).toBe("NOT_FOUND");
      expect(error.message).toBe("Project not found");
      expect(error.name).toBe("WorkspaceError");
    });
  });

  describe("toHttpResponse", () => {
    it("maps NOT_FOUND to 404", () => {
      const error = new WorkspaceError("NOT_FOUND", "Not found");
      const response = toHttpResponse(error);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: { code: "NOT_FOUND", message: "Not found" },
      });
    });

    it("maps INVALID_FORMAT to 400", () => {
      const error = new WorkspaceError("INVALID_FORMAT", "Invalid format");
      const response = toHttpResponse(error);
      expect(response.status).toBe(400);
    });

    it("maps PERMISSION_DENIED to 403", () => {
      const error = new WorkspaceError("PERMISSION_DENIED", "Permission denied");
      const response = toHttpResponse(error);
      expect(response.status).toBe(403);
    });

    it("maps WORKSPACE_NOT_CONFIGURED to 503", () => {
      const error = new WorkspaceError(
        "WORKSPACE_NOT_CONFIGURED",
        "Workspace not configured"
      );
      const response = toHttpResponse(error);
      expect(response.status).toBe(503);
    });

    it("maps ALREADY_EXISTS to 409", () => {
      const error = new WorkspaceError("ALREADY_EXISTS", "Already exists");
      const response = toHttpResponse(error);
      expect(response.status).toBe(409);
    });

    it("maps unknown codes to 500", () => {
      const error = new Error("Unknown error") as any;
      error.code = "UNKNOWN";
      const response = toHttpResponse(error);
      expect(response.status).toBe(500);
    });
  });
});
