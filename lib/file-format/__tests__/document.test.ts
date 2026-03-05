import { describe, it, expect } from "vitest";
import { parseDocumentFile } from "@/lib/file-format/parsers";
import { serializeDocumentFile } from "@/lib/file-format/serializers";
import type { Document } from "@/lib/types";

const SAMPLE_DOC: Document = {
  id: "doc-arquitectura",
  title: "Arquitectura Técnica",
  content: "# Arquitectura\n\nContenido técnico aquí.",
  createdAt: "2026-03-01T00:00:00Z",
  updatedAt: "2026-03-01T12:00:00Z",
};

describe("Document round-trip", () => {
  it("serialize → parse returns identical document", () => {
    const serialized = serializeDocumentFile(SAMPLE_DOC);
    const parsed = parseDocumentFile(serialized, SAMPLE_DOC.id);

    expect(parsed.id).toBe(SAMPLE_DOC.id);
    expect(parsed.title).toBe(SAMPLE_DOC.title);
    expect(parsed.content).toBe(SAMPLE_DOC.content);
    expect(parsed.createdAt).toBe(SAMPLE_DOC.createdAt);
    expect(parsed.updatedAt).toBe(SAMPLE_DOC.updatedAt);
  });

  it("parseDocumentFile handles missing frontmatter fields gracefully", () => {
    const minimal = "# Just a title\n\nSome content.";
    const doc = parseDocumentFile(minimal, "fallback-id");
    expect(doc.id).toBe("fallback-id");
    expect(doc.title).toBe("Untitled Document");
    expect(doc.content).toBe("# Just a title\n\nSome content.");
  });

  it("parseDocumentFile handles frontmatter-only file", () => {
    const frontmatterOnly = `---\nid: doc-1\ntitle: Test\ncreatedAt: 2026-01-01T00:00:00Z\nupdatedAt: 2026-01-01T00:00:00Z\n---\n`;
    const doc = parseDocumentFile(frontmatterOnly, "doc-1");
    expect(doc.id).toBe("doc-1");
    expect(doc.title).toBe("Test");
    expect(doc.content).toBe("");
  });
});
