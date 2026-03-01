import { describe, it, expect } from "vitest";
import { symbolToStatus, SYMBOL_TO_STATUS } from "@/lib/types";

describe("symbolToStatus", () => {
  it("maps [ ] to todo", () => {
    expect(symbolToStatus(" ")).toBe("todo");
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

  it("maps [>] to todo (carry-over)", () => {
    expect(symbolToStatus(">")).toBe("todo");
  });

  it("returns todo for unknown symbols", () => {
    expect(symbolToStatus("?")).toBe("todo");
    expect(symbolToStatus("")).toBe("todo");
    expect(symbolToStatus("z")).toBe("todo");
  });

  it("SYMBOL_TO_STATUS covers all 6 symbols", () => {
    const symbols = [" ", "~", "x", "!", "-", ">"];
    symbols.forEach((s) => {
      expect(SYMBOL_TO_STATUS).toHaveProperty(s);
    });
  });
});
