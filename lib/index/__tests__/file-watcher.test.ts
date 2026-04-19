import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { FSWatcher } from "fs";

// Mock fs.watch before importing the module
const mockWatcher = {
  close: vi.fn(),
} as unknown as FSWatcher;

vi.mock("fs", () => ({
  watch: vi.fn(() => mockWatcher),
}));

// Mock builder — we don't want actual reindexing
vi.mock("../builder", () => ({
  reindexFile: vi.fn().mockResolvedValue(true),
}));

// Mock sqlite — getDb returns a truthy value so flushPendingChanges proceeds
vi.mock("../sqlite", () => ({
  getDb: vi.fn(() => ({})),
}));

// Import after mocks
import * as fs from "fs";
import { reindexFile } from "../builder";
import {
  watchProject,
  unwatchProject,
  unwatchAll,
  onIndexUpdate,
  getWatcherCount,
} from "../file-watcher";

describe("file-watcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Clean up watchers from previous tests
    unwatchAll();
  });

  afterEach(() => {
    unwatchAll();
    vi.useRealTimers();
  });

  // --- watchProject / unwatchProject ---

  it("creates a watcher and increments count", () => {
    watchProject("proj-1", "/tmp/proj-1");
    expect(fs.watch).toHaveBeenCalledWith(
      "/tmp/proj-1",
      { recursive: true },
      expect.any(Function),
    );
    expect(getWatcherCount()).toBe(1);
  });

  it("does not create duplicate watchers for same project", () => {
    watchProject("proj-1", "/tmp/proj-1");
    watchProject("proj-1", "/tmp/proj-1");
    expect(fs.watch).toHaveBeenCalledTimes(1);
    expect(getWatcherCount()).toBe(1);
  });

  it("watches multiple projects independently", () => {
    watchProject("proj-1", "/tmp/proj-1");
    watchProject("proj-2", "/tmp/proj-2");
    expect(getWatcherCount()).toBe(2);
  });

  it("unwatchProject removes a single watcher", () => {
    watchProject("proj-1", "/tmp/proj-1");
    watchProject("proj-2", "/tmp/proj-2");
    unwatchProject("proj-1");
    expect(mockWatcher.close).toHaveBeenCalledTimes(1);
    expect(getWatcherCount()).toBe(1);
  });

  it("unwatchAll removes all watchers", () => {
    watchProject("proj-1", "/tmp/proj-1");
    watchProject("proj-2", "/tmp/proj-2");
    unwatchAll();
    expect(getWatcherCount()).toBe(0);
  });

  // --- File filtering ---

  it("ignores non-markdown files", async () => {
    watchProject("proj-1", "/tmp/proj-1");
    const callback = (fs.watch as ReturnType<typeof vi.fn>).mock.calls[0][2];

    // Simulate a .ts file change
    callback("change", "lib/store.ts");
    await vi.advanceTimersByTimeAsync(600);
    expect(reindexFile).not.toHaveBeenCalled();
  });

  it("ignores markdown files outside sprint-forge dirs", async () => {
    watchProject("proj-1", "/tmp/proj-1");
    const callback = (fs.watch as ReturnType<typeof vi.fn>).mock.calls[0][2];

    // Markdown but not in sprint-forge/, findings/, documents/, or README.md
    callback("change", "notes/random.md");
    await vi.advanceTimersByTimeAsync(600);
    expect(reindexFile).not.toHaveBeenCalled();
  });

  it("processes markdown files in sprint-forge/ directory", async () => {
    watchProject("proj-1", "/tmp/proj-1");
    const callback = (fs.watch as ReturnType<typeof vi.fn>).mock.calls[0][2];

    callback("change", "sprint-forge/SPRINT-1.md");
    await vi.advanceTimersByTimeAsync(600);
    expect(reindexFile).toHaveBeenCalledWith(
      "/tmp/proj-1/sprint-forge/SPRINT-1.md",
      "proj-1",
    );
  });

  it("still processes markdown under legacy sprints/ for hot-reload", async () => {
    watchProject("proj-1", "/tmp/proj-1");
    const callback = (fs.watch as ReturnType<typeof vi.fn>).mock.calls[0][2];

    callback("change", "sprints/SPRINT-1.md");
    await vi.advanceTimersByTimeAsync(600);
    expect(reindexFile).toHaveBeenCalledWith(
      "/tmp/proj-1/sprints/SPRINT-1.md",
      "proj-1",
    );
  });

  it("processes markdown files in findings/ directory", async () => {
    watchProject("proj-1", "/tmp/proj-1");
    const callback = (fs.watch as ReturnType<typeof vi.fn>).mock.calls[0][2];

    callback("change", "findings/01-issue.md");
    await vi.advanceTimersByTimeAsync(600);
    expect(reindexFile).toHaveBeenCalledWith(
      "/tmp/proj-1/findings/01-issue.md",
      "proj-1",
    );
  });

  it("processes README.md at root", async () => {
    watchProject("proj-1", "/tmp/proj-1");
    const callback = (fs.watch as ReturnType<typeof vi.fn>).mock.calls[0][2];

    callback("change", "README.md");
    await vi.advanceTimersByTimeAsync(600);
    expect(reindexFile).toHaveBeenCalledWith(
      "/tmp/proj-1/README.md",
      "proj-1",
    );
  });

  it("ignores events with null filename", async () => {
    watchProject("proj-1", "/tmp/proj-1");
    const callback = (fs.watch as ReturnType<typeof vi.fn>).mock.calls[0][2];

    callback("change", null);
    await vi.advanceTimersByTimeAsync(600);
    expect(reindexFile).not.toHaveBeenCalled();
  });

  // --- Debounce ---

  it("debounces rapid changes into a single flush", async () => {
    watchProject("proj-1", "/tmp/proj-1");
    const callback = (fs.watch as ReturnType<typeof vi.fn>).mock.calls[0][2];

    // Fire 3 changes in quick succession
    callback("change", "sprint-forge/SPRINT-1.md");
    callback("change", "sprint-forge/SPRINT-2.md");
    callback("change", "sprint-forge/SPRINT-3.md");

    // Before debounce: nothing indexed yet
    expect(reindexFile).not.toHaveBeenCalled();

    // After debounce: all 3 indexed in one flush
    await vi.advanceTimersByTimeAsync(600);
    expect(reindexFile).toHaveBeenCalledTimes(3);
  });

  it("deduplicates same file changed multiple times", async () => {
    watchProject("proj-1", "/tmp/proj-1");
    const callback = (fs.watch as ReturnType<typeof vi.fn>).mock.calls[0][2];

    // Same file changed 3 times
    callback("change", "sprint-forge/SPRINT-1.md");
    callback("change", "sprint-forge/SPRINT-1.md");
    callback("change", "sprint-forge/SPRINT-1.md");

    await vi.advanceTimersByTimeAsync(600);
    // Map deduplicates by key — should only reindex once
    expect(reindexFile).toHaveBeenCalledTimes(1);
  });

  // --- Listener notification ---

  it("notifies listeners after reindexing", async () => {
    const listener = vi.fn();
    const unsubscribe = onIndexUpdate(listener);

    watchProject("proj-1", "/tmp/proj-1");
    const callback = (fs.watch as ReturnType<typeof vi.fn>).mock.calls[0][2];

    callback("change", "sprint-forge/SPRINT-1.md");
    await vi.advanceTimersByTimeAsync(600);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      projectId: "proj-1",
      files: ["/tmp/proj-1/sprint-forge/SPRINT-1.md"],
    });

    unsubscribe();
  });

  it("does not notify after unsubscribe", async () => {
    const listener = vi.fn();
    const unsubscribe = onIndexUpdate(listener);
    unsubscribe();

    watchProject("proj-1", "/tmp/proj-1");
    const callback = (fs.watch as ReturnType<typeof vi.fn>).mock.calls[0][2];

    callback("change", "sprint-forge/SPRINT-1.md");
    await vi.advanceTimersByTimeAsync(600);

    expect(listener).not.toHaveBeenCalled();
  });

  it("groups listener notifications by project", async () => {
    const listener = vi.fn();
    onIndexUpdate(listener);

    // Watch two projects
    watchProject("proj-1", "/tmp/proj-1");
    watchProject("proj-2", "/tmp/proj-2");

    const callback1 = (fs.watch as ReturnType<typeof vi.fn>).mock.calls[0][2];
    const callback2 = (fs.watch as ReturnType<typeof vi.fn>).mock.calls[1][2];

    callback1("change", "sprint-forge/SPRINT-1.md");
    callback2("change", "findings/01-issue.md");
    await vi.advanceTimersByTimeAsync(600);

    // Should notify twice — once per project
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
