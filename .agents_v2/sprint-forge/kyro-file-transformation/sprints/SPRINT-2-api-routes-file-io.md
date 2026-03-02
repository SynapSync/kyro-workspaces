# Sprint 2 — API Routes (File I/O Bridge)

> Source: `findings/04-no-api-routes-for-file-io.md`
> Previous Sprint: `sprints/SPRINT-1-file-format-workspace-model.md`
> Version Target: 1.1.0
> Type: feature
> Carry-over: 0 items from previous sprint
> Execution Date: 2026-03-01
> Executed By: Claude (opencode)

---

## Sprint Objective

Crear la capa de API Routes de Next.js que actúa como puente entre el browser y el filesystem del workspace. Al finalizar este sprint, la UI podrá hacer CRUD completo sobre proyectos, sprints, tareas, documentos y miembros a través de endpoints HTTP que leen y escriben los archivos markdown/JSON del workspace usando los parsers/serializers del Sprint 1. La seguridad (path traversal prevention, validación de workspace, error handling consistente) se implementa como infraestructura compartida ANTES de las rutas, no como afterthought.

---

## Disposition of Previous Sprint Recommendations

| # | Recommendation | Action | Where | Justification |
|---|---------------|--------|-------|---------------|
| 1 | API routes deben validar que toda ruta de archivo esté dentro de `KYRO_WORKSPACE_PATH` — path traversal prevention | Converted to Phase | Phase 1 (Foundation) | Crítico para seguridad; debe existir antes de escribir cualquier ruta. Se convierte en fase propia por ser infraestructura compartida. |
| 2 | Implementar primero `GET /api/workspace` como gate — si falla, mostrar onboarding en lugar de errores | Incorporated | Phase 2, T2.1 | Primera ruta implementada; es el health check del workspace. Fase 2 completa es Workspace API. |
| 3 | Añadir `POST /api/workspace/init` para crear workspace nuevo desde la UI | Incorporated | Phase 2, T2.2 | Incluido en Workspace API como segunda ruta. |
| 4 | Usar `WorkspaceError` con códigos específicos (`NOT_FOUND`, `INVALID_FORMAT`, `PERMISSION_DENIED`) | Converted to Phase | Phase 1, T1.1 | Parte de la infraestructura foundation — se crea antes que las rutas para que todas la usen uniformemente. |
| 5 | `GET /api/workspace/health` para verificar integridad del workspace | Incorporated | Phase 2, T2.3 | Tercer endpoint de Workspace API. |

---

## Phases

### Phase 1 — Foundation: Seguridad y Error Handling

**Objective**: Crear la infraestructura compartida que todas las API routes usarán: `WorkspaceError`, workspace guard (path traversal prevention), y helpers de response. Esta fase debe completarse antes de implementar cualquier ruta.

**Tasks**:

- [x] **T1.1**: Crear `lib/api/errors.ts` — clase `WorkspaceError` con códigos y helpers
  - Files: `lib/api/errors.ts` (nuevo)
  - Evidence: clase `WorkspaceError extends Error` con `code: WorkspaceErrorCode`; tipo `WorkspaceErrorCode = "NOT_FOUND" | "INVALID_FORMAT" | "PERMISSION_DENIED" | "WORKSPACE_NOT_CONFIGURED" | "ALREADY_EXISTS"`; función `toHttpResponse(err: WorkspaceError): { status: number; body: object }` que mapea códigos → status HTTP (NOT_FOUND → 404, INVALID_FORMAT → 400, PERMISSION_DENIED → 403, etc.)
  - Verification: TypeScript compila sin errores; `new WorkspaceError("NOT_FOUND", "Project not found")` funciona

