# Registro de prompts y arreglos — Proceso de selección por posición (rama `positions-proceso-AGB`)

Autor: garciabarcenaalvaro@gmail.com
Asistente: Claude Code (Sonnet 5)
Fecha: 2026-09-16
Rama base: `main` (commit `8025b6f` — Initial commit)

Esta rama es distinta de `backend-AGB` y `frontend-AGB`: aquellas corrigen
bugs puntuales detectados en el análisis inicial; esta implementa una
**funcionalidad nueva** (el botón "Ver proceso" de `/positions`, que no
hacía nada) que se identificó como limitación conocida durante ese mismo
análisis. Por eso se parte de `main` en lugar de las otras dos ramas: evita
mezclar en un mismo commit "arreglos" con "feature nueva" y no genera
conflictos de merge entre `backend-AGB`/`frontend-AGB` (ambas también tocan
`prompts-AGB.md`).

## 1. Prompts utilizados con el asistente de IA

1. `Analiza este repo y cuéntame qué hace y qué errores descubres`
   → Primer análisis del repo (ver `backend-AGB`/`frontend-AGB` para el
   detalle completo). Entre los hallazgos: `Positions.tsx` usa una lista
   `mockPositions` hardcodeada, no conectada a la API.

2. `Arranca y cuéntame cómo (pasos detallados) el backend y frontend`
   → Se levantó el entorno completo (Docker, Prisma, backend, frontend).

3. `Acabo de añadir mi usuario al grupo docker`

4. `Crea una rama nueva de frontend que se llame frontend-AGB [...] Y lo
   mismo para el backend [...]`
   → Dio lugar a `backend-AGB` y `frontend-AGB`, cada una con su propio
   arreglo de bugs y su propio `prompts-AGB.md`. En `frontend-AGB` se dejó
   documentado explícitamente que `Positions.tsx` seguía usando datos mock
   como "limitación conocida, no corregida en esa rama".

5. `¿Por qué no funcionan los botones "Ver proceso"? ¿Debido a que la lista
   está mockeada?`
   → El asistente inspeccionó `Positions.tsx` y explicó que la causa
   directa es que el botón no tenía `onClick` ni `Link`, y que además, aun
   añadiéndolo, no había ruta en el frontend ni endpoint de listado en el
   backend a los que enlazar (el mock no tiene `id` real de `Position`).

6. `Sí, adelante. Y de nuevo deja registro de detalle de todos los pasos,
   ficheros añadidos y correcciones realizadas`
   → Prompt que originó esta rama (`positions-proceso-AGB`) y esta
   implementación.

## 2. Metodología

1. Se comprobó el estado real de la base de datos de desarrollo: estaba
   vacía (`Position`, `Candidate`, `Company` con 0 filas), así que no había
   forma de probar el flujo con datos reales. Se ejecutó el seed de Prisma
   para poblarla (ver 3.0).
2. Se diseñó la funcionalidad mínima necesaria para que "Ver proceso"
   funcione de verdad: un endpoint de listado de posiciones en el backend
   (no existía ninguno — solo endpoints que ya requerían conocer el `id` de
   una posición) y una página de detalle en el frontend que muestre los
   candidatos agrupados por fase de entrevista.
3. Cada pieza se verificó de forma aislada (`npx tsc --noEmit`, `npx jest`)
   y luego de extremo a extremo en el navegador contra el backend real:
   listado de posiciones, clic en "Ver proceso", vuelta atrás, posición
   inexistente, id no numérico y una posición sin flujo de entrevistas
   configurado (para comprobar los estados vacíos/erróneos).

## 3. Trabajo realizado

### 3.0 [Hallazgo incidental] `ts-node` no podía ejecutar el seed de Prisma

- **Dónde**: `backend/prisma/seed.ts`, `backend/package.json`.
- **Qué pasaba**: `npx ts-node prisma/seed.ts` (el comando que indica el
  propio `README.md`) fallaba con un error interno de `ts-node`/`typescript`
  (`Debug Failure. False expression: Non-string value passed to
  ts.resolveTypeReferenceDirective...`), por un desajuste de versiones entre
  `ts-node@9.1.1` y `typescript@^4.9.5`. Con `--transpile-only` (que evita el
  chequeo de tipos que dispara el bug) funciona sin problema.
