# Finding: Sin Contrato de API ni Capa de Mapeo

## Summary

No existen tipos de respuesta de API (DTOs), ni una capa de mapeo entre lo que devuelve el backend y los tipos de dominio que usa el frontend. Los tipos actuales en `lib/types.ts` son tipos de dominio pensados para el estado del cliente, no para el contrato de la API. Cuando el backend esté disponible, no habrá un lugar claro donde adaptar las respuestas.

## Severity / Impact

**medium** — No bloquea el trabajo actual en mock data, pero define la arquitectura que determinará cuán limpia será la integración real. Mejor definirlo antes que durante la integración.

## Details

### Diferencia entre Domain Types y API DTOs

**Domain Type** (para el estado del cliente):
```typescript
// lib/types.ts — lo que el store y los componentes usan
type Task = {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  assignee: string | undefined
  tags: string[]
  createdAt: string  // ISO string
  updatedAt: string
}
```

**API DTO** (lo que devuelve el backend):
```typescript
// lib/api/types.ts — lo que viene del servidor
type TaskDTO = {
  _id: string          // MongoDB ObjectId vs "id"
  title: string
  status: string       // sin validación de enum
  priority: string
  assigned_to: string  // snake_case vs camelCase
  tags: string[]
  created_at: string
  updated_at: string
  sprint_id: string    // relación que el domain type no necesita explícitamente
}
```

Sin una capa de mapeo, el componente o el store tendrían que hacer esta transformación inline, dispersando lógica de adaptación por toda la aplicación.

### Lo que hace falta

```
API Response (DTO) → Mapper → Domain Type → Store → Component
```

Actualmente:
```
mock-data.ts (ya en domain shape) → Store → Component
```

Cuando llegue la API real, si no hay mappers, la transformación se hará ad-hoc en cada punto de llamada.

### Endpoints que necesitarán DTOs

| Recurso | Endpoints estimados |
|---------|-------------------|
| Projects | GET /projects, POST /projects, PATCH /projects/:id, DELETE /projects/:id |
| Documents | GET /projects/:id/documents, POST, PATCH, DELETE |
| Sprints | GET /projects/:id/sprints, POST, PATCH |
| Tasks | GET /sprints/:id/tasks, POST, PATCH, DELETE |
| Members | GET /team, POST, PATCH, DELETE |
| Activities | GET /activities?projectId=:id |
| User | GET /me |

## Affected Files

- `lib/types.ts` — solo tiene domain types, no DTOs
- `lib/mock-data.ts` — ya usa domain shape, no necesita mappers (ventaja del mock)
- Futuros archivos: `lib/api/types.ts`, `lib/api/mappers/`, `lib/api/client.ts`

## Recommendations

1. Crear `lib/api/` directory como preparación
2. Definir `lib/api/types.ts` con DTOs de los endpoints conocidos o esperados
3. Crear `lib/api/mappers/` con funciones puras de transformación DTO → Domain
4. Crear `lib/api/client.ts` con un fetch wrapper configurado (baseURL, auth headers, error handling)
5. El mock service (Finding 03) puede implementar la misma interfaz retornando directamente domain types (sin necesidad de mappers en modo mock)
6. Por ahora, definir los DTOs como una "especulación informada" basada en la estructura actual — se ajustarán cuando el backend defina su contrato real
