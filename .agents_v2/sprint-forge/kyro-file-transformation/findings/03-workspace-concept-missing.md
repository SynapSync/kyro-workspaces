# Finding 03 — Workspace Concept Missing

## Summary

El modelo de datos actual no tiene el concepto de "Workspace" — el contenedor raíz que agrupa proyectos. El store de Zustand maneja `projects[]` directamente, sin un nivel superior. Esto limita la capacidad de los agentes para orientarse ("¿en qué workspace trabajo?") y hace imposible la configuración de la ruta del workspace en el sistema de archivos.

## Severity / Impact

**high** — Sin el concepto de Workspace:
- No hay forma de configurar dónde viven los archivos en disco
- Los agentes no tienen un punto de entrada claro ("trabaja en el workspace X")
- No se puede soportar múltiples workspaces (ej: "pagina del chef" vs "proyecto personal")

## Details

La visión del usuario es:

```
Workspace = espacio de trabajo completo (ej: "Página web de Chef")
  └── Proyecto 1: Integrar pasarela de pago
  └── Proyecto 2: Integrar auth
  └── Proyecto 3: Mejorar UI
```

Actualmente el store tiene:
```typescript
interface AppState {
  projects: Project[];        // ← directamente, sin workspace wrapper
  members: TeamMember[];
  activities: AgentActivity[];
}
```

Lo que se necesita:
```typescript
interface Workspace {
  id: string;
  name: string;
  description: string;
  rootPath: string;           // ruta en disco: ~/Documents/workspace-chef/
  projects: Project[];        // proyectos dentro del workspace
  members: TeamMember[];      // equipo global del workspace
}
```

El `rootPath` es la pieza crítica: determina dónde se guardan todos los archivos markdown. La UI lo lee de una variable de entorno o de configuración local.

### Configuración de ruta del workspace

```env
KYRO_WORKSPACE_PATH=/Users/rperaza/Documents/mi-workspace
```

O alternativamente, configurable desde la UI (primer uso → onboarding).

## Affected Files

- `lib/types.ts` — añadir `Workspace` interface
- `lib/store.ts` — añadir `activeWorkspace` al state
- `lib/config.ts` — añadir `DEFAULT_WORKSPACE_PATH`
- `.env.local` (nuevo) — `KYRO_WORKSPACE_PATH`
- `components/providers.tsx` — pasar workspace config al init

## Recommendations

1. Añadir `Workspace` type a `lib/types.ts`
2. Añadir `KYRO_WORKSPACE_PATH` como variable de entorno con default razonable
3. Crear endpoint para leer/inicializar workspace desde la ruta configurada
4. Mostrar workspace name en el sidebar (reemplaza el hardcoded "Clever")
5. Para MVP: soportar un solo workspace activo (multi-workspace es Sprint 5+)
