# ADR-0009: Playwright verifica comportamiento verificable, no solo HTTP/navegador

## Estado
Aceptado

## Contexto
Al planificar qué capacidades de OpenSpec cubrir con Playwright (ADR-0008), se excluyó `developer-tooling` (build, tests, auditoría de dependencias) bajo el criterio de que Playwright servía para "comportamiento HTTP/navegador", no para comandos de shell. Preguntado directamente si había algún motivo real para esa separación, no lo había: un *step* de `playwright-bdd` es código Node normal — puede hacer una petición HTTP, pilotar un navegador, o ejecutar `npm audit`/`tsc` por `child_process`, con la misma validez.

## Decisión
El criterio para qué entra en la suite de Playwright no es "¿es HTTP o navegador?", es "¿verifica algo real y automatizable del comportamiento o el estado del sistema?". Se incluye `security-hardening`/"Auditoría de dependencias" (ya en ADR-0008) y, más adelante, toda la capacidad `developer-tooling` (build de producción, arranque del entorno de desarrollo, suite de tests, tests tras un build, auditoría de `react-router-dom`) con el mismo motor de Playwright.

## Alternativas consideradas
- **Mantener el límite HTTP/navegador y dejar `developer-tooling` sin cobertura E2E**: era la postura inicial; rechazada al no encontrar ninguna limitación real de la herramienta detrás, solo una convención propia sin justificar.
- **Un *runner* de tests distinto para las verificaciones de shell** (p. ej. un script aparte fuera de Playwright): rechazado — habría duplicado infraestructura (otro `package.json`, otro comando) por una distinción que resultó no ser necesaria.

## Consecuencias
- Encontró un hallazgo real que de otra forma habría quedado invisible: el build real de `tsc` llevaba horas roto (un `import()` dinámico sin tipos resolubles) sin que nadie lo notara, porque `ts-node-dev` corre en modo `--transpile-only` y nunca comprueba tipos. Un escenario E2E que ejecuta `tsc` de verdad lo encontró en el primer intento.
- La suite mezcla ahora verificaciones de comportamiento de usuario final (clics reales en un navegador) con verificaciones de infraestructura (un build, una auditoría) — hay que ser explícito en cada `.feature` sobre cuál es cuál, para no confundir a quien lo lea después.

Más contexto: [`prompts-AGB.md` §3.27.3](../../entrega-frontend-AGB/prompts-AGB.md#327-capacidad-security-hardening-un-hallazgo-real-un-problema-de-orden-real-y-un-replanteamiento-del-alcance) y [§3.31.1](../../entrega-frontend-AGB/prompts-AGB.md#331-developer-tooling-55-la-última-capacidad-y-un-hallazgo-real-de-tsc-que-ts-node-dev-nunca-había-visto).
