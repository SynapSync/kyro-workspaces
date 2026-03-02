# Finding: Entidades del Mock Data No Reflejadas en el Store

## Summary

El archivo `lib/mock-data.ts` define datos que el store (`lib/store.ts`) no gestiona: `teamMembers` existe en mock-data pero no está en el estado de Zustand. Esto fuerza a los componentes a importar directamente de mock-data en lugar de acceder al estado centralizado, creando acoplamiento directo con la capa de datos mock.

## Severity / Impact

**medium** — Crea inconsistencia entre el store como fuente de verdad y mock-data como fuente alternativa. Cuando lleguen datos reales, estos componentes no actualizarán correctamente.

## Details

### teamMembers — en mock-data pero no en el store

`lib/mock-data.ts` exporta:
```typescript
export const teamMembers = [
  { name: "Alex Chen", avatar: "AC", color: "bg-blue-500" },
  { name: "Maya Patel", avatar: "MP", color: "bg-emerald-500" },
  { name: "Jordan Liu", avatar: "JL", color: "bg-amber-500" },
  { name: "Sprint Forge", avatar: "SF", color: "bg-primary" },
]
```

El tipo `TeamMember` no existe en `lib/types.ts`. Los componentes que necesitan mostrar asignados de tasks o avatares de equipo necesitan importar este array directamente del archivo mock, sin pasar por el store.

### Estado inicial del store — sin TeamMember

`lib/store.ts` inicializa:
```typescript
{
  projects: mockProjects,         // ✓ en store
  activeProjectId: ...,           // ✓ en store
  activities: mockActivities,     // ✓ en store
  // teamMembers: ???              // ✗ ausente
}
```

### Impacto en migración a datos reales

Cuando se conecte una API real:
- Los componentes que importan directamente de mock-data no actualizarán al cambiar datos
- `teamMembers` debe venir de un endpoint `/api/team` y pasar por el store
- Sin el tipo `TeamMember` en types.ts, TypeScript no puede validar la forma de los datos

## Affected Files

- `lib/mock-data.ts` — define teamMembers sin tipo formal
- `lib/store.ts` — no incluye teamMembers en el estado
- `lib/types.ts` — falta el tipo TeamMember
- Cualquier componente que use asignaciones de tareas (task assignee display)

## Recommendations

1. Definir el tipo `TeamMember` en `lib/types.ts` con Zod schema
2. Agregar `members: TeamMember[]` al estado de Zustand en `lib/store.ts`
3. Inicializar con `teamMembers` de mock-data igual que `projects` y `activities`
4. Agregar acciones: `addMember`, `updateMember`, `removeMember`
5. Reemplazar imports directos de mock-data en componentes por `useAppStore(s => s.members)`
