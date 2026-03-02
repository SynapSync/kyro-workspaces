# Finding 07 — No Agent Infrastructure

## Summary

Kyro no tiene ninguna infraestructura para que los agentes se orienten: no hay `README.md` para agentes en el workspace, no hay `RE-ENTRY-PROMPTS`, no hay `AGENTS.md` en el codebase (hasta este sprint-forge INIT). Los agentes no tienen un punto de entrada documentado ni un protocolo para retomar trabajo entre sesiones.

## Severity / Impact

**high** — La visión principal del producto ("agentes como clientes primarios del workspace") requiere que los agentes sepan exactamente qué leer, cómo trabajar, y cómo retomar el contexto. Sin esto, el sistema solo es útil para humanos.

## Details

### Lo que necesitan los agentes para funcionar

Para que un agente pueda recibir la instrucción "trabaja en el proyecto X, sprint Y" y ejecutar correctamente, necesita:

**1. README.md del proyecto** — lectura obligatoria al comenzar
```markdown
# Proyecto: Integrar Pasarela de Pago

## Objetivo del Proyecto
Integrar Stripe como pasarela de pago en la página web del chef.

## Stack Técnico
Next.js 15, TypeScript, Stripe SDK

## Cómo Trabajar
1. Lee el ROADMAP.md para entender el plan de sprints
2. Lee el último sprint en sprints/SPRINT-XX.md
3. Lee RE-ENTRY-PROMPTS.md para el prompt correcto

## Estado Actual
Sprint activo: SPRINT-02
Última actualización: 2026-03-01
```

**2. RE-ENTRY-PROMPTS.md** — prompts pre-escritos para el humano
```markdown
# Re-entry Prompts — Proyecto Pasarela de Pago

## Para comenzar el próximo sprint:
Lee README.md, ROADMAP.md, y SPRINT-01.md (con retro), luego usa /sprint-forge
para generar el Sprint 2.

## Para retomar un sprint en progreso:
Lee README.md y SPRINT-02.md. Continúa desde la última tarea marcada [~].
```

**3. ROADMAP.md del proyecto** — plan de sprints generado por sprint-forge

**4. Workspace-level README** — orientación general del workspace:
```markdown
# Workspace: Página Web del Chef

## Proyectos
- [integrar-pago] Integrar Pasarela de Pago — Sprint activo: 2
- [integrar-auth] Integrar Auth — pendiente
- [mejorar-ui] Mejorar UI — pendiente

## Agentes: Por dónde empezar
Indica el proyecto y sprint en tu prompt. El agente debe leer:
1. projects/{slug}/README.md
2. projects/{slug}/ROADMAP.md
3. projects/{slug}/sprints/SPRINT-XX.md (el último)
4. projects/{slug}/RE-ENTRY-PROMPTS.md
```

### Integración con sprint-forge skill

El skill `sprint-forge` ya genera ROADMAP.md, RE-ENTRY-PROMPTS.md, y README.md para el planning de sprints. La UI de Kyro debe:
- Exponer estos archivos como documentos legibles
- Permitir al usuario ejecutar `/sprint-forge` desde la UI para generar/actualizar estos archivos
- Generar automáticamente README.md al crear un proyecto nuevo

## Affected Files

- `components/pages/readme-page.tsx` — ya existe, adaptar para mostrar README del proyecto
- `components/pages/documents-page.tsx` — añadir vista de ROADMAP y RE-ENTRY-PROMPTS
- `lib/services/file/projects.file.ts` — incluir README en el model de Project
- Workspace root: generar `README.md` del workspace en init

## Recommendations

1. Al crear un proyecto nuevo, generar automáticamente `README.md`, `ROADMAP.md` (vacío), `RE-ENTRY-PROMPTS.md` (template)
2. Al crear un workspace nuevo, generar `README.md` del workspace con índice de proyectos
3. La UI debe mostrar README.md del proyecto en la pestaña "Readme" (ya existe)
4. Integrar sprint-forge: la UI puede tener un botón "Generate Roadmap with AI"
5. Documentar en AGENTS.md del workspace el protocolo de trabajo para agentes
