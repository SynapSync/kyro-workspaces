# Finding: Store Sin Estados Async (Loading / Error)

## Summary

Todos los actions del store son síncronos. No existe soporte para estados de carga (`isLoading`), estados de error (`error`), ni mecanismos de retry. Cuando se conecten operaciones reales con la API, los componentes no tendrán forma de mostrar feedback al usuario durante operaciones asíncronas ni manejar errores de red.

## Severity / Impact

**high** — Bloquea la experiencia de usuario con datos reales. Sin loading/error states, las operaciones de API parecerán "congelarse" o fallar silenciosamente.

## Details

### Estado actual del store — solo datos, sin estados async

```typescript
interface AppState {
  projects: Project[]
  activities: AgentActivity[]
  activeProjectId: string
  // ... UI state
  // ✗ Sin: isLoading, error, lastFetched, etc.
}
```

### Qué necesita cada módulo

| Módulo | Loading State | Error State | Retry |
|--------|--------------|-------------|-------|
| Projects init | `projectsLoading` | `projectsError` | sí |
| Create project | `creatingProject` | `createProjectError` | no (usuario reintenta) |
| Documents | `documentsLoading` | `documentsError` | sí |
| Sprint actions | `sprintLoading` | `sprintError` | no |
| Task mutations | `taskMutating` | `taskError` | no |
| Members fetch | `membersLoading` | `membersError` | sí |

### Patrón recomendado — estados granulares

```typescript
interface AsyncState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  lastFetched: string | null  // ISO timestamp
}

// En el store:
interface AppState {
  projects: AsyncState<Project[]>
  // ...
}
```

### Impacto en componentes

Sin estos estados, los componentes no pueden:
- Mostrar skeletons mientras cargan datos
- Mostrar mensajes de error cuando una operación falla
- Deshabilitar botones durante operaciones en curso (double-submit)
- Reintentar automáticamente operaciones fallidas

## Affected Files

- `lib/store.ts` — necesita refactor del state shape y todos los actions
- `lib/types.ts` — agregar tipos `AsyncState<T>`, `LoadingState`
- Todos los componentes que usen data del store (necesitan consumir isLoading/error)

## Recommendations

1. Definir `AsyncState<T>` en `lib/types.ts`
2. Refactorizar el estado del store para envolver entidades principales en `AsyncState<T>`
3. Agregar actions: `setLoading(entity, bool)`, `setError(entity, error | null)`, `clearError(entity)`
4. Actualizar components de forma gradual: primero los que tendrán operaciones pesadas (Projects list, Documents editor)
5. Comenzar con loading states simples (`isLoading: boolean`) y evolucionar a granulares si es necesario — no over-engineer al inicio