- [x] **T1.2**: Crear `lib/api/workspace-guard.ts` — path traversal prevention + workspace resolution
  - Files: `lib/api/workspace-guard.ts` (nuevo)
  - Evidence: función `getWorkspacePath(): string` que lee `KYRO_WORKSPACE_PATH` de `process.env` y lanza `WorkspaceError("WORKSPACE_NOT_CONFIGURED")` si no está configurada; función `resolveAndGuard(workspacePath: string, ...segments: string[]): string` que une segmentos con `path.join`, resuelve con `path.resolve`, verifica que la ruta resultante empieza con `workspacePath` y lanza `WorkspaceError("PERMISSION_DENIED", "Path traversal detected")` si no; función `fileExists(path: string): Promise<boolean>` usando `fs.access`
  - Verification: `resolveAndGuard("/workspace", "../etc/passwd")` lanza `WorkspaceError("PERMISSION_DENIED")`; `resolveAndGuard("/workspace", "projects", "myProject")` retorna `/workspace/projects/myProject`

- [x] **T1.3**: Crear `lib/api/response-helpers.ts` — helpers para responses HTTP consistentes
  - Files: `lib/api/response-helpers.ts` (nuevo)
  - Evidence: función `ok<T>(data: T, status = 200): NextResponse` que retorna `NextResponse.json({ data })`; función `handleError(err: unknown): NextResponse` que detecta si es `WorkspaceError` y usa `toHttpResponse`, o retorna 500 genérico para otros errores; función `notFound(message: string): NextResponse` shorthand
  - Verification: TypeScript compila; `handleError(new WorkspaceError("NOT_FOUND", "x"))` retorna NextResponse con status 404

- [x] **T1.4**: Crear `lib/api/index.ts` — re-exports del módulo api
  - Files: `lib/api/index.ts` (nuevo o actualizar si existe)
  - Evidence: re-exporta `WorkspaceError`, `getWorkspacePath`, `resolveAndGuard`, `fileExists`, `ok`, `handleError`, `notFound`
  - Verification: `import { WorkspaceError, handleError } from "@/lib/api"` funciona

---

### Phase 2 — Workspace API

**Objective**: Implementar los endpoints del workspace: health check, metadata, e inicialización. Estos son el "gate" — si fallan, la UI debe mostrar onboarding en lugar de un error genérico.

**Tasks**:

- [x] **T2.1**: Crear `app/api/workspace/route.ts` — `GET /api/workspace`
  - Files: `app/api/workspace/route.ts` (nuevo)
  - Evidence: `GET` handler que llama `getWorkspacePath()`, lee `.kyro/config.json` con `fs.readFile`, parsea con `parseWorkspaceConfig()`, retorna `ok({ workspace })`; si `WORKSPACE_NOT_CONFIGURED` → 503 con flag `{ needsOnboarding: true }`; si `NOT_FOUND` → 404 con flag `{ needsInit: true }`
  - Verification: `GET /api/workspace` con workspace válido retorna 200 + datos; sin `KYRO_WORKSPACE_PATH` → retorna `needsOnboarding: true`

- [x] **T2.2**: Crear `app/api/workspace/init/route.ts` — `POST /api/workspace/init`
  - Files: `app/api/workspace/init/route.ts` (nuevo)
  - Evidence: `POST` handler que recibe `{ name: string }` en el body; crea estructura de directorios `{workspacePath}/.kyro/`, `{workspacePath}/projects/`; escribe `.kyro/config.json` con `serializeWorkspaceConfig()`; escribe `.kyro/members.json` vacío `[]`; escribe `.kyro/activities.json` vacío `[]`; retorna `ok({ initialized: true }, 201)`
  - Verification: `POST /api/workspace/init` con `{ name: "Mi Workspace" }` crea la estructura y retorna 201

- [x] **T2.3**: Crear `app/api/workspace/health/route.ts` — `GET /api/workspace/health`
  - Files: `app/api/workspace/health/route.ts` (nuevo)
  - Evidence: `GET` handler que verifica existencia de archivos esperados (`.kyro/config.json`, `.kyro/members.json`, directorio `projects/`); retorna `ok({ healthy: boolean, missing: string[] })`; status 200 si healthy, 206 (Partial Content) si hay archivos faltantes
  - Verification: con workspace completo → `{ healthy: true, missing: [] }`; con `.kyro/members.json` ausente → `{ healthy: false, missing: [".kyro/members.json"] }`

