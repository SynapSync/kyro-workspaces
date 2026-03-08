"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface InlineMarkdownProps {
  content: string;
  className?: string;
}

export const InlineMarkdown = memo(function InlineMarkdown({
  content,
  className,
}: InlineMarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={className}
      components={{
        // Render paragraphs as spans to keep inline flow
        p: ({ children }) => <span>{children}</span>,
        // Inline styles
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em>{children}</em>,
        code: ({ children }) => (
          <code className="rounded bg-muted px-1 py-0.5 text-[0.9em] font-mono">
            {children}
          </code>
        ),
        a: ({ href, children }) => (
          <a href={href} className="text-primary underline underline-offset-2" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        // Suppress block elements
        h1: ({ children }) => <span className="font-semibold">{children}</span>,
        h2: ({ children }) => <span className="font-semibold">{children}</span>,
        h3: ({ children }) => <span className="font-semibold">{children}</span>,
        ul: ({ children }) => <span>{children}</span>,
        ol: ({ children }) => <span>{children}</span>,
        li: ({ children }) => <span>{children} </span>,
        blockquote: ({ children }) => <span>{children}</span>,
        pre: ({ children }) => <span>{children}</span>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
});
