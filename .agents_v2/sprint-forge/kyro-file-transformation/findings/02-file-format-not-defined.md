# Finding 02 — File Format Not Defined

## Summary

No existe un esquema definido para cómo se representan workspaces, proyectos, sprints, tareas y documentos en archivos markdown. Sin un formato canónico, los agentes no pueden leer ni escribir datos de forma consistente, y la UI no puede parsear archivos externos.

## Severity / Impact

**critical** — Antes de implementar cualquier código de file I/O, el formato debe estar completamente especificado y documentado. Este finding es la base de todo lo demás.

## Details

El sistema de referencia (binance-future-bot-v2) usa los siguientes patrones que deben adoptarse:

### YAML Frontmatter para metadatos
```yaml
---
id: sprint-01
name: Foundation Sprint
status: planned | active | closed
startDate: 2026-03-01
endDate: 2026-03-08
version: 1.0.0
objective: |
  Descripción del objetivo del sprint...
---
```

### Sistema de símbolos para tareas (OBLIGATORIO)
| Símbolo | Estado | Significado |
|---------|--------|-------------|
| `[ ]` | Pending | No comenzado |
| `[~]` | In Progress | En progreso |
| `[x]` | Done | Completado y verificado |
| `[!]` | Blocked | Bloqueado — blocker documentado |
| `[-]` | Skipped | Omitido intencionalmente con justificación |
| `[>]` | Carry-over | No completado — transferido al siguiente sprint |

### Estructura de directorio propuesta

```
{workspace-root}/
├── .kyro/
│   ├── config.json          # Nombre, descripción del workspace
│   └── members.json         # Roster global de team members
└── projects/
    └── {project-slug}/
        ├── README.md         # Lectura obligatoria para agentes
        ├── ROADMAP.md        # Plan de sprints (generado por sprint-forge)
        ├── RE-ENTRY-PROMPTS.md  # Guía para retomar el trabajo
        ├── sprints/
        │   └── SPRINT-01.md  # Sprint con tareas inline
        └── documents/
            └── {doc-title}.md  # Documentos técnicos del proyecto
```

### Formato de sprint file (SPRINT-NN.md)

```markdown
---
id: sprint-01
name: Foundation Sprint
status: active
startDate: 2026-03-01
endDate: 2026-03-08
version: 1.0.0
objective: |
  Descripción del objetivo...
---

# Sprint 01 — Foundation Sprint

## Objetivo
...

## Tareas

### Fase 1: Nombre de la Fase
- [x] Tarea completada
- [~] Tarea en progreso
  - Notas de progreso aquí
- [ ] Tarea pendiente
- [!] Tarea bloqueada — Motivo: necesita X

### Fase 2: Otra Fase
- [ ] Otra tarea

## Retrospectiva

### Qué funcionó bien
...

### Qué no funcionó
...

### Deuda técnica nueva
| ID | Item | Target |
|----|------|--------|
| D01 | ... | Sprint N |

### Recomendaciones para el próximo sprint
1. ...
```

### Formato de document file ({doc-title}.md)

```markdown
---
id: doc-uuid
title: Document Title
createdAt: 2026-03-01T00:00:00Z
updatedAt: 2026-03-01T00:00:00Z
---

# Document Title

Contenido markdown libre...
```

## Affected Files

- `lib/types.ts` — añadir tipo `Workspace`; los tipos actuales son compatibles con el formato propuesto
- `lib/markdown.ts` — añadir parsers para frontmatter YAML y task symbols
- Nuevo: `lib/file-format/` — parsers y serializers

## Recommendations

1. Documentar el formato completo en un spec file `FILE-FORMAT-SPEC.md`
2. Implementar parsers TypeScript para YAML frontmatter (usando `js-yaml` o `gray-matter`)
3. Implementar parser para task symbols → `TaskStatus` enum
4. Implementar serializers para escribir TypeScript types → markdown
5. Añadir tipo `Workspace` al modelo de datos en `lib/types.ts`