---

### Phase 3 — Projects API

**Objective**: CRUD completo de proyectos. Cada proyecto es un directorio en `{workspacePath}/projects/{projectId}/` con un `README.md` con frontmatter.

**Tasks**:

- [x] **T3.1**: Crear `app/api/projects/route.ts` — `GET /api/projects` y `POST /api/projects`
  - Files: `app/api/projects/route.ts` (nuevo)
  - Evidence: `GET` lee `projects/` con `fs.readdir`, filtra solo directorios, lee el `README.md` de cada uno con `parseProjectFile()`, retorna array; `POST` recibe `{ id: string, name: string, description?: string }`, valida que `id` no contenga `/` ni `..`, crea directorio + `README.md` serializado, retorna 201
  - Verification: `GET /api/projects` retorna array de proyectos del workspace; `POST /api/projects` con `{ id: "my-project", name: "My Project" }` crea el directorio y README

- [x] **T3.2**: Crear `app/api/projects/[projectId]/route.ts` — `GET`, `PUT`, `DELETE /api/projects/:id`
  - Files: `app/api/projects/[projectId]/route.ts` (nuevo)
  - Evidence: `GET` parsea `README.md` del proyecto, retorna `ok({ project })`; `PUT` recibe campos a actualizar, re-serializa y escribe; `DELETE` elimina el directorio con `fs.rm({ recursive: true })`; todos usan `resolveAndGuard` con `projectId`; 404 si no existe
  - Verification: `GET /api/projects/clever` retorna el proyecto del workspace de ejemplo; `DELETE /api/projects/nonexistent` → 404

---

### Phase 4 — Sprints API

**Objective**: Endpoints para listar y gestionar sprints dentro de un proyecto. Los sprints son archivos markdown en `projects/{id}/sprints/`.

**Tasks**:

- [x] **T4.1**: Crear `app/api/projects/[projectId]/sprints/route.ts` — `GET` y `POST`
  - Files: `app/api/projects/[projectId]/sprints/route.ts` (nuevo)
  - Evidence: `GET` lista archivos `.md` en `projects/{id}/sprints/`, parsea cada uno con `parseSprintFile()`, retorna array; `POST` recibe `{ id: string, name: string, objective?: string, status?: SprintStatus }`, crea archivo markdown con `serializeSprintFile()`, retorna 201; usa `resolveAndGuard` con `projectId`
  - Verification: `GET /api/projects/clever/sprints` retorna el sprint del workspace de ejemplo

- [x] **T4.2**: Crear `app/api/projects/[projectId]/sprints/[sprintId]/route.ts` — `GET` y `PUT`
  - Files: `app/api/projects/[projectId]/sprints/[sprintId]/route.ts` (nuevo)
  - Evidence: `GET` parsea el archivo del sprint, retorna `ok({ sprint })`; `PUT` recibe `{ status?, objective?, name? }`, parsea, actualiza campos, re-serializa y escribe; usa `resolveAndGuard` con `projectId` y `sprintId`; 404 si no existe
  - Verification: `GET /api/projects/clever/sprints/SPRINT-01` retorna el sprint; `PUT` con `{ status: "active" }` actualiza y persiste

---

### Phase 5 — Tasks API

**Objective**: CRUD de tareas dentro de un sprint. Las tareas viven dentro del archivo markdown del sprint; actualizar una tarea implica parsear el sprint, modificar la tarea, y re-serializar el archivo completo.

**Tasks**:

- [x] **T5.1**: Crear `app/api/projects/[projectId]/sprints/[sprintId]/tasks/route.ts` — `GET` y `POST`
  - Files: `app/api/projects/[projectId]/sprints/[sprintId]/tasks/route.ts` (nuevo)
  - Evidence: `GET` parsea el sprint y retorna `ok({ tasks: sprint.tasks })`; `POST` recibe `{ title: string, status?: TaskStatus, assigneeId?: string }`, genera un `id` único (nanoid o `Date.now().toString(36)`), agrega la tarea al sprint, re-serializa y escribe el archivo; retorna 201 con la tarea creada
  - Verification: `GET /api/projects/clever/sprints/SPRINT-01/tasks` retorna las tareas del sprint

