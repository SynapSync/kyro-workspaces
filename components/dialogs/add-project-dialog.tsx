"use client";

import { useState } from "react";
import { FolderOpen, Loader2 } from "lucide-react";
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
  const [isValidating, setIsValidating] = useState(false);

  const handleAdd = async () => {
    if (!path.trim()) {
      setError("Path is required");
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      addProject(path.trim(), name.trim() || undefined, color.trim() || undefined);
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
            <Input
              id="project-path"
              value={path}
              onChange={(e) => {
                setPath(e.target.value);
                setError(null);
              }}
              placeholder="/path/to/sprint-forge/project"
              className="mt-2 font-mono text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Path to a directory containing a sprint-forge README.md and sprints/ folder.
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
                  className={`h-6 w-6 rounded-full ${c} transition-all ${
                    color === c
                      ? "ring-2 ring-offset-2 ring-primary scale-110"
                      : "hover:scale-110"
                  }`}
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