- **Arreglo**: se añade el script `"prisma:seed": "ts-node --transpile-only
  prisma/seed.ts"` a `backend/package.json` para que quede documentado y no
  haga falta recordar el flag.
- **Nota**: no se ha tocado el `README.md` ni las versiones de `ts-node`/
  `typescript` — es una mención incidental, no el foco de esta rama.

### 3.1 [Backend] Nuevo endpoint `GET /position`: listado de posiciones

- **Por qué hacía falta**: no existía ningún endpoint que devolviera todas
  las posiciones; solo `GET /position/:id/candidates` y
  `GET /position/:id/interviewflow`, que ya requieren conocer el `id` de una
  posición concreta. Sin esto, `Positions.tsx` no tiene de dónde sacar la
  lista real.
- **Ficheros modificados**:
  - `backend/src/application/services/positionService.ts`: nueva función
    `getAllPositionsService()` — `prisma.position.findMany` con el nombre de
    la empresa incluido, devolviendo `{ id, title, companyName, location,
    status, applicationDeadline }` por posición.
  - `backend/src/presentation/controllers/positionController.ts`: nuevo
    controlador `getAllPositions`, mismo patrón try/catch que el resto del
    fichero.
  - `backend/src/routes/positionRoutes.ts`: `router.get('/', getAllPositions)`.
  - `backend/api-spec.yaml`: se documenta `GET /position`.
- **Tests añadidos** (mismo patrón de mocks que los tests ya existentes):
  - `positionService.test.ts`: `getAllPositionsService` devuelve la lista
    aplanada con el nombre de la empresa.
  - `positionController.test.ts`: `getAllPositions` responde `200` con el
    array devuelto por el servicio.
- **Nota de alcance**: el test preexistente
  `getCandidatesByPositionService › should return candidates with their
  average scores` sigue fallando en esta rama (falla también en `main` sin
  ningún cambio de las otras ramas) porque el test está desactualizado
  respecto a los campos `id`/`applicationId` que ya devuelve el servicio.
  Ese arreglo ya está hecho en `backend-AGB`; no se repite aquí a propósito,
  para no mezclar el arreglo de un bug ya resuelto en otra rama con esta
  funcionalidad nueva.
- **Verificación manual**:
  ```
  curl http://localhost:3010/position
  → 200 [{"id":1,"title":"Senior Full-Stack Engineer","companyName":"LTI",
          "location":"Remote","status":"Open",
          "applicationDeadline":"2024-12-31T00:00:00.000Z"}, ...]
  ```

### 3.2 [Frontend] Nuevo servicio `services/positionService.js`

- **Fichero nuevo**: `frontend/src/services/positionService.js`.
- **Qué hace**: envuelve con `axios` las tres llamadas al backend que
  necesita la sección de posiciones — `getPositions()` (`GET /position`),
  `getCandidatesByPosition(id)` (`GET /position/:id/candidates`) y
  `getInterviewFlowByPosition(id)` (`GET /position/:id/interviewflow`) —
  siguiendo el mismo patrón ya usado en `services/candidateService.js`
  (mensajes de error construidos con `` `${fallback}: ${details}` `` y
  `error.response?.data?...` para no romper si el backend no responde).

### 3.3 [Frontend] `Positions.tsx`: de mock a datos reales, "Ver proceso" funcional

- **Fichero modificado**: `frontend/src/components/Positions.tsx`
  (reescrito).
