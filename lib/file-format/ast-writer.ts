/**
 * AST-based markdown writer for sprint files.
 *
 * Uses a hybrid approach: AST (unified/remark) for structural node location,
 * positional string replacement for modifications. This ensures:
 * - Robust node finding (understands markdown structure, not fragile regex)
 * - Zero formatting drift (only the targeted text changes, everything else preserved)
 */

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import type { Root, List, ListItem } from "mdast";
import type { TaskStatus } from "@/lib/types";
import { STATUS_TO_SYMBOL } from "@/lib/types";

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkFrontmatter, ["yaml"]);

/** Parse raw markdown string into an mdast AST. */
export function parseMarkdown(content: string): Root {
  return processor.parse(content);
}

/**
 * Serialize an mdast AST back to a markdown string.
 * Only used for appending new nodes (where no original text exists).
 */
export function stringifyMarkdown(tree: Root): string {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkStringify, {
      bullet: "-",
      listItemIndent: "one",
      rule: "-",
      emphasis: "_",
      strong: "*",
      fences: true,
      resourceLink: true,
    })
    .stringify(tree);
}

// ---------------------------------------------------------------------------
// AST traversal helpers
// ---------------------------------------------------------------------------

/** Extract the full plain-text content of an AST node and its descendants. */
function nodeText(node: { children?: unknown[]; value?: string }): string {
  if (node.value) return node.value;
  if (!node.children) return "";
  return (node.children as { value?: string; children?: unknown[] }[])
    .map(nodeText)
    .join("");
}

/**
 * Check if a list item is a task (standard GFM checkbox or custom symbol).
 * GFM only recognizes `[ ]` and `[x]`, but sprint-forge uses `[~]`, `[!]`, `[-]`, `[>]`.
 * For non-standard symbols, we check the raw source text.
 */
function isTaskItem(item: ListItem, content: string): boolean {
  if (item.checked !== null && item.checked !== undefined) return true;
  if (!item.position) return false;
  const lineStart = item.position.start.offset!;
  const lineText = content.slice(lineStart, lineStart + 10);
  return /- \[.\]/.test(lineText);
}

/** Strip inline markdown formatting (backticks, bold, italic) for comparison. */
function stripInlineFormatting(text: string): string {
  return text.replace(/`([^`]*)`/g, "$1").replace(/\*{1,2}([^*]*)\*{1,2}/g, "$1");
}

/** Find a task list item whose text contains `title` and return it with its parent list. */
function findTaskInTree(
  tree: Root,
  title: string,
  content: string,
): { item: ListItem; list: List; index: number } | undefined {
  const normalizedTitle = stripInlineFormatting(title);
  for (const node of tree.children) {
    if (node.type !== "list") continue;
    const list = node as List;
    for (let i = 0; i < list.children.length; i++) {
      const item = list.children[i];
      if (!isTaskItem(item, content)) continue;
      const text = nodeText(item);
      if (text.includes(normalizedTitle)) {
        return { item, list, index: i };
      }
    }
  }
  return undefined;
}

/**
 * Replace a substring of `content` between byte offsets [start, end).
 * Uses the position info from mdast nodes.
 */
function spliceContent(
  content: string,
  start: number,
  end: number,
  replacement: string,
): string {
  return content.slice(0, start) + replacement + content.slice(end);
}

// ---------------------------------------------------------------------------
// Public write operations
// ---------------------------------------------------------------------------

/**
 * Update a task's checkbox status in sprint markdown.
 *
 * Parses to AST to locate the task item by title, then uses its
 * position info to replace only the checkbox character in the original text.
 */
export function updateTaskStatus(
  content: string,
  taskTitle: string,
  newStatus: TaskStatus,
): string {
  const tree = parseMarkdown(content);
  const found = findTaskInTree(tree, taskTitle, content);
  if (!found) return content;

  const { item } = found;
  if (!item.position) return content;

  const symbol = STATUS_TO_SYMBOL[newStatus];

  // The checkbox is on the first line of the list item.
  // Find `[X]` pattern in the line starting at the item's position.
  const lineStart = item.position.start.offset!;
  // Find the checkbox bracket in the original text from this position
  const searchArea = content.slice(lineStart, lineStart + 50);
  const bracketMatch = searchArea.match(/- \[(.)\]/);
  if (!bracketMatch) return content;

  // Replace the single character inside the brackets
  const bracketIndex = lineStart + searchArea.indexOf("[") + 1;
  return spliceContent(content, bracketIndex, bracketIndex + 1, symbol);
}

/**
 * Update a task's title in sprint markdown.
 *
 * Locates the task line by taskRef (e.g. "T2.4") and replaces the title portion
 * while preserving the checkbox, taskRef, and any sub-items below.
 */
export function updateTaskTitle(
  content: string,
  taskRef: string,
  newTitle: string,
): string {
  const escaped = taskRef.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^(- \\[.\\] \\*\\*${escaped}\\*\\*:\\s*)(.+)$`, "m");
  return content.replace(pattern, `$1${newTitle}`);
}