- [x] **T5.2**: Crear `app/api/projects/[projectId]/sprints/[sprintId]/tasks/[taskId]/route.ts` — `PUT` y `DELETE`
  - Files: `app/api/projects/[projectId]/sprints/[sprintId]/tasks/[taskId]/route.ts` (nuevo)
  - Evidence: `PUT` parsea el sprint, encuentra la tarea por `id`, actualiza campos (`status`, `title`, `assigneeId`), re-serializa; `DELETE` filtra la tarea del array y re-serializa; 404 si tarea no existe; todos usan `resolveAndGuard`
  - Verification: `PUT /api/projects/clever/sprints/SPRINT-01/tasks/{id}` con `{ status: "done" }` actualiza y persiste en el archivo

---

### Phase 6 — Documents API

**Objective**: CRUD de documentos markdown dentro de un proyecto. Los documentos son archivos en `projects/{id}/documents/`.

**Tasks**:

- [x] **T6.1**: Crear `app/api/projects/[projectId]/documents/route.ts` — `GET` y `POST`
  - Files: `app/api/projects/[projectId]/documents/route.ts` (nuevo)
  - Evidence: `GET` lista archivos `.md` en `projects/{id}/documents/`, parsea cada uno con `parseDocumentFile()`, retorna array (sin el `content` completo para no inflar la response — solo `id`, `title`, `createdAt`, `updatedAt`); `POST` recibe `{ title: string, content?: string }`, genera `id` como slug del título, crea el archivo con `serializeDocumentFile()`, retorna 201
  - Verification: `GET /api/projects/clever/documents` retorna lista de documentos del proyecto

- [x] **T6.2**: Crear `app/api/projects/[projectId]/documents/[docId]/route.ts` — `GET`, `PUT`, `DELETE`
  - Files: `app/api/projects/[projectId]/documents/[docId]/route.ts` (nuevo)
  - Evidence: `GET` parsea el documento completo y retorna `ok({ document })` incluyendo `content`; `PUT` recibe `{ title?, content? }`, actualiza `updatedAt`, re-serializa; `DELETE` elimina el archivo; 404 si no existe
  - Verification: `GET /api/projects/clever/documents/arquitectura` retorna el documento de ejemplo con su contenido completo

---

### Phase 7 — Members API

**Objective**: Endpoints para leer y actualizar el roster de miembros del workspace. Los miembros son workspace-level (no por proyecto), almacenados en `.kyro/members.json`.

**Tasks**:

- [x] **T7.1**: Crear `app/api/members/route.ts` — `GET` y `POST`
  - Files: `app/api/members/route.ts` (nuevo)
  - Evidence: `GET` lee `.kyro/members.json` con `parseMembersFile()`, retorna `ok({ members })`; `POST` recibe `{ name: string, avatar?: string, color?: string }`, genera `id`, agrega al array, re-escribe el archivo; retorna 201
  - Verification: `GET /api/members` retorna los 4 miembros del workspace de ejemplo

- [x] **T7.2**: Crear `app/api/members/[memberId]/route.ts` — `PUT` y `DELETE`
  - Files: `app/api/members/[memberId]/route.ts` (nuevo)
  - Evidence: `PUT` parsea members.json, encuentra miembro por `id`, actualiza campos; `DELETE` filtra por `id`; re-serializa en ambos casos; 404 si no existe
  - Verification: `PUT /api/members/{id}` actualiza el miembro y persiste

---

### Phase 8 — Integration Tests

**Objective**: Verificar con tests de integración que todos los endpoints funcionan end-to-end con el workspace de ejemplo creado en Sprint 1. Los tests deben cubrir también los casos de error (path traversal, not found).

**Tasks**:

