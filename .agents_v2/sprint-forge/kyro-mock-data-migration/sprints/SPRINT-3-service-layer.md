# Sprint 3 — Data Service Layer

> Source: `findings/03-no-data-service-layer.md`
> Previous Sprint: `sprints/SPRINT-2-store-entities.md`
> Version Target: —
> Type: refactor
> Carry-over: 0 items from previous sprint
> Execution Date: 2026-02-28
> Executed By: Claude Sonnet 4.6

---

## Sprint Objective

Crear una capa de servicios que abstraiga el origen de los datos (mock vs API real) del store y los componentes. Al finalizar:
- `lib/services/` tendrá interfaces tipadas y sus implementaciones mock
- `lib/store.ts` dejará de importar `mock-data.ts` directamente — solo usará la capa de servicios
- Un archivo `.env.local` documentará el feature flag `NEXT_PUBLIC_USE_MOCK_DATA`
- La app seguirá funcionando exactamente igual (zero cambio de comportamiento visible)

Este sprint es el andamiaje que Sprint 4 necesita para conectar los async states.

---

## Disposition of Previous Sprint Recommendations

| # | Recommendation | Action | Where | Justification |
|---|---------------|--------|-------|---------------|
| 1 | `MembersService.list()` puede retornar `state.members` del store o `teamMembers` de mock-data sin mapeos adicionales | Incorporated | Phase 2, T2.3 | MockMembersService implementa `list()` retornando el array de mock-data directamente |
| 2 | Sprint 3 debe mover `mockProjects`, `mockActivities`, `teamMembers` a implementaciones MockXService — el store deja de importar mock-data | Incorporated | Phase 3, T3.1 | Store reemplaza imports directos de mock-data con `getInitialState()` de services/mock/seed |
| 3 | Considerar delay artificial configurable en mock services para simular latencia | Incorporated | Phase 2 | MockServices incluyen `MOCK_DELAY_MS` configurable via env var (default 0) |

---

## Phases

### Phase 1 — Diseñar interfaces de servicios

**Objective**: Definir los contratos que deben cumplir tanto las implementaciones mock como las reales.

**Tasks**:

- [x] **T1.1**: Crear `lib/services/types.ts` con interfaces `ProjectsService`, `MembersService`, `ActivitiesService`
  - Files: `lib/services/types.ts` (nuevo)
  - Evidence: 3 interfaces definidas — cada una con método `list(): Promise<T[]>`; interfaz principal `AppServices` que agrupa las tres
  - Verification: TypeScript compila sin errores

---

### Phase 2 — Implementaciones mock

**Objective**: Crear las clases mock que implementan las interfaces retornando los datos de `mock-data.ts`.

**Tasks**:

- [x] **T2.1**: Crear `lib/services/mock/projects.mock.ts` — MockProjectsService
  - Files: `lib/services/mock/projects.mock.ts` (nuevo)
  - Evidence: Implementa `ProjectsService`; retorna `mockProjects` envueltos en `Promise.resolve()` con delay opcional
  - Verification: Implementa la interfaz completa

- [x] **T2.2**: Crear `lib/services/mock/activities.mock.ts` — MockActivitiesService
  - Files: `lib/services/mock/activities.mock.ts` (nuevo)
  - Evidence: Implementa `ActivitiesService`; retorna `mockActivities`
  - Verification: Implementa la interfaz completa

- [x] **T2.3**: Crear `lib/services/mock/members.mock.ts` — MockMembersService
  - Files: `lib/services/mock/members.mock.ts` (nuevo)
  - Evidence: Implementa `MembersService`; retorna `teamMembers`
  - Verification: Implementa la interfaz completa

- [x] **T2.4**: Crear `lib/services/mock/seed.ts` — función `getInitialState()` sincrónica
  - Files: `lib/services/mock/seed.ts` (nuevo)
  - Evidence: Función sync que retorna `{ projects, members, activities }` desde mock-data; este es el ÚNICO punto de acceso al store durante la init síncrona
  - Verification: Exporta los tres arrays con sus tipos correctos

---

### Phase 3 — Factory y registro de servicios

**Objective**: Crear el punto de entrada único para los servicios y desacoplar el store de mock-data.

**Tasks**:

- [x] **T3.1**: Crear `lib/services/index.ts` — factory y singleton `services`
  - Files: `lib/services/index.ts` (nuevo)
  - Evidence: Exporta `services` con instancias de MockXService; exporta re-exports de interfaces y tipos para que consumers no necesiten importar de `types.ts` directamente
  - Verification: TypeScript compila; `services.projects.list()` retorna `Promise<Project[]>`

- [x] **T3.2**: Actualizar `lib/store.ts` — eliminar import directo de mock-data
  - Files: `lib/store.ts`
  - Evidence: `import { mockProjects, mockActivities, teamMembers }` eliminado; reemplazado con `import { getInitialState } from "./services/mock/seed"`; estado inicial usa `getInitialState()`
  - Verification: Store compila; app funciona igual que antes