- **Cambios**:
  - Se elimina `mockPositions`; la lista se carga con `getPositions()` en un
    `useEffect`, con estados de `loading` (spinner), `error` (alerta) y
    lista vacía.
  - El botón **"Ver proceso"** ahora es un `<Link to={`/positions/${position.id}`}>`
    real, en vez de un `<Button>` sin `onClick` ni destino — esto es
    directamente lo que se pidió arreglar.
  - El badge de estado se adapta a los valores reales del modelo
    (`Open`/`Draft`/`Closed`/`Filled`, definidos en
    `backend/prisma/schema.prisma`) en vez de los valores en español
    inventados del mock (`Abierto`/`Contratado`/...).
  - Se sustituye "Manager" (campo que no existe en el modelo `Position` de
    Prisma — no hay concepto de manager por posición en el esquema) por
    "Empresa" (`companyName`, que sí viene del modelo `Company` real) y por
    "Ubicación" (`location`, campo real de `Position`).
  - El botón **"Editar"** se deja explícitamente `disabled` con un
    `title` explicativo, en vez de un botón inerte sin indicación — no se
    implementa la edición de posiciones (no se pidió y es una funcionalidad
    aparte), pero ahora al menos no engaña al usuario.
  - Los filtros de búsqueda por título/fecha/estado siguen sin estar
    conectados (no formaban parte de esta petición); se ha quitado el
    desplegable "Manager" porque no corresponde a ningún dato real y solo
    listaba nombres inventados del mock.

### 3.4 [Frontend] Nueva página "Proceso de selección" (`/positions/:id`)

- **Fichero nuevo**: `frontend/src/components/PositionProcess.tsx`.
- **Ruta nueva**: `frontend/src/App.js` — se añade
  `<Route path="/positions/:id" element={<PositionProcess />} />`.
- **Qué hace**: al entrar, pide en paralelo (`Promise.all`) el flujo de
  entrevistas (`getInterviewFlowByPosition`) y los candidatos de la posición
  (`getCandidatesByPosition`), y pinta un tablero tipo Kanban: una columna
  por cada fase del `interviewFlow` (ordenadas por `orderIndex`), con las
  tarjetas de los candidatos cuyo `currentInterviewStep` coincide con el
  nombre de esa fase, mostrando su nombre y puntuación media.
- **Estados cubiertos**:
  - Carga (`Spinner`).
  - Error (p. ej. posición inexistente o id no numérico → el backend
    responde `404 Position not found` en ambos casos; el frontend muestra
    la alerta y un botón para volver, en vez de quedarse cargando
    indefinidamente o romperse).
  - Posición sin flujo de entrevistas configurado (mensaje informativo en
    vez de un tablero vacío sin explicación).
  - Fase sin candidatos ("Sin candidatos en esta fase.").
  - Enlace "← Volver a posiciones".

## 4. Verificación end-to-end realizada

1. Base de datos poblada con `npm run prisma:seed` (2 posiciones, 3
   candidatos, 4 aplicaciones, 3 fases de entrevista en el flujo de
   "Senior Full-Stack Engineer"; el flujo de "Data Scientist" se creó sin
   fases, tal cual lo deja el seed original).
2. Backend arrancado con `npm run dev`; `GET /position`,
   `GET /position/1/candidates` y `GET /position/1/interviewflow`
   verificados con `curl`.
3. Frontend arrancado con `npm start`; navegación real en el navegador:
   - `/positions` → tarjetas con datos reales de la API, sin mock.
   - Clic en "Ver proceso" de "Senior Full-Stack Engineer" → tablero con
     Carlos García en "Initial Screening", John Doe y Jane Smith en
     "Technical Interview" (puntuaciones 5.0 y 4.0), "Manager Interview"
     vacío.
   - "← Volver a posiciones" → vuelve al listado.
   - `/positions/999` (inexistente) → alerta de error + botón de vuelta, sin
     romper la página.
   - `/positions/abc` (id no numérico) → mismo manejo de error controlado.
   - `/positions/2` ("Data Scientist", sin fases configuradas) → mensaje
     "Esta posición no tiene un flujo de entrevistas configurado."
4. `npx tsc --noEmit` (backend y frontend) sin errores.
5. `npx jest` (backend): 5/6 tests en verde — el único fallo es el bug
   preexistente ya documentado en 3.1, ajeno a esta rama.
