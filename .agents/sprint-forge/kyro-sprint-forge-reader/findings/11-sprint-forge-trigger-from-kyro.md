# Finding: Sprint Forge Trigger from Kyro

## Summary

Sprint-forge is a CLI/AI workflow. Generating a sprint requires setting up prompts, running an AI agent externally, waiting for output, then viewing the result in Kyro. Kyro can display results beautifully but can't trigger generation. The workflow is split across two tools, breaking the developer loop.

## Severity / Impact

**high** — This is the deepest pain point. Closing this loop transforms Kyro from "viewer of sprint-forge output" to "the interface for sprint-forge." The workflow becomes: see state → trigger → review → approve — all within the browser.

## Details

### Current Workflow (Broken Loop)

```
Developer sees state in Kyro
  → Leaves Kyro
    → Opens terminal
      → Composes sprint-forge prompt manually
        → Runs AI agent
          → Waits for output
            → Returns to Kyro to view result
```

### What Kyro Already Knows

Kyro has all the context needed to compose a sprint-forge prompt:
- Current project structure (sprints, findings, roadmap)
- Last sprint's recommendations and retro
- Open debt items across all sprints
- Unresolved findings
- Sprint numbering and version targets
- The `simple-git` package is already in dependencies

### What's Missing

1. No "Generate Sprint" action anywhere in the UI
2. No prompt composition logic
3. No way to detect new sprint files after external generation
4. No integration point with AI APIs or CLI tools

## Affected Files

- `components/pages/roadmap-page.tsx` — Add "Generate Sprint" button/wizard
- `lib/services/types.ts` — May need new service method for prompt composition
- `app/api/` — New route for sprint generation prompt
- `lib/store.ts` — Add sprint generation state

## Recommendations

1. Add a "Generate Next Sprint" button on the Roadmap page
2. Build a sprint generation wizard: select findings → select debt items → set version target → preview prompt
3. Output a ready-to-use sprint-forge prompt that copies to clipboard
4. Add a manual refresh button to detect new sprint files in the project directory
5. Future: Add `/api/forge/generate` route that writes the prompt file and optionally triggers Claude CLI
