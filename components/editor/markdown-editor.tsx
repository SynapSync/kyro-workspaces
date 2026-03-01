"use client";

import { useCallback, useRef, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { MarkdownToolbar } from "./markdown-toolbar";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleToolbarAction = useCallback(
    (format: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);

      let newText = "";
      let newCursorPos = start;

      switch (format) {
        case "bold":
          newText = `**${selectedText || "bold text"}**`;
          newCursorPos = selectedText ? end + 4 : start + 2;
          break;
        case "italic":
          newText = `*${selectedText || "italic text"}*`;
          newCursorPos = selectedText ? end + 2 : start + 1;
          break;
        case "code":
          newText = `\`${selectedText || "code"}\``;
          newCursorPos = selectedText ? end + 2 : start + 1;
          break;
        case "codeblock":
          newText = `\`\`\`\n${selectedText || "code here"}\n\`\`\``;
          newCursorPos = selectedText ? end + 8 : start + 4;
          break;
        case "link":
          newText = `[${selectedText || "link text"}](url)`;
          newCursorPos = selectedText ? end + 7 : start + 1;
          break;
        case "heading":
          newText = `## ${selectedText || "Heading"}`;
          newCursorPos = start + 3;
          break;
        case "list":
          newText = `- ${selectedText || "List item"}`;
          newCursorPos = start + 2;
          break;
        case "numberedlist":
          newText = `1. ${selectedText || "List item"}`;
          newCursorPos = start + 3;
          break;
        case "quote":
          newText = `> ${selectedText || "Quote"}`;
          newCursorPos = start + 2;
          break;
        default:
          return;
      }

      const newValue =
        value.substring(0, start) + newText + value.substring(end);
      onChange(newValue);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [value, onChange]
  );

  return (
    <div className="flex flex-col h-full">
      <MarkdownToolbar onAction={handleToolbarAction} />
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={50} minSize={30}>
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[500px] font-mono text-sm resize-none bg-card border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Write your markdown here..."
          />
        </ResizablePanel>
        <ResizableHandle className="w-1 bg-border hover:bg-primary transition-colors" />
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full overflow-auto p-4 bg-muted/20">
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none">
              <ReactMarkdown>{value || "*No content to preview*"}</ReactMarkdown>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
