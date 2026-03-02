# Kyro File Transformation — Re-entry Prompts

> Last updated: 2026-03-01
> Current sprint: 4 (Sprint 3 COMPLETADO)

Estos prompts te permiten (o a un agente nuevo) recuperar el contexto completo del proyecto en una sesión nueva.

---

## Quick Reference

| Sprint | File | Status |
|--------|------|--------|
| 1 | `sprints/SPRINT-1-file-format-workspace-model.md` | completed |
| 2 | `sprints/SPRINT-2-api-routes-file-io.md` | completed |
| 3 | `sprints/SPRINT-3-file-service-layer.md` | completed |

---

## Dynamic Paths

| Resource | Path |
|----------|------|
| Codebase | `/Users/rperaza/joicodev/ideas/kyro` |
| Working Directory | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-file-transformation/` |
| Roadmap | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-file-transformation/ROADMAP.md` |
| Latest Sprint | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-file-transformation/sprints/SPRINT-3-file-service-layer.md` |

---

## Scenario 1 — Contexto Acumulado (Sprints 1–2)

### Sprint 1 COMPLETADO — `sprints/SPRINT-1-file-format-workspace-model.md`

**Entregables del Sprint 1**:
- `FILE-FORMAT-SPEC.md` — formato canónico para todas las entidades
- `gray-matter` + `js-yaml` instalados
- `Workspace` type + Zod schema en `lib/types.ts`
- `TaskStatus` extendido con `"blocked"` y `"skipped"`
- `lib/file-format/parsers.ts` — 6 funciones de parse
- `lib/file-format/serializers.ts` — 5 funciones de serialización
- 16 tests unitarios pasando (Vitest)
- Workspace de ejemplo en `/Users/rperaza/kyro-workspace/`

### Sprint 2 COMPLETADO — `sprints/SPRINT-2-api-routes-file-io.md`

**Entregables del Sprint 2**:
- `lib/api/errors.ts` — WorkspaceError con códigos específicos
- `lib/api/workspace-guard.ts` — path traversal prevention
- `lib/api/response-helpers.ts` — ok(), handleError(), notFound()
- `app/api/workspace/route.ts` — GET /api/workspace
- `app/api/workspace/init/route.ts` — POST /api/workspace/init
- `app/api/workspace/health/route.ts` — GET /api/workspace/health
- `app/api/projects/route.ts` — GET/POST /api/projects
- `app/api/projects/[projectId]/route.ts` — GET/PUT/DELETE proyecto
- `app/api/projects/[projectId]/sprints/route.ts` — GET/POST sprints
- `app/api/projects/[projectId]/sprints/[sprintId]/route.ts` — GET/PUT sprint
- `app/api/projects/[projectId]/sprints/[sprintId]/tasks/route.ts` — GET/POST tasks
- `app/api/projects/[projectId]/sprints/[sprintId]/tasks/[taskId]/route.ts` — PUT/DELETE task
- `app/api/projects/[projectId]/documents/route.ts` — GET/POST documents
- `app/api/projects/[projectId]/documents/[docId]/route.ts` — GET/PUT/DELETE document
- `app/api/members/route.ts` — GET/POST members
- `app/api/members/[memberId]/route.ts` — PUT/DELETE member
- 13 tests unitarios pasando (workspace-guard + errors)
- TypeScript compila sin errores

---

## Scenario 2 — Ejecutar Sprint 3 (Service Layer File-Based)

El Sprint 2 está completado. El Sprint 3 transformará la service layer para usar file-based en lugar de mocks.

```
Estoy continuando la transformación arquitectural de Kyro. El Sprint 2 fue completado y el Sprint 3 necesita generación y ejecución.

Lee estos archivos en orden:
1. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-file-transformation/README.md
2. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-file-transformation/sprints/SPRINT-2-api-routes-file-io.md (para ver el retro y recomendaciones)
3. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-file-transformation/ROADMAP.md

Luego usa /sprint-forge en modo SPRINT para generar y ejecutar el Sprint 3.

Codebase: /Users/rperaza/joicodev/ideas/kyro
```

---

## Scenario 3 — Ejecutar Sprint en Progreso

Usa este prompt cuando un sprint ya fue generado pero no ejecutado completamente.

```
Estoy trabajando en la transformación arquitectural de Kyro. El Sprint [N] ha sido generado y necesita ejecución.

Lee estos archivos en orden:
1. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-file-transformation/README.md
2. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-file-transformation/ROADMAP.md
3. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-file-transformation/sprints/SPRINT-[N]-[slug].md

Luego usa /sprint-forge para ejecutar el Sprint [N]. Trabaja fase por fase, marcando
el progreso con los símbolos de tarea ([~] en progreso, [x] completado). Añade fases
emergentes si descubres trabajo no planeado.

Codebase: /Users/rperaza/joicodev/ideas/kyro
```

---

## Scenario 4 — Estado del Proyecto

Usa este prompt para obtener un reporte de progreso.

```
Necesito el estado actual de la transformación de Kyro.

Lee estos archivos:
1. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-file-transformation/README.md
2. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-file-transformation/ROADMAP.md
3. Todos los sprint files en: /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-file-transformation/sprints/

Luego usa /sprint-forge para generar un reporte de estado mostrando: sprints completados,
deuda técnica acumulada, métricas, y qué está planeado como siguiente.
```

---

## Key Context

### Visión del proyecto
Kyro debe funcionar como sistema de gestión de proyectos donde **los archivos markdown son la fuente de verdad**. Los agentes de IA leen el workspace directamente, retoman tareas, actualizan sprints, y escriben resultados. La UI de Next.js es un viewer/editor de esos archivos — no el sistema de record.

### Estructura de datos objetivo

```
{KYRO_WORKSPACE_PATH}/
├── .kyro/
│   ├── config.json          # nombre y config del workspace
│   └── members.json         # team members
└── projects/
    └── {project-slug}/
        ├── README.md         # lectura obligatoria para agentes
        ├── ROADMAP.md
        ├── RE-ENTRY-PROMPTS.md
        ├── sprints/
        │   └── SPRINT-01.md  # tasks con símbolos [ ]/[~]/[x]/[!]/[-]/[>]
        └── documents/
            └── {doc-title}.md
```

### Principios de implementación
- **Servicio layer ya existe** — solo necesita implementación file-based
- **Store Zustand se mantiene** — como capa de UI state en memoria (selección activa, etc.)
- **Mock services intactos** — para testing y development sin workspace real
- **La UI no cambia** — los componentes React no saben de dónde vienen los datos
- **API Routes** — puente entre browser y filesystem (Next.js App Router)

### Stack técnico relevante
- Next.js 16 App Router (API Routes en `app/api/`)
- `gray-matter` — YAML frontmatter parser (a instalar Sprint 1)
- `js-yaml` — YAML serializer (a instalar Sprint 1)
- `KYRO_WORKSPACE_PATH` — env var para la ruta del workspace

### Deuda técnica heredada (pre-sprint)
- D1: Logo "Clever" hardcodeado → Sprint 5 (reemplazar con workspace.name)
- D3: Service factory siempre mock → Sprint 3
- D4: Loading UI solo en ContentRouter → Sprint 4

### Deuda técnica del Sprint 2
- D5: No se validan los body de requests con Zod
- D6: No hay rate limiting en endpoints
- D7: No hay logging estructurado de operaciones filesystem
