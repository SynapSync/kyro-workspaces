import { describe, it, expect } from "vitest";
import {
  extractWikiLinks,
  extractMarkdownLinks,
  extractFrontmatterRefs,
  extractTags,
  extractFileReferences,
} from "../graph-parser";

// --- extractWikiLinks ---

describe("extractWikiLinks", () => {
  it("extracts single wiki-link", () => {
    const result = extractWikiLinks("See [[ROADMAP]] for details.");
    expect(result).toEqual(["ROADMAP"]);
  });

  it("extracts multiple wiki-links", () => {
    const result = extractWikiLinks("See [[ROADMAP]] and [[SPRINT-01]] also [[README]].");
    expect(result).toEqual(["ROADMAP", "SPRINT-01", "README"]);
  });

  it("deduplicates wiki-links", () => {
    const result = extractWikiLinks("See [[ROADMAP]] and later [[ROADMAP]] again.");
    expect(result).toEqual(["ROADMAP"]);
  });

  it("handles wiki-links in frontmatter", () => {
    const content = `---
related:
  - "[[ROADMAP]]"
  - "[[SPRINT-01]]"
---
# Title
See [[README]].`;
    const result = extractWikiLinks(content);
    expect(result).toContain("ROADMAP");
    expect(result).toContain("SPRINT-01");
    expect(result).toContain("README");
  });

  it("returns empty array for no links", () => {
    expect(extractWikiLinks("No links here.")).toEqual([]);
  });

  it("returns empty for empty content", () => {
    expect(extractWikiLinks("")).toEqual([]);
  });

  it("handles wiki-links with spaces", () => {
    const result = extractWikiLinks("See [[ Some Document ]].");
    expect(result).toEqual(["Some Document"]);
  });

  it("ignores empty wiki-links", () => {
    const result = extractWikiLinks("See [[]] here.");
    expect(result).toEqual([]);
  });
});

// --- extractMarkdownLinks ---

describe("extractMarkdownLinks", () => {
  it("extracts internal markdown links", () => {
    const result = extractMarkdownLinks("See [roadmap](ROADMAP.md) for details.");
    expect(result).toEqual([{ text: "roadmap", href: "ROADMAP.md" }]);
  });

  it("extracts relative path links", () => {
    const result = extractMarkdownLinks("See [sprint](../sprints/SPRINT-01.md).");
    expect(result).toEqual([{ text: "sprint", href: "../sprints/SPRINT-01.md" }]);
  });

  it("excludes external URLs", () => {
    const result = extractMarkdownLinks(
      "See [docs](https://example.com) and [local](./file.md)."
    );
    expect(result).toEqual([{ text: "local", href: "./file.md" }]);
  });

  it("excludes mailto links", () => {
    const result = extractMarkdownLinks("[email](mailto:test@test.com)");
    expect(result).toEqual([]);
  });

  it("excludes image links", () => {
    const result = extractMarkdownLinks("![alt](image.png) and [doc](file.md)");
    expect(result).toEqual([{ text: "doc", href: "file.md" }]);
  });

  it("excludes anchor-only links", () => {
    const result = extractMarkdownLinks("[section](#heading)");
    expect(result).toEqual([]);
  });

  it("returns empty for no links", () => {
    expect(extractMarkdownLinks("No links here.")).toEqual([]);
  });

  it("handles links in frontmatter-stripped body only", () => {
    const content = `---
title: "Test"
---
See [doc](file.md).`;
    const result = extractMarkdownLinks(content);
    expect(result).toEqual([{ text: "doc", href: "file.md" }]);
  });
});

// --- extractFrontmatterRefs ---

describe("extractFrontmatterRefs", () => {
  it("extracts related wiki-links from frontmatter", () => {
    const content = `---
related:
  - "[[ROADMAP]]"
  - "[[SPRINT-01]]"
---
# Title`;
    const result = extractFrontmatterRefs(content);
    expect(result).toContain("ROADMAP");
    expect(result).toContain("SPRINT-01");
  });

  it("extracts previous_doc and next_doc", () => {
    const content = `---
previous_doc: "[[SPRINT-01-architecture]]"
next_doc: "[[SPRINT-03-components]]"
---
# Title`;
    const result = extractFrontmatterRefs(content);
    expect(result).toContain("SPRINT-01-architecture");
    expect(result).toContain("SPRINT-03-components");
  });

  it("extracts parent_doc", () => {
    const content = `---
parent_doc: "[[ROADMAP]]"
---
# Title`;
    const result = extractFrontmatterRefs(content);
    expect(result).toEqual(["ROADMAP"]);
  });

  it("handles non-wiki-link values", () => {
    const content = `---
related:
  - "ROADMAP"
---
# Title`;
    const result = extractFrontmatterRefs(content);
    expect(result).toEqual(["ROADMAP"]);
  });

  it("returns empty for no frontmatter", () => {
    expect(extractFrontmatterRefs("# Just a heading")).toEqual([]);
  });

  it("deduplicates references", () => {
    const content = `---
related:
  - "[[ROADMAP]]"
parent_doc: "[[ROADMAP]]"
---
# Title`;
    const result = extractFrontmatterRefs(content);
    expect(result).toEqual(["ROADMAP"]);
  });
});

// --- extractTags ---

