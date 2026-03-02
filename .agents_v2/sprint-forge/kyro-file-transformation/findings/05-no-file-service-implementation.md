# Finding 05 — No File Service Implementation

## Summary

El service layer de Kyro (`lib/services/`) ya tiene las interfaces correctas (`ProjectsService`, `MembersService`, `ActivitiesService`) pero solo existe la implementación mock. La fábrica siempre retorna mock. No existe ningún `FileProjectsService` que lea/escriba archivos reales.

## Severity / Impact

**high** — La arquitectura ya está preparada para este cambio (D3 de la deuda técnica conocida). El service layer es el punto de inyección correcto — los componentes y el store no necesitan cambiar.

## Details

### Estado actual del service layer

```
lib/services/
├── types.ts          # interfaces: ProjectsService, MembersService, ActivitiesService
├── index.ts          # factory → SIEMPRE retorna mock (D3 debt)
└── mock/
    ├── seed.ts       # getInitialState() síncrono
    ├── projects.mock.ts
    ├── members.mock.ts
    └── activities.mock.ts
```

### Estado objetivo

```
lib/services/
├── types.ts          # sin cambios
├── index.ts          # factory → mock si NEXT_PUBLIC_USE_MOCK_DATA=true, file si false
├── mock/             # sin cambios (mantener para testing)
│   ├── seed.ts
│   ├── projects.mock.ts
│   ├── members.mock.ts
│   └── activities.mock.ts
└── file/             # NUEVO
    ├── projects.file.ts   # llama API routes para CRUD en archivos
    ├── members.file.ts
    └── activities.file.ts
```

### Interface actual de ProjectsService (desde lib/services/types.ts)

```typescript
interface ProjectsService {
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  // FALTA: create, update, delete — necesitan añadirse
}
```

Los servicios mock tienen operaciones CRUD adicionales implementadas directamente en el store. Para el file service, todas las operaciones deben pasar por el service layer, no directamente en el store.

### Patrón del FileProjectsService

```typescript
// lib/services/file/projects.file.ts
export class FileProjectsService implements ProjectsService {
  async getProjects(): Promise<Project[]> {
    const res = await fetch('/api/projects');
    if (!res.ok) throw new Error('Failed to read projects');
    return res.json();
  }

  async getProject(id: string): Promise<Project | null> {
    const res = await fetch(`/api/projects/${id}`);
    if (res.status === 404) return null;
    return res.json();
  }

  async createProject(data: CreateProjectInput): Promise<Project> {
    const res = await fetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return res.json();
  }
  // ...
}
```

### Service interface expansion requerida

Las interfaces actuales solo tienen `get*`. Se necesitan:
- `createProject(data)`, `updateProject(id, data)`, `deleteProject(id)`
- `createSprint(projectId, data)`, `updateSprint(projectId, sprintId, data)`, `deleteSprint()`
- `createTask(sprintId, data)`, `updateTask()`, `deleteTask()`, `moveTask()`
- `createDocument(projectId, data)`, `updateDocument()`, `deleteDocument()`
- `updateSprintSection(sprintId, key, content)`

## Affected Files

- `lib/services/types.ts` — ampliar interfaces con CRUD completo
- `lib/services/index.ts` — switch mock/file via env var
- `lib/services/file/` — directorio nuevo con 3 implementaciones
- `lib/store.ts` — refactor de acciones directas a llamadas al service

## Recommendations

1. Primero ampliar `lib/services/types.ts` con interfaces CRUD completas
2. Implementar `FileProjectsService`, `FileMembersService`, `FileActivitiesService`
3. Actualizar factory en `index.ts` para retornar file services cuando `NEXT_PUBLIC_USE_MOCK_DATA=false`
4. Refactorizar acciones del store para usar el service layer (actualmente algunas mutan estado directamente)
5. Añadir `NEXT_PUBLIC_USE_MOCK_DATA=false` a `.env.local` para activar el file backend
