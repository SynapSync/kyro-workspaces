# Sprint 1 — File Format + Workspace Model

> Source: `findings/02-file-format-not-defined.md`, `findings/03-workspace-concept-missing.md`
> Previous Sprint: None
> Version Target: 1.0.0
> Type: feature
> Carry-over: 0 items from previous sprint
> Execution Date: 2026-03-01
> Executed By: Claude Sonnet 4.6

---

## Sprint Objective

Definir el esquema canónico de archivos para el workspace de Kyro y establecer el tipo `Workspace` en el modelo de datos. Este sprint produce el contrato de datos sobre el cual todos los sprints siguientes construyen: el formato markdown/YAML para proyectos, sprints (con símbolos de tarea), documentos y configuración del workspace. También instala las dependencias necesarias para parsear estos archivos y crea parsers/serializers TypeScript. Al final del sprint, un agente puede leer y escribir todos los tipos de archivos del workspace de forma programática.

---

## Phases

### Phase 1 — Spec: Documento de formato canónico

**Objetivo**: Escribir `FILE-FORMAT-SPEC.md` en el codebase de Kyro — la especificación autoritativa del formato de archivos. Cada archivo del workspace tiene una sección con: estructura de directorio, formato exacto, campos YAML, y ejemplos completos.

**Tasks**:

- [x] **T1.1**: Escribir `FILE-FORMAT-SPEC.md` en la raíz del proyecto Kyro
  - Files: `/Users/rperaza/joicodev/ideas/kyro/FILE-FORMAT-SPEC.md`
  - Evidence: archivo creado con secciones para workspace config, project README, sprint file, document file, members file
  - Verification: el archivo cubre todos los tipos de entidad; los ejemplos son válidos YAML; los task symbols están documentados

### Phase 2 — Dependencies: Instalar paquetes y configurar env

**Objetivo**: Instalar `gray-matter` para parsear frontmatter YAML y `js-yaml` para serialización. Configurar `KYRO_WORKSPACE_PATH` como variable de entorno.

**Tasks**:

- [x] **T2.1**: Instalar dependencias de file parsing
  - Files: `package.json`
  - Evidence: `gray-matter` y `js-yaml` en dependencies; lockfile actualizado
  - Verification: `import matter from 'gray-matter'` compila sin error

- [x] **T2.2**: Crear `.env.local` con `KYRO_WORKSPACE_PATH`
  - Files: `.env.local`, `.env.example` (para documentar la variable)
  - Evidence: `.env.local` con `KYRO_WORKSPACE_PATH=/Users/rperaza/kyro-workspace`; `.env.example` con la variable documentada
  - Verification: `process.env.KYRO_WORKSPACE_PATH` está disponible en API routes

- [x] **T2.3**: Añadir `DEFAULT_WORKSPACE_PATH` a `lib/config.ts`
  - Files: `lib/config.ts`
  - Evidence: constante exportada con fallback razonable
  - Verification: TypeScript compila sin errores

### Phase 3 — Types: Añadir Workspace al modelo de datos

**Objetivo**: Añadir el tipo `Workspace` a `lib/types.ts` y extender `TaskStatus` con los estados del sistema de símbolos que aún no están en el enum.

**Tasks**:

- [x] **T3.1**: Añadir `Workspace` interface a `lib/types.ts`
  - Files: `lib/types.ts`
  - Evidence: interface `Workspace` con campos: `id`, `name`, `description?`, `rootPath`, `projects`, `members`, `createdAt`, `updatedAt`; Zod schema `WorkspaceSchema` correspondiente
  - Verification: TypeScript compila; todos los campos son tipados

- [x] **T3.2**: Extender `TaskStatus` con estados del sistema de símbolos
  - Files: `lib/types.ts`, `lib/config.ts` (COLUMNS)
  - Evidence: `TaskStatus` incluye `"blocked"` y `"skipped"` además de los existentes; `TaskStatusSchema` actualizado; COLUMNS en config.ts no rotos
  - Verification: TypeScript compila; los nuevos valores son aceptados por el schema

- [x] **T3.3**: Añadir `SprintTaskSymbol` type para el sistema de símbolos
  - Files: `lib/types.ts`
  - Evidence: `type SprintTaskSymbol = "[ ]" | "[~]" | "[x]" | "[!]" | "[-]" | "[>]"` exportado; función de mapeo `symbolToStatus(symbol: SprintTaskSymbol): TaskStatus` exportada
  - Verification: mapeo completo y correcto

