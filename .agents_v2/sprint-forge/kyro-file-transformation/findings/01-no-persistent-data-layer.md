# Finding 01 — No Persistent Data Layer

## Summary

Toda la información del sistema (proyectos, sprints, tareas, documentos) vive exclusivamente en el store de Zustand — memoria del navegador. Cuando el usuario cierra la pestaña o recarga, todos los datos se pierden. Los agentes de IA no tienen ninguna forma de leer ni modificar estos datos.

## Severity / Impact

**critical** — Este es el bloqueador principal de la visión del proyecto. Sin persistencia en archivos:
- Los agentes no pueden leer el estado actual del workspace
- Los agentes no pueden retomar tareas
- Los agentes no pueden actualizar sprints
- Los datos de trabajo se pierden completamente entre sesiones

## Details

El flujo actual de datos es:

```
lib/mock-data.ts → getInitialState() → Zustand store (browser memory) → UI
```

`getInitialState()` carga datos síncronamente desde `lib/mock-data.ts` (datos hardcodeados).
`initializeApp()` re-fetcha desde los servicios mock — que también retornan los mismos datos estáticos.

No existe ningún mecanismo de escritura a disco, ninguna API route para file I/O, y ningún adaptador de persistencia en el service layer.

El store Zustand tiene estas slices de datos que necesitan migrar a archivos:
- `projects[]` (con `sprints[]`, `tasks[]`, `documents[]` anidados)
- `members[]`
- `activities[]`

## Affected Files

- `lib/store.ts` — toda la lógica de estado
- `lib/mock-data.ts` — fuente de datos estática actual
- `lib/services/mock/seed.ts` — seed function síncrona
- `lib/services/mock/projects.mock.ts`
- `lib/services/mock/members.mock.ts`
- `lib/services/mock/activities.mock.ts`

## Recommendations

1. Diseñar e implementar un `FileProjectsService` que lea/escriba markdown files
2. Implementar API routes de Next.js para file I/O server-side
3. Adaptar el store init para ser completamente asíncrono (no hay seed síncrono)
4. Mantener los mock services como fixture de testing únicamente
