# Sprint 1 — UI Config & Mock User

> Source: `findings/01-ui-constants-scattered.md`
> Previous Sprint: None
> Version Target: —
> Type: debt
> Carry-over: 0 items from previous sprint
> Execution Date: 2026-02-28
> Executed By: Claude Sonnet 4.6

---

## Sprint Objective

Extraer todas las constantes de configuración de UI que actualmente viven dispersas en componentes y en `lib/types.ts` hacia un módulo centralizado `lib/config.ts`. Adicionalmente, crear `lib/auth.ts` con un mock del usuario actual que reemplazará el user info hardcodeado en el sidebar, preparando el punto de integración para cuando exista autenticación real.

Al final del sprint, ningún componente debe definir constantes de configuración inline, y `lib/types.ts` debe exportar únicamente tipos y schemas Zod.

---

## Disposition of Previous Sprint Recommendations

*No aplica — Sprint 1, sin sprint previo.*

---

## Phases

### Phase 1 — Audit de constantes hardcodeadas

**Objective**: Identificar y documentar todos los valores de configuración UI hardcodeados en el codebase antes de moverlos.

**Tasks**:

- [x] **T1.1**: Confirmar todos los valores hardcodeados en `components/kanban/task-card.tsx`
  - Files: `components/kanban/task-card.tsx`
  - Evidence: `priorityConfig` (líneas 19-36) — 4 entradas: low, medium, high, urgent con label y className
  - Verification: Leer el archivo y listar valores

- [x] **T1.2**: Confirmar todos los valores hardcodeados en `components/app-sidebar.tsx`
  - Files: `components/app-sidebar.tsx`
  - Evidence: `navItems` (líneas 35-41) — 5 items; user info "Tahlia Chen", "tahlia@clever.dev", "TC" (líneas 298-309); logo texto "Clever" (línea 124)
  - Verification: Leer el archivo y listar valores

- [x] **T1.3**: Confirmar constantes en `lib/types.ts`
  - Files: `lib/types.ts`
  - Evidence: `SPRINT_SECTIONS` (líneas 124-155) — constante de configuración con metadata de UI; `COLUMNS` (líneas 159-165) — array de config de columnas kanban
  - Verification: Leer el archivo y listar valores

---

### Phase 2 — Crear `lib/config.ts`

**Objective**: Consolidar todas las constantes de UI en un único módulo de configuración con tipos apropiados.

**Tasks**:

- [x] **T2.1**: Crear `lib/config.ts` con `PRIORITY_CONFIG`, `NAV_ITEMS`, `COLUMNS` y `SPRINT_SECTIONS`
  - Files: `lib/config.ts` (nuevo)
  - Evidence: Archivo creado con 4 secciones: priority config, nav items con tipo LucideIcon, columns config, sprint sections metadata
  - Verification: TypeScript sin errores, valores idénticos a los originales

---

### Phase 3 — Crear `lib/auth.ts`

**Objective**: Centralizar el mock del usuario actual en un módulo que luego será reemplazado por el contexto de autenticación real.

**Tasks**:

- [x] **T3.1**: Crear `lib/auth.ts` con tipo `User` y mock `currentUser`
  - Files: `lib/auth.ts` (nuevo)
  - Evidence: Tipo User con name, email, avatar, initials; mock con valores actuales del sidebar
  - Verification: Exporta correctamente, importable desde componentes

---

### Phase 4 — Limpiar `lib/types.ts`

**Objective**: Eliminar las constantes (`SPRINT_SECTIONS`, `COLUMNS`) de `lib/types.ts` para que solo exporte tipos y schemas Zod. Mantener la interfaz `SprintSectionMeta` ya que es un tipo, no una constante de config.

**Tasks**:

- [x] **T4.1**: Eliminar `SPRINT_SECTIONS` y `COLUMNS` de `lib/types.ts` y añadir import desde `lib/config.ts` para no romper consumers existentes
  - Files: `lib/types.ts`
  - Evidence: Constantes removidas del archivo; re-exportadas desde config.ts
  - Verification: Build exitoso, sin imports rotos

---

### Phase 5 — Actualizar consumers

**Objective**: Reemplazar definiciones inline en los componentes por imports desde `lib/config.ts` y `lib/auth.ts`.

**Tasks**:

- [x] **T5.1**: Actualizar `components/kanban/task-card.tsx` — import `PRIORITY_CONFIG`
  - Files: `components/kanban/task-card.tsx`
  - Evidence: Eliminada `const priorityConfig = {...}` inline; añadido `import { PRIORITY_CONFIG } from "@/lib/config"`; uso renombrado a `PRIORITY_CONFIG[task.priority]`
  - Verification: Task cards muestran prioridades correctamente

