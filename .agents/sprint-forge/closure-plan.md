# Kyro — Unified Evolution Plan

> Fecha: 2026-03-07
> Versión actual: 3.0.0 (proyecto kyro-sprint-forge-reader completado, 10/10 sprints)
> Propósito: Plan unificado para el proyecto sucesor. Combina el closure del proyecto anterior, el diagnóstico de arquitectura, y todo el backlog pendiente en un solo documento ejecutable.
> Fuentes: `closure-plan.md` (original) + `markdown-architecture-evolution.md`

---

## Estado Final del Proyecto Anterior

| Metric | Value |
|--------|-------|
| Sprints | 10/10 completados |
| Tests | 147 passing (18 archivos) |
| Type errors | 0 |
| Build | Clean |
| Archivos fuente | 141 (.ts/.tsx) |
| Líneas de código | ~16,700 |
| Deuda resuelta | 20/23 |
| Deuda abierta | D21, D22, D23 (ninguna blocker) |

---

## Diagnóstico Arquitectónico

### Lo que está sólido (NO cambiar)

- **Markdown como source of truth** — git nativo, portabilidad, sin infraestructura, offline-first, legibilidad humana. Herramientas serias funcionan así: Obsidian, Jekyll, Hugo, Docusaurus.
- **Arquitectura de software** — separación limpia: filesystem → API routes → parsers puros → services → Zustand → components. Service layer permite swappear implementación. Parsers son funciones puras.
- **Tipos Zod** como source of truth para validación + inferencia de tipos.

### Problema 1 — Escrituras con Regex (CRITICO)

**Estado actual:** `patchTaskStatusInMarkdown()` usa regex para encontrar una línea y cambiar el símbolo del checkbox.

**Por qué no escala:**
- Cada nueva operación de escritura (mover tarea, editar título, reordenar) requiere un regex artesanal nuevo
- Edge cases se multiplican: brackets en títulos, sub-tareas indentadas, formatos sin task ref
- El patrón de fragilidad es inherente a find-and-replace en texto plano sin validación formal

**Ejemplo del problema:**
```markdown
- [x] **T1.1**: Create type schemas        ← regex lo encuentra
- [x] **T1.1**: Create "type [schemas]"    ← brackets en título, puede fallar
- [x] **T1.1**: Create schemas             ← sin task ref, patrón diferente
  - Subtask indentada                       ← regex no maneja profundidad
```

**Impacto:** Bloquea toda expansión de funcionalidad de escritura.

### Problema 2 — Queries Cross-File son O(n)

**Estado actual:** "Dame todas las tareas bloqueadas de todos los sprints" requiere: listar archivos → leer cada uno → parsear completo → filtrar en memoria.

**Tabla de escalabilidad:**

| Escenario | Archivos a parsear | Viable |
|-----------|-------------------|--------|
| 3 proyectos x 5 sprints | 15 | Si |
| 10 proyectos x 15 sprints | 150 | Lento |
| 50 proyectos x 30 sprints | 1,500 | Inaceptable |

El search index actual (`lib/search.ts`) usa fingerprint-based memoization (D18 resuelto), pero sigue reconstruyendo el índice completo cuando los datos cambian — sin invalidación incremental por archivo.

### Modelo de referencia: Obsidian

Obsidian demostró que markdown-first puede ser profesional y escalable. Su stack:

| Problema | Solución de Obsidian |
|----------|---------------------|
| Lectura rápida | Indice SQLite en memoria, se reconstruye al abrir vault. Markdown sigue siendo source of truth. |
| Escritura segura | No usa regex. Trabaja con modelo interno del documento (AST) y serializa al guardar. |
| Queries | Dataview plugin indexa frontmatter YAML, genera vistas tipo tabla/lista sin modificar archivos. |
| Plugins de escritura | Editor CodeMirror 6 con modelo de documento estructurado — operaciones son transformaciones del modelo, no find-and-replace. |
| Concurrencia | File watcher detecta cambios externos y recarga. Sync maneja conflictos con timestamps. |

**Lección clave:** No necesitamos ir a blocks como Notion — pero sí necesitamos las mismas capas de abstracción que Obsidian: AST writer + indice derivado.

### Lo que NO hacer (reglas del proyecto sucesor)

