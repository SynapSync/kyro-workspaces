import type { SprintForgeContext } from "@/lib/forge/context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ForgePromptSelections {
  selectedFindingIds: string[];
  selectedDebtNumbers: number[];
  versionTarget: string;
  sprintType: string;
  customNotes: string;
}

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------

/**
 * Composes a ready-to-use sprint-forge prompt from assembled context
 * and user selections. Output follows the sprint-forge re-entry prompt format.
 */
export function composeSprintForgePrompt(
  context: SprintForgeContext,
  selections: ForgePromptSelections,
): string {
  const { lastSprint, nextSprint, openDebtItems, allFindings } = context;

  const sprintNumber = nextSprint?.number ?? (lastSprint ? lastSprint.number + 1 : 1);
  const version = selections.versionTarget || nextSprint?.version || "next";
  const type = selections.sprintType || nextSprint?.type || "feature";
  const focus = nextSprint?.focus || "Next sprint";

  // Build the files-to-read list
  const filesToRead: string[] = [
    "1. README.md",
    "2. ROADMAP.md (focus on Sprint " + sprintNumber + " definition)",
  ];

  if (lastSprint) {
    filesToRead.push(
      `3. The last completed sprint file (Retro, Recommendations, Debt table)`,
    );
  }

  // Add selected findings
  const selectedFindings = allFindings.filter((f) =>
    selections.selectedFindingIds.includes(f.id),
  );
  if (selectedFindings.length > 0) {
    const findingList = selectedFindings
      .map((f) => `   - ${f.title} (${f.severity})`)
      .join("\n");
    filesToRead.push(
      `${filesToRead.length + 1}. Finding files to address:\n${findingList}`,
    );
  }

  // Build selected debt summary
  const selectedDebt = openDebtItems.filter((d) =>
    selections.selectedDebtNumbers.includes(d.number),
  );
  const debtSection =
    selectedDebt.length > 0
      ? `\nDebt items to resolve in this sprint:\n${selectedDebt.map((d) => `- D${d.number}: ${d.item}`).join("\n")}\n`
      : "";

  // Build custom notes section
  const notesSection = selections.customNotes.trim()
    ? `\nAdditional notes:\n${selections.customNotes.trim()}\n`
    : "";

  // Compose the full prompt
  return `I'm continuing work on the ${context.projectName} project.

Read these files in order:
${filesToRead.join("\n")}

Then use /sprint-forge to generate and execute Sprint ${sprintNumber}.

Sprint ${sprintNumber} scope:
- Title: "${focus}"
- Version Target: ${version}
- Type: ${type}
- Completed: ${context.completedSprintCount}/${context.totalSprintCount} sprints
${debtSection}${notesSection}`.trim();
}
