# Finding: Architecture Layer Violations

## Summary

Service layer imports directly from UI components, creating circular dependencies that break tree-shaking and cause runtime errors in SSR.

## Severity / Impact

**high** — Causes circular dependencies and SSR failures.

## Details

The service layer in `lib/services/` imports types from `components/` which should be a one-way dependency. This creates a circular import chain.

### Current Import Graph

```
components/ → lib/services/ → components/  (circular!)
```

### Expected Import Graph

```
components/ → lib/services/ → lib/types/
```

## Affected Files

- `lib/services/foo.ts`
- `lib/services/bar.ts`
- `components/dashboard.tsx`
- `components/sidebar.tsx`

## Recommendations

1. Extract shared types to a separate module
2. Add lint rule for import boundaries
3. Create a barrel file for service types
