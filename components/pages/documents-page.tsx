"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Plus,
  FileText,
  Pencil,
  Save,
  Trash2,
  ArrowLeft,
  X,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { VersionHistory } from "@/components/editor/version-history";
import type { Document } from "@/lib/types";
import { DEFAULT_DOCUMENT } from "@/lib/config";

export function DocumentsPage() {
  const {
    getActiveProject,
    activeProjectId,
    addDocument,
    updateDocument,
    deleteDocument,
  } = useAppStore();
  
  const project = getActiveProject();
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeDoc = project.documents.find((d) => d.id === activeDocId);

  // Debounced autosave
  const handleAutoSave = useCallback(
    (content: string, title: string, docId: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      setIsSaving(true);

      saveTimeoutRef.current = setTimeout(() => {
        updateDocument(docId, { content, title });
        setIsSaving(false);
        setLastSaved(new Date());
        toast.success("Document saved", { duration: 1500 });
      }, 2000);
    },
    [updateDocument]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Update draft when activeDoc changes
  useEffect(() => {
    if (activeDoc && !isEditing) {
      setDraft(activeDoc.content);
      setDraftTitle(activeDoc.title);
    }
  }, [activeDoc, isEditing]);

  const handleOpen = (doc: Document) => {
    // Save any pending changes before switching
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setActiveDocId(doc.id);
    setIsEditing(false);
    setDraft(doc.content);
    setDraftTitle(doc.title);
    setLastSaved(null);
  };

  const handleEdit = () => {
    if (activeDoc) {
      setDraft(activeDoc.content);
      setDraftTitle(activeDoc.title);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (activeDoc) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      updateDocument(activeDoc.id, { title: draftTitle, content: draft });
      setIsSaving(false);
      setLastSaved(new Date());
      setIsEditing(false);
    }
  };

  const handleCreate = () => {
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title: DEFAULT_DOCUMENT.title,
      content: DEFAULT_DOCUMENT.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addDocument(newDoc);
    setActiveDocId(newDoc.id);
    setDraftTitle(newDoc.title);
    setDraft(newDoc.content);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    deleteDocument(id);
    if (activeDocId === id) {
      setActiveDocId(null);
      setIsEditing(false);
    }
  };

  const handleBack = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setActiveDocId(null);
    setIsEditing(false);
  };

  const handleRestore = (content: string) => {
    if (activeDoc) {
      setDraft(content);
      updateDocument(activeDoc.id, { content });
      toast.success("Version restored", { duration: 1500 });
    }
  };

  const handleContentChange = (content: string) => {
    setDraft(content);
    if (activeDoc) {
      handleAutoSave(content, draftTitle, activeDoc.id);
    }
  };

  const handleTitleChange = (title: string) => {
    setDraftTitle(title);
    if (activeDoc) {
      handleAutoSave(draft, title, activeDoc.id);
    }
  };

  // Document Editor View
  if (activeDoc) {
    return (
      <div className="p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to documents</span>
            </Button>
            {isEditing ? (
              <Input
                value={draftTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-lg font-bold h-9 max-w-md"
              />
            ) : (
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {activeDoc.title}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <span className="text-xs text-muted-foreground mr-2 flex items-center gap-1">
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </>
                ) : lastSaved ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" />
                    Saved
                  </>
                ) : null}
              </span>
            )}
            <VersionHistory
              projectId={activeProjectId}
              docId={activeDoc.id}
              onRestore={handleRestore}
            />
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (saveTimeoutRef.current) {
                      clearTimeout(saveTimeoutRef.current);
                    }
                    setIsEditing(false);
                    setDraft(activeDoc.content);
                    setDraftTitle(activeDoc.title);
                  }}
                  className="gap-1.5"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} className="gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  Save
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Last updated{" "}
          {formatDistanceToNow(new Date(activeDoc.updatedAt), {
            addSuffix: true,
          })}
        </p>

        {isEditing ? (
          <div className="border rounded-lg overflow-hidden bg-card">
            <MarkdownEditor
              value={draft}
              onChange={handleContentChange}
            />
          </div>
        ) : (
          <div className="prose prose-sm max-w-none rounded-xl border bg-card p-6 dark:prose-invert prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown>{activeDoc.content}</ReactMarkdown>
          </div>
        )}
      </div>
    );
  }

  // Document List View
  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Documents
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {project.documents.length} document
            {project.documents.length !== 1 ? "s" : ""} in this project
          </p>
        </div>
        <Button size="sm" onClick={handleCreate} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          New Document
        </Button>
      </div>

      <div className="grid gap-3">
        {project.documents.map((doc) => (
          <Card
            key={doc.id}
            className="border shadow-sm hover:border-primary/30 transition-colors cursor-pointer group"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-3 flex-1 min-w-0"
                  onClick={() => handleOpen(doc)}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {doc.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Updated{" "}
                      {formatDistanceToNow(new Date(doc.updatedAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(doc.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Delete document</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {project.documents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No documents yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Create your first document to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
