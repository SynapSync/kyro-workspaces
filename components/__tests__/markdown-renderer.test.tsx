import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownRenderer } from "@/components/markdown-renderer";

describe("MarkdownRenderer", () => {
  it("renders markdown content as HTML", () => {
    render(<MarkdownRenderer content="# Hello World" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Hello World",
    );
  });

  it("renders empty content without errors", () => {
    const { container } = render(<MarkdownRenderer content="" />);
    expect(container).toBeTruthy();
  });

  it("renders GFM tables", () => {
    const table = `| A | B |\n|---|---|\n| 1 | 2 |`;
    render(<MarkdownRenderer content={table} />);
    expect(screen.getByRole("table")).toBeTruthy();
  });
});
