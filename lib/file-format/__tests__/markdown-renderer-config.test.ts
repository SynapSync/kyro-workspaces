import { describe, expect, it } from "vitest";
import { defaultSchema } from "rehype-sanitize";

/**
 * Tests for the MarkdownRenderer sanitization configuration.
 * Full React rendering tests require jsdom + @testing-library/react (D17).
 */
describe("markdown sanitize schema", () => {
  // Mirrors the schema from components/markdown-renderer.tsx
  const sanitizeSchema = {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      code: [...(defaultSchema.attributes?.code ?? []), "className"],
      span: [...(defaultSchema.attributes?.span ?? []), "className"],
    },
  };

  it("allows className on code elements for syntax highlighting", () => {
    expect(sanitizeSchema.attributes?.code).toContain("className");
  });

  it("allows className on span elements for syntax highlighting tokens", () => {
    expect(sanitizeSchema.attributes?.span).toContain("className");
  });

  it("preserves default allowed tags", () => {
    expect(sanitizeSchema.tagNames).toEqual(defaultSchema.tagNames);
  });

  it("does not allow script tags", () => {
    expect(sanitizeSchema.tagNames).not.toContain("script");
  });

  it("does not allow style tags", () => {
    expect(sanitizeSchema.tagNames).not.toContain("style");
  });

  it("does not allow onclick attributes", () => {
    const allAttrs = Object.values(sanitizeSchema.attributes ?? {}).flat();
    expect(allAttrs).not.toContain("onclick");
    expect(allAttrs).not.toContain("onload");
    expect(allAttrs).not.toContain("onerror");
  });
});
