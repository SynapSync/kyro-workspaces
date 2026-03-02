# Sprint 4 — Async States + API Contract Scaffold

> Source: `findings/04-store-no-async-states.md`, `findings/05-no-api-contract.md`
> Previous Sprint: `sprints/SPRINT-3-service-layer.md`
> Version Target: —
> Type: refactor
> Carry-over: 0 items from previous sprint
> Execution Date: 2026-02-28
> Executed By: Claude Sonnet 4.6

---

## Sprint Objective

Dos objetivos paralelos que cierran la migración:

1. **Async states**: Añadir `isInitializing` / `initError` al store y un action `initializeApp()` que carga datos desde la capa de servicios. El app mostrará un spinner mientras carga y un error si falla. Con mock data el efecto es imperceptible; con API real el patrón estará listo.

2. **API contract scaffold**: Crear `lib/api/` con el cliente fetch, los DTOs (especulativos, ajustables cuando el backend esté disponible) y los mappers DTO → Domain. Este scaffold es la última pieza para que conectar el backend real sea un intercambio de implementación, no un refactor.

Al finalizar este sprint, **la migración a mock data está completa** y el proyecto está listo para recibir un backend real.

---

## Disposition of Previous Sprint Recommendations

| # | Recommendation | Action | Where | Justification |
|---|---------------|--------|-------|---------------|
| 1 | Usar `services.projects.list()` para el async init del store — `initializeApp()` con `isLoading: true` mientras carga | Incorporated | Phase 2, T2.1 | Action `initializeApp()` implementado con Promise.all sobre los 3 servicios |
| 2 | Testear con `NEXT_PUBLIC_MOCK_DELAY_MS=300` para validar loading UI | Incorporated | Phase 3 | ContentRouter muestra spinner cuando `isInitializing: true`; delay configurable en .env.local |
| 3 | D2 (TeamMember sin id) relevante en Sprint 4 — añadir `id` opcional como preparación | Incorporated | Phase 5, T5.1 | `TeamMemberSchema` actualizado con `id: z.string().optional()`; DTOs en `lib/api/types.ts` incluyen `id` como campo requerido |

---

## Phases

### Phase 1 — Tipo `LoadingState` en `lib/types.ts`

**Objective**: Definir el tipo que representa el estado de inicialización asíncrona del store.

**Tasks**:

- [x] **T1.1**: Agregar `LoadingState` interface a `lib/types.ts`
  - Files: `lib/types.ts`
  - Evidence: Interface con `isInitializing: boolean` e `initError: string | null`
  - Verification: TypeScript compila

---

### Phase 2 — Async init en el store

**Objective**: Añadir los campos de loading state y el action `initializeApp()` al store de Zustand.

**Tasks**:

- [x] **T2.1**: Agregar `isInitializing`, `initError`, `initializeApp()` a `lib/store.ts`
  - Files: `lib/store.ts`
  - Evidence: Import de `services` desde `./services`; 2 campos de estado nuevos; action async que llama `Promise.all([services.projects.list(), services.members.list(), services.activities.list()])`, actualiza estado y maneja errores
  - Verification: TypeScript compila; `useAppStore(s => s.isInitializing)` disponible

---

### Phase 3 — `AppInitializer` y wire en providers

**Objective**: Llamar `initializeApp()` al montar la app, sin modificar el árbol de componentes existente.

**Tasks**:

- [x] **T3.1**: Agregar `AppInitializer` a `components/providers.tsx`
  - Files: `components/providers.tsx`
  - Evidence: Componente `AppInitializer` que llama `initializeApp()` en `useEffect`; montado dentro de `QueryClientProvider` antes de `{children}`
  - Verification: DevTools muestran que `initializeApp()` se llama al montar; datos se rehidratan desde servicios

---

### Phase 4 — Loading UI en `ContentRouter`

**Objective**: Mostrar feedback visual al usuario mientras `isInitializing === true`.

**Tasks**:

- [x] **T4.1**: Guard de loading en `components/content-router.tsx`
  - Files: `components/content-router.tsx`
  - Evidence: `isInitializing` extraído del store; guard al inicio del render que muestra spinner con `Loader2` de lucide-react cuando `isInitializing: true`; estado de error visible si `initError !== null`
  - Verification: Configurando `NEXT_PUBLIC_MOCK_DELAY_MS=500` el spinner es visible durante medio segundo

---

### Phase 5 — API contract scaffold

**Objective**: Crear la estructura `lib/api/` con el cliente fetch, DTOs especulativos y mappers stub. No se integra con nada todavía — es el andamiaje listo para cuando exista el backend.

**Tasks**:

- [x] **T5.1**: Agregar `id` opcional a `TeamMemberSchema` (D2)
  - Files: `lib/types.ts`
  - Evidence: `id: z.string().optional()` añadido al schema; los 4 miembros en mock-data siguen siendo válidos (campo opcional)
  - Verification: TypeScript compila; mock data inalterada

- [x] **T5.2**: Crear `lib/api/client.ts` — fetch wrapper
  - Files: `lib/api/client.ts` (nuevo)
  - Evidence: `apiFetch<T>()` con baseURL desde `NEXT_PUBLIC_API_URL`, headers de Content-Type, manejo de errores HTTP; `NEXT_PUBLIC_API_URL` añadido a `.env.local`
  - Verification: TypeScript compila; función exportada correctamente

