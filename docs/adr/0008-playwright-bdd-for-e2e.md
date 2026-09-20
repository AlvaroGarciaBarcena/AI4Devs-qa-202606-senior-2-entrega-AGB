# ADR-0008: Playwright + `playwright-bdd`, trazado a OpenSpec

## Estado
Aceptado

## Contexto
Con OpenSpec ya adoptado (ADR-0007) y sus 56 escenarios escritos en GIVEN/WHEN/THEN completo, faltaba una forma de verificar que esos escenarios eran ciertos de verdad contra la aplicación en marcha, no solo prosa. `candidate-validation` ya tenía cobertura de Jest a nivel unitario, pero nada ejercitaba la aplicación real de principio a fin (navegador real, backend real, base de datos real).

## Decisión
[Playwright](https://playwright.dev) como motor E2E, con [`playwright-bdd`](https://vitalets.github.io/playwright-bdd/) generando los tests a partir de ficheros `.feature` en Gherkin — cada escenario de `e2e/features/*.feature` corresponde 1:1 a un escenario ya escrito en `openspec/specs/`, con un comentario de trazabilidad apuntando a la spec y al requisito de los que viene.

## Alternativas consideradas
- **Playwright "puro"** (tests como código TypeScript, sin capa BDD): rechazado — habría significado reescribir cada escenario GIVEN/WHEN/THEN de OpenSpec como código de test libre, perdiendo la correspondencia 1:1 y con ella la trazabilidad directa entre spec y test.
- **Cypress**: no evaluado a fondo — Playwright ya tenía la ventaja de estar instalado en el entorno del usuario y de soportar de forma nativa los tres motores de navegador con la misma API.

## Consecuencias
- Cada nueva capacidad de OpenSpec tiene un camino directo y mecánico hacia su propio fichero `.feature` — la estructura ya existe, "solo" hace falta escribir los *steps* que implementan cada GIVEN/WHEN/THEN.
- La traducción de GIVEN/WHEN/THEN a Gherkin es mecánica; escribir los *steps* que de verdad pilotan el navegador/la API es trabajo real de ingeniería, no una generación automática — varios hallazgos reales de esta sesión (ver ADR-0009 y los hallazgos de `prompts-AGB.md` §3.28 en adelante) salieron precisamente de escribir esos *steps* contra la aplicación real.

Más contexto: [`prompts-AGB.md` §3.25](../../entrega-frontend-AGB/prompts-AGB.md#325-primer-escenario-real-con-playwright-bdd-playwright-bdd-agb).