1. **No migrar a una base de datos relacional como source of truth** — perderias portabilidad, git tracking, y la esencia del proyecto
2. **No agregar más operaciones de escritura con regex** — cada una es deuda técnica acumulada
3. **No construir un editor WYSIWYG propio** — usar CodeMirror 6 o similar cuando llegue el momento
4. **No optimizar prematuramente** — el indice SQLite solo cuando las queries sean lentas
5. **No copiar Notion** — su modelo de blocks requiere DB relacional. El modelo de Obsidian (markdown + indice + AST) es el correcto para Kyro

---

## Deuda Técnica Heredada

Estos 3 items vienen del proyecto anterior. Se heredan al sucesor.

### D21: AI Integration Tests

**Qué**: `lib/ai/interpret.ts` solo tiene tests de tipos (contratos). No hay tests que verifiquen la calidad de clasificación del AI.

**Plan**:
1. Crear `lib/ai/__tests__/interpret.integration.test.ts`
2. Usar **recorded responses** — grabar respuestas reales de Claude y reproducirlas en tests
3. Alternativa: mock del `Anthropic` client que retorna JSON fixtures
4. Cubrir: input ambiguo, input multi-acción, input en español, input vacío, acciones desconocidas
5. Marcar como `integration` test group para que no corran en CI sin API key

**Esfuerzo**: Pequeño (1-2 horas)

### D22: Action Chaining

**Qué**: El AI puede sugerir acciones individuales pero no puede encadenar pasos (ej: "analiza findings y genera el siguiente sprint").

**Plan**:
1. Definir un `ActionChain` type: `ActionIntent[]` con dependencias entre pasos
2. Extender `interpretInstruction()` para detectar intents compuestos y retornar chains
3. UI: mostrar la cadena completa en el preview, ejecutar paso a paso con confirmación entre cada uno
4. Logging: cada paso se registra como actividad independiente
5. Limite de seguridad: máximo 5 acciones por cadena, confirmación obligatoria

**Esfuerzo**: Medio (4-6 horas)

### D23: Sprint Forge Integration Page

**Qué**: Pagina dedicada para Sprint Forge reemplazando agents tab. Se descartó en favor del wizard embebido en roadmap.

**Plan**:
1. Crear `components/pages/sprint-forge-page.tsx`
2. Secciones: generation history, project health metrics (debt count, finding resolution rate, sprint velocity), quick-action buttons
3. Reusar `assembleSprintContext()` para calcular métricas
4. Reemplazar "Agents" en `NAV_ITEMS` con "Sprint Forge"
5. Mover el wizard trigger aqui (además de mantenerlo en roadmap)

**Esfuerzo**: Medio (3-4 horas)

---

## Gaps Arquitectónicos

### C2: E2E Tests Desactualizados

**Estado actual**: Los tests de Playwright están rotos desde Sprint 4 (la UI cambió a read-only model). Solo los unit tests son confiables.

**Plan**:
1. Auditar `tests/e2e/` — identificar qué specs aún funcionan
2. Reescribir `navigation.spec.ts` para el modelo actual (sidebar → pages → sprint detail)
3. Agregar: kanban drag-drop flow, command palette search, sprint forge wizard
4. Configurar en CI: `pnpm test:e2e` debe correr en PRs

**Esfuerzo**: Medio (4-6 horas)
**Prioridad**: Alta — necesario antes de cambios grandes de UI/infra

### C3: Sanitización del CLI Spawn

**Estado actual**: `app/api/forge/generate/route.ts` pasa `body.prompt` como argumento a `spawn()`. Para uso local es seguro.

**Plan**:
1. Escribir el prompt a un archivo temporal y pasar el path del archivo al CLI (no el contenido como argumento)
2. Validar que `body.prompt` no contenga caracteres de escape de shell
3. Limitar el tamaño del prompt (max 50KB)

**Esfuerzo**: Pequeño (1-2 horas)
**Prioridad**: Baja — solo relevante si se expone a usuarios externos

### C4: URLs y Server-Side Rendering

**Estado actual**: Toda la navegación es client-side via Zustand. No hay URLs compartibles. No hay SSR.

