# Sprint 2 — Complete Store Entities

> Source: `findings/02-store-missing-entities.md`
> Previous Sprint: `sprints/SPRINT-1-ui-config.md`
> Version Target: —
> Type: debt
> Carry-over: 0 items from previous sprint
> Execution Date: 2026-02-28
> Executed By: Claude Sonnet 4.6

---

## Sprint Objective

Completar el store de Zustand con `TeamMember` como entidad de primer nivel: definir el tipo formal con Zod schema, agregar `members` al estado con CRUD actions, e inicializar desde `mock-data.ts`. Eliminar todos los imports directos de `mock-data` en componentes que no sea el store — `task-dialog.tsx` y `app-topbar.tsx` deberán acceder a miembros exclusivamente a través del store. Al cerrar este sprint, `mock-data.ts` solo será importado por `lib/store.ts`.

---

## Disposition of Previous Sprint Recommendations

| # | Recommendation | Action | Where | Justification |
|---|---------------|--------|-------|---------------|
| 1 | Prioritizar el import directo de `teamMembers` en `task-dialog.tsx` — confirmar si hay más componentes con este patrón | Incorporated | Phase 1, T1.1 | Auditoría completa ejecutada — solo `task-dialog.tsx` y `app-topbar.tsx` importan desde mock-data |
| 2 | Definir el tipo `TeamMember` con Zod schema desde el inicio de Sprint 2 | Incorporated | Phase 2, T2.1 | Primera tarea del sprint antes de tocar el store |
| 3 | Revisar `app-topbar.tsx` — puede contener user info u otras constantes de UI hardcodeadas | Incorporated | Phase 4, T4.2 | Confirmado: importa `teamMembers` directo + tiene `"TC"` hardcodeado — ambos se corrigen en este sprint |

---

## Phases

### Phase 1 — Audit de imports directos a mock-data

**Objective**: Mapear todos los componentes que bypasean el store e importan directamente de `mock-data.ts`.

**Tasks**:

- [x] **T1.1**: Buscar todos los imports de `lib/mock-data` fuera de `lib/store.ts`
  - Files: todo el codebase
  - Evidence: 2 componentes encontrados — `task-dialog.tsx:25` y `app-topbar.tsx:13`. El store (`lib/store.ts:12`) importa `mockProjects, mockActivities` — este import es intencional y se mantendrá hasta Sprint 3.
  - Verification: `grep -r "from.*mock-data"` en components/

---

### Phase 2 — Definir tipo `TeamMember`

**Objective**: Crear el Zod schema y tipo TypeScript para `TeamMember` en `lib/types.ts`, y añadir la anotación de tipo al array en `lib/mock-data.ts`.

**Tasks**:

- [x] **T2.1**: Agregar `TeamMemberSchema` y tipo `TeamMember` a `lib/types.ts`
  - Files: `lib/types.ts`
  - Evidence: Schema definido con `name: z.string()`, `avatar: z.string()`, `color: z.string()`; tipo `TeamMember` inferido via `z.infer`
  - Verification: TypeScript compila sin errores

- [x] **T2.2**: Anotar el array `teamMembers` en `lib/mock-data.ts` con el tipo `TeamMember[]`
  - Files: `lib/mock-data.ts`
  - Evidence: Import de `TeamMember` desde `./types`; array tipado explícitamente
  - Verification: TypeScript valida que los 4 miembros cumplen el schema

---

### Phase 3 — Agregar `members` al store

**Objective**: Incorporar `members: TeamMember[]` al estado del store con inicialización desde mock-data y actions CRUD.

**Tasks**:

- [x] **T3.1**: Agregar `members` al `AppState` interface y al estado inicial
  - Files: `lib/store.ts`
  - Evidence: Tipo `TeamMember` importado; `members: TeamMember[]` en interface; inicializado con `teamMembers` de mock-data
  - Verification: Store compila, `useAppStore(s => s.members)` disponible

- [x] **T3.2**: Agregar actions: `addMember`, `updateMember`, `removeMember`
  - Files: `lib/store.ts`
  - Evidence: 3 actions implementadas — add (append), update (map by name), remove (filter by name)
  - Verification: TypeScript compila, interface completa

---

### Phase 4 — Eliminar imports directos de mock-data en componentes

**Objective**: Reemplazar los 2 imports de `teamMembers` desde `mock-data` por acceso al store.

**Tasks**:

- [x] **T4.1**: Actualizar `task-dialog.tsx` — usar `useAppStore` para obtener members
  - Files: `components/kanban/task-dialog.tsx`
  - Evidence: Eliminado `import { teamMembers } from "@/lib/mock-data"`; agregado `useAppStore` + `const members = useAppStore(s => s.members)`; JSX actualizado a `members.map(...)`
  - Verification: Dialog de tareas muestra la lista de asignados correctamente

