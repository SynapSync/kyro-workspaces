/**
 * Graph Parser — Extracts cross-file references from markdown content.
 *
 * Pure functions that extract wiki-links, markdown links, frontmatter references,
 * and tags from markdown files. Used by the graph builder to construct the
 * project knowledge graph.
 */

import matter from "gray-matter";

// --- Types ---

export interface MarkdownLink {
  text: string;
  href: string;
}

export interface FileReferences {
  /** [[wiki-link]] targets found in body and frontmatter */
  wikiLinks: string[];
  /** [text](href) internal links (external URLs excluded) */
  markdownLinks: MarkdownLink[];
  /** Frontmatter related, previous_doc, next_doc, parent_doc references */
  frontmatterRefs: string[];
  /** Frontmatter tags array */
  tags: string[];
}

// --- Wiki-Link Extraction ---

const WIKI_LINK_RE = /\[\[([^\]]+)\]\]/g;

/**
 * Extract all [[wiki-link]] targets from markdown content.
 * Searches both the body and any string that matches the pattern.
 * Returns deduplicated target names.
 */
export function extractWikiLinks(content: string): string[] {
  const matches = new Set<string>();
  let match: RegExpExecArray | null;

  // Reset regex state
  WIKI_LINK_RE.lastIndex = 0;
  while ((match = WIKI_LINK_RE.exec(content)) !== null) {
    const target = match[1].trim();
    if (target) {
      matches.add(target);
    }
  }

  return Array.from(matches);
}

// --- Markdown Link Extraction ---

// Matches [text](href) but not ![image](src)
const MARKDOWN_LINK_RE = /(?<!!)\[([^\]]*)\]\(([^)]+)\)/g;

// External URL patterns to exclude
const EXTERNAL_URL_RE = /^(https?:\/\/|mailto:|tel:|ftp:\/\/)/i;

/**
 * Extract all internal [text](href) markdown links from content.
 * Excludes external URLs (http/https/mailto/etc) and image links.
 * Returns array of {text, href} objects.
 */
export function extractMarkdownLinks(content: string): MarkdownLink[] {
  const links: MarkdownLink[] = [];
  let match: RegExpExecArray | null;

  // Strip frontmatter before scanning body for links
  const body = stripFrontmatter(content);

  MARKDOWN_LINK_RE.lastIndex = 0;
  while ((match = MARKDOWN_LINK_RE.exec(body)) !== null) {
    const href = match[2].trim();
    // Skip external URLs, anchors-only, and empty hrefs
    if (!href || EXTERNAL_URL_RE.test(href) || href.startsWith("#")) {
      continue;
    }
    links.push({
      text: match[1].trim(),
      href,
    });
  }

  return links;
}

// --- Frontmatter Reference Extraction ---

/**
 * Extract references from frontmatter fields: related, previous_doc, next_doc, parent_doc.
 * Resolves [[wiki-link]] syntax within field values.
 * Returns deduplicated reference names.
 */
export function extractFrontmatterRefs(content: string): string[] {
  const refs = new Set<string>();

  try {
    const { data } = matter(content);

    // Extract from 'related' array
    if (Array.isArray(data.related)) {
      for (const item of data.related) {
        const resolved = resolveWikiLinkValue(String(item));
        if (resolved) refs.add(resolved);
      }
    }

    // Extract from single-value link fields
    for (const field of ["previous_doc", "next_doc", "parent_doc", "source"]) {
      const value = data[field];
      if (typeof value === "string" && value.trim()) {
        const resolved = resolveWikiLinkValue(value);
        if (resolved) refs.add(resolved);
      }
    }
  } catch {
    // If frontmatter parsing fails, return empty
  }

  return Array.from(refs);
}

// --- Tag Extraction ---

/**
 * Extract the tags array from frontmatter.
 * Returns empty array if no tags found or parsing fails.
 */
export function extractTags(content: string): string[] {
  try {
    const { data } = matter(content);
    if (Array.isArray(data.tags)) {
      return data.tags
        .map((t: unknown) => String(t).trim())
        .filter((t: string) => t.length > 0);
    }
  } catch {
    // If frontmatter parsing fails, return empty
  }
  return [];
}

// --- Unified Extraction ---

/**
 * Extract all cross-file references from a markdown file.
 * Combines wiki-links, markdown links, frontmatter refs, and tags.
 * This is the main entry point used by the graph builder.
 */
export function extractFileReferences(
  content: string,
  _filePath: string
): FileReferences {
  return {
    wikiLinks: extractWikiLinks(content),
    markdownLinks: extractMarkdownLinks(content),
    frontmatterRefs: extractFrontmatterRefs(content),
    tags: extractTags(content),
  };
}

// --- Helpers ---

/**
 * Resolve a value that may be wrapped in [[wiki-link]] syntax.
 * Returns the inner target name, or the raw value if not a wiki-link.
 */
function resolveWikiLinkValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = /^\[\[(.+)\]\]$/.exec(trimmed);
  return match ? match[1].trim() : trimmed;
}

/**
 * Strip YAML frontmatter from markdown content to get just the body.
 */
function stripFrontmatter(content: string): string {
  if (!content.trimStart().startsWith("---")) return content;
  try {
    const { content: body } = matter(content);
    return body;
  } catch {
    return content;
  }
}