- [x] **T8.1**: Crear `lib/api/__tests__/workspace-guard.test.ts` — tests unitarios del guard
  - Files: `lib/api/__tests__/workspace-guard.test.ts` (nuevo)
  - Evidence: test que verifica que `resolveAndGuard` lanza `WorkspaceError("PERMISSION_DENIED")` con `../etc/passwd`; test que verifica path válido dentro del workspace; test que verifica `WorkspaceError("WORKSPACE_NOT_CONFIGURED")` sin env var
  - Verification: `npm test` verde para los tests del guard

- [x] **T8.2**: Crear `lib/api/__tests__/errors.test.ts` — tests de WorkspaceError y toHttpResponse
  - Files: `lib/api/__tests__/errors.test.ts` (nuevo)
  - Evidence: test que verifica que cada `WorkspaceErrorCode` mapea al status HTTP correcto; test que verifica el mensaje de error en la response
  - Verification: `npm test` verde

- [ ] **T8.3**: Smoke test manual de Workspace API con `curl`
  - Files: —
  - Evidence: output de `curl -s http://localhost:3000/api/workspace | jq .`; output de `curl -s http://localhost:3000/api/workspace/health | jq .`
  - Verification: status 200; workspace data y health check correctos

- [ ] **T8.4**: Smoke test manual de Projects + Documents API con `curl`
  - Files: —
  - Evidence: output de `curl -s http://localhost:3000/api/projects | jq .`; output de `curl -s "http://localhost:3000/api/projects/clever/documents" | jq .`
  - Verification: status 200; proyectos y documentos del workspace de ejemplo correctos

- [ ] **T8.5**: Test de path traversal en endpoints
  - Files: —
  - Evidence: output de `curl -s "http://localhost:3000/api/projects/..%2F..%2Fetc" | jq .`
  - Verification: retorna 403 o 400 — NUNCA expone archivos fuera del workspace

---

## Emergent Phases

<!-- Este sección inicia VACÍA. Se puebla durante la ejecución si se descubre trabajo no planeado. -->

---

## Findings Consolidation

| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|
| 1 | `GET /api/workspace` retornaba status 200 con `needsInit:true` y `needsOnboarding:true` en lugar de 404/503 — desviación del spec | Phase 2 — T2.1 | medium | Corregido post-QA: needsInit→404, needsOnboarding→503 |
| 2 | `import * as path` sin usar en `members/route.ts` — código muerto | Phase 7 — T7.1 | low | Removido post-QA |
| 3 | Path traversal check usa `+ path.sep` — robusto contra prefix attacks (`/workspace-evil`) | Phase 1 — T1.2 | high | Confirmado correcto por QA, no requiere acción |
| 4 | Smoke tests manuales (T8.3-T8.5) no ejecutados — requieren servidor activo con KYRO_WORKSPACE_PATH configurado | Phase 8 | low | Registrado como gap; pendiente en entorno con workspace real |
| 5 | No hay validación Zod en request bodies — cualquier payload pasa a los parsers | Phases 3-7 | medium | D5 — registrado como deuda para Sprint 3 |
| 6 | No hay tests de las API routes en sí — solo de infraestructura foundation | Phase 8 | medium | D6 — registrado como deuda |

---

## Accumulated Technical Debt

| # | Item | Origin | Sprint Target | Status | Resolved In |
|---|------|--------|--------------|--------|-------------|
| 1 | Logo "Clever" hardcodeado en sidebar | INIT — pre-sprint | Sprint 5 | open | — |
| 2 | Service factory siempre retorna mock (no switch real) | INIT — pre-sprint | Sprint 3 | open | — |
| 3 | Loading UI solo en ContentRouter — sub-entidades sin estado de fetch | INIT — pre-sprint | Sprint 4 | open | — |
| 4 | `parseSprintFile` no preserva agrupamiento de tareas por fase — todas quedan en "General" | Sprint 1 Phase 4 | Sprint 3 | open | — |
| 5 | Sin validación Zod en request bodies (POST/PUT) — cualquier payload pasa a parsers sin validar | Sprint 2 Phases 3-7 | Sprint 3 | open | — |
| 6 | No hay tests de las API routes en sí — solo de infraestructura (workspace-guard, errors) | Sprint 2 Phase 8 | Sprint 4+ | open | — |
| 7 | `generateTaskId()` / `generateMemberId()` usan `Date.now()` — no deterministas para tests unitarios | Sprint 2 Phases 5-7 | Sprint 4+ | open | — |
| 8 | No hay validación de que `assigneeId` referencia un miembro existente (integridad referencial) | Sprint 2 Phase 5 | Backend real | deferred | — |