**Plan**:
1. Ya se migró parcialmente a Next.js App Router (commit `c90fb0c`)
2. Completar: cada página debe tener su propia ruta (`/projects/[id]/sprints/[sprintId]`)
3. Server Components para data fetching inicial
4. Mantener Zustand para estado de UI (sidebar, modals, palette)
5. Beneficio: URLs compartibles, deep linking

**Esfuerzo**: Alto (6-8 horas)

---

## Evolución Arquitectónica (3 Fases)

Estas son las 3 fases core del proyecto sucesor. Cada una resuelve un problema diagnosticado y desbloquea funcionalidad nueva.

### Fase 1 — AST Writer (Reemplazar Regex)

**Problema que resuelve**: Problema 1 — escrituras frágiles con regex
**Prioridad**: CRITICA — bloquea toda expansión de escritura

**Objetivo**: Todas las escrituras a markdown pasan por un AST, nunca por regex.

**Stack**: `unified` + `remark-parse` + `remark-stringify`

**Flujo de escritura:**
```
Operación de escritura:
  1. Leer archivo markdown
  2. Parsear a AST con remark-parse
  3. Localizar nodo en el árbol (por tipo, posición, contenido)
  4. Modificar el nodo (cambiar status, texto, agregar hijo)
  5. Serializar AST de vuelta a markdown con remark-stringify
  6. Escribir archivo
```

**Ejemplo concreto — cambiar status de tarea:**
```typescript
// HOY (frágil):
const patched = content.replace(/^(\s*- \[).\](\s+.*title.*$)/m, `$1x]$2`);

// FUTURO (robusto):
const tree = remark.parse(content);
const taskNode = findListItem(tree, { textContains: title });
taskNode.checked = true;
const patched = remark.stringify(tree);
```

**Beneficios:**
- Cero regex para escrituras
- El AST entiende la estructura — no se confunde con brackets en títulos
- Serialización consistente (remark-stringify respeta el formato original)
- Cada nueva operación de escritura es una función sobre el árbol, no un patrón nuevo

**Archivos afectados:**
- `lib/file-format/serializers.ts` — reescribir con remark
- `app/api/projects/[id]/sprints/[sprintId]/tasks/[taskId]/route.ts` — usar nuevo writer
- Nuevo: `lib/file-format/ast-writer.ts` — capa de modificación sobre AST

**Esfuerzo estimado**: 2-3 sprints
**Prerequisito**: Ninguno

### Fase 2 — Indice SQLite (Cache, No Source of Truth)

**Problema que resuelve**: Problema 2 — queries O(n) cross-file
**Prioridad**: Alta — desbloquea búsquedas y métricas instantáneas

**Objetivo**: Queries instantáneas sin parsear archivos en cada request.

**Stack**: `better-sqlite3` o `sql.js` (SQLite en WASM para el browser)

**Flujo:**
```
Startup:
  1. Escanear todos los archivos markdown del workspace
  2. Parsear cada uno (con los parsers existentes)
  3. Insertar en SQLite: projects, sprints, tasks, findings, debt
  4. Calcular checksums (para invalidación incremental)

Query:
  SELECT * FROM tasks WHERE status = 'blocked' AND project_id = 'kyro'
  → instantáneo, sin I/O

File change detected (file watcher):
  1. Re-parsear solo el archivo modificado
  2. Actualizar solo sus rows en SQLite
  3. Emitir evento para que el UI se actualice
```

**Regla fundamental**: SQLite es un **indice derivado**. Si se corrompe o se borra, se reconstruye desde los archivos markdown. Markdown sigue siendo la verdad.

**Beneficios:**
- Queries cross-project instantáneas
- Search full-text con FTS5
- Aggregations (progreso, métricas, debt tracking) sin parsear
- Invalidación incremental (solo re-parsear archivos modificados)

**Archivos afectados:**
- Nuevo: `lib/index/sqlite.ts` — schema + CRUD del indice
- Nuevo: `lib/index/file-watcher.ts` — detección de cambios + re-indexación
- `lib/services/file/` — queries van contra SQLite en vez de filesystem
- `lib/search.ts` — reemplazar `buildSearchIndex()` con query a SQLite

**Esfuerzo estimado**: 2-3 sprints
**Prerequisito**: Fase 1 (opcional pero recomendado — las escrituras via AST generan eventos limpios para el indexer)

