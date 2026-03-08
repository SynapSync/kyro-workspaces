import { describe, it, expect } from "vitest";
import {
  extractSections,
  parseMarkdownTable,
  extractBlockquoteMetadata,
  extractChecklistItems,
  extractHeadingTitle,
} from "../markdown-utils";

describe("extractSections", () => {
  it("splits markdown by ## headings", () => {
    const content = `# Title

## Section One

Content one here.

## Section Two

Content two here.
More content.

## Section Three

Content three.`;

    const result = extractSections(content);
    expect(Object.keys(result)).toEqual([
      "Section One",
      "Section Two",
      "Section Three",
    ]);
    expect(result["Section One"]).toBe("Content one here.");
    expect(result["Section Two"]).toBe("Content two here.\nMore content.");
    expect(result["Section Three"]).toBe("Content three.");
  });

  it("handles empty sections", () => {
    const content = `## Empty

## Has Content

Some text`;

    const result = extractSections(content);
    expect(result["Empty"]).toBe("");
    expect(result["Has Content"]).toBe("Some text");
  });
});

describe("parseMarkdownTable", () => {
  it("parses a standard markdown table", () => {
    const table = `| # | Item | Status |
|---|------|--------|
| 1 | Test item | open |
| 2 | Another item | resolved |`;

    const result = parseMarkdownTable(table);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      "#": "1",
      Item: "Test item",
      Status: "open",
    });
    expect(result[1]).toEqual({
      "#": "2",
      Item: "Another item",
      Status: "resolved",
    });
  });

  it("returns empty array for insufficient lines", () => {
    expect(parseMarkdownTable("| Header |")).toEqual([]);
    expect(parseMarkdownTable("")).toEqual([]);
  });

  it("handles table with surrounding text", () => {
    const section = `Some preamble text

| Name | Value |
|------|-------|
| foo | bar |

Some trailing text`;

    const result = parseMarkdownTable(section);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ Name: "foo", Value: "bar" });
  });
});

describe("extractBlockquoteMetadata", () => {
  it("extracts key-value pairs from blockquotes", () => {
    const content = `# Sprint 1 — Title

> Source: \`findings/01-arch.md\`
> Version Target: 0.2.0
> Type: refactor
> Carry-over: 0 items from previous sprint

## Body`;

    const result = extractBlockquoteMetadata(content);
    expect(result["Source"]).toBe("`findings/01-arch.md`");
    expect(result["Version Target"]).toBe("0.2.0");
    expect(result["Type"]).toBe("refactor");
    expect(result["Carry-over"]).toBe("0 items from previous sprint");
  });

  it("handles empty content", () => {
    expect(extractBlockquoteMetadata("")).toEqual({});
  });
});

describe("extractChecklistItems", () => {
  it("parses checked and unchecked items", () => {
    const section = `
- [x] All schemas added
- [ ] Sprint parser complete
- [x] Tests written
`;

    const result = extractChecklistItems(section);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ checked: true, text: "All schemas added" });
    expect(result[1]).toEqual({
      checked: false,
      text: "Sprint parser complete",
    });
    expect(result[2]).toEqual({ checked: true, text: "Tests written" });
  });

  it("ignores non-checklist lines", () => {
    const section = `Some text
- Regular bullet
- [x] Actual checklist item`;

    const result = extractChecklistItems(section);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Actual checklist item");
  });
});

describe("extractHeadingTitle", () => {
  it("parses sprint heading with em dash", () => {
    const result = extractHeadingTitle("# Sprint 1 — Foundation\n\nBody");
    expect(result).toEqual({ number: 1, title: "Foundation" });
  });

  it("parses sprint heading with en dash", () => {
    const result = extractHeadingTitle("# Sprint 10 – Big Refactor");
    expect(result).toEqual({ number: 10, title: "Big Refactor" });
  });

  it("parses sprint heading with hyphen", () => {
    const result = extractHeadingTitle("# Sprint 3 - Quick Fix");
    expect(result).toEqual({ number: 3, title: "Quick Fix" });
  });

  it("returns null for non-sprint headings", () => {
    expect(extractHeadingTitle("# Not a Sprint")).toBeNull();
    expect(extractHeadingTitle("## Sprint 1 — Sub")).toBeNull();
    expect(extractHeadingTitle("")).toBeNull();
  });
});