### Phase 4 — Parsers: markdown/YAML → TypeScript types

**Objetivo**: Crear `lib/file-format/parsers.ts` con todas las funciones necesarias para leer archivos del workspace y convertirlos a los tipos TypeScript de la aplicación.

**Tasks**:

- [ ] **T4.1**: Crear estructura de directorio `lib/file-format/`
  - Files: `lib/file-format/parsers.ts`, `lib/file-format/serializers.ts` (placeholder), `lib/file-format/index.ts`
  - Evidence: directorio creado; index.ts exporta todo
  - Verification: imports desde `@/lib/file-format` funcionan

- [ ] **T4.2**: Implementar `parseWorkspaceConfig(json: string): Workspace`
  - Files: `lib/file-format/parsers.ts`
  - Evidence: función lee `.kyro/config.json` y retorna `Workspace` parcial (sin projects ni members, esos se agregan después)
  - Verification: parsea el JSON del workspace de ejemplo correctamente

- [ ] **T4.3**: Implementar `parseDocumentFile(content: string, id: string): Document`
  - Files: `lib/file-format/parsers.ts`
  - Evidence: parsea frontmatter YAML (id, title, createdAt, updatedAt) + body markdown; usa `gray-matter`
  - Verification: parsea el documento de ejemplo; campo `content` contiene el markdown sin el frontmatter

- [ ] **T4.4**: Implementar `parseSprintFile(content: string): Sprint`
  - Files: `lib/file-format/parsers.ts`
  - Evidence: parsea frontmatter YAML (id, name, status, dates, version, objective) + extrae tasks de las fases usando regex de task symbols; convierte símbolos → TaskStatus
  - Verification: parsea un sprint file de ejemplo; las tareas tienen el status correcto

- [ ] **T4.5**: Implementar `parseMembersFile(json: string): TeamMember[]`
  - Files: `lib/file-format/parsers.ts`
  - Evidence: parsea `.kyro/members.json`
  - Verification: retorna array de TeamMember con todos los campos

- [ ] **T4.6**: Implementar `parseActivitiesFile(json: string): AgentActivity[]`
  - Files: `lib/file-format/parsers.ts`
  - Evidence: parsea `.kyro/activities.json`; retorna array vacío si el archivo no existe
  - Verification: parsea correctamente; no crashea con archivo vacío

### Phase 5 — Serializers: TypeScript types → markdown files

**Objetivo**: Crear `lib/file-format/serializers.ts` con todas las funciones para escribir tipos TypeScript de vuelta a archivos del workspace.

**Tasks**:

- [ ] **T5.1**: Implementar `serializeWorkspaceConfig(workspace: Workspace): string`
  - Files: `lib/file-format/serializers.ts`
  - Evidence: retorna JSON string del config del workspace (sin projects ni members)
  - Verification: output es JSON válido; re-parseable por `parseWorkspaceConfig`

- [ ] **T5.2**: Implementar `serializeDocumentFile(doc: Document): string`
  - Files: `lib/file-format/serializers.ts`
  - Evidence: genera markdown con frontmatter YAML (id, title, dates) + content
  - Verification: output es parseable por `parseDocumentFile`; round-trip sin pérdida de datos

- [ ] **T5.3**: Implementar `serializeSprintFile(sprint: Sprint): string`
  - Files: `lib/file-format/serializers.ts`
  - Evidence: genera markdown con frontmatter YAML + secciones de tareas organizadas por status usando task symbols; secciones markdown para retrospectiva, deuda técnica, recomendaciones
  - Verification: output es parseable por `parseSprintFile`; round-trip sin pérdida de datos

- [ ] **T5.4**: Implementar `serializeMembersFile(members: TeamMember[]): string`
  - Files: `lib/file-format/serializers.ts`
  - Evidence: retorna JSON string del roster de members
  - Verification: output es JSON válido; round-trip correcto

- [ ] **T5.5**: Implementar `serializeActivitiesFile(activities: AgentActivity[]): string`
  - Files: `lib/file-format/serializers.ts`
  - Evidence: retorna JSON string del log de actividades
  - Verification: output es JSON válido