- [x] **T5.2**: Actualizar `components/app-sidebar.tsx` — import `NAV_ITEMS` y `currentUser`
  - Files: `components/app-sidebar.tsx`
  - Evidence: Eliminada `const navItems = [...]` inline; eliminados valores de user hardcodeados; añadidos imports desde `lib/config` y `lib/auth`; sidebar footer usa `currentUser.name`, `currentUser.email`, `currentUser.initials`
  - Verification: Sidebar muestra navegación y user info correctamente

---

## Emergent Phases

<!-- Ninguna emergente en este sprint -->

---

## Findings Consolidation

| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|
| 1 | `navItems` en sidebar necesita `LucideIcon` como tipo del icon — no existía interface formal | Phase 1 | low | Definida `NavItem` interface en `lib/config.ts` |
| 2 | `SPRINT_SECTIONS` en `lib/types.ts` mezcla la interface `SprintSectionMeta` (tipo) con la constante (config) — separación limpia necesaria | Phase 1 | low | Interface mantenida en `types.ts`, constante movida a `config.ts` |
| 3 | El logo "Clever" en el sidebar es texto hardcodeado — por ahora se mantiene ya que requiere decisión de producto sobre branding dinámico | Phase 1 | low | D1 — debt registrado, diferido a decisión futura |

---

## Accumulated Technical Debt

| # | Item | Origin | Sprint Target | Status | Resolved In |
|---|------|--------|--------------|--------|-------------|
| D1 | Logo/brand name "Clever" hardcodeado en sidebar — requiere decisión de producto | Sprint 1 Phase 1 | — | deferred | — |

---

## Definition of Done

- [x] `lib/config.ts` creado con `PRIORITY_CONFIG`, `NAV_ITEMS`, `COLUMNS`, `SPRINT_SECTIONS`
- [x] `lib/auth.ts` creado con tipo `User` y mock `currentUser`
- [x] `lib/types.ts` no exporta constantes de UI — solo tipos y schemas Zod (re-exporta desde config para no romper imports)
- [x] `components/kanban/task-card.tsx` importa `PRIORITY_CONFIG` desde `lib/config`
- [x] `components/app-sidebar.tsx` importa `NAV_ITEMS` desde `lib/config` y `currentUser` desde `lib/auth`
- [x] Ningún componente define constantes de config inline
- [x] `next build` exitoso — `npx tsc --noEmit` sin errores
- [x] Accumulated debt table actualizada
- [x] Retro filled
- [x] Recommendations for Sprint 2 documented
- [x] Re-entry prompts updated

---

## Retro

### What Went Well

- Separación limpia: `lib/config.ts` y `lib/auth.ts` quedaron con responsabilidades claras y sin circular deps
- La interfaz `SprintSectionMeta` quedó correctamente en `lib/types.ts` (es un tipo, no una constante) — decisión de diseño que se confirmó al ejecutar
- Todos los consumers se actualizaron sin friction — la surface de cambios fue predecible

### What Didn't Go Well

- El error TypeScript en `sprint-board.tsx` (`columnTasks` con `{}` como tipo de early return) era pre-existente pero no visible antes — fue descubierto al separar imports. Requirió un fix adicional no planeado.

### Surprises / Unexpected Findings

- `task-dialog.tsx` importaba `teamMembers` directamente desde `lib/mock-data` — hallazgo relevante para Sprint 2 (exactamente el problema que finding 02 describe)
- 8 archivos en total usaban `COLUMNS` o `SPRINT_SECTIONS` (más de los 3 estimados en el finding)

### New Technical Debt Detected

- D1: Logo "Clever" hardcodeado — diferido por ser decisión de producto

---

## Recommendations for Sprint 2

1. **Prioritizar el import directo de `teamMembers` en `task-dialog.tsx`** (línea 25): este componente importa de `mock-data` directamente, exactamente el patrón que Sprint 2 debe eliminar. Confirmar si hay más componentes con este patrón antes de empezar el sprint.
2. **Definir el tipo `TeamMember` con Zod schema** desde el inicio de Sprint 2 para que todos los accesos a miembros queden validados en tiempo de compilación.
3. **Revisar si `app-topbar.tsx` tiene data hardcodeada** — no fue analizado en INIT, puede contener user info u otras constantes de UI.