- [x] **T4.2**: Actualizar `app-topbar.tsx` — usar `useAppStore` para members + `currentUser` para avatar
  - Files: `components/app-topbar.tsx`
  - Evidence: Eliminado import de mock-data; agregados imports de `useAppStore` y `currentUser`; avatar del usuario usa `currentUser.initials`
  - Verification: Topbar muestra avatars del equipo correctamente; "TC" viene de `currentUser`

---

## Emergent Phases

<!-- Ninguna emergente -->

---

## Findings Consolidation

| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|
| 1 | `app-topbar.tsx` tenía `"TC"` hardcodeado para el avatar del usuario actual — el mismo patrón resuelto en Sprint 1 para el sidebar | Phase 1 | low | Corregido en T4.2 usando `currentUser.initials` |
| 2 | El store usa `name` como identificador natural de `TeamMember` (no hay `id`) — funciona para mock data pero será problemático con API real (IDs de BD) | Phase 3 | medium | D2 — registrado como deuda para cuando se defina el API contract (Sprint 4) |
| 3 | `task-dialog.tsx` es un componente "dumb" que recibe `onSave` como prop — el acceso al store dentro de él crea un pequeño acoplamiento que podría evitarse pasando `members` como prop. Se acepta por pragmatismo. | Phase 4 | low | Decisión de diseño aceptada; documentada aquí |

---

## Accumulated Technical Debt

| # | Item | Origin | Sprint Target | Status | Resolved In |
|---|------|--------|--------------|--------|-------------|
| D1 | Logo "Clever" hardcodeado en sidebar | Sprint 1 Phase 1 | — | deferred | — |
| D2 | `TeamMember` usa `name` como identificador — sin `id` formal, los updates/removes del store usan name como key. Frágil para API real con IDs de BD | Sprint 2 Phase 3 | Sprint 4 | open | — |

---

## Definition of Done

- [x] `TeamMember` Zod schema + tipo definidos en `lib/types.ts`
- [x] `teamMembers` en `lib/mock-data.ts` tipado como `TeamMember[]`
- [x] `members: TeamMember[]` en el store con init desde mock-data y actions CRUD
- [x] `task-dialog.tsx` sin imports de mock-data — usa `useAppStore`
- [x] `app-topbar.tsx` sin imports de mock-data — usa `useAppStore` + `currentUser`
- [x] Cero imports de `mock-data` en `components/` — solo `lib/store.ts` lo importa
- [x] TypeScript sin errores (`npx tsc --noEmit`)
- [x] Retro filled
- [x] Recommendations for Sprint 3 documented
- [x] Re-entry prompts updated

---

## Retro

### What Went Well

- Sprint limpio y predecible: el scope fue exactamente el estimado. Las 3 recomendaciones del Sprint 1 se resolvieron completamente.
- El hallazgo de `app-topbar.tsx` (recomendación 3 del Sprint 1) se confirmó y se resolvió en el mismo sprint — doble problema resuelto en una sola tarea.
- `npx tsc --noEmit` sin errores en el primer intento — la separación de tipos preparada en Sprint 1 facilitó añadir `TeamMember` sin fricción.

### What Didn't Go Well

- La decisión de usar `name` como identificador en las actions del store (`updateMember`, `removeMember`) es una deuda conocida — aceptable para mock data pero el Finding 2 la capturó correctamente.

### Surprises / Unexpected Findings

- `app-topbar.tsx` no estaba en el finding original pero tenía exactamente el mismo patrón que `task-dialog.tsx`. La recomendación del Sprint 1 de "revisar topbar" fue clave.

### New Technical Debt Detected

- D2: `TeamMember` usa `name` como clave natural — diferido a Sprint 4 cuando se defina el contrato de API.

---

## Recommendations for Sprint 3

1. **En Sprint 3 (service layer), el mock de `members` debe devolver el array directamente** — `MembersService.list()` puede retornar `state.members` desde el store o `teamMembers` desde mock-data, sin mapeos adicionales. La interfaz ya está definida.
2. **El único import de `mock-data` que queda en el codebase es el del store** (`mockProjects`, `mockActivities`, `teamMembers`). Sprint 3 debe moverlos a implementaciones `MockProjectsService`, `MockActivitiesService`, `MockMembersService` — el store dejará de importar mock-data directamente.
3. **Al crear los servicios mock, considerar agregar un delay artificial configurable** (e.g. 100-300ms) para simular latencia de red — facilitará validar los loading states que se agregarán en Sprint 4.
