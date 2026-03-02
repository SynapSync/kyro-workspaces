# Finding 04 — No API Routes for File I/O

## Summary

No existen API routes en el proyecto Next.js para operaciones de file system. En Next.js App Router, las operaciones de disco (leer/escribir archivos) deben ocurrir en el servidor. Sin rutas de API, es imposible hacer CRUD sobre los archivos markdown desde la UI del navegador.

## Severity / Impact

**critical** — Sin API routes:
- La UI no puede leer archivos del disco
- La UI no puede escribir cambios a archivos
- El service layer file-based no tiene un canal de comunicación

## Details

Next.js App Router tiene dos mecanismos para lógica server-side:

### Opción A: API Routes (Route Handlers)

```
app/api/
├── workspace/
│   └── route.ts              # GET workspace info
├── projects/
│   ├── route.ts              # GET all projects, POST new project
│   └── [projectId]/
│       ├── route.ts          # GET, PUT, DELETE project
│       ├── sprints/
│       │   ├── route.ts      # GET sprints, POST new sprint
│       │   └── [sprintId]/
│       │       ├── route.ts  # GET, PUT sprint
│       │       └── tasks/
│       │           └── route.ts  # GET tasks, POST, PUT, DELETE task
│       └── documents/
│           ├── route.ts      # GET docs, POST new doc
│           └── [docId]/
│               └── route.ts  # GET, PUT, DELETE doc
└── members/
    └── route.ts              # GET, POST, PUT, DELETE members
```

### Opción B: Server Actions

```typescript
// lib/actions/projects.ts
"use server";

import { readFile, writeFile } from "fs/promises";
import { parseProjectFile } from "@/lib/file-format/parsers";

export async function getProject(projectId: string): Promise<Project> {
  const path = `${process.env.KYRO_WORKSPACE_PATH}/projects/${projectId}/README.md`;
  const content = await readFile(path, "utf-8");
  return parseProjectFile(content);
}
```

**Recomendación**: Usar API Routes (Opción A) para mejor separabilidad y futura extensibilidad. Los Server Actions son más apropiados para form mutations, no para data fetching complejo.

### Consideraciones de seguridad

- Validar que todas las rutas de archivo estén dentro de `KYRO_WORKSPACE_PATH`
- Sanitizar `projectId`, `sprintId`, `docId` antes de usar en paths (path traversal prevention)
- Nunca exponer la ruta absoluta del workspace en responses del cliente

### File System Operations requeridas

| Operation | fs method | Notes |
|-----------|-----------|-------|
| Read file | `readFile(path, 'utf-8')` | Retorna string markdown |
| Write file | `writeFile(path, content)` | Escribe markdown serializado |
| List directory | `readdir(path)` | Para listar proyectos, sprints, docs |
| Create directory | `mkdir(path, {recursive: true})` | Para nuevos proyectos/sprints |
| Delete file | `unlink(path)` | Para delete de entidades |
| File exists | `access(path)` | Verificar antes de read |

## Affected Files

- `app/api/` — directorio completo por crear
- `lib/file-format/` — parsers usados por las API routes
- `.env.local` — `KYRO_WORKSPACE_PATH`

## Recommendations

1. Crear estructura de API routes siguiendo el esquema RESTful propuesto
2. Implementar middleware de validación de workspace path
3. Usar `Node.js fs/promises` (disponible en Next.js API routes)
4. Añadir manejo de errores: 404 para archivos no encontrados, 400 para YAML inválido
5. Considerar un watcher de filesystem (`chokidar`) para notificar la UI de cambios externos
