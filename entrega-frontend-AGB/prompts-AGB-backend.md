# Registro de prompts y arreglos — Backend (rama `backend-AGB`)

Autor: garciabarcenaalvaro@gmail.com
Asistente: Claude Code (Sonnet 5)
Fecha: 2026-09-16
Rama base: `main` (commit `8025b6f` — Initial commit)

## 1. Prompts utilizados con el asistente de IA

Estos son, en orden, los prompts del usuario que dieron lugar al análisis y a los
arreglos recogidos en esta rama:

1. `Analiza este repo y cuéntame qué hace y qué errores descubres`
   → El asistente exploró `backend/` y `frontend/` (estructura, `package.json`,
   `schema.prisma`, rutas, controladores, servicios, modelos de dominio,
   componentes React) y devolvió un listado de errores con referencias a
   fichero y línea.

2. `Arranca y cuéntame cómo (pasos detallados) el backend y frontend`
   → El asistente levantó Postgres con Docker, instaló dependencias, aplicó
   migraciones de Prisma y arrancó backend (`npm run dev`) y frontend
   (`npm start`), documentando cada paso.

3. `Acabo de añadir mi usuario al grupo docker`
   → El asistente confirmó el acceso a Docker (usando `sg docker` para no
   depender de reiniciar sesión) y completó el arranque de ambos servicios.

4. `Crea una rama nueva de frontend que se llame frontend-AGB donde guardes
   registro completo y documentado de los arreglos de todos los problemas que
   detectaste para el front, de los prompts en el fichero prompts-AGB.md. Y lo
   mismo para el backend, creando una nueva rama que se llame backend-AGB, con
   el registro completo y documentado de todos los problemas que detectaste
   para el back, guardando igualmente los prompts en el fichero
   prompts-AGB.md`
   → Prompt que originó esta rama (`backend-AGB`) y este mismo documento.

## 2. Metodología

Para cada problema detectado en el análisis inicial:

1. Se localizó la causa raíz leyendo el código (no solo el síntoma).
2. Se aplicó el arreglo más simple y acotado al problema (sin refactors
   especulativos ni features nuevas).
3. Se verificó con `npx tsc --noEmit`, `npx jest` y, cuando aplicaba,
   peticiones `curl` reales contra el servidor en marcha (`npm run dev`) para
   comprobar el comportamiento antes/después.

Todos los tests (`npx jest`) pasan y `npx tsc --noEmit` no reporta errores
tras aplicar todos los cambios de esta rama.

## 3. Problemas detectados y solución aplicada

### 3.1 [Seguridad] Credenciales de base de datos hardcodeadas y commiteadas

- **Dónde**: `backend/prisma/schema.prisma` (url literal con usuario y
  contraseña), `.env` y `backend/.env` (trackeados por git), `.gitignore`
  (la línea `**/.env` estaba comentada y, al revés de lo habitual,
  `**/.env.example` estaba ignorado).
- **Problema**: la contraseña de la base de datos quedaba en texto plano en
  el repositorio. Además, como `schema.prisma` tenía la URL hardcodeada,
  **el valor `DATABASE_URL` del `.env` no se usaba para nada** aunque el
  README indicase que Prisma lo leía de ahí.
- **Arreglo**:
  - `schema.prisma`: `url = "postgresql://..."` → `url = env("DATABASE_URL")`.
  - `.gitignore`: se descomenta `**/.env` y se elimina el ignore erróneo de
    `**/.env.example`.
  - Se crean `.env.example` y `backend/.env.example` con placeholders
    (`DB_PASSWORD=changeme`, etc.) como plantilla versionada.
  - Se ejecuta `git rm --cached .env backend/.env` para dejar de trackear los
    `.env` reales sin borrarlos del disco (el entorno local sigue
    funcionando).
  - **Nota importante**: la contraseña ya existía en el historial de git
    (commit inicial). Este arreglo corrige el problema hacia delante; si el
    repo fuese a un entorno real habría que rotar también la contraseña y,
    si se quisiera, purgar el historial (`git filter-repo` / BFG), algo que
    no se ha hecho aquí por ser una acción destructiva sobre el historial
    compartido.
- **Verificación**: `npx prisma generate` deja de mostrar el aviso
  `🛑 Hardcoding URLs in your schema poses a security risk`; `npx prisma
  migrate deploy` sigue funcionando leyendo `DATABASE_URL` de `backend/.env`.

### 3.2 [Bug de seguridad] La validación de candidatos se podía saltar por completo

- **Dónde**: `backend/src/application/validator.ts`, función
  `validateCandidateData`.
- **Problema**: `if (data.id) return;` saltaba todas las validaciones
  (nombre, email, teléfono, fechas...) en cuanto el payload incluía un
  campo `id`, y nada impedía que un `POST /candidates` (alta) incluyera ese
  campo.
- **Arreglo**: se elimina el atajo; `validateCandidateData` valida siempre
  los datos del candidato.
- **Verificación manual**:
  ```
  curl -X POST http://localhost:3010/candidates \
    -H "Content-Type: application/json" \
    -d '{"id":999,"firstName":"x"}'
  ```
  - Antes: `400 { "message": "No se pudo encontrar el registro del candidato..." }`
    (saltaba la validación e intentaba actualizar un candidato inexistente).
  - Después: `400 { "error": "Invalid name" }` (la validación se ejecuta).

### 3.3 [Bug] Middleware de logging registrado después de las rutas

