import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a URL-safe slug from a filesystem path's basename.
 */
export function slugFromPath(path: string): string {
  const dirName = path.split("/").filter(Boolean).pop() ?? "project";
  return dirName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
