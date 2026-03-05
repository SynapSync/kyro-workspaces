/**
 * Markdown parsing utilities for sprint-forge files.
 * Used by all sprint-forge parsers.
 */

/**
 * Splits markdown content by ## headings into a map of heading → body.
 * Strips the `## ` prefix from keys.
 */
export function extractSections(
  content: string
): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = content.split("\n");
  let currentHeading = "";
  let currentBody: string[] = [];

  for (const line of lines) {
    const match = /^##\s+(.+)$/.exec(line);
    if (match) {
      if (currentHeading) {
        sections[currentHeading] = currentBody.join("\n").trim();
      }
      currentHeading = match[1].trim();
      currentBody = [];
    } else if (currentHeading) {
      currentBody.push(line);
    }
  }

  if (currentHeading) {
    sections[currentHeading] = currentBody.join("\n").trim();
  }

  return sections;
}

/**
 * Parses a markdown table into an array of row objects keyed by column headers.
 * Handles the header row, separator row, and data rows.
 */
export function parseMarkdownTable(
  section: string
): Record<string, string>[] {
  const lines = section
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|"));

  if (lines.length < 3) return [];

  // Header row
  const headers = lines[0]
    .split("|")
    .map((h) => h.trim())
    .filter(Boolean);

  // Skip separator row (lines[1]), parse data rows
  const rows: Record<string, string>[] = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i]
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);

    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = cells[j] ?? "";
    }
    rows.push(row);
  }

  return rows;
}

/**
 * Extracts blockquote metadata lines (> Key: value) into a key-value map.
 * Stops at the first non-blockquote, non-empty line after the heading.
 */
export function extractBlockquoteMetadata(
  content: string
): Record<string, string> {
  const meta: Record<string, string> = {};
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    const match = /^>\s*(.+?):\s*(.+)$/.exec(trimmed);
    if (match) {
      meta[match[1].trim()] = match[2].trim();
    }
  }

  return meta;
}

/**
 * Parses checklist items (- [ ] and - [x]) from a section.
 */
export function extractChecklistItems(
  section: string
): { checked: boolean; text: string }[] {
  const items: { checked: boolean; text: string }[] = [];
  const lines = section.split("\n");

  for (const line of lines) {
    const match = /^-\s+\[([ x])\]\s+(.+)$/.exec(line.trim());
    if (match) {
      items.push({
        checked: match[1] === "x",
        text: match[2].trim(),
      });
    }
  }

  return items;
}

/**
 * Parses a sprint heading like "# Sprint 1 — Foundation" into
 * { number, title } or returns null if no match.
 */
export function extractHeadingTitle(
  content: string
): { number: number; title: string } | null {
  const lines = content.split("\n");

  for (const line of lines) {
    const match = /^#\s+Sprint\s+(\d+)\s*[—–-]\s*(.+)$/.exec(line.trim());
    if (match) {
      return {
        number: parseInt(match[1], 10),
        title: match[2].trim(),
      };
    }
  }

  return null;
}