- **Dónde**: `backend/src/index.ts`.
- **Problema**: el middleware `app.use((req, res, next) => console.log(...))`
  estaba definido después de `app.use('/candidates', ...)`,
  `app.post('/upload', ...)` y `app.use('/position', ...)`. Como esas rutas
  ya respondían la petición, el logger nunca llegaba a ejecutarse para ellas
  — solo para peticiones que no encajaban en ninguna ruta anterior.
- **Arreglo**: se mueve el middleware de logging (junto con CORS) antes de
  montar las rutas.
- **Verificación**: tras el cambio, el log del proceso muestra una línea por
  cada petición, incluidas `GET /position/...` y `POST /candidates`
  (antes no aparecían).

### 3.4 [Bug] Pérdida de información en el manejo de errores

- **Dónde**: `backend/src/application/services/candidateService.ts`
  (`addCandidate` y `updateCandidateStage`).
- **Problema**: `throw new Error(error)` envolvía un `Error` ya existente
  dentro de otro `Error`, produciendo mensajes tipo
  `"Error: Invalid email"` en vez de `"Invalid email"`, y perdiendo el
  stack trace original.
- **Arreglo**: se elimina el `try/catch` redundante en ambas funciones y se
  deja que el error original se propague sin modificar. Como consecuencia,
  el mensaje de `Application not found` deja de llevar el prefijo
  `"Error: "`, así que se actualiza también la comprobación en
  `candidateController.ts` (`updateCandidateStageController`) para
  compararlo sin ese prefijo.
- **Verificación**: `npx jest` sigue en verde (los tests no dependían del
  prefijo erróneo).

### 3.5 [Bug] Ruta de subida de ficheros relativa y frágil

- **Dónde**: `backend/src/application/services/fileUploadService.ts`.
- **Problema**: `multer.diskStorage({ destination: (...) => cb(null,
  '../uploads/') })` usaba una ruta relativa al `cwd` del proceso Node y no
  creaba el directorio si no existía, por lo que la primera subida de un CV
  fallaba con `ENOENT`.
- **Arreglo**: se ancla el directorio de subidas a `process.cwd()` (el
  directorio desde el que se lanza el backend) y se crea con
  `fs.mkdirSync(uploadDir, { recursive: true })` si no existe.

### 3.6 [Bug] Falta de validación de `id` numérico en `positionController`

- **Dónde**: `backend/src/presentation/controllers/positionController.ts`
  (`getCandidatesByPosition`, `getInterviewFlowByPosition`).
- **Problema**: a diferencia de `candidateController`, no se comprobaba
  `isNaN(positionId)`, así que un id no numérico (p. ej. `/position/abc/candidates`)
  llegaba a Prisma como `NaN` y producía un error interno poco claro
  (`500`, `"Argument positionId is missing"`).
- **Arreglo**: se añade la misma comprobación `isNaN` que ya existía en
  `candidateController`, devolviendo `400` con un mensaje claro.
- **Verificación manual**:
  ```
  curl http://localhost:3010/position/abc/candidates
  ```
  - Antes: `500 { "error": "Error retrieving candidates by position" }`
  - Después: `400 { "message": "Invalid position ID format" }`

### 3.7 [Código muerto / duplicado] Doble implementación del alta de candidato

- **Dónde**: `backend/src/routes/candidateRoutes.ts` y
  `backend/src/presentation/controllers/candidateController.ts`.
- **Problema**: la ruta `POST /candidates` llamaba directamente al servicio
  `addCandidate` y reimplementaba su propio `try/catch` en el fichero de
  rutas, mientras que `candidateController.ts` definía
  `addCandidateController` (con el mismo propósito) sin que nada lo
  importara ni lo usara. Dos caminos distintos para manejar errores del
  mismo endpoint.
- **Arreglo**: la ruta usa ahora `addCandidateController`, igual que el
  resto de rutas de ese fichero (`getCandidateById`,
  `updateCandidateStageController`); se elimina el `try/catch` duplicado de
  `candidateRoutes.ts` y el `export { addCandidate }` que ya no hacía falta.

### 3.8 [Bug] Test y especificación de API desactualizados respecto al servicio

- **Dónde**: `backend/src/application/services/positionService.test.ts`,
  `backend/api-spec.yaml`.
- **Problema**: detectado al ejecutar `npx jest` para verificar que los
  arreglos anteriores no rompían nada. `getCandidatesByPositionService`
  (en `positionService.ts`) devuelve, además de `fullName`,
  `currentInterviewStep` y `averageScore`, los campos `id` (id del
  candidato) y `applicationId` — necesarios para que el frontend pueda
  enlazar con el candidato y llamar a `PUT /candidates/{id}` para
  actualizar su fase de entrevista. El test y `api-spec.yaml` no se habían
  actualizado cuando se añadieron esos campos, así que el test fallaba
  (`expect(result).toEqual([...])` sin `id`/`applicationId`) y la
  especificación de la API no documentaba el contrato real.
- **Arreglo**: se actualiza el mock y la aserción del test para incluir
  `id` y `applicationId`, y se documentan ambos campos en la respuesta de
  `GET /position/{id}/candidates` dentro de `api-spec.yaml`.
- **Verificación**: `npx jest` pasa las 4 suites (antes fallaba 1 de 4,
  incluso en `main` sin ninguno de los cambios anteriores).

## 4. Resumen de verificación final

```
npx tsc --noEmit   → sin errores
npx jest           → 4 suites, 4 tests, todos en verde
curl manual        → comportamiento esperado en los 4 endpoints tocados
                      (/, /candidates POST, /position/:id/candidates,
                      /position/:id/interviewflow)
```
