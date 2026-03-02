# Kyro File Transformation — Working Project

> Type: Architecture Transformation (file-system as source of truth)
> Created: 2026-03-01
> Codebase: `/Users/rperaza/joicodev/ideas/kyro`

---

## What Is This

Este directorio contiene los artefactos de trabajo para la transformación arquitectural de Kyro: pasar de un sistema donde los datos viven en Zustand (memoria del browser) a uno donde los archivos markdown son la fuente de verdad.

**Visión**: Los agentes de IA son clientes de primera clase del workspace. Un agente recibe "trabaja en el proyecto X, sprint Y" y puede: leer el estado real, retomar tareas, actualizar progreso, y escribir resultados — todo via archivos markdown.

---

## For AI Agents — Mandatory Reading Order

Si eres un agente reanudando trabajo en este proyecto, lee estos archivos en orden:

1. **Este README** — Estás aquí. Entiende la estructura del proyecto.
2. **ROADMAP.md** — El roadmap adaptativo con todos los sprints planeados y las reglas de ejecución.
3. **Último sprint completado** — El sprint más reciente en `sprints/`. Lee su retro, recomendaciones y tabla de deuda.
4. **RE-ENTRY-PROMPTS.md** — Prompts pre-escritos para acciones comunes. Copia el apropiado.

---

## Context

### ¿Por qué esta transformación?

Kyro fue construido inicialmente como prototipo UI con Zustand para validar la interfaz. Ahora que la UI está sólida, el siguiente paso es hacer que los datos persistan en archivos markdown, lo que:

1. Permite a los agentes leer y escribir el estado del proyecto directamente
2. Hace los datos legibles/editables en Obsidian, VS Code, o cualquier editor de texto
3. Elimina la dependencia de una base de datos o backend complejo
4. Permite al humano revisar y editar el trabajo del agente en su herramienta favorita

### Referencia de implementación

El sistema de archivos sigue las convenciones de `binance-future-bot-v2`:
- `/Users/rperaza/Library/Mobile Documents/iCloud~md~obsidian/Documents/joicodev/ideas/binance-future-bot-v2`

### Stack actual de Kyro

- Next.js 16 App Router, React 19, TypeScript 5.7
- Zustand 5.0.2 (estado actual — se mantiene como capa de UI state)
- Tailwind CSS 4, shadcn/ui + Radix UI
- dnd-kit (kanban drag-and-drop)
- `gray-matter` (a añadir) — YAML frontmatter parsing

---

## Directory Structure

```
.agents/sprint-forge/kyro-file-transformation/
├── README.md              ← Este archivo
├── ROADMAP.md             ← Roadmap adaptativo (documento vivo)
├── RE-ENTRY-PROMPTS.md    ← Prompts de recuperación de contexto
├── findings/              ← Hallazgos del análisis (un archivo por área)
│   ├── 01-no-persistent-data-layer.md
│   ├── 02-file-format-not-defined.md
│   ├── 03-workspace-concept-missing.md
│   ├── 04-no-api-routes-for-file-io.md
│   ├── 05-no-file-service-implementation.md
│   ├── 06-version-history-ephemeral.md
│   ├── 07-no-agent-infrastructure.md
│   └── 08-store-async-adaptation.md
└── sprints/               ← Sprints generados uno a la vez
```

---

## Absolute Paths

| Resource | Path |
|----------|------|
| Codebase | `/Users/rperaza/joicodev/ideas/kyro` |
| Working Directory | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-file-transformation/` |
| Findings | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-file-transformation/findings/` |
| Sprints | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-file-transformation/sprints/` |
| Roadmap | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-file-transformation/ROADMAP.md` |
| Re-entry Prompts | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-file-transformation/RE-ENTRY-PROMPTS.md` |
| AGENTS.md | `/Users/rperaza/joicodev/ideas/kyro/AGENTS.md` |

---

## Sprint System Rules

1. Sprints se generan **de uno en uno** — nunca pre-generados
2. Cada sprint alimenta del retro y recomendaciones del sprint anterior
3. La tabla de deuda acumulada pasa de sprint en sprint, sin perder items
4. El roadmap adapta basado en lo que la ejecución revela
5. Los re-entry prompts se actualizan después de cada sprint para persistencia de contexto

---

## Current State — Baseline

| Metric | Value |
|--------|-------|
| Data persistence | None (Zustand in-memory only) |
| File I/O | None |
| API Routes | None |
| File services | None (mock only) |
| Workspace type | Missing |
| File format spec | Missing |
| Agent infrastructure | Missing |
| Findings identified | 8 |
| Sprints planned | 5 |
| TypeScript errors | 0 |

---

## Sprint Map

| Sprint | Status | Focus | Key Deliverables |
|--------|--------|-------|-----------------|
| 1 | pending | File Format + Workspace Model | FILE-FORMAT-SPEC.md, parsers, serializers, Workspace type |
| 2 | pending | API Routes (File I/O Bridge) | Next.js API routes para todo CRUD |
| 3 | pending | File Service Implementation | FileProjectsService, factory wiring, datos reales en UI |
| 4 | pending | Store Async + Version History | Init async completo, git-based history |
| 5 | pending | Agent Infrastructure + Polish | README/ROADMAP/RE-ENTRY generation, onboarding UI |