### File Watcher (Sub-fase de Fase 2)

**Objetivo**: Detectar cambios en archivos desde otras fuentes y recargar automáticamente.

**Comportamiento:**
- Monitorea el directorio del proyecto con `fs.watch()` o `chokidar`
- Cuando un archivo cambia externamente (ej: otro editor, git pull, sprint-forge CLI):
  1. Re-parsea solo ese archivo
  2. Actualiza el indice SQLite
  3. Emite evento al frontend (SSE o WebSocket)
  4. UI se actualiza sin reload manual

**Impacto**: Elimina la necesidad de "Refresh Project" manual. Kyro siempre refleja el estado actual del disco.

---

## Roadmap del Proyecto Sucesor

5 sprints que intercalan infraestructura (arquitectura) con producto (features/debt).

### Sprint 1 — AST Writer

**Origen**: Fase 1 de evolución arquitectónica
**Justificación**: Elimina el riesgo #1 (regex patching). Bloquea toda expansión de escritura.

**Scope detallado:**
1. Instalar `unified` + `remark-parse` + `remark-stringify`
2. Crear `lib/file-format/ast-writer.ts` con funciones:
   - `updateTaskStatus(content, taskTitle, newStatus)` — via AST
   - `appendTask(content, phase, taskTitle, taskRef?)` — via AST
   - `updateFrontmatterField(content, field, value)` — via AST
3. Migrar `patchTaskStatusInMarkdown()` de regex a AST writer
4. Migrar `patchSprintStatusInMarkdown()` de regex a AST writer
5. Migrar `appendTaskToMarkdown()` de regex a AST writer
6. Actualizar API routes que usan serializers: Sprint PUT, Tasks POST
7. Eliminar todos los regex de escritura de `serializers.ts`
8. Tests unitarios para cada operación del AST writer
9. Verificar round-trip: leer → parsear → modificar → serializar → el archivo se preserva

**Archivos afectados:**
- `lib/file-format/ast-writer.ts` (NUEVO)
- `lib/file-format/serializers.ts` (REESCRIBIR funciones de patch)
- `app/api/projects/[id]/sprints/[sprintId]/route.ts`
- `app/api/projects/[id]/sprints/[sprintId]/tasks/route.ts`

**Riesgo**: `remark-stringify` podría reformatear markdown existente (espaciado, listas). Necesita configuración cuidadosa para preservar formato original.

### Sprint 2 — E2E Tests + AI Integration Tests

**Origen**: C2 (E2E rotos) + D21 (AI tests)
**Justificación**: Estabilizar el test suite antes de cambios grandes de infraestructura.

**Scope detallado:**
1. Auditar `tests/e2e/` — listar specs que pasan vs rotos
2. Reescribir `navigation.spec.ts` para el modelo actual:
   - Sidebar navigation entre páginas
   - Sprint board → sprint detail drill-down
   - Finding drill-down
   - Breadcrumb navigation
3. Nuevo: `kanban.spec.ts` — drag-drop task → confirmation dialog → status change persisted
4. Nuevo: `command-palette.spec.ts` — Cmd+K → search → navigate to result
5. Nuevo: `sprint-forge-wizard.spec.ts` — open wizard → select findings → select debt → preview prompt → copy
6. Crear `lib/ai/__tests__/interpret.integration.test.ts`:
   - Mock del `Anthropic` client con JSON fixtures
   - Test: "update task X to done" → `update_task_status` action
   - Test: "go to roadmap" → `navigate` action
   - Test: ambiguous input → falls back to `search`
   - Test: empty input → handles gracefully
   - Test: Spanish input → classifies correctly
7. Configurar CI: `pnpm test:e2e` en PRs

**Archivos afectados:**
- `tests/e2e/navigation.spec.ts` (REESCRIBIR)
- `tests/e2e/kanban.spec.ts` (NUEVO)
- `tests/e2e/command-palette.spec.ts` (NUEVO)
- `tests/e2e/sprint-forge-wizard.spec.ts` (NUEVO)
- `lib/ai/__tests__/interpret.integration.test.ts` (NUEVO)

### Sprint 3 — URL Routing / SSR

