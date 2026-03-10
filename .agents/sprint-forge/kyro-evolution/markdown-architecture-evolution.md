# Kyro — Markdown Architecture: Diagnóstico y Plan de Evolución

> Fecha: 2026-03-07
> Contexto: Evaluación de escalabilidad tras 9 sprints de desarrollo
> Estado actual: v2.2.0 — reader/viewer funcional con escrituras limitadas

---

## 1. Pregunta Central

¿Es viable a largo plazo una arquitectura basada 100% en archivos markdown como source of truth para un proyecto management tool?

**Respuesta corta:** Sí, pero con condiciones. Markdown como source of truth es una fortaleza — el problema no es leer markdown, sino cómo se escribe y cómo se consulta a escala.

---

## 2. Lo Que Está Sólido (No Cambiar)

### Markdown como source of truth

Herramientas serias funcionan así: Obsidian, Jekyll, Hugo, Docusaurus. Las ventajas son reales:

- **Git nativo**: versionado, branching, historial, diff — gratis
- **Portabilidad**: los archivos funcionan sin la app (sprint-forge funciona sin Kyro)
- **Sin infraestructura**: no DB, no migrations, no backups de base de datos
- **Legibilidad humana**: cualquier editor de texto puede leer/editar los archivos
- **Offline-first**: funciona sin conexión

### Arquitectura de software

La separación actual está bien diseñada:

```
Filesystem (markdown)
  → API routes (lectura)
    → lib/file-format/ (parsers puros, sin side effects)
      → lib/services/ (abstracción mock/file)
        → lib/store.ts (Zustand, estado cliente)
          → components/ (UI)
```

- Service layer permite swappear implementación sin tocar componentes
- Parsers son funciones puras — testeable, predecible
- Tipos Zod como source of truth para validación + inferencia
- Separación clara server/client

---

## 3. Problemas Reales (El Techo)

### Problema 1 — Escrituras con Regex (CRÍTICO)

**Estado actual:** `patchTaskStatusInMarkdown()` usa regex para encontrar una línea y cambiar el símbolo del checkbox. Funciona para un caso simple.

**Por qué no escala:**

```markdown
- [x] **T1.1**: Create type schemas ← regex lo encuentra
- [x] **T1.1**: Create "type [schemas]" ← brackets en título, puede fallar
- [x] **T1.1**: Create schemas ← sin task ref, patrón diferente
  - Subtask indentada ← regex no maneja profundidad
```

Cada nueva operación de escritura (mover tarea, editar título, reordenar, agregar tarea) requiere un nuevo regex artesanal. Los edge cases se multiplican exponencialmente.

**Evidencia:** El bug `body.status: "t1-2"` no fue del regex, pero el patrón de fragilidad es idéntico — asumir estructura en texto plano sin validación formal.

**Impacto:** Bloquea toda expansión de funcionalidad de escritura.

### Problema 2 — Queries Cross-File son O(n)

**Estado actual:** "Dame todas las tareas bloqueadas de todos los sprints" requiere:

1. Listar todos los archivos de sprint
2. Leer cada archivo del disco
3. Parsear cada uno completo
4. Filtrar en memoria

**Por qué no escala:**

| Escenario                 | Archivos a parsear | Viable      |
| ------------------------- | ------------------ | ----------- |
| 3 proyectos × 5 sprints   | 15                 | Sí          |
| 10 proyectos × 15 sprints | 150                | Lento       |
| 50 proyectos × 30 sprints | 1,500              | Inaceptable |

El search index actual (`lib/search.ts`) reconstruye todo el índice en cada cambio de estado — sin incrementalidad.

### Problema 3 — Sin Concurrencia

**Estado actual:** Si dos tabs escriben al mismo archivo, la segunda sobreescribe a la primera. No hay locks, no hay merge, no hay detección de conflictos.

**Impacto:**

- Para un solo usuario: riesgo bajo (una tab a la vez)
- Para equipo: corrupción garantizada

---

## 4. Cómo lo Resuelven Obsidian y Notion

### Obsidian (referencia directa — markdown-first)

| Problema             | Solución de Obsidian                                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Lectura rápida       | **Índice SQLite en memoria** que se reconstruye al abrir el vault. Markdown sigue siendo source of truth.                                     |
| Escritura segura     | **No usa regex.** Trabaja con un modelo interno del documento (similar a AST) y serializa al guardar.                                         |
| Queries              | **Dataview plugin** indexa frontmatter YAML y genera vistas tipo tabla/lista sin modificar archivos.                                          |
| Plugins de escritura | **Editor CodeMirror 6** con modelo de documento estructurado — las operaciones son transformaciones del modelo, no find-and-replace en texto. |
| Concurrencia         | **File watcher** detecta cambios externos y recarga. Sync maneja conflictos con timestamps.                                                   |