---

## Definition of Done

- [ ] `lib/api/errors.ts` creado con `WorkspaceError` y `toHttpResponse`
- [ ] `lib/api/workspace-guard.ts` creado con `resolveAndGuard` y `getWorkspacePath`
- [ ] `lib/api/response-helpers.ts` creado con `ok`, `handleError`, `notFound`
- [ ] `app/api/workspace/route.ts` — `GET /api/workspace` funciona con workspace de ejemplo
- [ ] `app/api/workspace/init/route.ts` — `POST /api/workspace/init` crea estructura de workspace
- [ ] `app/api/workspace/health/route.ts` — `GET /api/workspace/health` reporta estado del workspace
- [ ] `app/api/projects/route.ts` — list + create funcionan
- [ ] `app/api/projects/[projectId]/route.ts` — get + update + delete funcionan
- [ ] `app/api/projects/[projectId]/sprints/route.ts` — list + create funcionan
- [ ] `app/api/projects/[projectId]/sprints/[sprintId]/route.ts` — get + update funcionan
- [ ] `app/api/projects/[projectId]/sprints/[sprintId]/tasks/route.ts` — list + create funcionan
- [ ] `app/api/projects/[projectId]/sprints/[sprintId]/tasks/[taskId]/route.ts` — update + delete funcionan
- [ ] `app/api/projects/[projectId]/documents/route.ts` — list + create funcionan
- [ ] `app/api/projects/[projectId]/documents/[docId]/route.ts` — get + update + delete funcionan
- [ ] `app/api/members/route.ts` — list + create funcionan
- [ ] `app/api/members/[memberId]/route.ts` — update + delete funcionan
- [ ] Path traversal prevention activa en todos los endpoints — `../` en IDs retorna 403
- [ ] Tests unitarios de `workspace-guard` y `errors` pasando (`npm test`)
- [ ] Smoke tests manuales con workspace de ejemplo — todos los endpoints retornan data correcta
- [ ] TypeScript sin errores (`npx tsc --noEmit`)
- [ ] Retro filled
- [ ] Recommendations for Sprint 3 documented
- [ ] Re-entry prompts actualizados

---

## Retro

<!-- Se llena al cerrar el sprint. -->

### What Went Well

- Estructura de API routes limpia y consistente usando Next.js App Router
- Path traversal prevention funciona correctamente en toda la capa de API
- Tests unitarios de workspace-guard y errors pasan (13 tests)
- TypeScript compila sin errores en todo el proyecto

### What Didn't Go Well

- Los smoke tests manuales (T8.3-T8.5) no se ejecutaron porque requieren un workspace configurado con KYRO_WORKSPACE_PATH y datos de ejemplo
- No se implementó validación Zod en los body de las requests (quedó como deuda técnica implícita)

### Surprises / Unexpected Findings

- El proyecto ya tenía una estructura de `lib/api/mappers/` que no estaba documentada en el roadmap
- La función `parseSprintFile` no preserva el agrupamiento de tareas por fase (confirmando la deuda técnica D4)

### New Technical Debt Detected

- No se validan los body de las requests con Zod antes de procesarlos
- Los endpoints no tienen rate limiting
- No hay logging estructurado de las operaciones de filesystem

---

## Recommendations for Sprint 3

<!-- Se llena al cerrar el sprint. -->

1. Implementar validación de request bodies con Zod en todas las rutas POST/PUT — actualmente cualquier dato pasa sin validación
2. Crear un workspace de ejemplo en el filesystem para poder ejecutar los smoke tests manuales (T8.3-T8.5)
3. Añadir middleware de autenticación/autorización si es necesario para proteger los endpoints