**Origen**: C4 (no URLs, no SSR)
**Justificación**: Foundation para compartir y deep linking. Cada vista accesible por URL.

**Scope detallado:**
1. Definir URL schema:
   - `/` → workspace overview (redirect al proyecto activo)
   - `/projects/[id]` → project overview
   - `/projects/[id]/sprints` → sprint list
   - `/projects/[id]/sprints/[sprintId]` → sprint detail
   - `/projects/[id]/sprints/[sprintId]/board` → kanban board
   - `/projects/[id]/findings` → findings list
   - `/projects/[id]/findings/[findingId]` → finding detail
   - `/projects/[id]/roadmap` → roadmap view
   - `/projects/[id]/debt` → debt dashboard
   - `/projects/[id]/documents` → documents list
2. Crear App Router pages para cada ruta (Server Components donde posible)
3. Migrar data fetching de client-side `useEffect` a server-side `fetch` en page components
4. Mantener Zustand solo para estado de UI (sidebar collapsed, modals, command palette)
5. Actualizar `ContentRouter` para leer de URL params en vez de store
6. Actualizar sidebar links a `<Link href={...}>` en vez de `setActiveSidebarItem()`
7. Actualizar breadcrumbs para reflejar URL hierarchy
8. Preservar Cmd+K navigation (ahora usa `router.push()` en vez de store setters)

**Archivos afectados:**
- `app/` — nuevas carpetas de rutas
- `components/content-router.tsx` (REESCRIBIR o eliminar)
- `components/app-sidebar.tsx` (links en vez de store setters)
- `components/app-topbar.tsx` (breadcrumbs from URL)
- `lib/store.ts` (remover navigation state, mantener UI state)

**Riesgo**: Migración grande. Hacerlo incremental — primero las rutas principales, luego las secundarias.

### Sprint 4 — SQLite Index + File Watcher

**Origen**: Fase 2 de evolución arquitectónica
**Justificación**: Desbloquea queries instantáneas y auto-refresh.

**Scope detallado:**
1. Instalar `better-sqlite3` (server-side) o evaluar `sql.js` (WASM)
2. Crear `lib/index/sqlite.ts`:
   - Schema: `projects`, `sprints`, `tasks`, `findings`, `debt_items`, `documents`
   - `initIndex()` — crear tablas, escanear workspace, popular
   - `reindexFile(filePath)` — re-parsear un archivo y actualizar sus rows
   - `reindexProject(projectId)` — re-parsear todos los archivos de un proyecto
   - `query()` — wrapper tipado para queries comunes
3. Crear `lib/index/file-watcher.ts`:
   - Usar `chokidar` o `fs.watch()` para monitorear directorios de proyectos
   - On file change: `reindexFile()` → emit event
   - On file add/delete: `reindexProject()` → emit event
   - Debounce: 500ms para evitar re-index en cascada durante git operations
4. Activar FTS5 para búsqueda full-text:
   - Indexar: task titles, finding summaries, document content, sprint objectives
   - Reemplazar `buildSearchIndex()` en `lib/search.ts` con FTS5 query
5. Migrar `lib/services/file/` para queries contra SQLite:
   - `getProjects()` → `SELECT * FROM projects`
   - `getFindings(projectId)` → `SELECT * FROM findings WHERE project_id = ?`
   - Mantener filesystem read como fallback si SQLite no está inicializado
6. Agregar endpoint SSE o WebSocket para push de cambios al frontend:
   - File watcher detecta cambio → re-index → push event → UI actualiza
   - Elimina necesidad del botón "Refresh Project"
7. Checksums por archivo para invalidación incremental:
   - Almacenar hash del contenido en SQLite
   - En startup, comparar hash actual vs almacenado → solo re-parsear los que cambiaron
8. Tests: index build, incremental update, FTS5 search, file watcher events

**Regla fundamental**: SQLite es un **indice derivado**. Si se corrompe o se borra, se reconstruye desde los archivos markdown. Markdown sigue siendo la verdad.

**Archivos afectados:**
- `lib/index/sqlite.ts` (NUEVO)
- `lib/index/file-watcher.ts` (NUEVO)
- `lib/services/file/projects.file.ts` (migrar a queries SQLite)
- `lib/search.ts` (reemplazar buildSearchIndex con FTS5)
- `app/api/` routes (usar indice en vez de filesystem directo)

