# Architecture Decision Records (ADR)

Un ADR es un documento corto (media página, no más) que recoge **una** decisión de arquitectura real: qué se decidió, por qué, y qué alternativas se rechazaron. No es el sitio para explicar un bug ni una feature rutinaria — solo decisiones donde había más de un camino razonable y hubo que elegir uno.

En este proyecto conviven dos niveles de documentación, a propósito, cada uno con su función:

- **[`prompts-AGB.md`](../../entrega-frontend-AGB/prompts-AGB.md)** — el diario completo de la sesión: cada rama, el proceso de investigación, los hallazgos reales por el camino, verificado con PoCs. Es la versión larga, cronológica.
- **`docs/adr/`** (este directorio) — la versión corta y atemporal de las decisiones de arquitectura que sobreviven al detalle del proceso. Si solo quieres saber *qué se decidió y por qué*, sin el "cómo se llegó hasta ahí", empieza aquí.

Cada ADR enlaza a la sección de `prompts-AGB.md` donde se puede leer el proceso completo, por si hace falta más contexto.

## Formato

El formato usado es el clásico de Michael Nygard (el más extendido, el mismo que usan la mayoría de proyectos open source que llevan ADRs):

```
# ADR-NNNN: Título en imperativo

## Estado
Aceptado | Reemplazado por ADR-XXXX | Obsoleto

## Contexto
¿Qué problema había? ¿Qué fuerzas entraban en conflicto?

## Decisión
Qué se decidió hacer, en una o dos frases.

## Alternativas consideradas
Qué otras opciones había y por qué se descartaron.

## Consecuencias
Qué implica esta decisión, buenas y malas -- incluidas las que no se
sabían hasta que se tomó.
```

## Índice

| # | Título | Rama | Estado |
|---|---|---|---|
| [0000](./0000-use-architecture-decision-records.md) | Usar Architecture Decision Records | `adrs-AGB` | Aceptado |
| [0001](./0001-migrate-cra-to-vite.md) | Migrar de Create React App a Vite | `vite-migration-AGB` | Aceptado |
| [0002](./0002-adopt-react-i18next.md) | Adoptar `react-i18next` en vez del sistema de i18n casero | `i18n-react-i18next-AGB` | Aceptado |
| [0003](./0003-jwt-stateless-auth.md) | Autenticación JWT sin estado, con mensaje de error genérico | `api-auth-AGB` | Aceptado |
| [0004](./0004-global-axios-interceptor.md) | Interceptor global de axios en vez de una instancia dedicada | `api-auth-AGB` | Aceptado |
| [0005](./0005-route-based-code-splitting.md) | *Code splitting* por ruta con `React.lazy` + `Suspense` | `code-splitting-AGB` | Reemplazado por ADR-0010 |
| [0006](./0006-upgrade-react-router-v7.md) | Actualizar `react-router-dom` de v6 a v7 | `react-router-v7-AGB` | Aceptado |
| [0007](./0007-adopt-openspec-per-capability.md) | Adoptar OpenSpec, una spec por capacidad | `openspec-adoption-AGB` | Aceptado |
| [0008](./0008-playwright-bdd-for-e2e.md) | Playwright + `playwright-bdd`, trazado a OpenSpec | `playwright-bdd-AGB` | Aceptado |
| [0009](./0009-scope-playwright-to-verifiable-behavior.md) | Playwright verifica comportamiento verificable, no solo HTTP/navegador | `playwright-bdd-AGB` | Aceptado |
| [0010](./0010-data-router-for-navigation-state.md) | Migrar a `createBrowserRouter` para tener estado real de navegación | `playwright-bdd-AGB` | Aceptado |