- [x] **T5.3**: Crear `lib/api/types.ts` — DTOs especulativos
  - Files: `lib/api/types.ts` (nuevo)
  - Evidence: DTOs para ProjectDTO, TaskDTO, SprintDTO, DocumentDTO, TeamMemberDTO, AgentActivityDTO — en snake_case como es convención REST; comentario "speculative" en el archivo
  - Verification: TypeScript compila; sin imports de domain types (DTOs son independientes)

- [x] **T5.4**: Crear `lib/api/mappers/index.ts` — funciones de transformación DTO → Domain
  - Files: `lib/api/mappers/index.ts` (nuevo)
  - Evidence: Funciones `projectFromDTO`, `taskFromDTO`, `memberFromDTO`, `activityFromDTO`; cada una transforma snake_case a camelCase y mapea campos (e.g. `_id` → `id`)
  - Verification: TypeScript compila; funciones puras sin side-effects

---

## Emergent Phases

<!-- Ninguna emergente -->

---

## Findings Consolidation

| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|
| 1 | `initializeApp()` re-hidrata datos sobre el estado inicial del seed — en mock mode es redundante pero necesario para que el patrón async funcione con API real | Phase 2 | low | Aceptado — el re-fetch es instantáneo en mock mode; en API mode reemplazará el seed |
| 2 | `ContentRouter` es el único componente con loading UI — cuando hay sub-entidades cargando (e.g. documents de un proyecto) se necesitarán estados locales adicionales | Phase 4 | low | D4 — registrado como deuda; suficiente para el alcance actual |
| 3 | Los DTOs en `lib/api/types.ts` son especulativos — el backend real puede tener un contrato diferente | Phase 5 | medium | Comentado explícitamente en el archivo; son puntos de partida, no contratos definitivos |

---

## Accumulated Technical Debt

| # | Item | Origin | Sprint Target | Status | Resolved In |
|---|------|--------|--------------|--------|-------------|
| D1 | Logo "Clever" hardcodeado en sidebar | Sprint 1 Phase 1 | — | deferred | — |
| D2 | `TeamMember` usa `name` como identificador — frágil para API real | Sprint 2 Phase 3 | Sprint 4 | resolved | Sprint 4 |
| D3 | Service factory siempre retorna mock — switching real pendiente | Sprint 3 Phase 3 | Sprint 5+ | deferred | — |
| D4 | Loading UI solo en ContentRouter — sub-entidades (documents, sprints) sin estados de carga propios | Sprint 4 Phase 4 | Sprint 5+ | open | — |

---

## Definition of Done

- [x] `LoadingState` interface en `lib/types.ts`
- [x] `isInitializing`, `initError`, `initializeApp()` en el store
- [x] `AppInitializer` montado en `providers.tsx`
- [x] `ContentRouter` muestra spinner cuando `isInitializing: true` y error cuando `initError !== null`
- [x] `lib/api/client.ts` creado con `apiFetch<T>()`
- [x] `lib/api/types.ts` creado con DTOs especulativos
- [x] `lib/api/mappers/index.ts` creado con funciones de transformación
- [x] `TeamMemberSchema` actualizado con `id` opcional (D2 resuelto)
- [x] `.env.local` actualizado con `NEXT_PUBLIC_API_URL`
- [x] TypeScript sin errores (`npx tsc --noEmit`)
- [x] Retro filled
- [x] Re-entry prompts updated (sprint final — migración completa)

---

## Retro

### What Went Well

- `initializeApp()` + `AppInitializer` + loading guard en `ContentRouter` quedaron en 3 archivos distintos con responsabilidades claras — ningún componente de negocio se contamina con lógica de init.
- Los mappers en `lib/api/mappers/index.ts` son funciones puras tipadas — fáciles de testear unitariamente cuando llegue el momento.
- El patrón `AppInitializer` como componente null dentro de `Providers` es no-intrusivo: no modifica el árbol de UI y funciona con cualquier futuro provider que se agregue.
- 4 sprints, 0 regresiones, 0 errores TypeScript al cierre.

### What Didn't Go Well

- Los DTOs en `lib/api/types.ts` son especulativos — hay un riesgo real de que no coincidan con el contrato real del backend. Es una deuda conocida y documentada.

### Surprises / Unexpected Findings

- El `AppInitializer` dentro de `Providers` crea una dependencia de `useAppStore` dentro del provider tree de QueryClient — esto es correcto porque Zustand no necesita provider, pero es un detalle de orden que vale la pena documentar.

### New Technical Debt Detected

- D4: Loading UI solo en `ContentRouter` — sub-entidades sin estados de carga propios.

---

## Recommendations for Next Work

1. **Conectar el backend real**: Crear `ApiProjectsService`, `ApiMembersService`, `ApiActivitiesService` en `lib/services/api/` implementando las mismas interfaces de `lib/services/types.ts`. Activar con `NEXT_PUBLIC_USE_MOCK_DATA=false`.
2. **Ajustar los DTOs** en `lib/api/types.ts` una vez que el backend defina su contrato — los mappers en `lib/api/mappers/` absorberán cualquier diferencia sin tocar el store ni los componentes.
3. **Agregar autenticación**: Reemplazar `currentUser` en `lib/auth.ts` con el usuario real del contexto de auth (JWT/session). El punto de integración ya está aislado.
4. **Resolver D4** cuando haya sub-entidades con carga independiente: extender `LoadingState` con campos granulares (e.g. `isDocumentsLoading`) o adoptar React Query para queries individuales.
