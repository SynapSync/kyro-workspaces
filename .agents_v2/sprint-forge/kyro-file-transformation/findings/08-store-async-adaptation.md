# Finding 08 — Store Init Must Be Fully Async

## Summary

El store Zustand usa un patrón de inicialización híbrido: `getInitialState()` es síncrono y siembra datos desde `mock-data.ts`, mientras que `initializeApp()` es asíncrono pero llama a servicios mock que retornan los mismos datos estáticos. Con archivos como fuente de verdad, no hay datos disponibles síncronamente — todo viene del filesystem via API routes (async).

## Severity / Impact

**medium** — El patrón de init existente ya anticipó la necesidad de async (`isInitializing`, `initError`, `initializeApp()`). El cambio es quirúrgico pero afecta el flujo de arranque de la aplicación.

## Details

### Estado actual

```typescript
// lib/store.ts
const getInitialState = (): AppState => ({
  // datos sembrados desde mock-data.ts — SÍNCRONO
  projects: mockProjects,
  members: mockMembers,
  activities: mockActivities,
  isInitializing: false,
  // ...
});

// AppInitializer llama esto después del mount
async initializeApp() {
  set({ isInitializing: true });
  const projects = await services.projects.getProjects(); // → mock, síncrono bajo la superficie
  set({ projects, isInitializing: false });
}
```

### Estado objetivo

```typescript
const getInitialState = (): AppState => ({
  // SIN datos pre-sembrados
  projects: [],
  members: [],
  activities: [],
  isInitializing: true,  // ← empieza en true
  initError: null,
  // solo UI state inicial
  activeProjectId: null,
  activeSidebarItem: "overview",
  // ...
});

async initializeApp() {
  try {
    set({ isInitializing: true, initError: null });
    const workspace = await services.workspace.getWorkspace();
    const projects = await services.projects.getProjects();
    const members = await services.members.getMembers();
    set({
      workspace,
      projects,
      members,
      activities: [],
      isInitializing: false,
      // Set initial active project si hay proyectos
      activeProjectId: projects[0]?.id ?? null,
    });
  } catch (err) {
    set({
      isInitializing: false,
      initError: err instanceof Error ? err.message : 'Failed to load workspace',
    });
  }
}
```

### Loading UI

El `ContentRouter` ya tiene un guard de `isInitializing` que muestra un loading state. Para el file backend, este loading state se vuelve real (habrá latencia de filesystem). Se necesita:
- Loading state más informativo ("Loading workspace...", "Reading projects...")
- Error state con capacidad de retry
- Estado vacío cuando el workspace está vacío (onboarding)

### Acciones del store que necesitan adaptación

Las acciones de CRUD actualmente mutan el estado directamente en Zustand y llaman al servicio como side-effect. Con file backend, el orden debe invertirse:

```typescript
// Actual (mal para file backend):
addTask: (sprintId, task) => {
  set(state => { /* muta estado */ });
  services.projects.createTask(sprintId, task); // fire-and-forget
}

// Objetivo (correcto):
addTask: async (sprintId, task) => {
  const newTask = await services.projects.createTask(sprintId, task); // escribe al archivo
  set(state => { /* actualiza estado con la respuesta del server */ });
}
```

Esto requiere que los componentes manejen el estado de loading para operaciones de escritura (saving indicators, disable mientras guarda, etc.).

## Affected Files

- `lib/store.ts` — eliminar seed síncrono, adaptar todas las acciones CRUD a async
- `lib/services/mock/seed.ts` — puede mantenerse para testing, no para init
- `components/content-router.tsx` — mejorar loading/error UI
- Todos los componentes que llaman acciones de store — añadir loading state local

## Recommendations

1. Eliminar `getInitialState()` o convertirla a solo state de UI (sin datos)
2. `initializeApp()` es el único punto de carga de datos
3. Convertir todas las store actions CRUD a async con manejo de errores
4. Añadir `isSaving` state para operaciones de escritura frecuentes (ej: document editor)
5. Considerar optimistic updates para UX fluida (actualizar UI antes de confirmar escritura al disco)
