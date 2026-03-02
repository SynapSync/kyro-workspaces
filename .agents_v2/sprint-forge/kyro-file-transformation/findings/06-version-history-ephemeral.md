# Finding 06 — Document Version History is Ephemeral

## Summary

El sistema de versiones de documentos (`DocumentVersion[]`) vive exclusivamente en memoria del store de Zustand. Se pierden al recargar la página. El historial de versiones es una feature de valor para los agentes (saber qué cambió y cuándo) pero actualmente no tiene ninguna persistencia.

## Severity / Impact

**medium** — La feature existe y funciona en la UI, pero es frágil. Para la arquitectura de archivos, necesitamos decidir la estrategia de versionado.

## Details

### Estado actual

```typescript
// En lib/store.ts
documentVersions: Record<string, DocumentVersion[]>  // { docId: versions[] }
// Max 10 versiones por documento, en memoria
// Se pierden al recargar
```

La UI tiene `VersionHistory` component que muestra las últimas 10 versiones y permite restaurar.

### Estrategia de versión con archivos: Git

La solución más elegante para un sistema de archivos markdown es usar **Git** como motor de versiones:

- Cada save de documento = un commit en el repositorio de workspace
- El historial de versiones = `git log` sobre el archivo
- Restaurar una versión = `git checkout {hash} -- path/to/file`
- Los agentes pueden usar `git blame`, `git log --follow` para entender el historial

**Ventajas**:
- Natural para developers y agentes
- Sin código adicional de versioning
- El workspace es un git repo por defecto
- Integra perfectamente con el flujo de trabajo existente

**Alternativa si git no es viable**:

```
projects/{id}/documents/
├── my-doc.md              # versión actual
└── .versions/
    ├── my-doc.2026-03-01T10:00:00Z.md
    ├── my-doc.2026-03-01T11:30:00Z.md
    └── ...
```

### Impacto en la UI

Con Git como backend de versiones:
- `VersionHistory` component lee commits de git via API route
- `restoreVersion` hace `git checkout` via API route
- El límite de 10 versiones desaparece (git tiene historia completa)

## Affected Files

- `lib/store.ts` — eliminar `documentVersions` slice o adaptarlo a git
- `components/editor/version-history.tsx` — adaptar para leer git history
- `app/api/documents/[docId]/versions/route.ts` — endpoint para git log
- Workspace: inicializar como git repo

## Recommendations

1. Inicializar el workspace como git repository al crear (`git init`)
2. Auto-commit en cada save de documento (con 2s debounce existente)
3. Implementar API route para leer git log de un archivo
4. Adaptar `VersionHistory` component para consumir git history
5. Implementar API route para restore (git checkout)
6. Como fallback para MVP: shadow copies en `.versions/` si git no está disponible