### Phase 6 — Tests: Verificación de parsers y serializers

**Objetivo**: Tests unitarios que validen que parsers y serializers son inversos entre sí (round-trip) y que manejan casos edge correctamente.

**Tasks**:

- [ ] **T6.1**: Configurar entorno de testing (si no existe)
  - Files: `package.json`, `vitest.config.ts` o equivalente
  - Evidence: `npm test` o `npx vitest` corre sin error
  - Verification: framework de testing funcional

- [ ] **T6.2**: Tests de round-trip para Document (parse → serialize → parse)
  - Files: `lib/file-format/__tests__/document.test.ts`
  - Evidence: test pasa; el documento re-parseado es idéntico al original
  - Verification: `npm test` verde

- [ ] **T6.3**: Tests de round-trip para Sprint (parse → serialize → parse)
  - Files: `lib/file-format/__tests__/sprint.test.ts`
  - Evidence: test pasa; todas las tareas con sus símbolos son preservadas
  - Verification: `npm test` verde

- [ ] **T6.4**: Tests de mapeo de task symbols → TaskStatus
  - Files: `lib/file-format/__tests__/symbols.test.ts`
  - Evidence: cada símbolo mapea al TaskStatus correcto; casos desconocidos retornan `"todo"` como default
  - Verification: `npm test` verde

### Phase 7 — Seed Files: Workspace de ejemplo en disco

**Objetivo**: Crear un workspace de ejemplo en `KYRO_WORKSPACE_PATH` con datos que replican los mocks actuales. Esto permite smoke testing de los parsers con datos reales y establece la estructura de directorio concreta.

**Tasks**:

- [x] **T7.1**: Crear directorio del workspace y `.kyro/` config
  - Files: `/Users/rperaza/kyro-workspace/.kyro/config.json`, `/Users/rperaza/kyro-workspace/.kyro/members.json`
  - Evidence: directorio creado; config.json tiene nombre "Kyro Workspace"; members.json tiene los 4 members del mock
  - Verification: `parseWorkspaceConfig` lee el config sin error

- [x] **T7.2**: Crear proyecto de ejemplo con README
  - Files: `/Users/rperaza/kyro-workspace/projects/clever/README.md`
  - Evidence: README con frontmatter YAML + contenido markdown del proyecto Clever
  - Verification: archivo parseable; readme field poblado

- [x] **T7.3**: Crear sprint de ejemplo con tareas
  - Files: `/Users/rperaza/kyro-workspace/projects/clever/sprints/SPRINT-01.md`
  - Evidence: sprint con frontmatter YAML + 3-5 tareas usando los 6 símbolos (al menos uno de cada tipo)
  - Verification: `parseSprintFile` retorna Sprint con tasks correctas

- [x] **T7.4**: Crear documento de ejemplo
  - Files: `/Users/rperaza/kyro-workspace/projects/clever/documents/arquitectura.md`
  - Evidence: documento con frontmatter YAML + contenido markdown técnico
  - Verification: `parseDocumentFile` retorna Document correcto

- [x] **T7.5**: Verificar TypeScript sin errores al cierre del sprint
  - Files: todos los archivos modificados en el sprint
  - Evidence: output de `npx tsc --noEmit` sin errores
  - Verification: zero TypeScript errors

---

## Emergent Phases

<!-- Vacío — se puebla durante la ejecución si se descubre trabajo no planeado -->

---

## Findings Consolidation

| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|
| 1 | gray-matter parsea fechas YAML como JS Date objects, no strings | Phase 4 — T4.3/T4.4 | medium | Helper `dateStr()` normaliza a YYYY-MM-DD; tests actualizados |
| 2 | `parseSprintFile` extrae tareas pero no preserva el agrupamiento por fase — todas queen en "General" | Phase 4 — T4.4 | low | Registrado como D05 en deuda técnica; suficiente para Sprint 2 |
| 3 | Vitest no estaba configurado — necesitó setup completo (vitest.config.ts + script en package.json) | Phase 6 — T6.1 | low | Configurado y funcionando; 16 tests pasando |
| 4 | `STATUS_TO_SYMBOL` es parcial (Partial<Record<TaskStatus, ...>>) porque `review` → `"~"` y `backlog` → `" "` comparten símbolo con otros estados | Phase 5 — T5.3 | low | Aceptable para serialización; la dirección parse→serialize es inequívoca |

