# Finding: UI Config & Constants Scattered Across Components

## Summary

Configuración de UI (colores de prioridad, items de navegación, columnas del kanban, secciones de sprint) está dispersa en múltiples archivos en lugar de vivir en un único módulo de configuración. Adicionalmente, hay datos de identidad hardcodeados (nombre de usuario, logo) directamente en componentes.

## Severity / Impact

**medium** — No bloquea el desarrollo inmediato pero dificulta la migración a datos reales y crea inconsistencias cuando los valores deben actualizarse.

## Details

### Hallazgos específicos

**1. `priorityConfig` en `components/kanban/task-card.tsx`**
Mapping de prioridad a estilos visuales hardcodeado en el componente:
```typescript
const priorityConfig = {
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", className: "bg-blue-500/10 text-blue-600" },
  high: { label: "High", className: "bg-amber-500/10 text-amber-600" },
  urgent: { label: "Urgent", className: "bg-red-500/10 text-red-600" },
}
```

**2. `navItems` en `components/app-sidebar.tsx`**
Items de navegación principal definidos inline:
```typescript
const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "readme", label: "README", icon: FileText },
  { id: "documents", label: "Documents", icon: FolderOpen },
  { id: "sprints", label: "Sprints", icon: Zap },
  { id: "agents", label: "Agents Activity", icon: Bot },
]
```

**3. `COLUMNS` y `SPRINT_SECTIONS` en `lib/types.ts`**
Configuración de negocio mezclada con definiciones de tipos TypeScript. Los tipos son contratos, las constantes son configuración — deben estar separados.

**4. User info hardcodeado en `components/app-sidebar.tsx`**
```typescript
// Sidebar footer con datos fijos
Name: "Tahlia Chen"
Email: "tahlia@clever.dev"
Avatar: "TC"
```

**5. Logo hardcodeado**
```typescript
// Texto "Clever" hardcodeado en el sidebar
```

### Por qué importa para la migración a datos reales
- Cuando la autenticación real exista, el user info del sidebar debe venir del contexto de auth
- Los `navItems` pueden necesitar ser dinámicos basados en permisos del usuario
- `COLUMNS` y `SPRINT_SECTIONS` deben ser configurables por proyecto en el futuro

## Affected Files

- `components/kanban/task-card.tsx` — priorityConfig
- `components/app-sidebar.tsx` — navItems, user info, logo
- `lib/types.ts` — COLUMNS, SPRINT_SECTIONS_METADATA

## Recommendations

1. Crear `lib/config.ts` con todas las constantes de UI: `PRIORITY_CONFIG`, `NAV_ITEMS`, `COLUMNS`, `SPRINT_SECTIONS_METADATA`
2. Mover `COLUMNS` y `SPRINT_SECTIONS_METADATA` fuera de `lib/types.ts` hacia `lib/config.ts`
3. Crear un placeholder `lib/auth.ts` con un mock del usuario actual (`currentUser`) que luego será reemplazado por el contexto de autenticación real
4. Importar desde `lib/config.ts` en todos los componentes que necesiten estas constantes
