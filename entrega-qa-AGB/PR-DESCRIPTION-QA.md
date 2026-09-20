## Descripción

Añade la cobertura E2E con Playwright que pide este ejercicio (Lección 11, segunda fase) sobre la interfaz `position`: carga del tablero y mover un candidato de una fase a otra por *drag-and-drop*, comprobando tanto el resultado visual como la llamada real al backend.

Esta rama no arranca desde el punto de partida habitual de este repo (la plantilla base de `AI4Devs-qa-202606-senior-2`), sino desde la app ya evolucionada del primer ejercicio de esta misma Lección 11 (mover candidatos entre fases). El motivo y el alcance real de este PR se explican en la siguiente sección — es importante leerla antes de revisar el diff.

## Punto de partida (leer antes de revisar el diff)

El primer ejercicio de esta lección (mover candidatos por *drag-and-drop*) se resolvió sobre el repositorio hermano [`AI4Devs-frontend-202606-senior-2`](https://github.com/LIDR-academy/AI4Devs-frontend-202606-senior-2). El starter de ese repo tenía problemas suficientemente serios (sin autenticación real, sin aislamiento entre empresas, etc. — detalle completo en `JUSTIFICACION-ENTREGA.md` de ese repo) como para justificar una divergencia real: backend y frontend reescritos con autenticación JWT, aislamiento multi-tenant, i18n, accesibilidad, migración a Vite, una suite E2E propia (Playwright + BDD) y más — 36 ramas, documentadas rama a rama en `prompts-AGB.md`/`BRANCHES_LOG` de ese repo. Esa entrega ya está publicada y revisada por separado: [`AI4Devs-frontend-202606-senior-2#22`](https://github.com/LIDR-academy/AI4Devs-frontend-202606-senior-2/pull/22).

Como ambos ejercicios de la Lección 11 son, en la práctica, sobre la misma aplicación, este segundo ejercicio parte de esa misma base ya evolucionada en vez de la plantilla original de este repo — repetir desde cero un backend/frontend equivalente solo para este ejercicio no habría aportado nada. El `main` de este fork ya contiene, por tanto, todo ese trabajo previo.

**Consecuencia práctica para revisar este PR**: el diff contra el `main` real de este repositorio es grande, pero la inmensa mayoría es la app heredada del primer ejercicio, ya revisada en el PR enlazado arriba. Para que se note a simple vista qué es de cada entrega, la documentación de ese primer ejercicio se movió a su propia carpeta, [`entrega-frontend-AGB/`](../entrega-frontend-AGB/) (el código de la app en sí, `backend/`/`frontend/`/`e2e/`, no se toca ni se mueve). El trabajo propio de *este* PR — lo único nuevo para el ejercicio de QA — está listado en "Cambios realizados" más abajo.

## Por qué hay dos configuraciones de Playwright en el repo

El repo heredado ya trae su propia suite E2E en la raíz (`/e2e`, Playwright + [playwright-bdd](https://github.com/vitalets/playwright-bdd), con su propio `playwright.config.ts` en la raíz). Antes de añadir nada se evaluó explícitamente mover o fusionar esa suite con la que pide este ejercicio, y se descartó por tres motivos concretos:

1. **Alcance distinto**: gran parte de esa suite no es de frontend — cubre autenticación, *rate limiting*, cabeceras de seguridad, los propios *hooks* de pre-commit del repo. Meterla dentro de `/frontend` la etiquetaría como "tests de frontend" cuando no lo es.
2. **El config de la raíz orquesta ambos servidores** (backend + frontend) y depende de un `globalSetup` propio para no agotar el limitador de intentos de login — moverlo habría exigido reescribirlo.
3. **Documentación ya publicada**: decenas de referencias en el repo heredado (README, `BRANCHES_LOG`, `prompts-AGB.md`) apuntan a esa ruta.

En vez de tocarla, este PR añade una configuración y una suite **nuevas e independientes**, exactamente donde y como las pide el checklist de este ejercicio: `/frontend/playwright.config.ts` + `/frontend/tests/e2e/position.spec.ts`, como su propio proyecto Playwright dentro de `/frontend` (con su propia dependencia `@playwright/test` en `frontend/package.json`), sin tocar ni depender de la suite de la raíz.

## Cambios realizados

**Lo que exige el checklist de entrega:**
- **`frontend/src/components/PositionProcess.tsx`**: atributos `data-testid` para selectores estables — `position-title` en el título, `phase-column-<slug>` en cada columna de fase (slug del nombre real de la fase, las fases son configurables) y `candidate-card-<applicationId>` en cada ficha de candidato.
- **`frontend/playwright.config.ts`** (nuevo): configuración Playwright independiente de la de la raíz, sin `webServer` propio — igual que pide el README de este ejercicio, asume que backend y frontend ya están arrancados en local.
- **`frontend/tests/e2e/position.spec.ts`** (nuevo): los dos escenarios que exige el checklist —
  1. la página `position` carga el título, las columnas de fase, y cada candidato en la columna que dice la API que le corresponde — comprobado dinámicamente contra `GET /position/:id/candidates`, no contra nombres fijados a mano (la base de datos de desarrollo compartida se movió más de una vez durante la propia construcción de este PR, ver `entrega-qa-AGB/prompts-qa-AGB.md`, secciones 1 y 9);
  2. arrastrar la ficha de un candidato a otra fase la mueve visualmente y dispara `PUT /candidates/:id` con la fase nueva en el body y respuesta exitosa (el endpoint real del backend; el README usa `/candidate/:id` solo como ejemplo genérico).
- **`frontend/package.json`**: `@playwright/test` como devDependency + script `test:e2e`.
- **`frontend/vite.config.ts`**: excluye `tests/e2e/**` de Vitest — sin esto, Vitest intentaba cargar `position.spec.ts` como si fuera un test suyo por el propio nombre del fichero.
- **`/prompts/prompts-AGB.md`** (nuevo): la lista de prompts que exige este ejercicio, en formato de instrucción, sin narrativa.
- **`/prompts/evidencia-ejecucion-AGB.txt`** (nuevo): salida real de `npx playwright test` contra el backend y frontend en local — evidencia de ejecución exitosa.

**Organización, no exigida por el checklist pero para que se entienda el repo:**
- **`entrega-frontend-AGB/`** (nuevo, moviendo ficheros ya existentes): la documentación del primer ejercicio (`prompts-AGB.md` y satélites, `BRANCHES_LOG`, `JUSTIFICACION-ENTREGA.md`, `PROMPTS_POR_PR.md`) — antes en la raíz, movida aquí para que no se mezcle con este ejercicio. `README-ES.md`/`README-EN.md` y `docs/adr/` se actualizan solo en los enlaces que apuntaban a esos ficheros movidos.
- **`entrega-qa-AGB/`** (nuevo): diario de trabajo (`prompts-qa-AGB.md`) y ramas (`BRANCHES_LOG-qa`) de este ejercicio en concreto, más esta misma descripción de PR (`PR-DESCRIPTION-QA.md`).
- **`README.md`**: aviso breve al principio señalando las dos carpetas de arriba.

## Cómo ejecutar las pruebas

Backend y frontend deben estar arrancados en local antes (este `playwright.config.ts` no los levanta él mismo):

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev

# Terminal 3
cd frontend
npm install
npx playwright install
npx playwright test
```

Resultado esperado: `2 passed`. Salida real guardada en [`/prompts/evidencia-ejecucion-AGB.txt`](../prompts/evidencia-ejecucion-AGB.txt).

## Herramientas de IA utilizadas

- **Claude Code (Sonnet 5)** — generación del test E2E y su configuración, elección de selectores estables (`data-testid`), diagnóstico y corrección de varias asunciones erróneas sobre el estado del seed compartido (verificadas contra la API real, no solo el código; la última llevó a reescribir el primer escenario para que compruebe dinámicamente contra la API en vez de fijar nombres a mano), investigación de una lentitud puntual detectada en la suite de la raíz durante la verificación (sin cuello de botella real encontrado), y reorganización de la documentación heredada en carpetas propias por entrega. Detalle completo en `entrega-qa-AGB/prompts-qa-AGB.md`.
