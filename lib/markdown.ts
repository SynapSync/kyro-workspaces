export type MarkdownFormat = 
  | "bold" 
  | "italic" 
  | "code" 
  | "codeblock" 
  | "link" 
  | "heading" 
  | "list" 
  | "numberedlist" 
  | "quote";

export interface InsertResult {
  text: string;
  cursorPosition: number;
}

export function insertMarkdownFormatting(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  format: MarkdownFormat
): InsertResult {
  const selectedText = text.substring(selectionStart, selectionEnd);
  let newText = "";
  let newCursorPos = selectionStart;

  switch (format) {
    case "bold":
      newText = `**${selectedText || "bold text"}**`;
      newCursorPos = selectedText 
        ? selectionEnd + 4 
        : selectionStart + 2;
      break;

    case "italic":
      newText = `*${selectedText || "italic text"}*`;
      newCursorPos = selectedText 
        ? selectionEnd + 2 
        : selectionStart + 1;
      break;

    case "code":
      newText = `\`${selectedText || "code"}\``;
      newCursorPos = selectedText 
        ? selectionEnd + 2 
        : selectionStart + 1;
      break;

    case "codeblock":
      newText = `\`\`\`\n${selectedText || "code here"}\n\`\`\``;
      newCursorPos = selectedText 
        ? selectionEnd + 8 
        : selectionStart + 4;
      break;

    case "link":
      newText = `[${selectedText || "link text"}](url)`;
      newCursorPos = selectedText 
        ? selectionEnd + 7 
        : selectionStart + 1;
      break;

    case "heading":
      newText = `## ${selectedText || "Heading"}`;
      newCursorPos = selectionStart + 3;
      break;

    case "list":
      newText = `- ${selectedText || "List item"}`;
      newCursorPos = selectionStart + 2;
      break;

    case "numberedlist":
      newText = `1. ${selectedText || "List item"}`;
      newCursorPos = selectionStart + 3;
      break;

    case "quote":
      newText = `> ${selectedText || "Quote"}`;
      newCursorPos = selectionStart + 2;
      break;

    default:
      return {
        text: text,
        cursorPosition: selectionStart,
      };
  }

  const beforeSelection = text.substring(0, selectionStart);
  const afterSelection = text.substring(selectionEnd);

  return {
    text: beforeSelection + newText + afterSelection,
    cursorPosition: newCursorPos,
  };
}

export function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function getCharacterCount(text: string): number {
  return text.length;
}

export function getReadingTime(text: string, wordsPerMinute: number = 200): number {
  const wordCount = getWordCount(text);
  return Math.ceil(wordCount / wordsPerMinute);
}

export function extractHeadings(text: string): string[] {
  const headingRegex = /^#{1,6}\s+(.+)$/gm;
  const headings: string[] = [];
  let match;

  while ((match = headingRegex.exec(text)) !== null) {
    headings.push(match[1]);
  }

  return headings;
}

export function extractTasks(text: string): { completed: number; total: number } {
  const taskRegex = /- \[x\]/gi;
  const totalTaskRegex = /- \[x\]|- \[ \]/gi;

  const completed = (text.match(taskRegex) || []).length;
  const total = (text.match(totalTaskRegex) || []).length;

  return { completed, total };
}
