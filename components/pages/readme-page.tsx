"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Pencil, Eye, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";

export function ReadmePage() {
  const { project, updateReadme } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(project.readme);

  const handleSave = () => {
    updateReadme(draft);
    setIsEditing(false);
  };

  const handleToggle = () => {
    if (!isEditing) {
      setDraft(project.readme);
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            README
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Project documentation and getting started guide
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleToggle} className="gap-1.5">
            {isEditing ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                Preview
              </>
            ) : (
              <>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </>
            )}
          </Button>
          {isEditing && (
            <Button size="sm" onClick={handleSave} className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="min-h-[500px] font-mono text-sm resize-none bg-card"
          placeholder="Write your README in Markdown..."
        />
      ) : (
        <div className="prose prose-sm max-w-none rounded-xl border bg-card p-6 dark:prose-invert prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none">
          <ReactMarkdown>{project.readme}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
