import { describe, it, expect } from "vitest";
import { symbolToStatus, SYMBOL_TO_STATUS } from "@/lib/types";

describe("symbolToStatus", () => {
  it("maps [ ] to pending", () => {
    expect(symbolToStatus(" ")).toBe("pending");
  });

  it("maps [~] to in_progress", () => {
    expect(symbolToStatus("~")).toBe("in_progress");
  });

  it("maps [x] to done", () => {
    expect(symbolToStatus("x")).toBe("done");
  });

  it("maps [!] to blocked", () => {
    expect(symbolToStatus("!")).toBe("blocked");
  });

  it("maps [-] to skipped", () => {
    expect(symbolToStatus("-")).toBe("skipped");
  });

  it("maps [>] to carry_over", () => {
    expect(symbolToStatus(">")).toBe("carry_over");
  });

  it("returns pending for unknown symbols", () => {
    expect(symbolToStatus("")).toBe("pending");
    expect(symbolToStatus("z")).toBe("pending");
    expect(symbolToStatus("?")).toBe("pending");
    expect(symbolToStatus("_")).toBe("pending");
  });

  it("SYMBOL_TO_STATUS covers all 6 sprint-forge symbols", () => {
    const symbols = [" ", "~", "x", "!", "-", ">"];
    symbols.forEach((s) => {
      expect(SYMBOL_TO_STATUS).toHaveProperty(s);
    });
  });
});
