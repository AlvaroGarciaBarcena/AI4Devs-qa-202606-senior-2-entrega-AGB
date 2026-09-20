# Registro de prompts y arreglos — Frontend (rama `frontend-AGB`)

Autor: garciabarcenaalvaro@gmail.com
Asistente: Claude Code (Sonnet 5)
Fecha: 2026-09-16
Rama base: `main` (commit `8025b6f` — Initial commit)

## 1. Prompts utilizados con el asistente de IA

Estos son, en orden, los prompts del usuario que dieron lugar al análisis y a
los arreglos recogidos en esta rama:

1. `Analiza este repo y cuéntame qué hace y qué errores descubres`
   → El asistente exploró `backend/` y `frontend/` (estructura, `package.json`,
   componentes React, servicios, `App.js`/`App.tsx`) y devolvió un listado de
   errores con referencias a fichero y línea.

2. `Arranca y cuéntame cómo (pasos detallados) el backend y frontend`
   → El asistente levantó Postgres con Docker, instaló dependencias, aplicó
   migraciones de Prisma y arrancó backend (`npm run dev`) y frontend
   (`npm start`), documentando cada paso y verificando en el navegador que el
   dashboard renderizaba (confirmando de paso que `App.js`, no `App.tsx`, es
   el componente que webpack resuelve).

3. `Acabo de añadir mi usuario al grupo docker`
   → El asistente confirmó el acceso a Docker y completó el arranque de
   ambos servicios.

4. `Crea una rama nueva de frontend que se llame frontend-AGB donde guardes
   registro completo y documentado de los arreglos de todos los problemas que
   detectaste para el front, de los prompts en el fichero prompts-AGB.md. Y lo
   mismo para el backend, creando una nueva rama que se llame backend-AGB, con
   el registro completo y documentado de todos los problemas que detectaste
   para el back, guardando igualmente los prompts en el fichero
   prompts-AGB.md`
   → Prompt que originó esta rama (`frontend-AGB`) y este mismo documento.
   (El backend se resolvió en paralelo en la rama hermana `backend-AGB`, con
   su propio `prompts-AGB.md`.)

## 2. Metodología

Para cada problema detectado en el análisis inicial:

1. Se localizó la causa raíz leyendo el código (no solo el síntoma).
2. Se aplicó el arreglo más simple y acotado al problema (sin refactors
   especulativos ni features nuevas).
3. Se verificó recompilando con `npm start` (webpack + eslint + typecheck de
   CRA) y probando el flujo real en el navegador (Browser pane) contra el
   backend en marcha: alta de candidato de principio a fin, comprobando la
   petición de red real (`POST /candidates` → `201 Created`) y limpiando
   después los datos de prueba de la base de datos.

## 3. Problemas detectados y solución aplicada

### 3.1 [Código muerto / confuso] `App.js` y `App.tsx` duplicados

- **Dónde**: `frontend/src/App.js` (el componente real, con `BrowserRouter`
  y las rutas de la app) y `frontend/src/App.tsx` (boilerplate de
  Create React App sin modificar, con el logo de React girando).
- **Problema**: `index.tsx` importa `./App` sin extensión. CRA resuelve
  `.js` antes que `.tsx` en su lista de `moduleFileExtensions`, así que
  `App.js` es el que realmente se renderiza (confirmado en el navegador
  durante el arranque) y `App.tsx` queda completamente muerto — cualquiera
  que lo edite pensando que es el componente activo (por ser el archivo
  TypeScript, "más nuevo") perderá el tiempo.
- **Arreglo**: se elimina `frontend/src/App.tsx`. De paso, `App.css` y
  `logo.svg` quedaban huérfanos (solo los importaba el `App.tsx` muerto), así
  que también se eliminan.
- **Verificación**: `npm start` sigue compilando y sirviendo el dashboard
  real sin cambios visibles (comprobado con captura de pantalla en
  `http://localhost:3000`).

### 3.2 [Bug] `services/candidateService.js`: `Error` mal construido y crash si el servidor no responde

- **Dónde**: `frontend/src/services/candidateService.js`
  (`uploadCV`, `sendCandidateData`).
