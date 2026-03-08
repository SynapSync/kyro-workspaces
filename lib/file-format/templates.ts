/**
 * No-op for external sprint-forge directories.
 * Sprint-forge manages its own RE-ENTRY-PROMPTS.md.
 * Kept as a stub for backward compatibility with callers.
 */
export async function syncProjectReentryPrompts(
  _workspacePath: string,
  _projectId: string,
  _fallbackProjectName?: string
): Promise<void> {
  // External sprint-forge directories manage their own re-entry prompts.
  // Kyro does not write to external directories.
}