### Notion (referencia — block-based)

| Problema     | Solución de Notion                                                                        |
| ------------ | ----------------------------------------------------------------------------------------- |
| Storage      | **Block tree en PostgreSQL.** Cada párrafo, heading, checkbox es un block con ID único.   |
| Escritura    | **Operaciones sobre blocks** — no sobre texto. Mover tarea = cambiar parent_id del block. |
| Queries      | **Database nativas** con filtros, sorts, rollups, relaciones.                             |
| Concurrencia | **OT (Operational Transform)** para edición colaborativa en tiempo real.                  |

**Lección clave:** Obsidian demuestra que markdown + índice + AST writer es viable a escala profesional. No necesitamos ir a blocks como Notion — pero sí necesitamos las mismas capas de abstracción que Obsidian.

---

## 5. Plan de Evolución (3 Fases)

### Fase 1 — AST Writer (Reemplazar Regex)

**Objetivo:** Todas las escrituras a markdown pasan por un AST, nunca por regex.

**Stack:** `unified` + `remark-parse` + `remark-stringify`

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
taskNode.checked = true; // o el equivalente en el AST
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

### Fase 2 — Índice SQLite (Cache, No Source of Truth)

**Objetivo:** Queries instantáneas sin parsear archivos en cada request.

**Stack:** `better-sqlite3` o `sql.js` (SQLite en WASM para el browser)

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

**Regla fundamental:** SQLite es un **índice derivado**. Si se corrompe o se borra, se reconstruye desde los archivos markdown. Markdown sigue siendo la verdad.

**Beneficios:**

- Queries cross-project instantáneas
- Search full-text con FTS5
- Aggregations (progreso, métricas, debt tracking) sin parsear
- Invalidación incremental (solo re-parsear archivos modificados)

**Archivos afectados:**

- Nuevo: `lib/index/sqlite.ts` — schema + CRUD del índice
- Nuevo: `lib/index/file-watcher.ts` — detección de cambios + re-indexación
- `lib/services/file/` — queries van contra SQLite en vez de filesystem
- `lib/search.ts` — reemplazar `buildSearchIndex()` con query a SQLite

### Fase 3 — Concurrencia y Colaboración

**Objetivo:** Múltiples usuarios/tabs pueden trabajar sin corrupción.

**Enfoque incremental:**

1. **File watcher + reload** (mínimo viable)
   - Detectar cambios en archivos desde otras fuentes
   - Recargar el estado automáticamente
   - Sin merge — last-write-wins con notificación

2. **Advisory locks** (siguiente nivel)
   - Lock file por sprint mientras se edita
   - Timeout automático (60s)
   - UI muestra "archivo en uso por otro usuario"

3. **CRDT / OT** (nivel Notion — solo si se necesita)
   - Edición colaborativa en tiempo real
   - Requiere servidor WebSocket
   - Probablemente overkill para el caso de uso

---

## 6. Prioridades de Implementación

| Orden | Fase         | Impacto                                    | Esfuerzo    | Prerequisito                       |
| ----- | ------------ | ------------------------------------------ | ----------- | ---------------------------------- |
| 1     | AST Writer   | Desbloquea todas las features de escritura | 2-3 sprints | Ninguno                            |
| 2     | SQLite Index | Queries instantáneas, search real          | 2-3 sprints | Fase 1 (opcional pero recomendado) |
| 3     | File Watcher | Multi-tab safe, auto-refresh               | 1 sprint    | Fase 2                             |
| 4     | Concurrencia | Multi-usuario                              | 2+ sprints  | Fase 3                             |

---

## 7. Lo Que NO Hacer

- **No migrar a una base de datos relacional como source of truth** — perderías portabilidad, git tracking, y la esencia del proyecto
- **No agregar más operaciones de escritura con regex** — cada una es deuda técnica acumulada
- **No construir un editor WYSIWYG propio** — usar CodeMirror 6 o similar cuando llegue el momento
- **No optimizar prematuramente** — el índice SQLite solo cuando las queries sean lentas (aún no estamos ahí)
- **No copiar Notion** — su modelo de blocks requiere una DB relacional. El modelo de Obsidian (markdown + índice + AST) es el correcto para Kyro

---

## 8. Conclusión

Kyro no es "pañitos de agua tibia." La arquitectura base es real:

- Parsers puros, service abstraction, tipos estrictos, separación de concerns
- Markdown como source of truth es una decisión de diseño válida y probada

El techo actual es el **write path** (regex) y las **queries** (O(n) file reads). Ambos se resuelven sin abandonar markdown:

1. AST writer (remark/unified) para escrituras seguras
2. SQLite como índice derivado para queries rápidas
3. File watcher para consistencia

Obsidian demostró que markdown-first puede ser profesional y escalable. El camino está claro.