- **Problema**:
  - `new Error('mensaje:', error.response.data)` — el constructor `Error`
    solo usa el primer argumento; el segundo se descarta en silencio, así
    que el detalle del error del servidor nunca llegaba a mostrarse.
  - Si la petición fallaba sin respuesta del servidor (red caída, CORS,
    backend apagado) `error.response` era `undefined`, y acceder a
    `.data` lanzaba un `TypeError` no controlado que tapaba el error real
    y podía dejar la promesa rechazada de forma inesperada.
- **Arreglo**: se construye un único mensaje de error interpolado
  (`` `Error al enviar datos del candidato: ${details}` ``), usando
  `error.response?.data?.error ?? error.message` para no romper si no hay
  respuesta del servidor.

### 3.3 [Bug] Dependencia `axios` usada pero nunca instalada

- **Dónde**: `frontend/package.json`, `frontend/src/services/candidateService.js`.
- **Problema**: detectado al intentar usar `candidateService.js` desde los
  componentes (ver 3.4): `candidateService.js` importa `axios`, pero
  `axios` nunca se declaró en `package.json` ni estaba instalado en
  `node_modules`. Como este fichero no lo importaba ningún componente, el
  error nunca se manifestaba — quedó como código muerto con una dependencia
  rota.
- **Arreglo**: `npm install axios --save` en `frontend/`, quedando
  declarado en `package.json`/`package-lock.json`.
- **Verificación**: `npm start` pasa de
  `Module not found: Error: Can't resolve 'axios'` a
  `Compiled successfully!`.

### 3.4 [Duplicación] `AddCandidateForm.js` y `FileUploader.js` reimplementaban las llamadas a la API con `fetch`

- **Dónde**: `frontend/src/components/AddCandidateForm.js`,
  `frontend/src/components/FileUploader.js`.
- **Problema**: ambos componentes reimplementaban con `fetch` crudo
  exactamente lo que ya hacían `sendCandidateData` y `uploadCV` en
  `services/candidateService.js` (que quedaba sin usar), duplicando la
  lógica de las peticiones HTTP y el manejo de sus errores en dos sitios
  distintos.
- **Arreglo**:
  - `FileUploader.js` ahora llama a `uploadCV(file)` del servicio; se añade
    estado `error` para mostrar en pantalla un fallo de subida (antes solo
    se logueaba por consola y el usuario no se enteraba).
  - `AddCandidateForm.js` ahora llama a `sendCandidateData(candidateData)`
    del servicio en vez de repetir el `fetch` + inspección manual de
    `res.status`.
  - Se elimina el import sin usar `InputGroup` en `AddCandidateForm.js`
    (warning de ESLint `no-unused-vars` que aparecía en cada arranque).
- **Verificación end to end** (navegador, contra el backend real):
  1. Se navega a `/add-candidate`, se rellenan nombre/apellido/email y se
     envía → `POST http://localhost:3010/candidates` responde `201 Created`
     y la UI muestra "Candidato añadido con éxito".
  2. Un envío previo con el email vacío responde `400 Bad Request` y la UI
     lo maneja sin romperse (gracias al arreglo de 3.2), mostrando el
     mensaje de error en vez de un `TypeError` en consola.
  3. El candidato de prueba (`laura.perez.agb@example.com`) se borra de la
     base de datos tras la verificación.

### 3.5 [Limitación conocida, no corregida en esta rama] `Positions.tsx` usa datos mock

- **Dónde**: `frontend/src/components/Positions.tsx`.
- **Qué pasa**: la lista de posiciones (`mockPositions`) está hardcodeada
  en el propio componente y no llama a la API (`GET /position/:id/...`);
  los filtros de búsqueda del UI (título, fecha, estado, manager) no tienen
  ningún handler conectado.
- **Por qué no se toca aquí**: no es un bug de un fragmento de código
  concreto, sino una funcionalidad a medio construir que requeriría diseñar
  el endpoint de listado de posiciones (no existe en `backend/routes` —
  solo existen `/position/:id/candidates` y `/position/:id/interviewflow`,
  ambos para una posición ya conocida) y el estado/paginación del listado en
  el frontend. Se documenta aquí para que quede explícito y no se confunda
  con un olvido.

## 4. Resumen de verificación final

```
npm start (CRA dev server) → "Compiled successfully!" / "No issues found."
                              sin errores ni warnings de ESLint/TypeScript
Navegador (Browser pane)   → dashboard, /add-candidate y /positions
                              renderizan correctamente
Flujo real de alta         → POST /candidates 201 Created, candidato de
                              prueba limpiado de la base de datos
```
