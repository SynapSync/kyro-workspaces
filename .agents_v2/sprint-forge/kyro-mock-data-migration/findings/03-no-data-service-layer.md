# Finding: Ausencia de Capa de Servicio de Datos

## Summary

El store de Zustand se inicializa directamente desde `mock-data.ts` sin ninguna abstracción. No existe una capa de servicio o repositorio que separe "de dónde vienen los datos" de "cómo se gestiona el estado". Cuando se conecte una API real, todos los actions del store deberán ser reescritos para operaciones async, sin una interfaz estable que garantice la consistencia.

## Severity / Impact

**high** — Es el bloqueo principal para integrar datos reales. Sin esta capa, la migración requerirá cambios en cascada en store, componentes y tests.

## Details

### Patrón actual — acoplamiento directo

```
mock-data.ts ──→ store.ts (state init) ──→ components
                                           (useAppStore())
```

El store actúa como fuente de datos **y** gestor de estado al mismo tiempo. No hay separación de responsabilidades.

### Ejemplo: ¿Cómo se debería agregar un proyecto?

**Ahora (síncrono, mock):**
```typescript
addProject: (project) => set((state) => ({
  projects: [...state.projects, project],
}))
```

**Con API real (async):**
```typescript
addProject: async (project) => {
  const created = await api.projects.create(project)
  set((state) => ({ projects: [...state.projects, created] }))
}
```

Sin una interfaz de servicio, habrá que buscar y reescribir cada action del store para agregar async/await + error handling + loading states. Esto multiplica el riesgo de regresiones.

### Lo que falta: interfaz de servicio

Necesitamos un contrato que pueda implementarse de dos formas:

```typescript
// lib/services/projects.service.ts
interface ProjectsService {
  list(): Promise<Project[]>
  getById(id: string): Promise<Project>
  create(data: CreateProjectInput): Promise<Project>
  update(id: string, data: UpdateProjectInput): Promise<Project>
  delete(id: string): Promise<void>
}

// Implementación mock (usa mock-data)
class MockProjectsService implements ProjectsService { ... }

// Implementación real (llama a la API)
class ApiProjectsService implements ProjectsService { ... }
```

### Operaciones que necesitan esta capa

| Entidad | Operaciones |
|---------|------------|
| Projects | list, getById, create, update, delete |
| Documents | list, getById, create, update, delete |
| Sprints | list, getById, create, update |
| Tasks | list, create, update, move, delete |
| Members | list, create, update, remove |
| Activities | list, create |

## Affected Files

- `lib/store.ts` — todos los actions necesitan ser adaptados
- `lib/mock-data.ts` — se convierte en la implementación mock de los servicios
- Todos los componentes que llaman actions del store directamente

## Recommendations

1. Crear `lib/services/` con una interfaz por entidad principal
2. Implementar `MockProjectsService`, `MockSprintsService`, etc. usando los datos de `mock-data.ts`
3. Crear `lib/services/index.ts` con un factory que selecciona mock vs real según `NEXT_PUBLIC_USE_MOCK_DATA`
4. Actualizar el store para llamar servicios en lugar de mutar estado directamente
5. Los servicios mock son síncronos (o con delay artificial), los reales serán async — el store debe manejar ambos
