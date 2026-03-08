---
title: "Finding: AI Action Chaining"
created: 2026-03-07
severity: medium
agents:
  - claude-opus-4-6
---

# Finding: AI Action Chaining

## Summary

The AI interpret layer (`lib/ai/interpret.ts`) can only suggest single actions. Users cannot issue compound instructions like "analyze findings and generate the next sprint" — these require manual multi-step interaction through the command palette.

## Severity / Impact

**medium** — Quality-of-life improvement for power users. Not blocking any core functionality, but limits the AI layer's usefulness for multi-step workflows.

## Details

### Current behavior

`interpretInstruction()` classifies natural language into exactly one of 5 action types:
- `update_task_status`
- `generate_sprint`
- `refresh_project`
- `navigate`
- `search`

A compound instruction like "mark T3.2 as done and then refresh the project" gets classified as only one of these, losing the second action.

### Proposed solution — ActionChain

```typescript
type ActionChain = {
  steps: ActionIntent[];
  currentStep: number;
};

type ChainExecutionState = {
  chain: ActionChain;
  results: Map<number, ActionResult>;
};
```

- Extend system prompt to detect multi-step intents and return `chain: ActionIntent[]`
- Single actions return a chain with 1 element (backward compatible)
- UI shows all steps in preview card, executes with confirmation between steps
- Maximum 5 actions per chain, mandatory confirmation for destructive steps

### Activity logging

Each step in a chain is logged as an independent activity with a reference to the parent chain. This preserves the audit trail granularity.

## Affected Files

- `lib/ai/interpret.ts` — extend types + system prompt for chain detection
- `components/command-palette.tsx` — chain preview UI, step-by-step execution
- `lib/store.ts` — chain execution state (if needed)
- `lib/types.ts` — `ActionChain`, `ChainExecutionState` types

## Recommendations

1. Define `ActionChain` and `ChainExecutionState` types
2. Extend `interpretInstruction()` to detect compound intents
3. Build chain preview card in command palette (show all steps, progress indicator)
4. Implement step-by-step execution with confirmation between destructive steps
5. Log each step as independent activity with chain reference
6. Set safety limit: max 5 actions per chain
7. Test: chain detection, multi-step execution, mid-chain cancellation
