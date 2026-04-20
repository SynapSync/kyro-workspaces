"use client";

import { useState } from "react";
import { FolderOpen, FolderSearch, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProjectDialog({ open, onOpenChange }: AddProjectDialogProps) {
  const { addProject } = useAppStore();
  const [path, setPath] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleBrowse = async () => {
    setIsBrowsing(true);
    setError(null);
    try {
      const response = await fetch("/api/filesystem/browse", { method: "POST" });
      const json = (await response.json()) as {
        data?: { path?: string; cancelled?: boolean };
        error?: { message?: string };
      };

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Failed to open folder picker");
      }

      if (json.data?.cancelled) return;
      if (json.data?.path) {
        setPath(json.data.path);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to browse folders");
    } finally {
      setIsBrowsing(false);
    }
  };

  const handleAdd = async () => {
    if (!path.trim()) {
      setError("Path is required");
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      await addProject(path.trim(), name.trim() || undefined, color.trim() || undefined);
      onOpenChange(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add project");
    } finally {
      setIsValidating(false);
    }
  };

  const resetForm = () => {
    setPath("");
    setName("");
    setColor("");
    setError(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const COLORS = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-red-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-orange-500",
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Add Project
          </DialogTitle>
          <DialogDescription>
            Register an external sprint-forge directory as a project.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div>
            <Label htmlFor="project-path" className="text-sm font-medium">
              Directory Path
            </Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="project-path"
                value={path}
                onChange={(e) => {
                  setPath(e.target.value);
                  setError(null);
                }}
                placeholder="…/.agents/sprint-forge/your-scope-project"
                className="flex-1 font-mono text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleBrowse}
                disabled={isBrowsing || isValidating}
                title="Browse folders"
                type="button"
              >
                {isBrowsing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FolderSearch className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              One scope folder (README.md at root; sprint .md in sprint-forge/ or sprints/). Not the parent that contains multiple scopes.
            </p>
          </div>

          <div>
            <Label htmlFor="project-name" className="text-sm font-medium">
              Display Name (optional)
            </Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Auto-detected from README"
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Color (optional)</Label>
            <div className="flex gap-2 mt-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(color === c ? "" : c)}
                  className={cn(
                    "h-6 w-6 rounded-full transition-all",
                    c,
                    color === c
                      ? "ring-2 ring-offset-2 ring-primary scale-110"
                      : "hover:scale-110"
                  )}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!path.trim() || isValidating}
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Validating...
              </>
            ) : (
              "Add Project"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