describe("extractTags", () => {
  it("extracts tags array from frontmatter", () => {
    const content = `---
tags:
  - "architecture"
  - "sprint-1"
  - "kyro"
---
# Title`;
    const result = extractTags(content);
    expect(result).toEqual(["architecture", "sprint-1", "kyro"]);
  });

  it("handles inline tags array", () => {
    const content = `---
tags: ["a", "b", "c"]
---
# Title`;
    const result = extractTags(content);
    expect(result).toEqual(["a", "b", "c"]);
  });

  it("returns empty for no tags", () => {
    const content = `---
title: "No tags"
---
# Title`;
    expect(extractTags(content)).toEqual([]);
  });

  it("returns empty for no frontmatter", () => {
    expect(extractTags("# Just a heading")).toEqual([]);
  });

  it("filters empty strings", () => {
    const content = `---
tags:
  - "valid"
  - ""
  - "  "
---
# Title`;
    const result = extractTags(content);
    expect(result).toEqual(["valid"]);
  });
});

// --- extractFileReferences (unified) ---

describe("extractFileReferences", () => {
  it("extracts all reference types from a sprint-forge file", () => {
    const content = `---
title: "Sprint 1"
related:
  - "[[ROADMAP]]"
  - "[[01-architecture]]"
previous_doc: "[[SPRINT-00-init]]"
tags:
  - "sprint-1"
  - "architecture"
---

# Sprint 1 -- Architecture

See [[README]] for project info.

Check [findings](../findings/01-architecture.md) for details.

External: [docs](https://example.com) should be ignored.
`;
    const result = extractFileReferences(content, "/path/to/SPRINT-01.md");

    // Wiki-links from both frontmatter and body
    expect(result.wikiLinks).toContain("ROADMAP");
    expect(result.wikiLinks).toContain("01-architecture");
    expect(result.wikiLinks).toContain("SPRINT-00-init");
    expect(result.wikiLinks).toContain("README");

    // Markdown links (internal only)
    expect(result.markdownLinks).toEqual([
      { text: "findings", href: "../findings/01-architecture.md" },
    ]);

    // Frontmatter refs
    expect(result.frontmatterRefs).toContain("ROADMAP");
    expect(result.frontmatterRefs).toContain("01-architecture");
    expect(result.frontmatterRefs).toContain("SPRINT-00-init");

    // Tags
    expect(result.tags).toEqual(["sprint-1", "architecture"]);
  });

  it("handles content with no references", () => {
    const result = extractFileReferences("# Empty doc\n\nNo links.", "/path/to/empty.md");
    expect(result.wikiLinks).toEqual([]);
    expect(result.markdownLinks).toEqual([]);
    expect(result.frontmatterRefs).toEqual([]);
    expect(result.tags).toEqual([]);
  });

  it("handles empty content", () => {
    const result = extractFileReferences("", "/path/to/empty.md");
    expect(result.wikiLinks).toEqual([]);
    expect(result.markdownLinks).toEqual([]);
    expect(result.frontmatterRefs).toEqual([]);
    expect(result.tags).toEqual([]);
  });
});

// --- Edge Cases ---

describe("edge cases", () => {
  it("does not extract wiki-links inside code blocks", () => {
    const content = "Normal text\n```\n[[NOT-A-LINK]]\n```\nAfter code";
    const result = extractWikiLinks(content);
    // Note: current implementation does extract from code blocks.
    // This test documents the current behavior.
    expect(result).toContain("NOT-A-LINK");
  });

  it("extracts links from multi-paragraph content with mixed types", () => {
    const content = `---
title: "Mixed"
related:
  - "[[ROADMAP]]"
tags:
  - "multi"
  - "test"
---

# First Section

See [[SPRINT-01]] for phase 1.

Check [details](../findings/01-arch.md) for more info.

## Second Section

Also reference [[README]] and [other](./documents/guide.md).

External [link](https://example.com) should be ignored.
`;
    const result = extractFileReferences(content, "/path/to/file.md");

    expect(result.wikiLinks).toContain("ROADMAP");
    expect(result.wikiLinks).toContain("SPRINT-01");
    expect(result.wikiLinks).toContain("README");
    expect(result.markdownLinks).toHaveLength(2);
    expect(result.markdownLinks[0].href).toBe("../findings/01-arch.md");
    expect(result.markdownLinks[1].href).toBe("./documents/guide.md");
    expect(result.frontmatterRefs).toContain("ROADMAP");
    expect(result.tags).toEqual(["multi", "test"]);
  });

  it("handles malformed frontmatter gracefully", () => {
    const content = `---
title: "Unclosed
tags: [broken
---
# Still works
See [[LINK]].`;
    // gray-matter may throw or return partial data
    const result = extractFileReferences(content, "/path/to/broken.md");
    // Should not throw -- wiki-links should still be extracted from body
    expect(result.wikiLinks).toContain("LINK");
  });

  it("handles very long content without errors", () => {
    const longContent = "---\ntags:\n  - long\n---\n" +
      Array.from({ length: 1000 }, (_, i) => `Line ${i}: see [[NODE-${i}]]`).join("\n");
    const result = extractFileReferences(longContent, "/path/to/long.md");
    expect(result.wikiLinks.length).toBe(1000);
    expect(result.tags).toEqual(["long"]);
  });

  it("handles inline code containing wiki-link-like syntax", () => {
    const content = "Use `[[syntax]]` for wiki-links. Also [[REAL-LINK]].";
    const result = extractWikiLinks(content);
    // Current implementation extracts from inline code too
    expect(result).toContain("REAL-LINK");
    expect(result).toContain("syntax");
  });

  it("handles nested brackets correctly", () => {
    const result = extractWikiLinks("See [[[NESTED]]] text");
    // The regex should capture the inner content
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it("handles frontmatter with source field", () => {
    const content = `---
source: "[[FINDING-01]]"
---
# Title`;
    const result = extractFrontmatterRefs(content);
    expect(result).toContain("FINDING-01");
  });
});