---

### Phase 4 — Env config y documentación

**Objective**: Documentar el feature flag y crear el archivo de configuración de entorno.

**Tasks**:

- [x] **T4.1**: Crear `.env.local` con `NEXT_PUBLIC_USE_MOCK_DATA=true`
  - Files: `.env.local` (nuevo)
  - Evidence: Archivo creado; comentario explica el propósito
  - Verification: Archivo en la raíz del proyecto

---

## Emergent Phases

<!-- Ninguna emergente -->

---

## Findings Consolidation

| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|
| 1 | Documents y Sprints son entidades anidadas dentro de Project — no necesitan servicios propios por ahora; `ProjectsService.list()` devuelve proyectos con toda la data anidada | Phase 1 | low | Decisión de diseño aceptada: 3 servicios raíz (projects, members, activities); sub-entidades van embebidas |
| 2 | El feature flag `NEXT_PUBLIC_USE_MOCK_DATA` se define en `.env.local` pero el factory de Sprint 3 siempre usa mock — la lógica de switching real se implementa cuando exista una `ApiXService` | Phase 3 | low | Comentado en `services/index.ts`; D3 registrado como deuda |

---

## Accumulated Technical Debt

| # | Item | Origin | Sprint Target | Status | Resolved In |
|---|------|--------|--------------|--------|-------------|
| D1 | Logo "Clever" hardcodeado en sidebar | Sprint 1 Phase 1 | — | deferred | — |
| D2 | `TeamMember` usa `name` como identificador — frágil para API real con IDs de BD | Sprint 2 Phase 3 | Sprint 4 | open | — |
| D3 | Service factory siempre retorna implementaciones mock — lógica de switching mock/API pendiente hasta que exista `ApiXService` | Sprint 3 Phase 3 | Sprint 5+ | deferred | — |

---

## Definition of Done

- [x] `lib/services/types.ts` creado con interfaces `ProjectsService`, `MembersService`, `ActivitiesService`, `AppServices`
- [x] `lib/services/mock/projects.mock.ts`, `members.mock.ts`, `activities.mock.ts` creados
- [x] `lib/services/mock/seed.ts` con `getInitialState()` sincrónica
- [x] `lib/services/index.ts` con singleton `services` exportado
- [x] `lib/store.ts` sin imports directos de `mock-data.ts`
- [x] `.env.local` creado con `NEXT_PUBLIC_USE_MOCK_DATA=true`
- [x] TypeScript sin errores (`npx tsc --noEmit`)
- [x] App funciona igual (zero cambio de comportamiento)
- [x] Retro filled
- [x] Recommendations for Sprint 4 documented
- [x] Re-entry prompts updated

---

## Retro

### What Went Well

- La separación en `seed.ts` (sync, para init del store) + `MockXService` (async, para Sprint 4) quedó limpia — resuelve el problema de que Zustand's `create()` es síncrono sin sacrificar la interfaz async de los servicios.
- `mock-data.ts` ahora solo es accesible desde `lib/services/mock/` — el aislamiento es completo y verificable con grep.
- El delay configurable `NEXT_PUBLIC_MOCK_DELAY_MS` agrega valor inmediato para testing de Sprint 4 sin complejidad adicional.
- TypeScript sin errores en el primer intento.

### What Didn't Go Well

- `seed.ts` y `MockXService` acceden ambos a mock-data por separado (duplicación de imports). Podría unificarse, pero es una micro-deuda que no vale la complejidad ahora.

### Surprises / Unexpected Findings

- Documents y Sprints son entidades anidadas en Project — no necesitan servicios propios. `ProjectsService.list()` devuelve todo el árbol. Esto es la decisión correcta para ahora, pero si el backend devuelve proyectos sin sus hijos y requiere llamadas separadas, habrá que agregar `SprintsService` y `DocumentsService` en el futuro.

### New Technical Debt Detected

- D3: Service factory siempre retorna implementaciones mock — switching real diferido.

---

## Recommendations for Sprint 4

1. **Usar `services.projects.list()` para el async init del store**: Sprint 4 debe reemplazar el estado inicial sincrónico (`projects: initialProjects`) por un `initializeApp()` action que llama `await services.projects.list()` y actualiza el store — con `isLoading: true` mientras carga.
2. **Testear con `NEXT_PUBLIC_MOCK_DELAY_MS=300`** antes de implementar los skeletons de loading — así se puede validar visualmente que el estado de carga se muestra correctamente.
3. **D2 (TeamMember sin id) se vuelve relevante en Sprint 4**: cuando `updateMember`/`removeMember` se conviertan en calls async a la API, necesitarán un `id` real. Considerar añadir un campo `id` opcional al schema de `TeamMember` en Sprint 4 como preparación.