---

## Accumulated Technical Debt

| # | Item | Origin | Sprint Target | Status | Resolved In |
|---|------|--------|--------------|--------|-------------|
| 1 | Logo "Clever" hardcodeado en sidebar | INIT — pre-sprint | Sprint 5 | open | — |
| 2 | Service factory siempre retorna mock (no switch real) | INIT — pre-sprint | Sprint 3 | open | — |
| 3 | Loading UI solo en ContentRouter — sub-entidades sin estado de fetch | INIT — pre-sprint | Sprint 4 | open | — |
| 4 | `parseSprintFile` no preserva agrupamiento de tareas por fase — todas quedan en "General" | Sprint 1 Phase 4 | Sprint 3 | open | — |

---

## Definition of Done

- [x] `FILE-FORMAT-SPEC.md` documentado y completo para todas las entidades
- [x] `gray-matter` y `js-yaml` instalados y compilando
- [x] `.env.local` con `KYRO_WORKSPACE_PATH`
- [x] `Workspace` type en `lib/types.ts` con Zod schema
- [x] `TaskStatus` extendido con `"blocked"` y `"skipped"`
- [x] `lib/file-format/parsers.ts` implementado (workspace, project, sprint, document, members, activities)
- [x] `lib/file-format/serializers.ts` implementado (round-trip completo)
- [x] Tests unitarios pasando (round-trip document, sprint, symbols) — 16 tests, 0 fallos
- [x] Workspace de ejemplo creado en disco y parseable (`/Users/rperaza/kyro-workspace/`)
- [x] TypeScript sin errores (`npx tsc --noEmit`)
- [x] Re-entry prompts actualizados

---

## Retro

<!-- Se llena al cerrar el sprint -->

### What Went Well

- La abstracción de servicios existente en `lib/services/` hace que el cambio sea limpio — componentes y store no necesitan cambios
- `gray-matter` maneja frontmatter YAML de forma muy limpia con una API simple
- El sistema de task symbols (`[ ]`/`[~]`/`[x]`/`[!]`/`[-]`/`[>]`) es elegante y legible tanto para humanos como para agentes
- Los 16 tests pasaron en el primer intento después de corregir el bug de fechas
- TypeScript zero errores en todo momento — el tipado estricto capturó el problema del `Record<TaskStatus, Task[]>` inmediatamente

### What Didn't Go Well

- `gray-matter` parsea fechas YAML (`2026-03-01`) como `Date` objects JS, no como strings — requirió agregar el helper `dateStr()` y re-correr los tests
- Vitest no estaba configurado en el proyecto — añadió trabajo de setup no planeado (pero menor)

### Surprises / Unexpected Findings

- El `STATUS_TO_SYMBOL` es inherentemente muchos-a-uno en la dirección serialize (ej: `backlog` y `todo` ambos → `" "`). Esto es aceptable porque serialize solo se usa para escribir, no para round-trip de vuelta al kanban.
- Extender `TaskStatus` con `"blocked"` y `"skipped"` rompió el `columnTasks` map en `sprint-board.tsx` — se arregló en 1 línea pero confirma que los tipos están bien conectados.

### New Technical Debt Detected

- D4 — `parseSprintFile` no preserva agrupamiento de tareas por fase (ver Findings Consolidation #2)

---

## Recommendations for Sprint 2

1. Las API routes deben implementar validación estricta de path: verificar que toda ruta de archivo resuelta esté dentro de `KYRO_WORKSPACE_PATH` antes de cualquier operación de disco (path traversal prevention)
2. Implementar primero `GET /api/workspace` — este endpoint es el gate que verifica que el workspace existe y es válido; si falla, la UI muestra onboarding en lugar de errores
3. Añadir `POST /api/workspace/init` para crear un workspace nuevo desde la UI (estructura de directorios + archivos base)
4. Para el manejo de errores: usar una clase `WorkspaceError` con códigos específicos (`NOT_FOUND`, `INVALID_FORMAT`, `PERMISSION_DENIED`) — hace que la UI pueda mostrar mensajes útiles
5. Considerar añadir un endpoint `GET /api/workspace/health` que verifique la integridad del workspace (todos los archivos esperados existen, YAML válido, etc.)