**Riesgo**: `better-sqlite3` requiere native bindings (puede complicar deploy). `sql.js` es WASM puro pero más lento. Evaluar en la primera tarea.

### Sprint 5 — Action Chaining

**Origen**: D22 (deuda heredada)
**Justificación**: Permite al AI ejecutar flujos multi-paso desde Cmd+K ("analiza findings y genera sprint").

**Scope detallado:**
1. Definir tipos:
   - `ActionChain`: `{ steps: ActionIntent[], currentStep: number }`
   - `ChainExecutionState`: `{ chain: ActionChain, results: Map<number, ActionResult> }`
2. Extender system prompt en `lib/ai/interpret.ts`:
   - Nuevo campo en respuesta: `chain: ActionIntent[]` (array cuando detecta multi-step)
   - Mantener retrocompatibilidad: acción simple retorna `chain` con 1 elemento
3. Extender UI en `command-palette.tsx`:
   - Preview card muestra todos los pasos de la cadena
   - Botón "Execute All" con confirmación por paso
   - Progress indicator: paso 1/3 → 2/3 → 3/3
   - Cualquier paso puede ser cancelado sin ejecutar los siguientes
4. Logging: cada paso se registra como actividad independiente con referencia a la cadena
5. Limite de seguridad: máximo 5 acciones por cadena, confirmación obligatoria entre pasos destructivos
6. Tests: chain detection, multi-step execution, cancellation mid-chain, activity logging

**Archivos afectados:**
- `lib/ai/interpret.ts` (extender tipos + system prompt)
- `components/command-palette.tsx` (chain UI)
- `lib/store.ts` (chain execution state si necesario)

---

## Assets Heredados

| Asset | Path | Rol en el sucesor |
|-------|------|-------------------|
| Codebase | `/Users/rperaza/joicodev/ideas/kyro` | Base — se evoluciona, no se reescribe |
| Este plan | `.agents/planning/closure-plan.md` | Input principal para INIT del sucesor |
| Diagnóstico original | `.agents/planning/markdown-architecture-evolution.md` | Referencia del "por qué" de cada decisión |
| Sprint history | `.agents/sprint-forge/kyro-sprint-forge-reader/sprints/` | Contexto de decisiones pasadas |
| Findings | `.agents/sprint-forge/kyro-sprint-forge-reader/findings/` | Base para nuevos findings |
| Growth-CEO strategy | `.agents/growth-ceo/strategic-overview.md` | Visión de producto |

---

## Re-entry Prompt (para iniciar el proyecto sucesor)

```
I'm starting the kyro-evolution project, the successor to kyro-sprint-forge-reader (v3.0.0, all 10 sprints complete).

Read these files in order:
1. /Users/rperaza/joicodev/ideas/kyro/.agents/planning/closure-plan.md (unified evolution plan — THE primary input)
2. /Users/rperaza/joicodev/ideas/kyro/.agents/planning/markdown-architecture-evolution.md (architecture diagnosis — reference)
3. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-sprint-forge-reader/sprints/SPRINT-10-ai-instruction-layer.md (last sprint retro + debt table)

Then use /sprint-forge to INIT the new project at:
.agents/sprint-forge/kyro-evolution/

The closure plan contains the full roadmap (5 sprints), detailed scope per sprint, files affected, risks, and inherited debt (D21-D23). Use it as the primary source for the new roadmap.
```

---

## Cierre

El proyecto `kyro-sprint-forge-reader` cumplió su objetivo: construir un cockpit funcional para sprint-forge sobre archivos markdown. 10 sprints, 41 commits, 147 tests, zero type errors, 20 deudas resueltas.

Lo que sigue no son parches — es evolución arquitectónica:
1. **AST Writer** elimina la fragilidad de regex
2. **E2E + AI tests** estabiliza antes de cambios grandes
3. **URL Routing** hace la app compartible
4. **SQLite Index + File Watcher** hace las queries instantáneas y el refresh automático
5. **Action Chaining** completa el AI layer

Markdown sigue siendo source of truth. Obsidian demostró que este modelo escala. Kyro sigue el mismo camino.