/**
 * Append a new pending task to the last phase's task list.
 *
 * Uses AST to find the last task list and its last item, then inserts
 * a new task line at the correct position in the original text.
 */
export function appendTask(
  content: string,
  taskTitle: string,
  taskRef?: string,
): string {
  const tree = parseMarkdown(content);

  // Find the last list that contains task items
  let lastTaskList: List | undefined;
  for (const node of tree.children) {
    if (node.type !== "list") continue;
    const list = node as List;
    const hasTaskItems = list.children.some(
      (item) => isTaskItem(item, content),
    );
    if (hasTaskItems) lastTaskList = list;
  }

  if (!lastTaskList || lastTaskList.children.length === 0) return content;

  // Get the end position of the last item in this list
  const lastItem = lastTaskList.children[lastTaskList.children.length - 1];
  if (!lastItem.position) return content;

  const insertOffset = lastItem.position.end.offset!;

  // Build the new task line
  const taskLine = taskRef
    ? `\n- [ ] **${taskRef}**: ${taskTitle}`
    : `\n- [ ] ${taskTitle}`;

  return spliceContent(content, insertOffset, insertOffset, taskLine);
}

/**
 * Update a single YAML frontmatter field.
 *
 * Locates the YAML frontmatter node via AST, then does a targeted
 * string replacement of the specified field within the frontmatter bounds.
 * Supports string, number, boolean, and simple array values.
 * If the field doesn't exist, it is appended to the frontmatter.
 */
export function updateFrontmatterField(
  content: string,
  field: string,
  value: string | number | boolean | string[],
): string {
  const tree = parseMarkdown(content);

  for (const node of tree.children) {
    if (node.type === "yaml") {
      const yaml = node as { type: "yaml"; value: string; position?: { start: { offset?: number }; end: { offset?: number } } };
      const startOff = yaml.position?.start.offset;
      const endOff = yaml.position?.end.offset;
      if (startOff == null || endOff == null) return content;

      const fmStart = startOff;
      const fmEnd = endOff;
      const fmText = content.slice(fmStart, fmEnd);

      const serialized = serializeFrontmatterValue(value);

      // Try to replace existing field
      // Match the field name at the start of a line, followed by its value
      // For array fields, also match the indented list items that follow
      const fieldRegex = new RegExp(
        `^(${escapeRegex(field)}:)[ \\t]*.*(?:\\n[ \\t]+-[ \\t]+.*)*`,
        "m",
      );
      const match = fmText.match(fieldRegex);

      let patched: string;
      if (match) {
        // Replace existing field
        patched = fmText.replace(fieldRegex, `${field}: ${serialized}`);
      } else {
        // Append new field before the closing ---
        // The fmText includes the opening --- and closing ---
        // yaml.value is just the content between them
        // But fmText is the full range including delimiters
        // We need to insert before the last line
        const lines = fmText.split("\n");
        const lastLine = lines[lines.length - 1];
        if (lastLine.trim() === "---") {
          lines.splice(lines.length - 1, 0, `${field}: ${serialized}`);
          patched = lines.join("\n");
        } else {
          // No closing ---, just append
          patched = fmText + `\n${field}: ${serialized}`;
        }
      }

      if (patched === fmText) return content;
      return spliceContent(content, fmStart, fmEnd, patched);
    }
  }

  return content;
}

/** Serialize a value for YAML frontmatter. */
function serializeFrontmatterValue(
  value: string | number | boolean | string[],
): string {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return "\n" + value.map((v) => `  - ${quoteIfNeeded(v)}`).join("\n");
  }
  return quoteIfNeeded(String(value));
}

/** Quote a YAML string value if it contains special characters. */
function quoteIfNeeded(s: string): string {
  if (/[:#\[\]{}&*!|>'"%@`,?]/.test(s) || s === "" || s === "true" || s === "false" || /^\d+$/.test(s)) {
    return `"${s.replace(/"/g, '\\"')}"`;
  }
  return s;
}

/** Escape special regex characters in a string. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Update the sprint status in YAML frontmatter.
 *
 * Convenience wrapper around updateFrontmatterField() for the `status` field.
 */
export function updateSprintStatus(
  content: string,
  newStatus: string,
): string {
  return updateFrontmatterField(content, "status", newStatus);
}

/**
 * Delete a task line from sprint markdown.
 *
 * Uses AST to find the task item by title, then removes the entire
 * line range from the original text.
 */
export function deleteTask(
  content: string,
  taskTitle: string,
): string {
  const tree = parseMarkdown(content);
  const found = findTaskInTree(tree, taskTitle, content);
  if (!found) return content;

  const { item } = found;
  if (!item.position) return content;

  let start = item.position.start.offset!;
  let end = item.position.end.offset!;

  // Extend to include the trailing newline if present
  if (content[end] === "\n") end++;

  // If there's a leading newline and this isn't the first character, remove it
  // to avoid double blank lines
  if (start > 0 && content[start - 1] === "\n") {
    start--;
  }

  return spliceContent(content, start, end, "");
}
