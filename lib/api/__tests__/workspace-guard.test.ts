import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getWorkspacePath, resolveAndGuard } from "../workspace-guard";
import { WorkspaceError } from "../errors";

describe("workspace-guard", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getWorkspacePath", () => {
    it("throws WORKSPACE_NOT_CONFIGURED when env var is not set", () => {
      delete process.env.KYRO_WORKSPACE_PATH;
      expect(() => getWorkspacePath()).toThrow(WorkspaceError);
      try {
        getWorkspacePath();
      } catch (e) {
        expect((e as any).code).toBe("WORKSPACE_NOT_CONFIGURED");
      }
    });

    it("returns workspace path when env var is set", () => {
      process.env.KYRO_WORKSPACE_PATH = "/test/workspace";
      expect(getWorkspacePath()).toBe("/test/workspace");
    });
  });

  describe("resolveAndGuard", () => {
    it("throws PERMISSION_DENIED for path traversal with ../", () => {
      expect(() => resolveAndGuard("/workspace", "../etc/passwd")).toThrow(
        WorkspaceError
      );
      try {
        resolveAndGuard("/workspace", "../etc/passwd");
      } catch (e) {
        expect((e as any).code).toBe("PERMISSION_DENIED");
      }
    });

    it("throws PERMISSION_DENIED for absolute path outside workspace", () => {
      expect(() =>
        resolveAndGuard("/workspace", "/etc/passwd")
      ).toThrow(WorkspaceError);
      try {
        resolveAndGuard("/workspace", "/etc/passwd");
      } catch (e) {
        expect((e as any).code).toBe("PERMISSION_DENIED");
      }
    });

    it("returns resolved path for valid segments", () => {
      const result = resolveAndGuard("/workspace", "projects", "myProject");
      expect(result).toBe("/workspace/projects/myProject");
    });

    it("resolves . to workspace path", () => {
      const result = resolveAndGuard("/workspace", ".");
      expect(result).toBe("/workspace");
    });
  });
});
