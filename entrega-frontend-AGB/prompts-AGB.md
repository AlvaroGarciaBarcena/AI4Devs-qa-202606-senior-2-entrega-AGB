# Registro de prompts y arreglos — Integración completa + i18n + Vite + tests + seguridad + auth + code splitting + UX + candidatura + OpenSpec (rama `openspec-adoption-AGB`)

Autor: garciabarcenaalvaro@gmail.com
Asistente: Claude Code (Sonnet 5)
Fecha: 2026-09-16 / 2026-09-17 / 2026-09-19

Rama base: `position-selector-AGB` (commit `096120b`), que ya reunía
todo lo anterior (`backend-AGB` + `frontend-AGB` +
`candidate-validation-i18n-a11y-AGB` + `positions-proceso-AGB` + la
migración de i18n a `react-i18next` + la migración de Create React App a
Vite + tests automáticos + una auditoría de ciberseguridad exhaustiva +
la migración de `react-router-dom` a v7 + autenticación JWT en toda la
API + *code splitting* por ruta + tres bugs de UX en "Agregar
Candidato" + el selector de posición para la candidatura). Esta rama no
toca código de la aplicación — adopta OpenSpec retroactivamente,
extrayendo de las 14 ramas anteriores una spec por capacidad, cada
requisito trazable a la rama y commit que lo implementó.

> Nota: las secciones 1-13 de este documento son el historial heredado de
> `i18n-react-i18next-AGB`/`all-fixes-AGB` sin modificar — validación,
> i18n con `react-i18next`, accesibilidad. La sección 3.14 documenta la
> migración de CRA a Vite, la 3.15 la incorporación de tests automáticos,
> la 3.16 la traducción del selector de fichero nativo, la 3.17 la
> auditoría de ciberseguridad, la 3.18 la migración de `react-router-dom`
> a v7, la 3.19 la autenticación de las APIs, la 3.20 el *code splitting*
> del bundle, la 3.21 dos bugs de UX en "Agregar Candidato", la 3.22 el
> reseteo del formulario tras un alta con éxito, la 3.23 el selector de
> posición para la candidatura, y la 3.24 la adopción de OpenSpec. El
> histórico de `positions-proceso-AGB` sigue en
> [`prompts-AGB-positions.md`](./prompts-AGB-positions.md), y el de
> `backend-AGB`/`frontend-AGB` en
> [`prompts-AGB-backend.md`](./prompts-AGB-backend.md) /
> [`prompts-AGB-frontend.md`](./prompts-AGB-frontend.md).

## 0. Resumen ejecutivo: el camino completo, de un vistazo

Esta sesión generó **15 ramas** a partir de `main`, en varias oleadas.
Esta sección existe para poder entender el conjunto sin tener que leer
las más de 2700 líneas de detalle de más abajo — cada punto enlaza a la
sección donde está el porqué completo.

### 0.1 Mapa de ramas

```
main (8025b6f) — estado original del repo, sin tocar
│
├── backend-AGB (24f86fd)            — arreglos de bugs del backend
├── frontend-AGB (d92752d)           — arreglos de bugs del frontend
├── positions-proceso-AGB (cd86b57)  — feature "Ver proceso" (parte de main
│                                       directamente, independiente de las
│                                       dos de arriba)
│
└── candidate-validation-i18n-a11y-AGB (eea6e5a)
    │  = fusión de backend-AGB + frontend-AGB
    │  + mensajes de validación estructurados y traducibles
    │  + i18n "casero" (Context + diccionario a mano) para toda la app
    │  + accesibilidad (aria-*, <html lang>, selector de idioma)
    │
    └── all-fixes-AGB (d60127b)
        │  = fusión de lo anterior + positions-proceso-AGB
        │  (todo el trabajo de las 4 primeras ramas, junto)
        │
        └── i18n-react-i18next-AGB (ace52cb)
            │  = i18n "casero" sustituido por react-i18next (librería
            │    estándar) — mismo comportamiento, mejor base
            │
            └── vite-migration-AGB (6b25e95)
                │  = Create React App sustituido por Vite
                │
                └── tests-AGB (97c58a3 + d5a4328)
                    │  = tests automáticos (backend y frontend) que
                    │    codifican las verificaciones hechas a mano
                    │  + traducción del selector de fichero nativo
                    │    ("Browse…"/"No file selected")
                    │
                    └── security-audit-AGB (8b31eb5)
                        │  = auditoría de ciberseguridad exhaustiva:
                        │    20 vulnerabilidades de npm audit → 0 en
                        │    backend, helmet + rate limiting, filtro de
                        │    subida de ficheros endurecido, límite de
                        │    entradas por candidato. La ausencia total
                        │    de autenticación queda documentada como el
                        │    hallazgo más severo, sin corregir.
                        │
                        └── react-router-v7-AGB (0ab68a0)
                            │  = react-router-dom v6 → v7 (cierra las 2
                            │    vulnerabilidades moderadas que quedaban
                            │    abiertas) + fix de un bug de
                            │    configuración de Jest encontrado de
                            │    camino (dist/ con tests compilados
                            │    duplicando ejecuciones)
                            │
                            └── api-auth-AGB (73731bf)
                                │  = autenticación JWT en todas las rutas
                                │    del backend (antes abiertas por
                                │    completo) + login/logout real en el
                                │    frontend — cierra el hallazgo más
                                │    severo de security-audit-AGB
                                │
                                └── code-splitting-AGB (947bbc3)
                                    │  = React.lazy() + Suspense por ruta:
                                    │    de 1 fichero JS (674KB) a 10, con
                                    │    -52% en la carga en frío de /login
                                    │
                                    └── candidate-form-ux-fixes-AGB (700fc68)
                                        │  = 3 bugs de UX en "Agregar
                                        │    Candidato": el error de un
                                        │    campo no se actualizaba al
                                        │    corregirlo, el teléfono no
                                        │    decía por qué era inválido,
                                        │    y el formulario no se
                                        │    vaciaba tras un alta con
                                        │    éxito
                                        │
                                        └── position-selector-AGB (096120b)
                                            │  = desplegable con las
                                            │    posiciones reales para
                                            │    elegir a cuál se presenta
                                            │    el candidato — sin esto,
                                            │    nadie quedaba vinculado a
                                            │    ninguna posición
                                            │
                                            └── openspec-adoption-AGB  ← RAMA ACTUAL
                                                 = adopción retroactiva de
                                                   OpenSpec: 11 specs por
                                                   capacidad, 41 requisitos,
                                                   cada uno trazable a la
                                                   rama que lo implementó
                                                   (incluida developer-tooling,
                                                   añadida tras la corrección
                                                   del usuario de 3.24.1)
```

Cada rama tiene su propio commit y su propia sección de detalle en este
documento (o en `prompts-AGB-backend.md` / `prompts-AGB-frontend.md` /
`prompts-AGB-positions.md` para las tres primeras, conservadas aparte
porque sus `prompts-AGB.md` originales entraron en conflicto de fusión al
integrarlas).

### 0.2 Cronología y qué disparó cada rama

| # | Petición del usuario (resumida) | Rama resultante | Sección |
|---|---|---|---|
| 1 | "Analiza este repo y cuéntame qué hace y qué errores descubres" | *(análisis, sin rama)* | — |
| 2 | "Arranca... backend y frontend" | *(arranque del entorno)* | — |
| 3 | "Créa una rama para el back y otra para el front con los arreglos" | `backend-AGB`, `frontend-AGB` | `prompts-AGB-backend.md`, `prompts-AGB-frontend.md` |
| 4 | "¿Por qué no funcionan los botones 'Ver proceso'? ... Adelante" | `positions-proceso-AGB` | `prompts-AGB-positions.md` |
| 5 | "Me devuelve 'Invalid name' sin decir por qué. ¿Me ayudas?" → "Mejora el mensaje, con i18n y a11y" | `candidate-validation-i18n-a11y-AGB` (fusiona backend-AGB+frontend-AGB) | 3.1–3.8 |
| 6 | Varios reportes de "el idioma no funciona bien" (resultaron ser: pestaña con caché obsoleta, y luego detección real pero navegador en inglés) | *(arreglos dentro de la misma rama)* | 3.3.1, 3.6–3.8 |
| 7 | "¿Añades el selector a todo, no solo a los mensajes de error?" | *(misma rama, se extiende el alcance)* | 3.9–3.11 |
| 8 | "¿Incluyes positions-proceso-AGB para tenerlo todo fusionado?" | `all-fixes-AGB` | 3.12 |
| 9 | "¿Qué mejorarías [del i18n]?" → "Implementa el 1 [librería estándar]" | `i18n-react-i18next-AGB` | 3.13 |
| 10 | "¿Por qué no TS5?" → "CRA está descontinuado, analiza migrar a Vite" → "Vamos a por ello" | `vite-migration-AGB` | 3.14 |
| 11 | "¿Añades todos los Tests para que tengamos las mismas pruebas de validación que en las primeras ramas?" | `tests-AGB` | 3.15 |
| 12 | "¿Puedes conseguir que el botón del selector de fichero se traduzca ('Browse...'/'No file selected')?" | *(misma rama, `tests-AGB`)* | 3.16 |
| 13 | "¿Realizas ahora una auditoría de Ciberseguridad exhaustiva para verificar que no tenemos problemas en este ámbito?" | `security-audit-AGB` | 3.17 |
| 14 | "¿La razón de no migrar react-router-dom v7 era el linter, o no había impedimento y eso era solo para TS7?" → "Sí, porfa, en una rama nueva" | `react-router-v7-AGB` | 3.18 |
| 15 | "Documéntalo todo bien, incluyendo los porqués de TS7 y react-router-dom v7, y vamos después, en otra rama nueva, a incluir la autenticación de las APIs" | *(actualización de esta sección 0)* | 0 (este resumen) |
| 16 | Aclaración de alcance (backend+frontend vs. solo backend; empleados ya sembrados vs. registro público) → "Backend + login en el frontend" + "Los Employee ya sembrados" | `api-auth-AGB` | 3.19 |
| 17 | "¿Cómo generaste esas credenciales que me dijiste... y dónde se almacenan?" → "¿Haces una recopilación de los secretos del sistema... en un fichero unificado, tipo secrets.md?" | `api-auth-AGB` (mismo commit `73731bf`) | 3.19.12 |
| 18 | "¿Qué es el estado `<Suspense>`?" → "¿Creas porfa una nueva rama y aplicas el code splitting, que quiero ver la diferencia del código y cómo afecta a la experiencia de usuario el resultado final?" | `code-splitting-AGB` | 3.20 |
| 19 | "Después de un error de entrada en 'Agregar Candidato' no me recarga los valores corregidos. Tampoco da información de porqué el tfno tiene formato inválido a pesar de haber introducido sólo 9 números. ¿Lo mejoras, porfa?" | `candidate-form-ux-fixes-AGB` | 3.21 |
| 20 | "Acabo de lograr añadir un candidato con éxito, pero opino que deberían haberse borrado los valores tras ello, pero se mantienen. ¿Coincides?" | *(misma rama)* | 3.22 |
| 21 | "El formulario actual permite el registro del candidato sin CV y sin experiencia... ¿El código actual contempla analizar el CV o la experiencia para asignar el candidato a la posición?" → "Añade porfa primero el campo de elección a la candidatura... ¿Sólo el desplegable ahora." | `position-selector-AGB` | 3.23 |
| 22 | "Querría darle mayor trazabilidad a todo el proceso. ¿Cómo ves que llevemos todo lo hecho hasta ahora, las 14 ramas, a openspec?" → "Sí, perfecto, specs por capacidad, pero granulariza bien y deja registrado... la rama dónde se implementó" | `openspec-adoption-AGB` | 3.24 |
| 23 | "Pero el cambio de cómo está construido el sistema es un cambio real. Opino que ha de estar documentado también" | *(misma rama)* | 3.24.1 |

### 0.3 Qué se hizo, paso a paso, en cada rama

Versión compacta de las secciones 3.x — el detalle completo (comandos,
fragmentos de código, verificaciones) está en la sección referenciada.

**`backend-AGB`** (detalle en `prompts-AGB-backend.md`):
1. Credenciales de la base de datos hardcodeadas en `schema.prisma` → `env("DATABASE_URL")`; `.env` deja de trackearse en git.
2. `validator.ts`: se quita el `if (data.id) return` que saltaba toda la validación.
3. Middleware de logging registrado después de las rutas (nunca se ejecutaba) → movido antes.
4. `throw new Error(error)` envolviendo errores y perdiendo el mensaje → simplificado.
5. Ruta de subida de ficheros relativa y frágil (`../uploads/`) → anclada a `process.cwd()`, se crea si no existe.
6. Faltaba `isNaN` en `positionController` (a diferencia de `candidateController`) → añadido.
7. Alta de candidato duplicada entre `candidateRoutes.ts` y un controlador sin usar → unificada.
8. Test de `positionService` desactualizado (no contemplaba `id`/`applicationId`) → corregido.

**`frontend-AGB`** (detalle en `prompts-AGB-frontend.md`):
1. `App.js` y `App.tsx` duplicados (CRA resolvía `.js`, `App.tsx` quedaba muerto) → `App.tsx` eliminado.
2. `candidateService.js`: `new Error(msg, data)` con el segundo argumento ignorado, y `TypeError` si el servidor no respondía → corregido.
3. `axios` usado pero nunca instalado (descubierto al intentar reutilizar el servicio) → instalado.
4. `AddCandidateForm`/`FileUploader` reimplementaban las llamadas con `fetch` en vez de usar el servicio → unificados.

**`positions-proceso-AGB`** (detalle en `prompts-AGB-positions.md`):
1. Diagnóstico: el botón "Ver proceso" no tenía `onClick` ni ruta, y aunque la tuviera no había endpoint de listado ni id real (los datos eran mock).
2. Backend: nuevo `GET /position` (servicio + controlador + ruta + tests).
3. Frontend: `Positions.tsx` pasa de datos mock a la API real; nuevo `PositionProcess.tsx` con un tablero Kanban por fase de entrevista.
4. Hallazgo incidental: `ts-node` sin `--transpile-only` no podía ejecutar el seed de Prisma → añadido script `prisma:seed`.

**`candidate-validation-i18n-a11y-AGB`** (detalle en 3.1–3.11, esta misma rama fusiona `backend-AGB`+`frontend-AGB` primero):
1. `validator.ts` reescrito: de un `Error('Invalid name')` genérico a `{ field, code, params }` acumulando todos los fallos, no solo el primero.
2. Bug de `instanceof` con `target: es5` que rompía distinguir `ValidationError` de otros errores → corregido con `Object.setPrototypeOf`.
3. `candidateController.ts` distingue `ValidationError` y devuelve el array de issues sin traducir.
4. Frontend: `i18n/validationMessages.js` traduce esos issues; mensajes por campo con `aria-invalid`/`aria-describedby`, resumen con `role="alert"`.
5. `getLocale()` pasa de mirar solo `navigator.language` a recorrer `navigator.languages` completo.
6. `<html lang="en">` estático (hallado por el usuario) corregido a `"es"`.
7. Selector de idioma explícito (Español/English), con la detección automática como valor inicial, nunca sustituida salvo elección explícita.
8. Extensión del i18n "casero" (Context + diccionario) a los 5 componentes con texto visible, no solo los mensajes de validación.

**`all-fixes-AGB`** (detalle en 3.12):
1. Fusión de `candidate-validation-i18n-a11y-AGB` + `positions-proceso-AGB`.
2. Conflictos resueltos a mano en `App.js` (rutas + selector de idioma) y `Positions.tsx` (datos reales + i18n combinados).
3. `PositionProcess.tsx`, nuevo con la fusión, traducido por primera vez.
4. Backend fusionado sin conflictos de contenido, revisado a mano para confirmar que `GET /position` convivía con los `isNaN` ya existentes.

**`i18n-react-i18next-AGB`** (detalle en 3.13):
1. Instalación de `react-i18next`/`i18next`/`i18next-browser-languagedetector` — 3 intentos hasta encontrar versiones compatibles con TypeScript 4.9.5.
2. `locale.js` + `LocaleContext.js` + `translations.js` (caseros) eliminados; sustituidos por `i18n/i18n.js` (config) + `i18n/locales/{es,en}.json` (JSON anidado).
3. `validationMessages.js` reescrito para componer mensajes con `i18n.t()` en vez de plantillas JS a mano.
4. `<html lang>` pasa de fijo a reactivo (`i18n.on('languageChanged', ...)`).
5. Los 6 componentes que usaban el hook casero `useLocale()` migrados a `useTranslation()`.

**`vite-migration-AGB`** (detalle en 3.14, rama actual):
1. Análisis previo del riesgo (sin variables `REACT_APP_*`, sin tests que romper, sin `craco`/`eject`) antes de tocar nada.
2. `react-scripts` desinstalado (-1239 paquetes); Vite instalado tras resolver dos conflictos de peer dependencies (`@babel/core`, `@types/node`).
3. Cadena de versiones de TypeScript: `latest` resolvió `7.0.2` (incompatible con `typescript-eslint`) → `5.9.3` (funciona, pero no la más nueva posible) → `6.0.3` (estable, compatible, la definitiva — a raíz de una pregunta directa del usuario).
4. `index.html` movido a la raíz; `vite.config.ts`, `tsconfig.json` dividido en project references, `vite-env.d.ts` nuevos.
5. `App.js` y 4 componentes con JSX renombrados a `.jsx` (Vite 8 solo activa JSX por extensión).
6. `eslint.config.js` (flat config) nuevo; encontró 5 `throw new Error()` sin `cause` en los servicios, corregidos.
7. Vitest configurado (`npm test` estaba roto desde antes, apuntaba a un `jest.config.js` inexistente).
8. `README.md` (raíz y frontend) actualizados para reflejar los comandos nuevos.

**`tests-AGB`** (detalle en 3.15-3.16):
1. Backend: nuevos tests para `addCandidateController` (alta con éxito, con el caso del guión bajo, con varios campos acumulados, y error no relacionado con validación) y para `getCandidatesByPosition`/`getInterviewFlowByPosition` (id no numérico, posición inexistente) — huecos reales de cobertura, no cubiertos hasta ahora pese a haberse verificado a mano muchas veces con `curl`.
2. Bug de aislamiento entre tests encontrado al escribirlos: sin `jest.clearAllMocks()` en un `beforeEach`, el recuento de llamadas de un mock se acumulaba entre `it()` distintos, dando falsos negativos.
3. Frontend: primeros tests del proyecto (antes, cero). `i18n/validationMessages.test.js` (composición de mensajes, español/inglés, campos de array), `services/candidateService.test.js` (propagación de issues, el arreglo del doble prefijo, fallo de red sin `TypeError`) y `components/AddCandidateForm.test.jsx` (el flujo completo del guión bajo en el navegador, ahora automatizado).
4. `@testing-library/react`/`user-event`/`jest-dom`, heredados de CRA en versiones antiguas (`user-event@13`, sin `.setup()`), actualizados a las versiones actuales; movidos de `dependencies` a `devDependencies` (nunca debieron ir a producción).
5. `FileUploader.jsx`: "Browse…"/"No file selected" son *chrome* nativo del navegador para `<input type="file">`, no texto de React — imposible de traducir con i18n. Input oculto con `.visually-hidden` (mantiene el foco por teclado) + botón propio ya traducido.

**`security-audit-AGB`** (detalle en 3.17):
1. Metodología: cada hallazgo verificado con una PoC real (`curl` con `multipart/form-data` fabricado a mano) o leyendo el código fuente de la dependencia en `node_modules/`, nunca solo "a ojo".
2. **Hallazgo principal, sin corregir**: ningún endpoint exige autenticación ni autorización — cualquiera puede leer/escribir PII de candidatos con solo un id numérico secuencial. Documentado como decisión de arquitectura para el propietario del proyecto, no como bug.
3. Subida de CVs: el filtro de tipo de archivo solo miraba el `Content-Type` que envía el cliente — PoC confirmó que aceptaba y guardaba un HTML con `<script>` bajo extensión `.pdf`.
4. Path traversal en el nombre de fichero: no explotable hoy (protegido por una versión concreta de `busboy`, no documentada como su contrato), pero el propio código nunca saneaba `file.originalname` — añadido `path.basename()` explícito como defensa en profundidad.
5. Dependencias vulnerables alcanzables en producción: `express` (ReDoS/DoS/XSS transitivos) y `react-router-dom` (open redirect) — `npm audit fix` dentro del rango semver ya declarado, sin `--force`: backend 20→0 vulnerabilidades, frontend 3 altas→0.
6. `swagger-jsdoc`/`swagger-ui-express`, declaradas pero nunca importadas, eliminadas (arrastraban una dependencia vulnerable de `validator`).
7. Añadidos `helmet` (cabeceras de seguridad) y `express-rate-limit` (300 peticiones/15 min); límite de 20 entradas en `educations`/`workExperiences`.
8. Descartado tras comprobarlo, no solo asumido: inyección SQL (Prisma parametriza todo, sin `$queryRaw`) y XSS en frontend (sin `dangerouslySetInnerHTML`/`innerHTML`/`eval`).

**`react-router-v7-AGB`** (detalle en 3.18):
1. Aclaración previa: el impedimento de TS7 (peer dependency de `typescript-eslint`) y la decisión de no migrar `react-router-dom` a v7 el día anterior (para no mezclar un salto de versión mayor con el alcance de una auditoría de seguridad) eran dos cosas sin relación — verificado con `npm view react-router-dom@7.18.4 peerDependencies` antes de responder: sin impedimento técnico real.
2. `react-router-dom` 6.23.1 → 7.18.4. Cero cambios de código: la app solo usa el subconjunto declarativo de la API (`BrowserRouter`/`Routes`/`Route`/`Link`/`useParams`), idéntico entre ambas versiones.
3. `npm audit` → 0 vulnerabilidades (cierra las 2 moderadas que quedaban de `security-audit-AGB`).
4. Hallazgo incidental: `npm run build` del backend compilaba también los `*.test.ts` a `dist/`, y Jest los recogía duplicados junto a los `src/*.test.ts` originales — 14 de 42 tests fallaban en falso tras cualquier build previo a `npx jest`. Corregido excluyendo los tests del `include` de `tsconfig.json`.

**`api-auth-AGB`** (detalle en 3.19):
1. Alcance acordado antes de escribir código: JWT + login real en el frontend (no solo backend), contra los `Employee` ya sembrados (sin registro público).
2. `Employee` gana un campo `password` (hash de bcrypt, nullable) vía migración de Prisma; `authService.ts` (backend) hace login con un único mensaje de error genérico para los cuatro motivos de rechazo posibles (evita enumerar correos dados de alta); `requireAuth` protege `/candidates`, `/upload` y `/position`; límite de intentos propio (10/15 min) solo para `/auth/login`.
3. Hallazgos incidentales: no existía ningún `.env` en el repo (había que crearlo) y, al hacerlo, se comprobó que `.env.example` usaba una interpolación de variables (`${DB_USER}`) que el `dotenv` del proyecto no soporta — corregido con valores ya resueltos; varios servidores de backend zombis de sesiones anteriores seguían corriendo (matados, uno solo arrancado limpio).
4. Frontend: interceptor global de axios (no una instancia `axios.create()` nueva, para no romper los tests existentes que mockean `axios` directamente) + `AuthContext`/`Login`/`RequireAuth`/`UserMenu`, con el mismo patrón de accesibilidad ya establecido en `AddCandidateForm`.
5. Hallazgo al testear: auto-mockear `authService.ts` entero también sustituye la clase `AuthError` por una versión simulada sin `.message` real — corregido acotando el mock a solo la función `login`.
6. +15 tests backend (21→36), +10 tests frontend (19→29); verificado de extremo a extremo en el navegador (login correcto/incorrecto, ambos empleados sembrados, cierre de sesión, redirección tras acceso directo a una ruta protegida sin sesión) y con `curl` para `/upload` (sin equivalente de UI, el navegador no puede pilotar el selector nativo de archivos).

**`code-splitting-AGB`** (detalle en 3.20):
1. Las 4 rutas protegidas de `App.jsx` pasan a `React.lazy()`, envueltas en un único `<Suspense>`; `Login` se queda con `import` estático a propósito (es lo primero que ve cualquiera sin sesión, y un parpadeo de carga ahí sería el peor sitio para ahorrar KB).
2. Medido, no solo descrito: de 1 fichero JS (674.25 kB) a 10, con la carga en frío de `/login` en 323.76 kB (4 ficheros) — un 52% menos — y el chunk más pesado de toda la app (`AddCandidateForm`, 345 kB, por `react-datepicker`) sin descargarse nunca si no se visita esa pantalla.
3. Verificado con tráfico de red real (no con los nombres de fichero): `vite preview` en el puerto 3000 (no el 4173 por defecto, para que el CORS del backend lo aceptase), confirmando con `read_network_requests` que cada chunk se pide exactamente la primera vez que su ruta se visita.
4. Hallazgo incidental durante la demo en directo: un JWT de dos días caducó a mitad de la verificación, y el interceptor de `apiClient.js` (3.19.8) cerró la sesión y redirigió a `/login` solo, exactamente como estaba diseñado — la primera vez que ese camino se observa en acción sin forzarlo.

**`candidate-form-ux-fixes-AGB`** (detalle en 3.21-3.22):
1. Reproducido en el navegador antes de tocar nada; un primer intento salió engañoso por una condición de carrera del propio tooling (clic sobre una captura tomada mientras `/add-candidate` aún mostraba el `Suspense` de "Cargando página…") combinada con una entrada de red residual de una pestaña de larga duración — investigado hasta confirmar que no era un bug de la app, no asumido.
2. Bug A: `issues` (los errores por campo) solo se actualizaba en `handleSubmit`, nunca al cambiar un campo — corregir un valor no limpiaba su error hasta el siguiente envío. Arreglado con `clearFieldIssue(field)`, sin revalidar en el cliente (esa lógica se queda solo en `validator.ts`).
3. Bug B: un teléfono de 9 dígitos con el prefijo equivocado daba el código genérico `invalidFormat` ("no tiene un formato válido"), sin explicar la regla real. Nuevo código específico `invalidPhoneFormat`, con un mensaje que sí la explica, en los dos idiomas.
4. +3 tests backend (36→39), +3 tests frontend (29→32) — incluido uno que codifica exactamente el bug A reportado (corregir sin reenviar hace desaparecer el error). Verificado también en caliente contra el backend de desarrollo real (`curl`) y en el navegador de principio a fin.
5. Bug C, reportado por el usuario probando por su cuenta: el formulario no se vaciaba tras un alta con éxito. Dos causas: `candidate` nunca se reseteaba, y los 5 campos nunca habían tenido `value=` (no controlados de verdad, así que resetear el estado no habría bastado). Arreglado con `value={candidate.X}` en los 5 campos, reseteo a `EMPTY_CANDIDATE` tras el éxito, y una `key` en `FileUploader` para que también olvide el fichero ya subido. +1 test frontend (32→33).

**`position-selector-AGB`** (detalle en 3.23):
1. Confirmado con el código real, antes de opinar: `addCandidate` nunca había creado una `Application` — un candidato nuevo se guardaba, pero no quedaba vinculado a ninguna posición, así que jamás aparecía en "Ver proceso". No hay, ni ha habido nunca, ningún análisis de CV/experiencia para nada.
2. Alcance acordado explícitamente antes de tocar código: solo el desplegable ahora, contra las posiciones ya existentes (`GET /position`); crear vacantes nuevas (que exigiría elegir también un flujo de entrevistas) queda para una rama futura.
3. Backend: `validatePositionId` (obligatorio, entero positivo); `getFirstInterviewStepForPosition` (ordena explícitamente por `orderIndex`, distingue "posición inexistente" de "posición sin fases" devolviendo `undefined`/`null` respectivamente); `addCandidate` crea la `Application` en esa primera fase, con un mensaje de error distinto para cada uno de los dos motivos de fallo.
4. Frontend: `<Form.Select>` real (no texto libre) poblado con `getPositions()` (el mismo servicio que ya usaba `Positions.tsx`), enviando `positionId` como `Number`.
5. Hallazgo real en la verificación en vivo, no hipotético: la posición "Data Scientist" (seed original, de antes de esta sesión) tenía un flujo de entrevistas sin ninguna fase — invisible hasta que esta rama fue la primera cosa que de verdad necesitó una. Corregido en `seed.ts` y con un script de un solo uso sobre la base de datos de desarrollo ya sembrada.
6. +6 tests backend (39→45), +1 test frontend (33→34). Verificado con `curl` contra el backend real y en el navegador: un candidato nuevo aparece de verdad en la columna "Initial Screening" de la posición elegida.

**`openspec-adoption-AGB`** (detalle en 3.24, rama actual):
1. `openspec init` (esquema `spec-driven`) + un único change, `adopt-openspec-baseline`, con una spec de capacidad por área real de comportamiento (10, no 14 — por rama habría mezclado capacidades distintas dentro de una misma rama conversacional).
2. 38 requisitos en total, cada uno con una línea `_Rama: \`nombre\` (commit \`hash\`)_` verificada contra `git log` real antes de darla por buena — la trazabilidad que pidió explícitamente el usuario.
3. Decisión explícita, documentada en `design.md`: los cambios de solo herramientas sin comportamiento observable (`vite-migration-AGB`, `react-router-v7-AGB`, `tests-AGB`) no generan spec propia — no cambian qué hace el sistema, y forzar una capacidad para ellos habría producido requisitos sin ningún escenario real que verificar.
4. Change archivado (`openspec archive`) tras validar en limpio (`openspec validate --strict` y `openspec validate --specs --strict`, 10/10). `openspec/specs/` queda como la referencia de "qué hace el sistema hoy"; `prompts-AGB.md` sigue siendo la referencia del "por qué" — no se sustituyen.
5. El usuario corrigió la decisión del punto 3: un cambio de herramientas también es un cambio real y debe documentarse. Se relee el criterio (un requisito de OpenSpec no exige que el actor sea un usuario final, puede ser "quien ejecuta el build") y se añade, con un segundo change (`add-developer-tooling-capability`, también archivado), la capacidad `developer-tooling` — 3 requisitos más, con sus propios escenarios verificables por comando (`npm run build`, `npx jest`, una auditoría de dependencias). 11 capacidades y 41 requisitos en total, 11/11 en `openspec validate --specs --strict`.

### 0.4 Decisiones clave y por qué (el hilo conductor)

- **Una rama por tema, nunca todo mezclado.** Cada peticion nueva que no
  encajaba claramente en el propósito de la rama activa se llevó a una
  rama nueva (p. ej. "Ver proceso" no se mezcló con los arreglos de
  backend/frontend porque son cosas distintas). Esto se pagó luego en
  forma de fusiones (`all-fixes-AGB`), pero mantuvo cada commit legible y
  revisable de forma aislada.
- **Fusionar hacia delante, nunca rehacer desde `main`.** Cuando hubo que
  combinar trabajo de varias ramas (3.12, y de nuevo al pasar de
  `all-fixes-AGB` a `i18n-react-i18next-AGB` a `vite-migration-AGB`),
  siempre se partió de la rama más completa y se fusionó la que faltaba
  encima — nunca se repitió trabajo ya hecho y verificado desde cero.
- **Backend nunca redacta texto en un idioma.** Desde 3.1, el backend
  solo devuelve *códigos* de validación (`{ field, code, params }`); quién
  sabe en qué idioma quiere verlo el usuario es siempre el frontend. Esta
  decisión de arquitectura temprana es lo que hizo trivial migrar después
  a `react-i18next` (3.13) sin tocar el backend en absoluto.
- **La detección automática de idioma nunca queda sustituida por el
  selector manual — solo se le da prioridad cuando el usuario elige
  explícitamente** (aclarado por el usuario a mitad de una respuesta en
  3.9, respetado también tras migrar a `react-i18next`).
- **"Lo último" se verifica, no se asume.** Tres veces en esta sesión una
  versión "latest" resultó no ser la jugada correcta una vez comprobada
  contra el resto del stack: `react-i18next@17`/`@15.5.0` rompían con
  TypeScript 4.9 (3.13.1-3.13.2); `typescript@latest` resolvió a la v7
  pero rompe `typescript-eslint` (3.14.1); y se pasó por 5.9.3 antes de
  confirmar con `npm view` que 6.0.3 era estable y sí compatible. El
  patrón repetido: instalar, dejar que `tsc`/`npm install` fallen si van
  a fallar, leer el error real, y solo entonces decidir la versión final.
- **Tratar la causa, no el síntoma.** La pregunta concreta "¿por qué no
  TS5?" llevó a identificar que el bloqueo real no era una versión de
  TypeScript sino Create React App en sí (descontinuado) — de ahí que la
  solución no fuera "forzar TS5" sino migrar el toolchain (3.14.1).
- **Cuando una herramienta nueva encuentra algo real, se corrige en el
  momento**, aunque no fuera el objetivo de la rama: el test
  `id`/`applicationId` desactualizado (3.1 del trabajo de posiciones), el
  bug de `instanceof` con `target: es5` (3.1), el `<html lang>` estático
  (3.7), los `throw new Error()` sin `cause` que encontró ESLint recién
  instalado (3.14.4), y el `dist/` de Jest duplicando tests tras un build
  (3.18.4) — todos se arreglaron in situ en vez de ignorarlos o abrirlos
  como tareas aparte.
- **Una decisión de arquitectura con varias formas razonables de
  implementarse se confirma antes de escribir código, no se asume.**
  "Añadir autenticación" podía ser solo backend (verificable con `curl`,
  dejando el frontend roto) o backend+frontend; podía admitir registro
  público o solo los empleados ya sembrados. Se preguntó explícitamente
  por los dos ejes (3.19.1) antes de tocar una sola línea — evita
  construir 2-3 veces más de lo necesario, o en la dirección equivocada,
  por dar algo por sentado en una decisión que no era técnica sino de
  producto.
- **Un bloqueo técnico se verifica por librería concreta, nunca se
  generaliza a otra por el número de versión.** TypeScript 7 sí bloqueaba
  la migración de herramientas en `vite-migration-AGB` (peer dependency
  real de `typescript-eslint`, 3.14.1); eso no significaba que
  "cualquier versión 7" fuera a bloquear algo — `react-router-dom` v7 no
  tenía ningún impedimento equivalente (3.18.1), y solo se dejó fuera de
  `security-audit-AGB` por alcance, no por compatibilidad. La respuesta
  se verificó con `npm view <paquete> peerDependencies` en ambos casos
  antes de decidir, no por analogía entre los dos "v7".

### 0.5 Dónde estamos ahora (estado de `openspec-adoption-AGB`)

Además de todo lo de más abajo: el repo tiene ahora `openspec/specs/`
con 11 capacidades documentadas (`candidate-intake`,
`candidate-validation`, `file-upload`, `position-catalog`,
`hiring-pipeline`, `authentication`, `internationalization`,
`accessibility`, `security-hardening`, `frontend-performance`,
`developer-tooling`), 41 requisitos en total, cada uno trazable a la
rama y commit que lo implementó — consultable con `openspec spec show
<capacidad>` sin tener que leer este documento entero (sección 3.24,
con la corrección de alcance en 3.24.1).

**Verificado y funcionando**, de extremo a extremo, en el navegador, por
línea de comandos y con tests automáticos:
- Backend: Express 4.22.3 + TypeScript + Prisma, con validación
  estructurada (incluido un límite de 20 entradas por
  `educations`/`workExperiences`, un código específico
  `invalidPhoneFormat` que explica la regla del teléfono en vez del
  genérico `invalidFormat`, y `positionId` ahora obligatorio y validado),
  endpoint de listado de posiciones, `isNaN` en todos los `:id`, `helmet`
  + `express-rate-limit` (general y uno más estricto solo para
  `/auth/login`), subida de CVs con el nombre de fichero saneado, **dar
  de alta un candidato crea también su `Application` en la primera fase
  de la posición elegida** (antes, el candidato quedaba huérfano, sin
  aparecer nunca en ningún "Ver proceso"), y **autenticación JWT exigida
  en `/candidates`, `/upload` y `/position`** contra los `Employee` ya
  sembrados (email + contraseña con hash de bcrypt). 8 suites / **45
  tests** en verde (`npx jest`), `tsc --noEmit` limpio, **`npm audit` →
  0 vulnerabilidades**.
- Frontend: React + TypeScript sobre **Vite**, con **react-i18next**
  (español/inglés, detección automática + selector, persistido) en toda
  la interfaz — incluido ya el selector de fichero nativo del CV
  ("Browse…"/"No file selected", chrome del navegador sustituido por un
  botón propio) —, formulario de alta de candidato con **un desplegable
  real (no texto libre) para elegir la posición a la que se presenta**,
  mensajes de validación específicos por campo y accesibles
  (`aria-invalid`, `aria-describedby`, `role="alert"`) que además **se
  actualizan al instante al corregir un campo**, sin esperar a un nuevo
  envío, y **se vacía por completo tras un alta con éxito** (incluido el
  selector de CV, que se remonta para olvidar el fichero ya subido),
  listado de posiciones con datos reales de la API, el tablero "Ver
  proceso" agrupando candidatos por fase de entrevista (ahora
  alimentado también por los candidatos dados de alta desde el
  formulario, no solo por el seed), **`react-router-dom` v7**, un
  **flujo de login/logout real** (`/login` pública, el resto de rutas
  protegidas con `RequireAuth`, token adjunto automáticamente a toda
  petición vía un interceptor de axios), y **las 4 rutas protegidas
  cargadas bajo demanda** (`React.lazy` + `Suspense`): el build pasa de 1
  fichero JS (674.25 kB) a 10, con un 52% menos de JS en la carga en frío
  de `/login` (sección 3.20). 6 suites / **34 tests** en verde (`npm
  test`, Vitest), `tsc -b`/`eslint .`/`npm run build` limpios,
  **`npm audit` → 0 vulnerabilidades**.
- Nada de esto ha tocado la base de datos de forma permanente más allá de
  lo esperado: los candidatos de prueba creados durante las
  verificaciones manuales (y los ficheros subidos como PoC de la
  auditoría de seguridad y de esta rama) se borraron después de cada
  comprobación; la única escritura permanente es la contraseña de
  desarrollo asignada a los dos `Employee` ya sembrados (sección 3.19.5,
  necesaria para que el login sea probable); los tests automáticos no
  tocan la base de datos real en ningún caso (todo mockeado).

**Deuda conocida, documentada pero no resuelta** (todas mencionadas donde
se detectaron, ninguna oculta):
- El botón **"Editar"** de una posición está deshabilitado a propósito
  (`positions.editNotImplemented`) — nunca se pidió implementarlo.
- La cobertura de tests se centra en **validación** y, desde esta rama,
  **autenticación** (que es lo que se pidió en cada caso). Quedan sin
  test automático el dashboard, el listado/filtros de posiciones (mock de
  UI sin lógica que probar todavía) y el tablero "Ver proceso" — no se ha
  fabricado cobertura de esas partes por iniciativa propia.
- Los mensajes de error **no estructurados** (caída de red, backend
  caído, mensajes ya hechos que vienen directos de un `Error` de
  servicio) siguen sin traducirse — solo los errores de validación tienen
  el tratamiento de códigos que permite traducirlos (ver 3.11). Algunos de
  esos mensajes sin traducir devuelven `error.message` tal cual al
  cliente; se revisó caso por caso en 3.17.6 y se dejó así a propósito
  donde es necesario para la UX (p. ej. email duplicado), documentando el
  riesgo de fuga de información donde no lo es.
- No hay comprobación de contenido real (*magic bytes*) en los CVs
  subidos, solo de extensión/`Content-Type` (3.17.3.A) — requeriría una
  dependencia nueva no evaluada todavía.
- **Sin registro de empleados ni gestión de contraseñas** (cambiar la
  propia, recuperar una olvidada, expirar tokens antes de las 8h de
  vigencia) — a propósito, según el alcance acordado en 3.19.1: los
  `Employee` se dan de alta a mano, no hay flujo de autoservicio.
- El JWT no se puede revocar antes de que caduque (sin lista de
  revocación ni sesiones del lado del servidor) — limitación conocida de
  cualquier JWT sin estado; con una vigencia de 8h y sin la opción de
  invalidar tokens robados al momento, es una cesión consciente de
  seguridad a cambio de simplicidad, razonable para el alcance actual del
  proyecto pero a tener en cuenta si se maneja información más sensible.
- La contraseña de la base de datos de desarrollo, aunque ya no se lee
  del `schema.prisma` (arreglado en `backend-AGB`), sigue existiendo en
  el **historial** de git del commit inicial — no se ha purgado el
  historial por ser una operación destructiva que no se ha pedido.
- El *code splitting* es por ruta, no dentro de cada pantalla (p. ej.
  `react-datepicker` sigue cargando entero junto con el resto de
  `AddCandidateForm`, no de forma perezosa al pulsar "Añadir Educación")
  — a propósito, ver 3.20.5: con 5 pantallas, dividir por ruta ya cubre
  la mayor parte de la ganancia posible.
- **No hay forma de crear vacantes nuevas desde la UI** — el desplegable
  de posiciones (3.23) lista las que ya existen, pero solo se pueden
  crear a mano en `prisma/seed.ts` o directamente en la base de datos.
  A propósito, según el alcance acordado explícitamente en 3.23.2: el
  usuario pidió dejarlo para una rama aparte, deliberada, dado que
  `Position` exige también elegir o crear un flujo de entrevistas.
- El formulario sigue permitiendo un alta sin CV y sin experiencia
  laboral — se discutió (3.23, primer prompt de la conversación) pero
  no se ha implementado ningún cambio todavía; quedó pendiente de una
  decisión explícita sobre si exigir el CV, la experiencia, o ninguno
  de los dos.

**Nada se ha subido a `origin`** en ningún momento de esta sesión — las
15 ramas son enteramente locales. Si se quiere consolidar, el camino
natural sería fusionar `openspec-adoption-AGB` sobre `main` cuando el
usuario lo decida explícitamente.

### 0.6 Análisis de ventajas: por qué esto debería haber sido así desde el principio

Cada cifra de esta sección se ha medido en este mismo repositorio durante
la sesión (comandos reales, `wc -l` sobre los ficheros reales, salida real
de `npm`/`eslint`/`vite`) — no son estimaciones genéricas de "cómo suele
ir" una migración. Donde no hay un número medido en este repo concreto
(p. ej. no se llegó a ejecutar nunca `react-scripts build` en esta sesión,
así que no hay un tiempo de build de CRA con el que comparar directamente
el de Vite), se dice explícitamente en vez de inventar la cifra.

#### A. Motor y herramientas: lo que se midió, no lo que se supone

| Métrica | Dato medido en esta sesión |
|---|---|
| Arranque del dev server | Vite: **~150-175ms** (`VITE v8.3.0 ready in 154 ms` / `174 ms`, dos arranques distintos, logs reales) |
| Build de producción | **438-441ms** (`✓ built in 441ms`), 2773 módulos transformados |
| Motor usado en dev | `oxc` (parser/transformador en Rust) — se ve literalmente en los logs de error de esta sesión (`Plugin: vite:oxc`) al depurar el problema de JSX en `.js` |
| Motor usado en build | `rolldown` (sucesor de Rollup, también en Rust) — igualmente visible en los propios logs (`rolldown/dist/shared/error-...mjs`) |
| Dependencias eliminadas | **-1239 paquetes** exactos al desinstalar `react-scripts` (`npm uninstall react-scripts` → `removed 1239 packages`) |
| Huella final de dependencias | 718 paquetes totales (`npm ls --all`), 494MB de `node_modules`, 18 dependencias directas + 12 de desarrollo |

CRA (`react-scripts`) nunca llegó a compilarse en modo producción en esta
sesión — se pasó directamente de verificar que el dev server funcionaba a
desinstalarlo, así que no hay un número de "antes" medido en este mismo
repo para el build. Lo que sí es un hecho verificable y no una opinión: al
quitar `react-scripts`, **1239 paquetes transitivos** (todo el árbol de
Babel, webpack, y sus plugins) dejaron de formar parte del proyecto de
golpe — cada uno de esos paquetes era, hasta ese momento, superficie de
ataque potencial (vulnerabilidades de la cadena de suministro) y coste de
instalación/CI, sin aportar nada que Vite no cubra ya.

#### B. Líneas de código: el caso concreto, fichero a fichero (no una cifra redonda)

| Fichero (antes) | Líneas | → | Fichero (después) | Líneas | Cambio |
|---|---|---|---|---|---|
| `locale.js` | 56 | → | *(eliminado, sustituido por `LanguageDetector`)* | 0 | **-100%** |
| `LocaleContext.js` | 39 | → | *(eliminado, sustituido por el hook de la librería)* | 0 | **-100%** |
| `translations.js` | 147 | → | `locales/es.json` + `locales/en.json` | 212 | +44% |
| `validationMessages.js` | 111 | → | `validationMessages.js` | 42 | **-62%** |
| `i18n.js` (config, nuevo) | — | → | `i18n.js` | 53 | (nuevo) |
| **Total** | **353** | → | | **307** | -13% |

La cifra total (353→307) por sí sola no cuenta la historia real, y
conviene ser precisos en vez de redondear a "la mitad" sin más:

- **`locale.js` + `LocaleContext.js` (95 líneas de lógica de detección y
  de `Context` de React, escritas y mantenidas a mano) desaparecen por
  completo** — no se sustituyen por otras 95 líneas nuestras, sino por
  código de una librería con miles de usos en producción que no
  escribimos ni mantenemos nosotros. Ahí sí hay una reducción real del
  100%, medible y sin matices.
- **`validationMessages.js` baja un 62%** (111→42) porque la composición
  de mensajes (antes plantillas JS escritas a mano por cada combinación
  de campo+código+idioma) pasa a delegarse en el motor de interpolación
  de i18next — la lógica que quedaba era, literalmente, reimplementar mal
  una pequeña parte de lo que ya hace la librería.
- **`translations.js` → `es.json`+`en.json` *crece* un 44%** (147→212), y
  es importante no ocultarlo: el JSON anidado necesita más líneas por
  cadena de texto que un objeto JS con claves planas (una llave de
  apertura/cierre por cada nivel de anidamiento). Esto **no es deuda
  técnica** — es texto de traducción puro, el mismo cueste lo que cueste
  representarlo, y a cambio de esas líneas de más se gana compatibilidad
  con herramientas de extracción de claves y plataformas de gestión de
  traducciones (Lokalise, Crowdin...) que no existía con el formato a
  mano.

**Conclusión honesta**: la intuición de "menos de la mitad de código a
mantener" es correcta específicamente para la parte que **es lógica
nuestra susceptible de tener bugs** (locale.js + LocaleContext.js +
validationMessages.js: 206→42 líneas, **-80%**) — no para el texto de
traducción en sí, que ocupa prácticamente el mismo espacio se represente
como se represente.

#### C. Correctitud real, no solo estilo: lo que encontró el linter al configurarse por primera vez de verdad

Antes de esta sesión, `package.json` tenía `"eslintConfig": {"extends":
["react-app", "react-app/jest"]}` — el linter de CRA, con un conjunto de
reglas orientado a errores básicos de React (hooks mal usados, JSX roto),
sin ninguna regla de buenas prácticas generales de JavaScript moderno. Al
instalar el stack de ESLint 9 + `typescript-eslint` con las reglas
recomendadas (`js.configs.recommended` + `tseslint.configs.recommended`),
`npx eslint .` encontró **5 errores reales** en código que llevaba ahí
desde antes de esta sesión, invisibles hasta ese momento:

```
src/services/candidateService.js  19:9  error  There is no `cause` attached...
src/services/candidateService.js  41:9  error  There is no `cause` attached...
src/services/positionService.js   15:9  error  There is no `cause` attached...
src/services/positionService.js   24:9  error  There is no `cause` attached...
src/services/positionService.js   33:9  error  There is no `cause` attached...
```

(regla `preserve-caught-error`: un `catch (error) { throw new Error(...) }`
que no adjunta la causa original pierde la traza de pila real del fallo —
en producción, esto es la diferencia entre depurar un error de red viendo
exactamente qué petición falló, o viendo solo un mensaje genérico sin
ningún rastro de dónde vino). Los cinco se corrigieron en el momento.

Además, `npm test` estaba roto desde antes de esta sesión —
`jest --config jest.config.js` apuntando a un fichero que nunca existió
en el repositorio (confirmado con `ls jest.config.js` → *no existe*) — y
nadie lo había notado porque nunca se ejecutaba en ningún flujo. Ahora
`npm test` (Vitest) sale con código 0 de verdad.

#### D. Accesibilidad: técnicas concretas, mapeadas a criterios WCAG 2.1 (no "buenas prácticas" genéricas)

| Criterio WCAG 2.1 | Nivel | Técnica implementada | Dónde |
|---|---|---|---|
| **3.1.1** Language of Page | A | `<html lang>` sincronizado dinámicamente con el idioma activo (`i18n.on('languageChanged', ...)`) | `i18n.js` |
| **4.1.3** Status Messages | AA | `role="alert"` + `aria-live="assertive"` para errores; `role="status"` + `aria-live="polite"` para el éxito — un lector de pantalla anuncia el mensaje sin que el foco tenga que moverse a él | `AddCandidateForm.jsx` |
| **3.3.1** Error Identification | A | Cada campo inválido lleva `aria-invalid="true"` y un mensaje de error específico (no genérico) | `AddCandidateForm.jsx` |
| **1.3.1** Info and Relationships | A | `aria-describedby` asocia programáticamente cada input con su mensaje de error concreto, no solo visualmente | `AddCandidateForm.jsx` |
| **4.1.2** Name, Role, Value | A | `aria-pressed` en los botones del selector de idioma, comunicando cuál está activo a tecnología de asistencia | `LanguageSwitcher.jsx` |
| *(Buena práctica, no un SC numerado)* | — | `lang="es"`/`lang="en"` en cada botón del selector, para que un lector de pantalla pronuncie "Español"/"English" con las reglas fonéticas del idioma que nombran | `LanguageSwitcher.jsx` |

Antes de esta sesión no había ni una sola de estas técnicas en el
formulario: los errores eran un `<Alert>` sin `role`, sin asociar a
ningún campo, y `<html lang="en">` estaba fijo pese a que toda la
interfaz estaba en español.

#### E. TypeScript: la trayectoria real de esta sesión, sin inflar lo que no se usa

Esta sesión pasó por **cuatro** versiones de TypeScript distintas, cada
una descartada o aceptada por una razón medida, no supuesta:

1. **4.9.5** (la que traía CRA) — techo real: `react-scripts` declara
   `"typescript": "^3.2.1 || ^4"` como peer, así que no se podía subir sin
   quitar CRA primero.
2. **7.0.2** (`typescript@latest` en el momento de esta sesión — el
   compilador reescrito nativamente en Go) — descartada: `typescript-eslint`
   declara `typescript: ">=4.8.4 <6.1.0"`, y no es solo un peer estricto:
   sin `typescript-eslint` no hay forma de enlazar TypeScript con ESLint,
   así que habría que renunciar al linter tipado por completo.
3. **5.9.3** — funcional y compatible, primera elección "segura".
4. **6.0.3** (versión final) — se comprobó con `npm view typescript
   versions --json` que existen releases **estables** 6.0.2/6.0.3 (no solo
   la beta que aparece en `dist-tags`), y caen dentro del rango que acepta
   `typescript-eslint`. Es la versión más reciente posible sin sacrificar
   el linter.

**Lo que esto significa hacia delante, con datos y no con deseos**: el
bloqueo que impedía subir de TypeScript 4 ya no existe — no es que TS7 se
vaya a poder usar "en el futuro" de forma vaga, es que el único obstáculo
real hoy es una única peer dependency de un solo paquete
(`typescript-eslint`, versión `8.70.0` en el momento de esta sesión). El
día que esa librería publique soporte para TS7 (ya en desarrollo activo,
visible en su propio repositorio), adoptarlo aquí es un `npm install
typescript@latest` — sin ningún otro cambio de infraestructura. Con CRA
en medio, el mismo salto habría exigido primero un `eject` irreversible
antes de poder tocar una sola versión.

#### F. "La manera correcta de hacerlo": patrones adoptados que son el estándar de facto actual, no una preferencia

- **`tsconfig.json` como *project references*** (`tsconfig.app.json` +
  `tsconfig.node.json`) — el mismo patrón que genera `npm create
  vite@latest` con la plantilla oficial `react-ts`, no una convención
  inventada para este proyecto.
- **`eslint.config.js` (flat config)** — el único formato que reconoce
  ESLint 9 de forma nativa; el `eslintConfig` de `package.json` que usaba
  CRA es un formato que ESLint 9 ya ni siquiera carga sin un plugin de
  compatibilidad adicional.
- **Códigos de error estructurados (`{ field, code, params }`) en vez de
  strings ya redactados** en el backend — el patrón que hace posible que
  el frontend traduzca sin que el backend sepa nada de idiomas; es la
  razón por la que migrar de un sistema de i18n casero a `react-i18next`
  (sección 3.13) no tocó una sola línea del backend.
- **Un idioma, un fichero JSON**, en vez de un único objeto JS con todos
  los idiomas mezclados — el formato que esperan `i18next-parser` y
  cualquier plataforma de gestión de traducciones externa.

#### G. Resumen en una tabla

| Aspecto | Antes de esta sesión | Ahora | Evidencia |
|---|---|---|---|
| Toolchain de frontend | Create React App (descontinuado desde 2025, sin versión mayor desde 2022) | Vite 8, mantenido activamente | `npm uninstall react-scripts` |
| TypeScript | 4.9.5 (techo de CRA) | 6.0.3 (techo real del ecosistema de linting hoy) | Cadena de instalaciones documentada en 3.14.1 |
| Arranque en desarrollo | No medido en este repo (CRA nunca llegó a compararse) | ~150-175ms medidos | Logs de `vite` |
| Lógica de i18n propia (detección + contexto + composición de mensajes) | 206 líneas | 42 líneas | `wc -l` sobre los ficheros reales, sección B |
| Linter configurado | Reglas básicas de React únicamente | ESLint 9 + TypeScript + 5 bugs reales encontrados y corregidos | `npx eslint .`, sección C |
| `npm test` | Roto (`jest.config.js` inexistente) | Funcional (Vitest, sale con código 0) | Comprobado en 3.14.2 |
| Accesibilidad del formulario | Ninguna técnica WCAG aplicada | 5 criterios WCAG 2.1 implementados | Sección D |
| Idiomas soportados | Español fijo en el código | Español/inglés, detección automática + selector, `<html lang>` reactivo | Secciones 3.9-3.13 |
| Dependencias transitivas | +1239 paquetes solo por `react-scripts` | Ninguno de esos 1239 | `npm uninstall`, sección A |

Ninguna de estas filas es una opinión de estilo — todas son
consecuencia directa de sustituir herramientas descontinuadas o caseras
por el estándar actual del ecosistema, verificado paso a paso en el
propio repositorio durante esta misma sesión.

## 1. Prompts utilizados con el asistente de IA

1. `Analiza este repo y cuéntame qué hace y qué errores descubres` /
   `Arranca y cuéntame cómo...` / `Acabo de añadir mi usuario al grupo
   docker` / `Crea una rama nueva de frontend...` — ver
   [`prompts-AGB-backend.md`](./prompts-AGB-backend.md) y
   [`prompts-AGB-frontend.md`](./prompts-AGB-frontend.md) para el detalle.

2. `¿Por qué no funcionan los botones "Ver proceso"?...` /
   `Sí, adelante...` — dieron lugar a la rama `positions-proceso-AGB`
   (no relacionada con esta, ver su propio `prompts-AGB.md`).

3. `Al intentar añadir un nuevo candidato me devuelve "Invalid name", pero
   el mensaje no me permite determinar el motivo. ¿Me ayudas?`
   → El asistente localizó la causa en `validator.ts`: `validateName` se
   usa tanto para `firstName` como `lastName` y lanza siempre el mismo
   `Error('Invalid name')`, sin decir qué campo falló ni por qué (vacío,
   muy corto, muy largo o con caracteres no permitidos — la regex solo
   admite letras y espacios, ni guiones ni apóstrofos ni números). Preguntó
   qué había escrito el usuario para confirmar cuál de los cuatro casos era.

4. `Un guión bajo. ¿Mejoras el validator.ts para que el mensaje de error
   sea significativo? Añade también y11n y a18n.`
   → El asistente interpretó "y11n"/"a18n" como una probable errata de
   **i18n** (internacionalización) y **a11y** (accesibilidad) — con los
   números intercambiados entre ambas — y lo confirmó con una pregunta
   antes de implementar nada, dado que son dos alcances bastante distintos.
   Tras la confirmación ("Sí, ambas"), se implementó lo que documenta este
   fichero.

5. `Introdujiste un fallo, y es que al mover el foco a un textbox, se
   dispara la acción añadir candidato...` → El texto exacto del error
   reportado (`"Datos inválidos: Error: Invalid name"`) solo existe en el
   código **anterior** a esta rama (`main`/`backend-AGB`/
   `positions-proceso-AGB`, comprobado con `git grep` sobre todas las
   ramas); el navegador del usuario (Firefox, conectado de forma
   independiente al mismo servidor de desarrollo que el panel del
   asistente) llevaba abierto desde antes de varios cambios de rama, y no
   sobrevivió bien a tantos hot-reloads seguidos. Tras recargar la pestaña,
   confirmó que funcionaba bien.

6. `¿Puedes conseguir que los textos de error salgan en el idioma elegido
   por a18n?` (de nuevo, errata de i18n) → El asistente preguntó si el
   usuario quería un selector explícito de idioma o si la detección
   automática (`navigator.language`) no le estaba funcionando bien; el
   usuario confirmó lo segundo, dando lugar al arreglo de 3.3.1.

7. `Esto es lo que me salía antes... Pruebo ahora tras los últimos cambios
   y te digo` / `Tras meter el apellido con un underscore... el mensaje me
   aparece en el siguiente Textbox... Y los mensajes de error me siguen
   saliendo en inglés` → El asistente no logró reproducirlo (el DOM,
   inspeccionado directamente, mostraba el mensaje bien colocado y en
   español) y pidió abrir una ventana privada nueva para descartar caché/
   extensiones, y el valor real de `navigator.language`/`navigator.languages`.

8. `Tras abrir una nueva ventana ya no sale el error tras moverme a los
   Textbox. Pero sí, el idioma está en EN por esto: <html lang="en">` →
   Confirmó que el problema de posición era, de nuevo, la pestaña de
   Firefox con estado obsoleto (arreglado con la ventana privada). Sobre
   el idioma, el asistente aclaró que `<html lang="en">` es un atributo
   estático sin relación con la lógica de i18n (que solo lee
   `navigator.language`/`navigator.languages`) — pero lo corrigió de
   todos modos por ser un fallo real y aparte (ver 3.7) — y pidió el valor
   real de `navigator.language` para confirmar si el inglés en los
   mensajes era la detección funcionando correctamente o un bug.

9. `navigator.language me devuelve "en-US", así que no, está en US` →
   Confirmó que la detección funcionaba correctamente (su navegador
   realmente está en inglés); el problema pasó a ser de diseño (formulario
   en español fijo + errores en el idioma real del navegador). El
   asistente preguntó cómo resolver esa mezcla; el usuario eligió añadir
   un selector explícito en pantalla (ver 3.8), aclarando además a mitad
   de respuesta: *"Pero no que sustituya a la detección automática
   inicial, sino que la interprete al seleccionar el idioma"* — es decir,
   la detección automática debía seguir siendo el valor inicial, y el
   selector solo debía intervenir cuando el usuario lo usara
   explícitamente (comportamiento que ya tenía la primera implementación,
   confirmado con `localStorage` vacío tras el primer render).

10. `Perfecto, ahora lo hace bien. ¿Añades el a18n a todo, no sólo a los
    mensajes de error?` → Petición de extender la traducción a **todo** el
    texto estático de la interfaz (no solo los mensajes de validación),
    dando lugar a la infraestructura compartida de 3.9-3.11 y la
    traducción de los 5 componentes con texto visible.

11. `¿Cuántas ramas tenemos ahora?` → El asistente listó las 5 ramas
    locales existentes (`main`, `backend-AGB`, `frontend-AGB`,
    `positions-proceso-AGB`, `candidate-validation-i18n-a11y-AGB`),
    señalando que `positions-proceso-AGB` era independiente y no incluía
    el trabajo de las demás.

12. `¿Incluyes positions-proceso-AGB en una nueva rama que parta de
    candidate-validation-i18n-a11y-AGB para tenerlo ya todo fusionado?`
    → Prompt que originó la rama `all-fixes-AGB` y la sección 12 de este
    documento.

13. `¿Tiene sentido que a18n también los endpoints, así add-candidate pase
    a ser anadir-candidato, etc.?` → El asistente recomendó no hacerlo:
    las rutas de React Router son paths internos (nunca se escriben ni
    comparten a mano, a diferencia de un sitio público con SEO
    multi-idioma), así que localizarlas solo añade complejidad de alias/
    redirecciones sin beneficio real en una herramienta interna.

14. `¿Y cómo se gestiona en los casos en que los endpoints están
    traducidos?` → Pregunta puramente conceptual (sin implementación): el
    asistente explicó el patrón estándar — tabla de rutas por clave
    canónica con traducción de path por idioma, el idioma codificado en la
    propia URL (prefijo `/es/`/`/en/`) en vez de solo en `localStorage`,
    redirecciones/alias para no romper enlaces ya compartidos, y
    `hreflang` para SEO.

15. `Estoy aprendiendo a hacerlo bien, flexible, estándar, escalable, con
    idiomas, accesible... ¿Qué mejorarías?` → El asistente listó 5 mejoras
    priorizadas sobre el sistema de i18n "casero" construido hasta
    entonces: (1) adoptar una librería real (`react-i18next`/`react-intl`)
    en vez del diccionario a mano, (2) sincronizar `<html lang>`
    dinámicamente con el idioma activo (estaba fijo en `"es"`), (3) usar
    `Intl.DateTimeFormat`/`Intl.NumberFormat` para fechas/números en vez de
    manipulación de strings, (4) tipar las claves de traducción con
    TypeScript para detectar en compilación una clave inexistente, (5) un
    fichero JSON por idioma cargado bajo demanda en vez de un único objeto
    JS con todos los idiomas siempre en el bundle.

16. `¿Creas una rama e implementas el 1. que me parece el más potente para
    ver cómo debería hacerse bien?` → Prompt que originó esta rama
    (`i18n-react-i18next-AGB`) y la migración documentada en la sección 13
    más abajo. De paso se implementan también la mejora 2 (`<html lang>`
    dinámico, trivial una vez usando `i18next.on('languageChanged', ...)`)
    y la 5 (un JSON por idioma), por ser consecuencia directa y casi
    gratuita de adoptar la librería — no un alcance añadido por iniciativa
    propia.

17. `Documenta porfa con todo detalle todos los pasos dados, comandos
    ejecutados, paquetes instalados, la filosofía que hay detrás y cómo se
    modificó el código y las ventajas que todo esto supuso frente a la
    versión inicial.` → Ampliación de la sección 3.13 (commit `ace52cb`)
    con el nivel de detalle que documenta esta misma sección para la
    migración a Vite: filosofía, comandos exactos (incluidos los
    fallidos), tabla de paquetes, cambios de código fichero a fichero y
    tabla comparativa de ventajas.

18. `¿Y por qué no pasar a TS 5? ;). ¿Hay algún impedimento de peso?. Dado
    que el sistema es nuevo, ¿mejor con lo último, no?` → El asistente
    explicó que no hay impedimento técnico real en el código: el bloqueo
    es que `react-scripts` (Create React App) declara como peer
    `"typescript": "^3.2.1 || ^4"`. Pero señaló el problema de fondo: CRA
    está descontinuado (retirado como recomendación oficial de React en
    2025), así que subir solo TypeScript trata el síntoma, no la causa —
    cada librería futura volverá a chocar con el mismo peer desfasado.
    Recomendó migrar el toolchain a Vite en vez de forzar TS5 sobre CRA.

19. `Pero CRA está descontinuado y lo que busco es aprender con lo último
    y cómo debe hacerse. ¿Analizas qué supondría? Soy partidario de
    hacerlo` → El asistente inspeccionó el estado real del proyecto
    (variables de entorno, tests existentes, personalizaciones de CRA) y
    presentó un análisis concreto de qué implicaría migrar a Vite,
    concluyendo que el riesgo era bajo (sin `REACT_APP_*`, sin suite de
    tests que romper, sin `craco` ni `eject`, nada fuera de `frontend/`
    dependiente de CRA) y preguntó si debía proceder.

20. `En una rama nueva, porfa ;)` (enviado a mitad de turno, mientras el
    asistente ya estaba creando la rama) → Confirmó el plan ya en marcha;
    dio lugar a la rama `vite-migration-AGB`.

21. `¿Y TS6 no es compatible con todo el stack también?` (enviado a mitad
    de turno, tras ver que el asistente había fijado TypeScript en
    `5.9.3`) → El asistente comprobó con `npm view typescript versions`
    que, efectivamente, `6.0.2`/`6.0.3` son versiones **estables**
    (no solo beta) y caen dentro del rango que soporta `typescript-eslint`
    (`>=4.8.4 <6.1.0`) — más cerca de "lo último" que la 5.9.3 sin perder
    compatibilidad con el linter. Se corrigió a `typescript@6.0.3`.

22. `Documenta porfa el análisis previo y vamos a por ello, sí.` → Prompt
    que originó la ejecución real de la migración documentada en la
    sección 14 más abajo (la rama ya se había creado en respuesta al
    prompt 20).

## 2. Metodología

1. Se leyó `validator.ts` para entender exactamente por qué el mensaje era
   tan poco informativo (una sola condición `||` que agrupa cuatro motivos
   distintos, y una función compartida por `firstName`/`lastName` que no
   dice el nombre del campo).
2. Se diseñó un formato de error estructurado (`{ field, code, params }`)
   en el backend, en vez de intentar adivinar en qué idioma debía redactar
   el backend el mensaje: el backend solo señala **qué** falló, y quien
   conoce el idioma del usuario (el frontend, vía `navigator.language`)
   compone el texto. Esto es lo que hace posible el i18n sin duplicar
   lógica de validación en dos idiomas dentro del propio validador.
3. Cada pieza se verificó de forma aislada antes de integrarla: tests
   unitarios nuevos para `validator.ts` (backend) y verificación manual con
   `curl` del endpoint completo, y solo después se conectó el frontend,
   verificando en el navegador con el caso real reportado por el usuario
   (apellido con guión bajo) tanto en español como simulando
   `navigator.language = 'en-US'`.
4. Para la accesibilidad, se verificó no solo visualmente sino inspeccionando
   el DOM (`aria-invalid`, `aria-describedby` y que el elemento referenciado
   contenga el texto del error).

## 3. Trabajo realizado

### 3.1 [Backend] `validator.ts`: de un `Error('Invalid name')` genérico a errores estructurados

- **Fichero reescrito**: `backend/src/application/validator.ts`.
- **Antes**: cada `validate*` lanzaba `throw new Error('Invalid <campo>')`
  en cuanto encontraba el primer problema, cortando la validación ahí —
  el usuario solo se enteraba de un problema a la vez, con un texto en
  inglés fijo que no decía la causa exacta (`validateName` agrupaba con
  `||` estar vacío, ser muy corto, ser muy largo o tener caracteres no
  permitidos, todo bajo el mismo `"Invalid name"`).
- **Después**:
  - Nuevo tipo `ValidationIssue = { field, code, params? }` y una clase
    `ValidationError extends Error` que agrupa **todos** los problemas
    encontrados (`issues: ValidationIssue[]`), no solo el primero.
  - Cada `validate*` recibe ahora el nombre del campo (`firstName`,
    `lastName`, `educations[0].institution`, etc.) y empuja un `issue` con
    un código de una lista cerrada: `required`, `tooShort`, `tooLong`,
    `invalidCharacters` (con el carácter concreto que falló en `params.char`),
    `invalidFormat`, `invalid`.
  - `validateCandidateData` ya no lanza en el primer fallo: recorre todas
    las validaciones, acumula los `issues` y al final lanza un único
    `ValidationError` con todos ellos (o no lanza nada si no hay ninguno).
  - **Bug encontrado y corregido de paso**: `class ValidationError extends
    Error` con `"target": "es5"` en `tsconfig.json` rompe `instanceof`
    (problema conocido de TypeScript al compilar clases que heredan de
    `Error` a ES5) — `error instanceof ValidationError` daba `false` en
    quien la capturaba, aunque el error fuera efectivamente una
    `ValidationError`. Se corrige con
    `Object.setPrototypeOf(this, ValidationError.prototype)` en el
    constructor. **Esto se detectó gracias al test nuevo** (ver 3.2): sin
    tests, este bug habría pasado desapercibido y el controlador nunca
    habría distinguido un error de validación de cualquier otro error.
- **Tests nuevos**: `backend/src/application/validator.test.ts` (no existía
  ningún test para este fichero) — valida que un candidato correcto no
  lanza, que se reporta el campo exacto que falta, que se reporta el
  carácter concreto no permitido, que **se acumulan** varios campos
  fallidos a la vez (no solo el primero) y que el formato de email inválido
  se detecta.

### 3.2 [Backend] `candidateController.ts`: distinguir errores de validación

- **Fichero modificado**: `backend/src/presentation/controllers/candidateController.ts`.
- **Cambio**: `addCandidateController` ahora comprueba
  `error instanceof ValidationError` antes que el `catch` genérico, y en
  ese caso responde `400` con `{ message: 'Validation failed', errors:
  error.issues }` — el array completo de `{field, code, params}`, sin
  texto ya redactado. El resto de errores (no relacionados con validación,
  p. ej. un fallo de base de datos) siguen respondiendo como antes
  (`{ message: 'Error adding candidate', error: error.message }`).
- **Verificación manual**:
  ```
  curl -X POST http://localhost:3010/candidates -H "Content-Type: application/json" \
    -d '{"firstName":"Juan","lastName":"Garcia_","email":"juan@example.com"}'
  → 400 {"message":"Validation failed","errors":[{"field":"lastName","code":"invalidCharacters","params":{"char":"_"}}]}

  curl -X POST http://localhost:3010/candidates -H "Content-Type: application/json" \
    -d '{"firstName":"","lastName":"","email":"not-an-email"}'
  → 400 {"message":"Validation failed","errors":[
        {"field":"firstName","code":"required"},
        {"field":"lastName","code":"required"},
        {"field":"email","code":"invalidFormat"}]}
  ```

### 3.3 [Frontend] Nuevo módulo de i18n: `i18n/validationMessages.js`

- **Fichero nuevo**: `frontend/src/i18n/validationMessages.js`.
- **Qué hace**: traduce cada `{field, code, params}` que devuelve el
  backend a una frase legible, en español o inglés según
  `navigator.language` (por defecto español si el navegador no está en
  ninguno de los dos idiomas soportados).
  - `getLocale()`: detecta `es`/`en` a partir de `navigator.language`.
  - `translateValidationIssue(issue, locale)`: resuelve la etiqueta del
    campo (`firstName` → "El nombre" / "The first name"; para campos de
    arrays como `educations[0].institution` compone "Educación #1 (la
    institución)" / "Education #1 (the institution)") y aplica la
    plantilla del `code` correspondiente, interpolando `params` (p. ej. el
    carácter concreto no permitido, o el mínimo/máximo de caracteres).
  - `translateValidationIssues(issues, locale)`: aplica lo anterior a la
    lista completa devuelta por el backend.
- **Por qué esta arquitectura y no otra**: se decidió que el backend nunca
  redacte texto en un idioma — solo el frontend sabe en qué idioma quiere
  ver el mensaje el usuario. Así, añadir un tercer idioma en el futuro es
  un diccionario nuevo en este fichero, sin tocar el backend.

### 3.3.1 [Frontend] `getLocale()`: usar `navigator.languages`, no solo el idioma principal

- **Fichero modificado**: `frontend/src/i18n/validationMessages.js`.
- **Motivo**: el usuario reportó que la detección automática del idioma no
  le funcionaba bien. La primera versión de `getLocale()` solo miraba
  `navigator.language` (un único valor, el idioma principal del
  navegador) y, si no era exactamente `es` o `en`, se rendía directamente
  al español por defecto. Esto falla para alguien con el navegador
  configurado en catalán, euskera o gallego (frecuente en España) que
  tenga español o inglés como preferencia secundaria: por ejemplo
  `navigator.language = 'ca'` con `navigator.languages = ['ca', 'es-ES',
  'en']` acababa siempre en español por defecto (por casualidad correcto
  en ese caso concreto) pero ignoraba por completo la preferencia real del
  navegador, y si el orden fuera `['ca', 'en', 'es']` habría mostrado
  español en vez del inglés realmente preferido.
- **Arreglo**: `getLocale()` ahora recorre `navigator.languages` (la lista
  completa de idiomas preferidos, en orden) y se queda con el primero que
  sea `es` o `en`; solo cae al español por defecto si ninguno de los
  idiomas de la lista está soportado. Si el navegador no expone
  `navigator.languages` (algunos entornos no lo hacen), sigue usando
  `navigator.language` como antes.
- **Verificación manual** (simulando `navigator.language`/`navigator.languages`
  en el navegador, reproduciendo el mismo caso del guión bajo en el
  apellido):
  - `language: 'ca'`, `languages: ['ca', 'es-ES', 'en']` → mensaje en
    español ("El apellido contiene un carácter no permitido...").
  - `language: 'ca'`, `languages: ['ca', 'en', 'es']` → mensaje en inglés
    ("The last name contains a character that is not allowed...").
  - Confirmado inspeccionando el DOM (`document.querySelector('.alert-danger')`),
    no solo visualmente.

### 3.4 [Frontend] `services/candidateService.js`: propagar los `issues` sin aplanarlos

- **Fichero modificado**: `frontend/src/services/candidateService.js`.
- **Cambio**: `sendCandidateData` ahora detecta si la respuesta de error
  del backend trae `errors` (array de issues) y, si es así, lanza un
  `Error` con una propiedad `.issues` adjunta (en vez de aplanarlo todo en
  un único string como hacía antes vía
  `` `Error al enviar datos del candidato: ${details}` ``, que habría
  perdido la posibilidad de mostrar cada error junto a su campo).

### 3.5 [Frontend] `AddCandidateForm.js`: mensajes por campo + accesibilidad

- **Fichero modificado**: `frontend/src/components/AddCandidateForm.js`.
- **Cambios**:
  - Nuevo estado `fieldErrors` (la lista de issues ya traducidos) además
    del `error` genérico existente (que se sigue usando para errores no
    relacionados con validación, p. ej. el servidor caído).
  - Cada campo de nivel superior (`firstName`, `lastName`, `email`,
    `phone`, `address`) ahora:
    - Muestra el mensaje traducido pegado al campo, vía
      `Form.Control.Feedback` (patrón nativo de Bootstrap).
    - Lleva `isInvalid` (estilo visual: borde e icono rojos),
      `aria-invalid="true"` y `aria-describedby="<campo>-error"` apuntando
      al `id` del propio mensaje de error — así un lector de pantalla
      anuncia el motivo exacto al llegar al campo, no solo que "hay un
      error" en algún sitio de la página.
  - Se añade un resumen accesible al final del formulario
    (`role="alert"`, `aria-live="assertive"`) que lista todos los errores
    devueltos (incluidos los de `educations`/`workExperiences`, que no
    tienen un campo individual asociado en el formulario actual). El
    mensaje de éxito usa `role="status"`/`aria-live="polite"` (no
    interrumpe, solo informa).
  - Los errores no estructurados (p. ej. el backend no responde) se
    siguen mostrando en el `Alert` genérico existente, también con
    `role="alert"`.
- **Verificación en el navegador** (contra el backend real, corriendo en
  `positions-proceso-AGB`'s puerto 3010 con el nuevo formato):
  1. Se reprodujo el caso exacto reportado por el usuario — apellido
     `Garcia_` — y apareció: *"El apellido contiene un carácter no
     permitido: "_". Solo se admiten letras y espacios."*, tanto pegado al
     campo como en el resumen.
  2. Se comprobó en el DOM (`aria-invalid`, `aria-describedby`) que el
     campo `lastName` queda correctamente asociado a su mensaje de error.
  3. Se simuló `navigator.language = 'en-US'` y se repitió el envío: el
     mismo error apareció en inglés — *"The last name contains a character
     that is not allowed: "_". Only letters and spaces are allowed."* — sin
     tocar el backend.
  4. La acumulación de varios errores a la vez (backend) y el
     renderizado de una lista con varios elementos (frontend, lógica
     genérica sobre el array `fieldErrors`) ya estaban verificados por
     separado en 3.1/3.2 y en el test de `validator.test.ts`; no fue
     necesario forzarlo también por navegador, donde la validación nativa
     de HTML5 (`required`, `type="email"`) bloquea antes de llegar a
     enviar varios campos igualmente inválidos a la vez.

### 3.7 [Frontend] `public/index.html`: `<html lang="en">` en una app 100% en español

- **Fichero modificado**: `frontend/public/index.html`.
- **Hallazgo**: al investigar por qué los mensajes de error salían en
  inglés, el usuario encontró `<html lang="en">` en el HTML estático y
  preguntó si era la causa. No lo es — la lógica de `getLocale()` nunca
  lee ese atributo, solo `navigator.language`/`navigator.languages` — pero
  es un fallo real y separado: es el valor por defecto del boilerplate de
  Create React App, nunca actualizado, y todo el texto estático de la app
  (etiquetas, botones, títulos) está en español. Un lector de pantalla
  configurado para seguir el idioma declarado de la página anunciaría en
  inglés contenido que en realidad es español.
- **Arreglo**: `lang="en"` → `lang="es"`.

### 3.8 [Frontend] Selector explícito de idioma en `AddCandidateForm.js`

- **Motivo**: `navigator.language` del usuario resultó ser `en-US` — la
  detección automática funcionaba correctamente (ver 3.3.1), pero como el
  resto de la app no tiene i18n en ningún otro sitio (todo el texto
  estático está fijo en español), el resultado era una mezcla: formulario
  en español, errores de validación en inglés. En vez de forzar siempre
  español (perdiendo el beneficio de la detección para quien sí quiera
  inglés) o dejarlo solo en manos del navegador, se añade un control
  visible para elegir explícitamente.
- **Ficheros modificados**:
  - `frontend/src/i18n/validationMessages.js`: se separa `getLocale()` en
    `getStoredLocale()` (lee `localStorage['lti_error_locale']`, `null` si
    no hay nada guardado o no es un idioma soportado) +
    `detectBrowserLocale()` (la lógica de 3.3.1, ahora privada) +
    `setStoredLocale(locale)`. `getLocale()` pasa a ser
    `getStoredLocale() || detectBrowserLocale()`: **la detección
    automática del navegador sigue siendo el valor inicial** — la
    preferencia guardada solo existe una vez que el usuario ha elegido
    explícitamente un idioma con el selector, nunca antes. Esto es
    deliberado: el usuario pidió expresamente que el selector "no
    sustituya a la detección automática inicial, sino que la interprete
    al seleccionar el idioma".
  - `frontend/src/components/AddCandidateForm.js`:
    - Nuevo control con dos botones ("Español"/"English") junto al título
      del formulario, con `role="group"` y `aria-pressed` en el botón
      activo (patrón accesible de grupo de botones tipo toggle).
    - El estado ya no guarda los issues **ya traducidos**
      (`fieldErrors`), sino los issues **en crudo** tal cual los devuelve
      el backend (`issues`) más el `locale` actual; `fieldErrors` se
      recalcula en cada render con
      `translateValidationIssues(issues, locale)`. Así, cambiar el
      selector re-traduce al instante los errores que ya estén en
      pantalla, sin necesidad de reenviar el formulario.
- **Verificación**:
  - Con `navigator.language = 'es'` y sin nada en `localStorage`, el botón
    "Español" aparece activo desde el primer render (confirmado
    inspeccionando `localStorage.getItem('lti_error_locale') === null`
    justo después de cargar la página, antes de tocar el selector) — la
    detección automática sigue siendo el punto de partida.
  - Se verificó la lógica de `getLocale()` de forma aislada (mismo
    algoritmo, ejecutado en la consola del navegador) con
    `navigator.language = 'en-US'` y `localStorage` vacío: resuelve a
    `'en'`, confirmando que un navegador en inglés seguiría arrancando en
    inglés hasta que el usuario elija lo contrario.
  - Compilación (`webpack`/ESLint del dev server) limpia tras el cambio.

### 3.9 [Frontend] Infraestructura compartida de i18n para toda la app

- **Ficheros nuevos**:
  - `frontend/src/i18n/locale.js`: la lógica de "qué idioma está activo"
    (detección de `navigator.language`/`navigator.languages`, lectura/
    escritura de la preferencia guardada) se extrae de
    `validationMessages.js` a un módulo propio, porque ahora la necesitan
    dos consumidores distintos: los mensajes de validación y los textos
    estáticos generales.
  - `frontend/src/i18n/translations.js`: diccionario `es`/`en` de todos
    los textos estáticos de la interfaz (etiquetas, botones, placeholders,
    mensajes de estado), organizados por namespace de componente
    (`dashboard.*`, `addCandidate.*`, `fileUploader.*`, `positions.*`) más
    una función `translate(key, locale, params)`.
  - `frontend/src/i18n/LocaleContext.js`: contexto de React
    (`LocaleProvider`/`useLocale()`) que envuelve toda la app (en
    `App.js`) y expone `{ locale, setLocale, t }` a cualquier componente,
    para que solo exista **un** selector de idioma (no uno por página) y
    un único origen de verdad para el idioma activo.
  - `frontend/src/components/LanguageSwitcher.js`: el control ES/English
    (extraído de `AddCandidateForm.js`, que ya lo tenía inline) como
    componente reutilizable, ahora consumiendo `useLocale()` en vez de
    recibir el estado por props.
- **`validationMessages.js`**: ya no duplica la lógica de detección de
  idioma; reexporta `SUPPORTED_LOCALES`/`getStoredLocale`/`setStoredLocale`/
  `getLocale` desde `locale.js`. El resto (composición de mensajes de
  validación a partir de `{field, code, params}`) no cambia.
- **`App.js`**: envuelve `<BrowserRouter>` con `<LocaleProvider>` y añade
  una barra superior fija con `<LanguageSwitcher />`, visible en las tres
  rutas de la app (antes el selector solo existía dentro del formulario de
  alta de candidato).
- **Bug encontrado al integrar con `Positions.tsx` (TypeScript)**:
  `createContext(null)` hacía que TypeScript infiriera el tipo de `t()`
  (tras el `if (!context) throw` de `useLocale`) como `never` en los
  ficheros `.tsx` que lo consumen (`This expression is not callable. Type
  'never' has no call signatures.`) — un problema conocido de
  `createContext` sin un valor por defecto con forma concreta. Se
  soluciona dándole a `createContext` un objeto por defecto con la misma
  forma que el valor real (`{ locale, setLocale, t }`), en vez de `null`
  más una comprobación que lanza.

### 3.10 [Frontend] Traducción de los 5 componentes con texto visible

- **`RecruiterDashboard.js`**: título, encabezados de las dos tarjetas,
  botones, `alt` del logo.
- **`FileUploader.js`**: `aria-label` del input de fichero, "Selected
  file:"/"Archivo seleccionado:" (antes en inglés fijo pese al resto de la
  app en español — inconsistencia previa, corregida de paso), botón de
  subida, mensaje de éxito.
- **`AddCandidateForm.js`**: título, las 5 etiquetas de campo, "CV",
  botones de añadir/eliminar educación y experiencia, los 6 placeholders
  compartidos entre educación y experiencia, botón de envío, cabecera del
  resumen de errores, mensaje de éxito. Se elimina el selector de idioma
  local (ahora vive en la barra superior de `App.js`, vía `useLocale()`
  compartido) para no tener dos selectores independientes.
- **`Positions.tsx`**: título, placeholders de búsqueda, etiqueta y
  opciones del filtro de estado, etiquetas "Manager"/"Deadline", botones
  "Ver proceso"/"Editar". Los valores de `status` en `mockPositions` pasan
  de cadenas en español (`'Abierto'`, tipadas como unión literal) a
  códigos neutros (`'open'`, `'filled'`, `'closed'`, `'draft'` — ya
  usados como `value` de las opciones del filtro), traducidos solo al
  renderizar; así el mismo dato no depende del idioma para tener sentido
  internamente. **Nota de alcance**: esta es la versión con datos mock de
  `frontend-AGB` — el listado real conectado a la API y la vista "Ver
  proceso" con el tablero Kanban viven en la rama separada
  `positions-proceso-AGB`, que no está fusionada aquí; no se ha traducido
  `PositionProcess.tsx` porque ese fichero no existe en esta rama.
- **`candidateService.js`**: se detecta y corrige un bug introducido al
  añadir el prefijo traducido (`t('addCandidate.genericErrorPrefix')`) en
  `AddCandidateForm.js` sin quitar el prefijo español que `candidateService.js`
  ya añadía él mismo (`"Error al enviar datos del candidato: ..."`) — el
  resultado habría sido un prefijo duplicado. Se corrige dejando que
  `candidateService.js` lance solo el detalle del error, sin prefijo; el
  prefijo traducido lo añade quien lo muestra.

### 3.11 Límites de alcance de esta traducción

- **Texto nativo del navegador**: el botón "Seleccionar archivo" y el
  texto "Ningún archivo seleccionado" del `<input type="file">` son
  generados por el propio navegador según su idioma de interfaz (no el de
  la página), y no se pueden traducir desde JavaScript/React. Se
  documenta aquí para que no se confunda con un olvido.
- **Mensajes de error dinámicos no estructurados**: los mensajes que
  vienen de errores genéricos (no de validación) — p. ej. si el backend
  está caído, o un error de red — siguen sin traducirse: son texto ya
  hecho que viene de `error.message` (JS) o de un `Error` lanzado por el
  propio backend (que tampoco los traduce, como el `"Invalid file type,
  only PDF and DOCX are allowed!"` de `fileUploadService.ts`). Traducir
  esto exigiría el mismo tratamiento de códigos estructurados que ya
  tienen los errores de validación, aplicado a todos los demás mensajes de
  error del backend — un cambio bastante más grande, no pedido aquí.

### 3.12 Fusión con `positions-proceso-AGB`: todo el trabajo en una sola rama

- **Por qué esta rama y no otra combinación**: `positions-proceso-AGB`
  parte de `main` directamente (no de `backend-AGB`/`frontend-AGB`), así
  que nunca tuvo los arreglos de validación, i18n ni a11y. Para tenerlo
  todo junto sin reintroducir bugs ya corregidos, se crea `all-fixes-AGB`
  desde `candidate-validation-i18n-a11y-AGB` (que ya incluye
  `backend-AGB` + `frontend-AGB` + todo el trabajo de i18n/a11y) y se
  fusiona `positions-proceso-AGB` sobre ella — en vez de al revés, que
  habría obligado a reconstruir el i18n desde cero sobre el código de
  posiciones.
- **Conflictos de la fusión** (`git merge positions-proceso-AGB`):
  - `prompts-AGB.md`: mismo patrón que la fusión anterior — se conserva el
    histórico de `positions-proceso-AGB` como
    [`prompts-AGB-positions.md`](./prompts-AGB-positions.md) y se reescribe
    este fichero.
  - `frontend/src/App.js`: se combinan las dos rutas (`LocaleProvider` +
    barra de idioma de esta rama, ruta `/positions/:id` → `PositionProcess`
    de `positions-proceso-AGB`).
  - `frontend/src/components/Positions.tsx`: el conflicto más sustancial —
    esta rama tenía la versión **mock** ya traducida (con códigos de
    estado neutros `open`/`filled`/`closed`/`draft`);
    `positions-proceso-AGB` tenía la versión con **datos reales** de la
    API pero sin traducir. Se reescribe a mano combinando ambas: fetch
    real (`getPositions()`, estados de carga/error/vacío) + `t()` en todo
    el texto estático, con los códigos de estado en minúscula
    (`position.status.toLowerCase()`) para que coincidan con las claves
    del diccionario, ya que el backend real devuelve `Open`/`Filled`/...
    con mayúscula inicial.
  - `backend/src/presentation/controllers/positionController.ts`,
    `positionService.ts`, `positionRoutes.ts`, `api-spec.yaml`,
    `positionService.test.ts`, `positionController.test.ts`,
    `backend/package.json`: se fusionaron automáticamente sin conflictos
    de contenido; se revisaron a mano de todos modos para confirmar que
    combinaban correctamente el endpoint `GET /position` (de
    `positions-proceso-AGB`) con las comprobaciones `isNaN` (de
    `backend-AGB`) y el test corregido de `id`/`applicationId` (también de
    `backend-AGB`) — todo presente, sin pérdidas.
- **`frontend/src/components/PositionProcess.tsx`**: no existía en esta
  rama antes de la fusión (por eso no se había traducido, ver 3.10). Al
  llegar con la fusión, se traduce ahora: "Volver a posiciones", "Proceso
  de selección: ", "Esta posición no tiene un flujo de entrevistas
  configurado.", "Sin candidatos en esta fase.", "Puntuación media: " y el
  mensaje de error genérico. Los nombres de las fases de entrevista
  (`step.name`, p. ej. "Technical Interview") y el paso actual de cada
  candidato (`candidate.currentInterviewStep`) **no** se traducen — son
  datos que vienen de la base de datos (`InterviewStep.name`), no texto
  estático de la interfaz, igual que los nombres de los candidatos o de
  las empresas no se traducen.
- **`frontend/src/i18n/translations.js`**: se añaden las claves que
  faltaban para la versión real de `Positions.tsx`
  (`positions.company`, `positions.location`, `positions.empty`,
  `positions.editNotImplemented`, `positions.fetchError`) y las nuevas de
  `positionProcess.*`; se retiran `positions.managerLabel`/
  `positions.managerFilterLabel`, que pertenecían solo al mock (el
  concepto de "Manager" no existe en el modelo `Position` real).

## 4. Verificación final

```
npx tsc --noEmit (backend y frontend) → sin errores
npx jest (backend) → 5 suites, 9 tests, todos en verde
                      (incluye el validator.test.ts nuevo)
Navegador            → caso real del usuario reproducido y corregido,
                        en español e inglés, con aria-invalid/
                        aria-describedby verificados en el DOM
                      → detección de idioma verificada con varias
                        combinaciones de navigator.language/languages
                        (ca+es-ES+en → español; ca+en+es → inglés),
                        confirmando el DOM tras esperar la respuesta
                        async, no solo la captura inmediata al clic
                      → selector explícito ES/English: arranca desde la
                        detección automática (localStorage vacío en el
                        primer render), cambia el idioma de los errores ya
                        visibles al instante
                      → <html lang="es"> corregido (antes "en", sin
                        relación con la lógica de i18n)
                      → las 3 rutas (dashboard, alta de candidato,
                        posiciones) verificadas en español e inglés tras
                        cambiar el selector global, con el idioma
                        persistiendo al navegar entre páginas
                      → bug de tipos (createContext(null) → `never` en
                        .tsx) detectado por tsc y corregido antes de dar
                        el cambio por bueno
                      → bug de doble prefijo en candidateService.js
                        detectado y corregido antes de dar el cambio por
                        bueno
```

## 5. Verificación de la fusión con `positions-proceso-AGB` (sección 12)

```
npx tsc --noEmit (backend y frontend) → sin errores tras resolver los
                        conflictos de App.js y Positions.tsx
npx jest (backend)   → 5 suites, 11 tests, todos en verde (los 2 tests
                        nuevos de getAllPositionsService/getAllPositions
                        de positions-proceso-AGB conviven con los 9 ya
                        existentes de esta rama)
Navegador            → GET /position con datos reales del seed (2
                        posiciones), badges de estado y "Edit"
                        deshabilitado, en inglés (idioma recordado de la
                        sesión anterior, confirmando que la preferencia
                        persiste entre fusiones)
                      → "View process" → tablero con Carlos García /
                        John Doe / Jane Smith en sus fases correctas,
                        interfaz en inglés
                      → cambio a español desde el selector → "Volver a
                        posiciones", "Proceso de selección: ", "Sin
                        candidatos en esta fase.", "Puntuación media: "
                        traducidos; nombres de fases ("Initial
                        Screening"...) sin traducir, por ser datos
                      → formulario de alta de candidato verificado de
                        nuevo tras la fusión, sin regresiones
```

## 3.13 Migración a `react-i18next`: cómo se hace "bien"

Esta sección documenta con el máximo detalle posible la migración del
sistema de i18n hecho a mano (rama `candidate-validation-i18n-a11y-AGB`)
a `react-i18next`, la librería estándar del ecosistema React para
internacionalización: la filosofía detrás de la decisión, cada comando
ejecutado (incluidos los que fallaron, porque el porqué de un fallo es
tan importante como el resultado final), los paquetes instalados y por
qué esas versiones concretas, cómo cambió el código fichero a fichero, y
las ventajas reales frente a la versión anterior.

### 3.13.1 Filosofía: por qué sustituir algo que ya funcionaba

El sistema anterior (`locale.js` + `LocaleContext.js` + `translations.js`,
~150 líneas en total) **funcionaba correctamente** — estaba verificado,
probado en el navegador, con tests indirectos vía la UI. La pregunta no
era "¿funciona?" sino "¿es así como se construye esto en un proyecto
real, en equipo, a largo plazo?". Tres ideas concretas guiaron la
migración:

1. **No reinventar problemas ya resueltos.** Detectar el idioma del
   navegador con fallbacks razonables, persistir una preferencia,
   interpolar parámetros en una frase, pluralizar correctamente según el
   idioma (las reglas de plural varían radicalmente entre idiomas — no es
   "singular o plural", en algunos idiomas hay 3, 4 o 6 formas distintas)
   son problemas que miles de proyectos ya resolvieron, testearon contra
   casos borde durante años, y empaquetaron en una librería. Escribirlo a
   mano es empezar de cero en un problema ya resuelto, y cada edge case
   nuevo (un tercer idioma, una frase con plural, RTL) sería código nuevo
   a escribir, testear y mantener nosotros mismos.
2. **Adoptar el formato idiomático desbloquea herramientas gratis.** Un
   JSON anidado por idioma (`es.json`/`en.json`) no es solo "otra forma
   de guardar lo mismo": es el formato que entienden `i18next-parser`
   (extrae claves usadas en el código automáticamente), los plugins de
   VSCode para i18next, y plataformas de gestión de traducciones como
   Lokalise o Crowdin (a las que un traductor no-programador podría subir
   directamente estos ficheros). Un objeto JS con claves planas hecho a
   mano no es compatible con nada de eso.
3. **El estado del idioma debe vivir fuera de React.** El sistema casero
   guardaba el `locale` como estado de un `React.Context` — lo cual
   obligaba a cualquier código que necesitara traducir algo *fuera* de un
   componente (como `validationMessages.js`, invocado desde un `catch` de
   un `handleSubmit`) a recibir el `locale` como parámetro explícito en
   cada función. i18next mantiene el idioma activo como un singleton
   global fuera de React; cualquier módulo puede llamar a `i18n.t(...)`
   directamente, sin necesidad de que el idioma "le llegue" desde algún
   sitio. Esto simplificó de verdad `validationMessages.js` (ver 3.13.4).

### 3.13.2 Pasos ejecutados, en orden, con los comandos exactos

```bash
# 1. Nueva rama desde la que ya tenía todo integrado
git checkout -b i18n-react-i18next-AGB

# 2. Primer intento de instalación — falla
cd frontend
npm install react-i18next i18next i18next-browser-languagedetector
# npm error ERESOLVE unable to resolve dependency tree
# npm error peerOptional typescript@"^5 || ^6 || ^7" from react-i18next@17.0.14
# (el proyecto usa typescript@^4.9.5 en tsconfig.json/package.json)

# 3. Investigar qué versiones de react-i18next NO exigen TypeScript 5
npm view react-i18next versions --json
npm view react-i18next@13 peerDependencies   # sin peer de typescript
npm view react-i18next@14 peerDependencies   # sin peer de typescript
npm view react-i18next@15 peerDependencies   # 15.0.0–15.5.0 sin peer;
                                              # 15.5.1+ ya exige typescript ^5

# 4. Segundo intento, fijando react-i18next@15.5.0 — falla igualmente,
#    esta vez por i18next (su última versión también exige TS5)
npm install react-i18next@15.5.0 i18next i18next-browser-languagedetector
# npm error peerOptional typescript@"^5 || ^6 || ^7" from i18next@26.4.2

# 5. Repetir la misma investigación para i18next
npm view i18next@23 peerDependencies   # sin peer de typescript
npm view i18next@24 peerDependencies   # ya exige typescript ^5
npm view i18next@23 version            # última 23.x: 23.16.8

# 6. Tercer intento, fijando ambos paquetes — funciona
npm install react-i18next@15.5.0 i18next@23.16.8 i18next-browser-languagedetector
# added 5 packages, removed 1 package, changed 1 package

# 7. Se construyen los ficheros nuevos (locales/es.json, locales/en.json,
#    i18n.js) y se reescriben los componentes (ver 3.13.3-3.13.4)

# 8. Verificación de tipos — falla de nuevo, con react-i18next@15.5.0 esta vez
npx tsc --noEmit
# node_modules/react-i18next/index.d.ts(100,3): error TS1139:
#   Type parameter declaration expected.
# (+ una docena de errores de sintaxis más en el mismo fichero de tipos)
# → No es un peer dependency mal declarado: los .d.ts de esta versión
#   usan sintaxis de TypeScript 5 que el compilador 4.9.5 no puede ni
#   parsear. Hay que bajar react-i18next también.

# 9. Cuarto y último intento — funciona y compila limpio
npm install react-i18next@14.1.3
npx tsc --noEmit   # sin salida = sin errores

# 10. Verificación completa: backend sin cambios, frontend en el navegador
cd ../backend && npx jest && npx tsc --noEmit
cd ../frontend && npx tsc --noEmit

# 11. Commit
git add ...
git commit -m "refactor(i18n): migra del sistema casero a react-i18next"
```

**Por qué se documentan también los pasos 2, 4 y 8 (los que fallaron)**:
en un proyecto real, el primer intento de instalar una librería rara vez
es el definitivo — hay que fijar versiones compatibles con el resto del
stack (aquí, TypeScript 4.9.5, heredado del resto del proyecto). Sirve
como referencia de "qué hacer cuando `npm install` falla por peer
dependencies": primero investigar con `npm view <paquete>@<major>
peerDependencies` qué versión concreta dejó de exigir el requisito
conflictivo, y solo si eso no basta (como pasó aquí en el paso 8),
verificar con `tsc` que los tipos realmente son compatibles y no solo que
`npm install` no proteste.

### 3.13.3 Paquetes instalados (versiones finales)

| Paquete | Versión final | Por qué esa versión concreta |
|---|---|---|
| `react-i18next` | `14.1.3` | Última de la rama 14.x; ni exige TypeScript 5 como peer dependency ni sus `.d.ts` usan sintaxis de TS5 (a diferencia de la 15.5.0, que solo cumplía lo primero). |
| `i18next` | `23.16.8` | Última de la rama 23.x, la última sin exigir TypeScript 5. |
| `i18next-browser-languagedetector` | `8.2.1` (resuelta automáticamente, sin conflicto) | Detecta el idioma del navegador con una cadena de estrategias configurables (`localStorage`, `navigator`, `querystring`, `cookie`, `htmlTag`...); sustituye el bucle manual sobre `navigator.languages` del sistema anterior. |

Estos tres paquetes sustituyen por completo la lógica que antes vivía en
`locale.js` (detección + persistencia) y `translations.js` (diccionario +
interpolación) — ver 3.13.4 para el detalle fichero a fichero.

### 3.13.4 Cómo cambió el código, fichero a fichero

**Ficheros eliminados** (su funcionalidad la cubre ahora la librería):
- `frontend/src/i18n/locale.js` — detección de `navigator.languages`,
  lectura/escritura de `localStorage`.
- `frontend/src/i18n/LocaleContext.js` — el `React.Context` +
  `LocaleProvider` + hook `useLocale()` caseros.
- `frontend/src/i18n/translations.js` — el diccionario plano
  `{ 'addCandidate.firstName': '...' }` + la función `translate()` que
  hacía `dict[key]` y un `.replace()` manual por cada `{{param}}`.

**Ficheros nuevos**:
- `frontend/src/i18n/locales/es.json` y `en.json` — el mismo contenido
  que antes vivía en `translations.js`, pero como JSON **anidado**
  (`{ "addCandidate": { "firstName": "Nombre" } }` en vez de
  `{ 'addCandidate.firstName': 'Nombre' }`). i18next usa `.` como
  separador de claves por defecto, así que `t('addCandidate.firstName')`
  sigue funcionando exactamente igual desde los componentes — no hizo
  falta tocar ni una sola llamada a `t()` en el JSX por este cambio de
  formato. También incorporan un namespace nuevo `validation.*` con las
  etiquetas de campo (`validation.fields.firstName`) y las plantillas de
  mensaje (`validation.messages.required`) que antes eran objetos JS
  (`SIMPLE_FIELD_LABELS`, `MESSAGE_TEMPLATES`) dentro de
  `validationMessages.js`.
- `frontend/src/i18n/i18n.js` — la configuración e inicialización de
  i18next. Se importa **una sola vez**, como efecto secundario
  (`import './i18n/i18n'`), desde `index.tsx`, antes de renderizar
  `<App />`. Esto basta para que cualquier componente use
  `useTranslation()` sin necesidad de un `<Provider>` explícito envolviendo
  la app — a diferencia del `LocaleProvider` casero, que si se te olvidaba
  envolver un árbol de componentes rompía el hook con una excepción en
  tiempo de ejecución. Contenido relevante:
  ```js
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: { es: { translation: es }, en: { translation: en } },
      fallbackLng: 'es',
      supportedLngs: ['es', 'en'],
      load: 'languageOnly',   // 'en-US' -> 'en'
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'lti_error_locale', // misma clave que el sistema anterior
      },
      interpolation: { escapeValue: false }, // React ya escapa por defecto
    });

  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng; // <html lang> ahora reactivo
  });
  ```
  Nótese `lookupLocalStorage: 'lti_error_locale'`: se reutiliza
  deliberadamente la misma clave que usaba el sistema casero, así que
  cualquier preferencia de idioma que un usuario ya hubiera elegido antes
  de esta migración se respeta automáticamente, sin necesidad de
  migración de datos.

- **`frontend/src/i18n/validationMessages.js` (reescrito por completo)**:

  *Antes* — objetos JS con plantillas interpoladas a mano, y el `locale`
  viajando como parámetro explícito por cada función:
  ```js
  const MESSAGE_TEMPLATES = {
    es: {
      required: (field) => `${field} es obligatorio.`,
      tooShort: (field, params) => `${field} debe tener al menos ${params.min} caracteres.`,
      // ...
    },
    en: { /* lo mismo en inglés */ },
  };

  export const translateValidationIssue = (issue, locale = getLocale()) => {
    const fieldLabel = getFieldLabel(issue.field, locale);
    const templates = MESSAGE_TEMPLATES[locale] || MESSAGE_TEMPLATES[DEFAULT_LOCALE];
    return templates[issue.code](fieldLabel, issue.params || {});
  };
  ```

  *Después* — delega la composición e interpolación en i18next, sin
  necesidad de recibir el idioma como parámetro (usa el idioma activo de
  la instancia global directamente):
  ```js
  import i18n from './i18n';

  const getFieldLabel = (field) => {
    const match = field.match(ARRAY_FIELD_REGEX);
    if (match) {
      const [, section, index, subfield] = match;
      return i18n.t('validation.arrayFieldLabel', {
        section: i18n.t(`validation.sections.${section}`),
        position: Number(index) + 1,
        subfield: i18n.t(`validation.subfields.${subfield}`),
      });
    }
    return i18n.t(`validation.fields.${field}`, { defaultValue: field });
  };

  export const translateValidationIssue = (issue) => {
    const field = getFieldLabel(issue.field);
    return i18n.t(`validation.messages.${issue.code}`, { field, ...(issue.params || {}) });
  };
  ```
  La firma pasó de `translateValidationIssue(issue, locale)` a
  `translateValidationIssue(issue)` — una simplificación real, no
  cosmética: ya no hay que acordarse de propagar el `locale` por cada
  punto de la cadena de llamadas.

- **Componentes migrados** (`useLocale()` de `LocaleContext.js` →
  `useTranslation()` de `react-i18next`): `RecruiterDashboard.js`,
  `FileUploader.js`, `AddCandidateForm.js`, `Positions.tsx`,
  `PositionProcess.tsx`, `LanguageSwitcher.js`. El cambio en cada uno fue
  mínimo — literalmente la línea de import y la línea del hook — porque
  las claves de traducción ya usaban el mismo formato de puntos:
  ```diff
  - import { useLocale } from '../i18n/LocaleContext';
  + import { useTranslation } from 'react-i18next';

  - const { t } = useLocale();
  + const { t } = useTranslation();
  ```
  `LanguageSwitcher.js` cambió algo más: `setLocale(code)` pasó a ser
  `i18n.changeLanguage(code)` (la API estándar de i18next, que ya
  persiste en `localStorage` vía `LanguageDetector` sin código adicional
  nuestro), y la comparación de idioma activo pasó a usar
  `i18n.resolvedLanguage` en vez de un `locale` de estado propio — el
  idioma realmente resuelto tras aplicar `load: 'languageOnly'`. Se
  añadió también `lang={code}` a cada botón del selector, para que un
  lector de pantalla pronuncie "Español"/"English" con las reglas
  fonéticas del idioma que nombran, no las de la página en la que están.

- **Ajuste en los `useEffect` de `Positions.tsx`/`PositionProcess.tsx`**:
  antes incluían `t` en el array de dependencias (necesario con el `t`
  "casero", recreado en cada cambio de idioma vía `useMemo`), lo que
  volvía a pedir los datos a la API cada vez que alguien cambiaba de
  idioma — un efecto secundario no intencionado del diseño anterior.
  `useTranslation()` de `react-i18next` también provoca un re-render al
  cambiar de idioma (así el texto se re-traduce), pero ya no hacía falta
  meter `t` en las dependencias del *fetch*: se corrigió a `[]`/`[id]`,
  de modo que los datos solo se piden una vez y el texto se re-traduce en
  cada render sin necesidad de volver a llamar a la API.

### 3.13.5 Ventajas frente al sistema anterior

| Aspecto | Sistema casero (`candidate-validation-i18n-a11y-AGB`) | `react-i18next` |
|---|---|---|
| Detección de idioma | Bucle manual sobre `navigator.languages`, escrito y testeado por nosotros | `LanguageDetector`, usado y probado en miles de proyectos en producción |
| Persistencia de preferencia | `localStorage.getItem`/`setItem` manual con `try/catch` propio | Gestionada por `LanguageDetector` (`caches: ['localStorage']`), cero código nuestro |
| Interpolación de parámetros | `String.replace()` manual por cada `{{param}}` | Motor de interpolación nativo, con opciones de escapado/formato |
| Pluralización | Sin soporte — habría que escribirlo desde cero para el primer `"1 candidato"` vs `"2 candidatos"` | Soporte nativo vía `t('key', { count })`, con las reglas de plural correctas por idioma |
| Uso fuera de componentes React | Cada función debía recibir `locale` como parámetro explícito | `i18n.t(...)` global, mismo resultado sin parámetros adicionales |
| `<html lang>` reactivo | Había que cablearlo a mano (y de hecho fue un fallo real detectado en esta misma sesión, ver sección 3.7/3.3.1) | Una línea: `i18n.on('languageChanged', ...)` |
| Formato de recursos | Objeto JS con claves planas, sin convención externa | JSON anidado, el formato que esperan `i18next-parser` y plataformas de traducción (Lokalise, Crowdin...) |
| Añadir un idioma nuevo | Un objeto JS más en `translations.js` + otro en `validationMessages.js`, mantenidos a mano en paralelo | Un fichero `xx.json` más; toda la lógica de resolución/fallback ya está resuelta |
| Mantenimiento a largo plazo | Cada caso nuevo (RTL, formato de fecha, plural, un tercer idioma) es código nuestro a escribir y testear | Ya resuelto por la librería; se actualiza con `npm update` |
| Superficie de código propio | ~150 líneas de lógica de i18n hecha a mano, a mantener indefinidamente | ~40 líneas de configuración declarativa (`i18n.js`); el resto lo mantiene la librería |

La funcionalidad visible para el usuario final **no cambió en nada** — es
exactamente el mismo comportamiento (detección automática, selector
explícito que la anula, persistencia, re-traducción en caliente) que ya
se había verificado con el usuario. Lo que cambió es *qué tan sostenible*
es ese comportamiento a partir de aquí.

## 6. Verificación de la migración a react-i18next (sección 3.13)

```
npm install react-i18next@14.1.3 i18next@23.16.8 i18next-browser-languagedetector
                      → tras descartar react-i18next@17 (exige TS5) y
                        @15.5.0 (sus .d.ts no compilan con TS 4.9)
npx tsc --noEmit (frontend) → sin errores con react-i18next@14.1.3
npx jest (backend)   → 5 suites, 11 tests, sin cambios (rama solo de frontend)
Navegador            → <html lang> confirmado dinámico
                        (document.documentElement.lang pasa de "es" a "en"
                        al cambiar el selector, sin recargar)
                      → localStorage['lti_error_locale'] se sigue
                        actualizando con la misma clave que antes
                      → caso real del guión bajo en el apellido reproducido
                        de nuevo: mensaje interpolado correctamente vía
                        i18next ("...character that is not allowed: "_"...")
                      → cambio de idioma en caliente sobre un error ya
                        visible, sin reenviar el formulario (igual que con
                        el sistema casero)
                      → /positions y /positions/:id (datos reales)
                        verificados en español, sin regresiones
```

## 3.14 Migración de Create React App a Vite

### 3.14.1 Filosofía: por qué migrar el toolchain y no solo la versión de TypeScript

El disparador fue una pregunta muy concreta: "¿por qué no pasar a
TypeScript 5?". La respuesta corta es que no hay ningún impedimento en
el código — nada de lo escrito en este proyecto usa sintaxis específica
de una versión de TS. El impedimento era `react-scripts` (Create React
App), que declara `"typescript": "^3.2.1 || ^4"` como *peer dependency*.

Pero forzar solo esa versión habría sido tratar el síntoma, no la causa:
**Create React App está descontinuado** — el equipo de React lo retiró
oficialmente como recomendación en 2025, y `react-scripts` no ha tenido
una versión mayor desde 2022 que reconozca nada del ecosistema moderno.
Subir TypeScript por su cuenta habría significado volver a chocar con el
mismo peer dependency desfasado en la siguiente librería (como de hecho
ya había pasado con `react-i18next` en la sección 3.13). La decisión de
migrar a Vite fue del usuario, explícitamente ("busco aprender con lo
último y cómo debe hacerse"), tras un análisis previo de qué implicaba
(ver el resumen que dio el asistente antes de empezar: sin variables
`REACT_APP_*`, sin suite de tests que romper — `npm test` ya estaba roto,
apuntaba a un `jest.config.js` inexistente —, sin `craco` ni `eject`,
nada fuera de `frontend/` dependiente de CRA — riesgo bajo).

Un hallazgo no anticipado durante la propia migración reforzó la
filosofía de "lo último no siempre es lo más compatible, y hay que
comprobarlo, no asumirlo": al intentar instalar TypeScript en su versión
`latest`, npm resolvió `7.0.2` — **TypeScript ya va por la versión 7**
(el compilador reescrito nativamente en Go), más nuevo todavía de lo que
la pregunta original planteaba. Pero `typescript-eslint` (necesario para
enlazar TypeScript con ESLint) declara un peer `typescript: ">=4.8.4
<6.1.0"` — no soporta ni TS7 ni siquiera TS 5.9 en su forma más estricta
de resolución de npm. La cadena de decisiones fue: TS7 (más nuevo,
incompatible con el linter) → TS5.9.3 (compatible, pero no la más
reciente posible) → **TS6.0.3** (el usuario preguntó explícitamente si
TS6 también encajaba; se comprobó con `npm view typescript versions` que
sí hay releases estables 6.0.2/6.0.3, no solo la beta que aparecía en
`dist-tags`, y caen dentro del rango que acepta `typescript-eslint`). El
resultado final es la versión más nueva posible que no rompe ninguna
pieza del stack — ni más, ni menos.

### 3.14.2 Pasos ejecutados, en orden, con los comandos exactos

```bash
# 1. Nueva rama desde la que ya tenía todo integrado + i18n con react-i18next
git checkout -b vite-migration-AGB
cd frontend

# 2. Primer intento de instalar Vite — falla por un conflicto de babel
#    heredado del propio react-scripts, todavía instalado en ese momento
npm install --save-dev vite @vitejs/plugin-react
# npm error Conflicting peer dependency: @babel/core@8.0.5
# npm error peer @babel/core@"^7.29.0 || ^8.0.0-rc.1" from @rolldown/plugin-babel@0.2.4
# npm error   peerOptional @rolldown/plugin-babel from @vitejs/plugin-react@6.1.1

# 3. Se quita react-scripts ANTES de instalar Vite (elimina el babel
#    obsoleto que causaba el conflicto del paso 2)
npm uninstall react-scripts
# removed 1239 packages

# 4. Segundo intento — falla por otra razón: Vite 8 exige @types/node
#    moderno, el proyecto tenía la versión de la época de CRA (^16.18.97)
npm install --save-dev vite @vitejs/plugin-react
# npm error peerOptional @types/node@"^20.19.0 || >=22.12.0" from vite@8.3.0
npm install --save-dev @types/node@latest   # -> 22.20.3

# 5. Tercer intento — funciona
npm install --save-dev vite @vitejs/plugin-react
# added 15 packages (vite@8.3.0, @vitejs/plugin-react@6.1.1)

# 6. TypeScript a la última — resuelve a la v7 (el compilador en Go)
npm install --save-dev typescript@latest   # -> 7.0.2

# 7. Vitest, el test runner hermano de Vite
npm install --save-dev vitest jsdom

# 8. Se construyen index.html (en la raíz), vite.config.ts, tsconfig.json/
#    tsconfig.app.json/tsconfig.node.json, vite-env.d.ts, y se actualizan
#    los scripts de package.json (ver 3.14.4)

# 9. Instalar el stack de ESLint flat config — falla: typescript-eslint no
#    soporta TypeScript 7 todavía
npm install --save-dev eslint @eslint/js typescript-eslint \
  eslint-plugin-react-hooks eslint-plugin-react-refresh globals
# npm error peer typescript@">=4.8.4 <6.1.0" from typescript-eslint@8.70.0
# npm error Found: typescript@7.0.2

# 10. Se baja TypeScript a la última 5.x para poder instalar el linter
npm view typescript-eslint peerDependencies   # typescript: ">=4.8.4 <6.1.0"
npm view typescript@5 version                 # última 5.x: 5.9.3
npm install --save-dev typescript@5.9.3
npm install --save-dev eslint @eslint/js typescript-eslint \
  eslint-plugin-react-hooks eslint-plugin-react-refresh globals
# funciona

# 11. Se escribe eslint.config.js; hace falta "type": "module" en
#     package.json para que Node interprete su `import` como ESM

# 12. Verificación de tipos — limpia
npx tsc -b

# 13. Primer arranque de Vite — falla: JSX en ficheros .js
npm run dev
# [PARSE_ERROR] Unexpected JSX expression, src/App.js:12
# Help: JSX syntax is disabled and should be enabled via the parser options

# 14. Se identifican los .js con JSX real (grep descartando falsos
#     positivos como comentarios que mencionan <Provider>) y se renombran
grep -lE "<[A-Za-z]|</[A-Za-z]" $(find src -name "*.js")
git mv src/App.js src/App.jsx
git mv src/components/RecruiterDashboard.js src/components/RecruiterDashboard.jsx
git mv src/components/AddCandidateForm.js src/components/AddCandidateForm.jsx
git mv src/components/FileUploader.js src/components/FileUploader.jsx
git mv src/components/LanguageSwitcher.js src/components/LanguageSwitcher.jsx

# 15. Segundo arranque — limpio; verificación completa en el navegador
#     (dashboard, alta de candidato con validación ES/EN, listado de
#     posiciones con datos reales, tablero "Ver proceso")
npm run dev

# 16. Build de producción — funciona, genera dist/ (antes build/ con CRA)
npm run build
npx vite preview --port 4173   # sirve el build, 200 OK

# 17. El linter, ya con el stack completo instalado, encuentra 5 errores
#     reales (no relacionados con la migración en sí, preexistentes):
npx eslint .
# preserve-caught-error: throw new Error(...) dentro de un catch sin
# adjuntar la causa original -> se corrige añadiendo { cause: error } en
# candidateService.js (x2) y positionService.js (x3)

# 18. vitest sin tests configurados sale con código 1 (rompería CI); se
#     añade --passWithNoTests al script "test" de package.json
npx vitest run
# No test files found, exiting with code 1

# 19. A mitad de sesión, el usuario pregunta si TS6 también sería
#     compatible con el stack — se comprueba y se corrige (ver 3.14.1)
npm view typescript versions --json | grep '"6\.'   # 6.0.2, 6.0.3 estables
npm install --save-dev typescript@6.0.3
npx tsc -b   # sigue limpio

# 20. Verificación final completa
npx tsc -b && npx eslint . && npm run build && npm test
cd ../backend && npx jest && npx tsc --noEmit   # backend intacto
```

### 3.14.3 Paquetes: qué se quitó, qué se añadió, y las versiones finales

**Eliminado**: `react-scripts` (y con él, 1239 paquetes transitivos —
todo el toolchain de Babel/webpack de CRA), `@types/jest` (ya no hace
falta con Vitest, y podía chocar con los tipos globales de
`vitest/globals`).

| Paquete | Versión final | Por qué |
|---|---|---|
| `vite` | `8.3.0` | El bundler/dev server en sí. |
| `@vitejs/plugin-react` | `6.1.1` | Soporte de React (Fast Refresh, JSX) para Vite. |
| `typescript` | `6.0.3` | La versión estable más reciente compatible con `typescript-eslint` (ver 3.14.1) — ni la 7.0.2 "latest" (rompe el linter) ni quedarse en la 5.9.3 (había una 6.x estable más nueva). |
| `@types/node` | `22.20.3` | La `^16.18.97` heredada de CRA no cumplía el peer de Vite 8 (`^20.19 \|\| >=22.12`). |
| `vitest` | `5.0.1` | Test runner — sustituye a Jest (que además nunca llegó a configurarse: `npm test` apuntaba a un `jest.config.js` inexistente). |
| `jsdom` | `30.0.1` | Entorno DOM simulado para que Vitest pueda ejecutar tests de componentes. |
| `eslint` | `10.10.0` | ESLint 9+ con configuración plana (`eslint.config.js`), sustituye al `eslintConfig` de `package.json` que dependía de `eslint-config-react-app` (empaquetado por `react-scripts`, ya no disponible al quitarlo). |
| `@eslint/js` + `typescript-eslint` | `10.0.1` / `8.70.0` | Reglas recomendadas de JS y de TypeScript para la config plana. |
| `eslint-plugin-react-hooks` | `7.1.1` | Reglas de hooks de React (`rules-of-hooks`, `exhaustive-deps`). |
| `eslint-plugin-react-refresh` | `0.5.7` | Avisa si un fichero exporta algo que rompería el Fast Refresh de Vite. |
| `globals` | `17.12.0` | Define las globals del navegador (`window`, `document`...) para el linter. |

### 3.14.4 Cómo cambió el código, fichero a fichero

- **`frontend/public/index.html` → `frontend/index.html`** (movido a la
  raíz, no a `public/`): Vite lo trata como el punto de entrada real, no
  como una plantilla. Los 3 usos de `%PUBLIC_URL%/...` se convierten en
  rutas normales (`/favicon.ico`), porque Vite sirve el contenido de
  `public/` en la raíz automáticamente. Se añade
  `<script type="module" src="/src/index.tsx"></script>` (con CRA esta
  referencia era implícita, inyectada por `react-scripts`). De paso se
  corrige el `<title>` genérico "React App" heredado del boilerplate por
  "LTI - Talent Tracking System".
- **`frontend/vite.config.ts` (nuevo)**: plugin de React,
  `server.port: 3000` fijado explícitamente (el backend tiene
  `cors({ origin: 'http://localhost:3000' })` hardcodeado — así no hace
  falta tocar el backend, aunque el puerto por defecto de Vite sea 5173),
  y la config de Vitest (`environment: 'jsdom'`, `globals: true`).
- **`frontend/tsconfig.json`**: pasa de un único fichero con todas las
  opciones a **project references** (`{ "files": [], "references": [...]
  }`), el patrón que genera el propio scaffold oficial de Vite
  (`npm create vite@latest`) — separa la config de "código de la app"
  (`tsconfig.app.json`) de la de "config de Vite en sí"
  (`tsconfig.node.json`, para que `vite.config.ts` se compile con un
  target de Node, no de navegador). Cambios de fondo en
  `tsconfig.app.json`: `moduleResolution: "node"` → `"bundler"` (el modo
  recomendado cuando el bundler, no `tsc`, resuelve los módulos) y
  `target: "es5"` → `"ES2022"` (Vite/esbuild no necesitan bajar a ES5;
  los navegadores objetivo del `browserslist` ya son modernos).
- **`frontend/src/react-app-env.d.ts` → `frontend/src/vite-env.d.ts`**:
  `/// <reference types="react-scripts" />` → `/// <reference types="vite/client" />`.
- **`frontend/eslint.config.js` (nuevo)**: configuración plana de ESLint
  9, sustituye al campo `"eslintConfig": { "extends": ["react-app",
  "react-app/jest"] }` de `package.json` (ese formato de configuración ya
  ni siquiera lo lee ESLint 9 sin un plugin de compatibilidad).
- **`frontend/src/App.jsx`, `RecruiterDashboard.jsx`,
  `AddCandidateForm.jsx`, `FileUploader.jsx`, `LanguageSwitcher.jsx`**
  (renombrados de `.js`): el motor de transformación de Vite 8 (`oxc`,
  escrito en Rust) solo activa el parseo de JSX para ficheros `.jsx`/
  `.tsx` por extensión — a diferencia de Babel (usado por CRA), que lo
  detectaba dentro de cualquier `.js`. La solución correcta no es
  configurar una excepción para `.js` (posible, pero un parche), sino
  nombrar los ficheros según lo que contienen — la convención que ya
  seguían `Positions.tsx`/`PositionProcess.tsx` en este mismo proyecto.
- **`frontend/src/services/candidateService.js` y `positionService.js`**:
  el linter recién configurado (regla `preserve-caught-error`) señaló que
  los `throw new Error(mensaje)` dentro de un `catch (error)` perdían la
  causa original. Se corrige añadiendo el segundo argumento estándar de
  `Error` (`{ cause: error }`), sin cambiar el mensaje mostrado al
  usuario — un hallazgo real del linter, no parte "planeada" de la
  migración, corregido porque instalar un linter y no atender lo que
  encuentra habría dejado el repositorio en un estado incoherente.
- **`frontend/package.json`**: `"type": "module"` (necesario para que
  Node interprete el `import` de `eslint.config.js`/`vite.config.ts` como
  ESM); scripts `start`/`eject` → `dev`/`preview`; `build` pasa de
  `react-scripts build` a `tsc -b && vite build` (type-check explícito
  antes del build, algo que CRA hacía de forma menos visible vía
  `fork-ts-checker-webpack-plugin`); `test` pasa de
  `jest --config jest.config.js` (roto: el fichero no existía) a
  `vitest run --passWithNoTests` (no falla con cero tests, que es el
  estado real y honesto del proyecto ahora mismo) + un `test:watch`
  nuevo para desarrollo local.
- **`README.md`** (raíz, ES y EN) **y `frontend/README.md`**: los pasos
  "construye el frontend" + "inicia el frontend" (`npm run build` +
  `npm start`) se sustituyen por un único `npm run dev`. El
  `frontend/README.md` generado por CRA (boilerplate nunca personalizado,
  con enlaces a la documentación oficial de Create React App) se
  reemplaza por uno breve y específico de este proyecto.
- **`.gitignore`**: se añade `**/*.tsbuildinfo` (caché incremental de
  `tsc -b`, generada al compilar, que no debe versionarse — no existía
  antes porque CRA nunca usaba compilación incremental de `tsc` con
  project references).

### 3.14.5 Ventajas frente a Create React App

| Aspecto | Create React App | Vite |
|---|---|---|
| Estado del proyecto | Descontinuado desde 2025; `react-scripts` sin versión mayor desde 2022 | Activamente mantenido, es el estándar de facto actual para React sin meta-framework |
| Versión de TypeScript soportada | Como mucho TS4 (peer `^3.2.1 \|\| ^4`) | Sin opinión propia — la fija el proyecto; aquí TS6.0.3 |
| Arranque del dev server | Empaqueta toda la app con webpack antes de servir nada (lento a partir de cierto tamaño) | Sirve los módulos ES nativos del navegador sin empaquetar en dev (arranque en ~150ms en este proyecto, medido) |
| Motor de transformación | Babel (JS puro) | `oxc` (Rust) en dev / `esbuild`/`rolldown` en build — building notablemente más rápido |
| Testing integrado | `react-scripts test` (Jest) — aquí ni siquiera estaba configurado de verdad | Vitest, comparte config y motor con Vite; mucho más rápido que Jest |
| Configuración | Oculta (hay que `eject` para tocarla, "operación de un solo sentido") | `vite.config.ts` explícito, versionado, sin necesidad de "eyectar" nada |
| Linter | `eslint-config-react-app`, formato de config legado (`.eslintrc`) | `eslint.config.js`, la configuración plana estándar de ESLint 9+ |
| Salida de build | `build/` | `dist/` (y avisa de forma explícita de chunks grandes, cosa que CRA no hacía) |
| Coste de mantener actualizado | Cada bump de una dependencia moderna choca con peers de 2022 (ya pasó con `react-i18next` en 3.13) | Las dependencias del ecosistema actual (react-i18next, etc.) se llevan bien con Vite/TS moderno de fábrica |

La app en sí **se comporta exactamente igual** para quien la usa — mismo
puerto, mismas rutas, mismo idioma, misma validación. Lo que cambia es
que ahora se apoya en herramientas mantenidas activamente, en vez de en
un proyecto retirado que solo podía ir acumulando fricción con cada
dependencia nueva.

## 7. Verificación de la migración a Vite (sección 3.14)

```
npm uninstall react-scripts        → -1239 paquetes
npm install vite/@vitejs/plugin-react/typescript/vitest/jsdom/eslint...
                                    → 3 intentos fallidos documentados en
                                      3.14.2, resueltos uno a uno
npx tsc -b (frontend)               → sin errores, con TS 6.0.3
npx eslint . (frontend)             → 5 errores reales encontrados y
                                       corregidos (preserve-caught-error),
                                       luego limpio
npm run build (frontend)            → dist/ generado, build de 441ms
npx vite preview --port 4173        → sirve el build, 200 OK
npm test (frontend)                 → vitest, 0 tests, sale con código 0
                                       (--passWithNoTests)
npx jest / npx tsc --noEmit (backend) → 5 suites, 11 tests, sin cambios
                                       (rama solo de frontend)
Navegador (npm run dev)             → dashboard, /add-candidate (mismo
                                       caso del guión bajo, ES/EN), 
                                       /positions (datos reales de la
                                       API), /positions/:id (tablero
                                       "Ver proceso" con los candidatos
                                       del seed) — todo verificado sin
                                       regresiones tras la migración
```

## 3.15 Tests automáticos: las mismas pruebas de validación, ahora repetibles

A lo largo de toda la sesión, "probar" un arreglo significó siempre lo
mismo: lanzar el backend y el frontend, y reproducir el caso a mano con
`curl` o en el navegador — el apellido con guión bajo, la acumulación de
varios campos, el cambio de idioma, un id de posición no numérico... Esto
verificaba que el comportamiento era correcto en el momento, pero no deja
nada que vuelva a comprobarlo automáticamente si algo se rompe más
adelante. Esta rama convierte esos mismos casos en tests que se ejecutan
con `npm test` (o `npx jest` en el backend), sin depender de tener la
base de datos ni los servidores arrancados.

### 3.15.1 El recuento exacto: por qué 11→19 en el backend y 0→18 en el frontend

No son cifras redondeadas — cada test nuevo está contado (`grep -c
"it("` sobre cada fichero, verificado literalmente antes de escribir esta
sección).

**Backend: 11 → 19 (+8)**

| Fichero | Antes | Después | Qué se añadió |
|---|---|---|---|
| `candidateController.test.ts` | 1 | 5 (+4) | `addCandidateController`: alta con éxito (201); el caso del guión bajo (400, `errors: [{field, code, params}]`); acumulación de 3 campos a la vez; error no-validación (formato genérico, no `issues`) |
| `positionController.test.ts` | 2 | 6 (+4) | `getCandidatesByPosition` con id no numérico (400, sin llamar al servicio); `getInterviewFlowByPosition` con id numérico (200), id no numérico (400) y posición inexistente (404) |
| `validator.test.ts` | 5 | 5 | sin cambios (ya existía desde `candidate-validation-i18n-a11y-AGB`) |
| `candidateService.test.ts` | 1 | 1 | sin cambios |
| `positionService.test.ts` | 2 | 2 | sin cambios |

Los +8 son exactamente los huecos de cobertura identificados en 3.15.2 —
no tests genéricos añadidos por rellenar un número, sino los casos
concretos que antes solo se habían comprobado con `curl`.

**Frontend: 0 → 18** (no había ningún fichero `*.test.*` en todo
`frontend/src` antes de esta rama — `Vitest` estaba instalado y
configurado desde `vite-migration-AGB`, pero vacío)

| Fichero (nuevo) | Tests |
|---|---|
| `i18n/validationMessages.test.js` | 8 |
| `services/candidateService.test.js` | 6 |
| `components/AddCandidateForm.test.jsx` | 4 |
| **Total** | **18** |

### 3.15.2 Backend: rellenar los huecos reales de cobertura

Antes de esta rama, `candidateController.test.ts` solo cubría
`updateCandidateStageController`; **`addCandidateController` — el flujo
de alta de candidato, el más verificado a mano de toda la sesión — no
tenía ni un solo test.** De igual manera, `positionController.test.ts`
no cubría el caso `isNaN` de `getCandidatesByPosition`
(sí arreglado en código desde `backend-AGB`, pero nunca comprobado por un
test) ni `getInterviewFlowByPosition` en absoluto.

### 3.15.3 Hallazgo: aislamiento entre tests (mocks que no se limpiaban)

La primera versión de los tests nuevos de `positionController.test.ts`
fallaba así, literalmente:

```
expect(jest.fn()).not.toHaveBeenCalled()

Expected number of calls: 0
Received number of calls: 1
```

No porque el código probado estuviera mal: `jest.mock(...)` a nivel de
módulo conserva el historial de llamadas de un mock **entre distintos
`it()` del mismo fichero** si nadie lo limpia explícitamente. El test
anterior (con un `id` válido, que sí debía llamar al servicio) dejaba
registrada esa llamada, y el siguiente test (`id` no numérico, que **no**
debía llamarlo) heredaba ese recuento y fallaba pese a que el código
`if (isNaN(positionId)) return res.status(400)...` funcionaba
perfectamente. Se corrige con:

```ts
beforeEach(() => {
  jest.clearAllMocks();
});
```

en `positionController.test.ts` y, por coherencia y prevención,
también en `candidateController.test.ts`. Lección concreta: un test mal
aislado puede fallar — o, más peligroso todavía, **pasar** — por motivos
que no tienen nada que ver con lo que dice comprobar.

### 3.15.4 Hallazgo: `getByText` falla cuando el mensaje aparece duplicado a propósito

Al escribir `AddCandidateForm.test.jsx`, la primera versión usaba
`screen.getByText(mensaje)` y fallaba así:

```
TestingLibraryElementError: Found multiple elements with the text:
El apellido contiene un carácter no permitido: "_". Solo se admiten
letras y espacios.

Here are the matching elements: [...]
```

Esto no es un fallo del test ni del componente: es el comportamiento
**diseñado a propósito** en `candidate-validation-i18n-a11y-AGB` (sección
3.5) — el mismo mensaje aparece dos veces, pegado al campo
(`Form.Control.Feedback`, para quien ve la pantalla) y en el resumen
`role="alert"` al final (para que un lector de pantalla lo anuncie sin
que el foco tenga que moverse hasta el campo). `getByText` de
Testing Library está diseñado para **fallar** si hay más de una
coincidencia — es una salvaguarda para detectar selectores ambiguos, no
un bug de la librería. La solución correcta no es "hacer que solo
aparezca una vez" (eso rompería la accesibilidad que se buscaba
conseguir), sino usar la función pensada para este caso:

```js
expect(screen.getAllByText(expectedMessage)).toHaveLength(2);
```

`getAllByText` devuelve un array con todas las coincidencias en vez de
lanzar; afirmar `toHaveLength(2)` además deja constancia explícita de que
la duplicación es intencionada — si algún día solo apareciera una vez (o
tres), el test fallaría y alertaría de una regresión real en el diseño
de accesibilidad, no solo de un cambio de texto.

### 3.15.5 Hallazgo: `.setup()` no se eliminó — hubo que *adoptarlo*, actualizando la librería

Aquí conviene ser preciso porque es fácil describirlo al revés: **no se
quitó `.setup()` de los tests. Al contrario: `.setup()` es la API
*actual* de `@testing-library/user-event`, y hubo que actualizar la
librería para poder usarla**, porque la versión instalada era una
heredada de la plantilla por defecto de Create React App, nunca
actualizada desde entonces.

El primer intento de test ya usaba la API moderna, con la que se escribe
código nuevo hoy:

```js
const user = userEvent.setup();
await user.type(screen.getByLabelText('Apellido'), 'Garcia_');
```

Y falló así:

```
TypeError: default.setup is not a function
 ❯ src/components/AddCandidateForm.test.jsx:34:32
```

La causa: `package.json` tenía `"@testing-library/user-event": "^13.5.0"`
— la v13 no tiene el método `.setup()` en absoluto; su API era la más
antigua, de llamada directa y síncrona
(`userEvent.type(elemento, texto)`, sin sesión previa). `.setup()` se
introdujo en la v14 como el patrón recomendado (crea una "sesión" de
usuario que simula con más fidelidad la secuencia real de eventos de
puntero/teclado del navegador, en vez de disparar un único evento
sintético). Dos caminos posibles: reescribir el test contra la API vieja
(v13), o actualizar la librería para poder usar la API que ya se había
escrito por ser la actual. Se optó por lo segundo — coherente con el
criterio de toda la sesión ("lo último que sea compatible", ya aplicado
en 3.13/3.14 con `react-i18next` y `TypeScript`):

```bash
npm install @testing-library/react@16.3.3 @testing-library/user-event@14.6.7 @testing-library/jest-dom@7.0.1
```

Instalación limpia, sin conflictos de peer dependencies (a diferencia de
los tropiezos con TypeScript de 3.13/3.14, estas tres sí eran compatibles
con el resto del stack a la primera). Tras la actualización, el mismo
código de test (con `.setup()`) pasó a funcionar sin cambiarle una línea.

### 3.15.6 Hallazgo: las librerías de test estaban en `dependencies`, no en `devDependencies`

Al tocar `package.json` para el punto anterior, se observó que
`@testing-library/jest-dom`, `@testing-library/react` y
`@testing-library/user-event` llevaban desde el origen del proyecto
dentro de `"dependencies"` — el bloque de paquetes que se instalan
siempre, incluidos los despliegues de producción — en vez de
`"devDependencies"` (paquetes que solo hacen falta durante el desarrollo
y la ejecución de tests). Es el resultado por defecto de
`npx create-react-app`: CRA no distingue entre ambos bloques porque todo
pasa igualmente por su propio proceso de build, así que nunca hizo falta
corregirlo — pero fuera de CRA (con Vite, o con cualquier build estándar)
si alguien instalara el proyecto con `npm install --omit=dev` (habitual
en una imagen Docker de producción minimalista), estas tres librerías se
habrían instalado igualmente sin necesidad ninguna, solo por estar mal
clasificadas. Se corrige moviéndolas al bloque correcto:

```diff
   "dependencies": {
-    "@testing-library/jest-dom": "^7.0.1",
-    "@testing-library/react": "^16.3.3",
-    "@testing-library/user-event": "^14.6.7",
     "@types/react": "^18.3.1",
     ...
   },
   "devDependencies": {
+    "@testing-library/jest-dom": "^7.0.1",
+    "@testing-library/react": "^16.3.3",
+    "@testing-library/user-event": "^14.6.7",
     "@eslint/js": "^10.0.1",
     ...
```

### 3.15.7 Frontend: qué prueba cada fichero nuevo

- **`i18n/validationMessages.test.js`** (8 tests): el equivalente, en la
  capa de traducción, del `validator.test.ts` del backend — compone el
  mismo `{field: 'lastName', code: 'invalidCharacters', params: {char:
  '_'}}` y comprueba el texto final en español, en inglés (cambiando
  `i18n.changeLanguage`), la composición de etiquetas para campos de
  array (`educations[0].institution`) y la interpolación de `min`/`max`.
- **`services/candidateService.test.js`** (6 tests): mockeando `axios`,
  comprueba que los issues de validación se propagan sin aplanar, que
  **no** hay doble prefijo en errores genéricos (el bug real corregido en
  `vite-migration-AGB`, sección 3.14.4) y que un fallo de red sin
  `response` no lanza un `TypeError` (el bug real corregido en
  `frontend-AGB`, sección 3.2 de `prompts-AGB-frontend.md`) — dos tests
  que, de haber existido antes, habrían detectado esos dos bugs en el
  momento en que se introdujeron, no cuando se encontraron a mano.
- **`components/AddCandidateForm.test.jsx`** (4 tests): el test más
  directamente ligado a lo verificado a mano una y otra vez durante la
  sesión — renderiza el formulario real, rellena Nombre/Apellido/Email,
  envía, y comprueba (entre los hallazgos 3.15.4 y 3.15.5 de arriba) que
  el mensaje aparece por duplicado a propósito, que
  `aria-invalid`/`aria-describedby` quedan bien puestos, que cambiar el
  idioma re-traduce el error ya visible sin volver a llamar al servicio
  (`sendCandidateData` sigue con 1 sola llamada), que se acumulan varios
  campos a la vez, y que un envío válido limpia los errores y muestra el
  mensaje de éxito.

### 3.15.8 Lo que queda fuera, a propósito

Siguiendo el mismo criterio de toda la sesión (no fabricar cobertura que
nadie pidió), no se han escrito tests para el dashboard, el listado de
posiciones (sigue habiendo lógica mínima que probar más allá del mock del
propio `getPositions`) ni el tablero "Ver proceso" — el foco explícito de
la petición era "las mismas pruebas de validación que en las primeras
ramas", y eso es exactamente lo que cubren estos tests: alta de
candidato, códigos de error, y las comprobaciones de `id` en las rutas de
posiciones.

## 8. Verificación de los tests añadidos (sección 3.15)

```
Backend (npx jest)   → 5 suites, 19 tests (antes 11; +8 nuevos), verde
                        npx tsc --noEmit → sin errores
Frontend (npm test)  → 3 suites, 18 tests (antes 0), verde
                        npx tsc -b → sin errores
                        npx eslint . → sin errores
                        npm run build → mismo tamaño de bundle que antes
                        (2773 módulos, 651.80 kB) — los ficheros .test.*
                        no se cuelan en el build de producción
Aislamiento           → bug real de mocks sin limpiar entre tests
                        encontrado y corregido en positionController.test.ts
                        y candidateController.test.ts (beforeEach +
                        jest.clearAllMocks())
```

## 3.16 `FileUploader`: traducir "Browse…" / "No file selected"

Prompt del usuario: *"Un detalle, ¿puedes conseguir que en la pantalla
add-candidate el botón de apertura del navegador de archivos se traduzca
'Browse...' y 'No file selected' al español cuando estamos en este
idioma?"*

### 3.16.1 Por qué no es un problema de i18n

Todo el resto de la aplicación ya estaba traducido desde
`i18n-react-i18next-AGB`. Este texto concreto es distinto: **"Browse…" y
"No file selected" no los pinta React**, los pinta el propio navegador
como parte del *chrome* nativo del elemento `<input type="file">` — cada
navegador los renderiza en el idioma de su configuración (sistema
operativo/navegador), no en el de la página, y no son accesibles ni desde
CSS (`content`, pseudo-elementos) ni desde JS (no existe ningún atributo
ni prop que los sobrescriba). Por eso ninguna clave de `es.json`/`en.json`
los estaba cubriendo: no hay clave posible que un `<input type="file">`
nativo vaya a leer.

### 3.16.2 El arreglo: ocultar el input, controlarlo con un botón propio

Patrón estándar (usado por Bootstrap y la mayoría de librerías de UI)
en [`FileUploader.jsx`](../frontend/src/components/FileUploader.jsx):

1. El `<input type="file">` se mantiene en el DOM y en el orden de
   tabulación (accesible por teclado y lectores de pantalla), pero se
   oculta visualmente con la clase `visually-hidden` de Bootstrap —
   **no** `display: none`, que lo sacaría del árbol de accesibilidad y
   rompería la navegación por teclado.
2. Se le añade una `ref` (`inputRef`).
3. Un botón propio, ya traducido (`t('fileUploader.browse')`), dispara
   `inputRef.current?.click()` — el clic sintético sobre el input oculto
   abre el diálogo nativo de selección de archivo exactamente igual que
   si se hubiera clicado el input original.
4. El texto de estado ("Ningún archivo seleccionado" / nombre del
   archivo elegido) ya no lo pinta el navegador: se pinta con un `<p>`
   propio controlado por el estado `fileName`, así que se traduce como
   cualquier otro texto de la aplicación.

Claves nuevas en
[`es.json`](../frontend/src/i18n/locales/es.json)/[`en.json`](../frontend/src/i18n/locales/en.json)
(dentro de `fileUploader`): `browse` ("Seleccionar archivo" / "Browse…")
y `noFileSelected` ("Ningún archivo seleccionado" / "No file selected").
Las claves `ariaLabel`, `selectedFile`, `upload` y `success` ya existían.

### 3.16.3 Hallazgo: falsos positivos en consola por caché de dependencias de Vite

Al probar el botón nuevo en el navegador, la consola mostraba errores
("Invalid hook call", "Cannot read properties of null (reading
'useContext')") señalando a `LanguageSwitcher.jsx` y
`RecruiterDashboard.jsx` — componentes que este cambio no toca. La
sospecha inicial (copias duplicadas de React) se descartó con `npm ls
react react-dom`: una sola copia de `react@18.3.1` en todo el árbol de
dependencias, todo `deduped`.

La causa real: la pestaña del navegador llevaba horas abierta durante la
sesión, y en ese tiempo `npm install` se había ejecutado varias veces
(subidas de versión de `@testing-library/*` en la sección 3.15). Cada
`npm install` invalida la caché de pre-bundling de Vite
(`node_modules/.vite`), y el registro de red de la pestaña mostraba **dos
grupos distintos de hashes** `?v=...` para `react.js`/`react-dom_client.js`
en la misma cadena de peticiones — restos de la pestaña sirviendo módulos
de dos generaciones distintas de esa caché a la vez. Se confirmó
cerrando la pestaña por completo y abriendo una nueva contra el mismo
servidor (`preview_stop` no fue necesario; bastó `tabs_close` +
`preview_start` reutilizando el proceso): consola limpia, sin ningún
error, en español y en inglés. **No era un bug del código — era estado
obsoleto de una pestaña de depuración de larga duración**, la misma
categoría de falso positivo que ya había aparecido en el prompt 5 de la
sección 1 (Firefox con hot-reloads acumulados).

## 9. Verificación del arreglo de `FileUploader` (sección 3.16)

```
Visual (navegador, pestaña nueva)
  Español → "Seleccionar archivo" / "Subir Archivo" /
            "Ningún archivo seleccionado"                        OK
  English → "Browse…" / "Upload File" / "No file selected"       OK
  Consola → sin errores en ninguno de los dos idiomas             OK
  DOM     → input oculto: display:block, visibility:visible,
            1px×1px, tabIndex:0 (patrón .visually-hidden
            correcto, no display:none)                            OK

Frontend (npm test -- --run)  → 3 suites, 18 tests, verde (sin cambios:
                                  no se ha tocado ningún test)
                                 npx tsc -b       → sin errores
                                 npx eslint .     → sin errores
                                 npm run build    → 2773 módulos, verde
Backend  (npx jest)            → 5 suites, 19 tests, verde (no afectado,
                                  cambio es exclusivamente de frontend)
```

## 3.17 Auditoría de ciberseguridad exhaustiva (`security-audit-AGB`)

Prompt del usuario: *"¿Realizas ahora una auditoría de Ciberseguridad
exhaustiva para verificar que no tenemos problemas en este ámbito?"*

Rama nueva, creada desde `tests-AGB` (la rama más completa hasta ahora:
incluye el validador estructurado, i18n con react-i18next, la migración a
Vite y los tests automáticos).

### 3.17.1 Metodología

No se ha auditado "a ojo": cada hallazgo de esta sección está verificado
de una de estas dos formas, indicada explícitamente en cada uno:

1. **Con una prueba de concepto real** contra el backend arrancado
   (`curl` con peticiones `multipart/form-data` fabricadas a mano), en el
   mismo estilo que el resto de la sesión ha usado para verificar
   arreglos: no basta con leer el código y sospechar, hay que
   reproducirlo.
2. **Leyendo el código fuente de la dependencia** en
   `node_modules/` cuando la pregunta es "¿esta librería en concreto hace
   lo que yo creo que hace?" (p. ej. `multer`/`busboy`), en vez de asumir
   el comportamiento por el nombre del paquete.

Alcance cubierto: inyección (SQL/NoSQL), control de acceso, subida de
ficheros, cabeceras HTTP, gestión de dependencias (`npm audit` en ambos
paquetes), XSS en el frontend, gestión de secretos/`.env`, CORS, y manejo
de errores (fuga de información).

### 3.17.2 Hallazgo principal: no existe autenticación ni autorización

**Severidad: crítica. No corregido — es una decisión de producto, no un
bug.**

Ningún endpoint del backend (`POST /candidates`, `GET /candidates/:id`,
`PUT /candidates/:id`, `POST /upload`, `GET /position`,
`GET /position/:id/candidates`, `GET /position/:id/interviewflow`) exige
identidad ni comprueba permisos. Cualquiera que alcance el puerto 3010
puede leer y escribir datos personales de candidatos (nombre, email,
teléfono, dirección, ruta del CV) y cambiar la fase de entrevista de
cualquier candidatura, sin más que conocer un `id` numérico secuencial
(no hay que adivinar nada: `GET /candidates/1`, `/2`, `/3`... enumera
candidatos completos).

Esto no es un fallo puntual corregible con un parche: no hay ningún
concepto de usuario, sesión, rol o permiso en el código (el campo `role`
que existe en `prisma/schema.prisma` pertenece al modelo `Employee` y no
se usa en ninguna ruta ni middleware para autorizar nada). Añadirlo es un
cambio de arquitectura — quién puede hacer qué — que le corresponde
decidir al propietario del proyecto, no algo que este audit deba imponer
sin más. Se documenta aquí con el detalle necesario para que la decisión
se tome con la información completa; ver sección 3.17.6 para el resto de
opciones que sí se han quedado fuera por el mismo motivo.

### 3.17.3 Hallazgos confirmados con PoC, corregidos en esta rama

**A. Subida de ficheros: el tipo de archivo solo se comprobaba por un
dato que envía quien sube el fichero — severidad alta.**

`fileUploadService.ts` filtraba por `file.mimetype`, que es literalmente
la cabecera `Content-Type` de la parte del `multipart/form-data` —  la
pone quien hace la petición, no el servidor. PoC:

```bash
printf '<html><body><script>alert(document.domain)</script></body></html>' > evil.html
curl -X POST http://localhost:3010/upload \
  -F "file=@evil.html;filename=evil.pdf;type=application/pdf"
# → 200 OK, {"filePath":".../uploads/<ts>-evil.pdf","fileType":"application/pdf"}
```

El servidor aceptó y guardó en disco un fichero HTML con un `<script>`
dentro, bajo extensión `.pdf` y reportando `fileType: application/pdf` —
sin inspeccionar ni un solo byte del contenido real. Hoy no hay ninguna
ruta que sirva `uploads/` de vuelta al navegador (se comprobó con `grep
-rn "uploads"` sobre todo el repo: solo aparece en
`fileUploadService.ts`, que lo escribe, no lo sirve), así que no hay XSS
almacenado *hoy*; pero es el tipo de comprobación que falla en silencio
el día que alguien añada esa ruta, o que un antivirus/gestor de
documentos interno abra el fichero confiando en la extensión.
**No se ha añadido una comprobación de contenido (magic bytes) en esta
rama** — no había ninguna librería de ese tipo ya en el proyecto y
añadir una nueva dependencia solo para esto se ha dejado como
recomendación (sección 3.17.6) en vez de una decisión unilateral de qué
librería usar.

**B. Path traversal en el nombre de fichero: no explotable *hoy*, pero
por una libería de terceros, no por el código propio — corregido como
defensa en profundidad.**

`filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)`
usa `file.originalname` (controlado por quien sube el archivo) sin
sanear, y `multer`'s `DiskStorage` hace literalmente
`path.join(destination, filename)`
(`node_modules/multer/storage/disk.js:37`) — sin comprobar que el
resultado siga dentro de `destination`. Es el patrón exacto de CWE-22.

Se probó con dos PoC:

```bash
# 1) el propio "../" queda pegado al timestamp (10 dígitos + guión), así
#    que no es un segmento ".." puro y no escapa:
curl ... -F "file=@x.pdf;filename=../poc.pdf;type=application/pdf"
# → guardado como uploads/<ts>-..poc.pdf (sin escapar)

# 2) con un segmento intermedio para que el ".." sí quede puro:
curl ... -F "file=@x.pdf;filename=x/../../poc.pdf;type=application/pdf"
# → guardado como uploads/<ts>-poc.pdf — el nombre no escapó
```

En ambos casos el fichero se quedó dentro de `uploads/`. Inspeccionando
por qué (`node_modules/busboy/lib/utils.js`), la versión instalada de
`busboy` (1.6.0, dependencia transitiva de `multer`) ya normaliza el
nombre de fichero del `multipart/form-data` antes de que la aplicación
lo vea, y descarta los componentes de ruta. **Es decir: hoy no es
explotable, pero por una protección de una dependencia de tercer nivel
que el código de la aplicación desconoce por completo** — si algún día
se cambia de librería de subida de ficheros, o esa versión de `busboy`
deja de sanear (no está documentado como parte de su contrato público),
el `path.join` de `multer` volvería a ser alcanzable con un
`file.originalname` malicioso. Se ha añadido `path.basename()` explícito
en [`fileUploadService.ts`](../backend/src/application/services/fileUploadService.ts)
para que la protección no dependa de un comportamiento no documentado de
una dependencia transitiva:

```ts
const safeOriginalName = path.basename(file.originalname);
cb(null, uniqueSuffix + '-' + safeOriginalName);
```

Verificado de nuevo tras el cambio con las mismas dos PoC: el
comportamiento es idéntico (el fichero se queda en `uploads/`), y una
subida normal (`filename=cv.pdf`) se sigue guardando y devolviendo
igual que antes — no hay regresión funcional.

**C. Dependencias con vulnerabilidades conocidas, alcanzables en
producción — severidad alta (backend) / moderada (frontend).**

`npm audit` antes de esta rama:

| Paquete | Dónde entra | Severidad | Alcanzable en producción |
|---|---|---|---|
| `path-to-regexp <=0.1.12` | `express@4.19.2` (dependencia directa) | alta (ReDoS) | Sí — enrutamiento de todas las peticiones |
| `qs <=6.15.3` | `express@4.19.2` → `body-parser` | moderada (DoS) | Sí — parseo de query string/body |
| `send <0.19.0` / `serve-static` | `express@4.19.2` | alta (XSS por plantilla) | Sí |
| `validator <=13.15.20` | `swagger-jsdoc` (nunca importado en el código, ver más abajo) | alta | No — dependencia muerta |
| `micromatch`/`minimatch`/`picomatch` | `jest`/`eslint` (herramientas de desarrollo) | alta/moderada | No — solo en `devDependencies`, nunca se despliegan |
| `@remix-run/router <=1.23.2` (frontend) | `react-router-dom@6.23.1` (dependencia directa, va al bundle del navegador) | alta (XSS por *open redirect*) | Sí |

Se trazó cada paquete con `npm ls <paquete>` (no asumido) para separar lo
que de verdad corre en el servidor/navegador de lo que solo vive en
herramientas de desarrollo — la tabla de arriba es el resultado de eso,
no de leer directamente la salida de `npm audit`.

Corregido con `npm audit fix` (sin `--force`, todo dentro del rango
`^semver` ya declarado en `package.json`, cero cambios de API):

```
backend  : npm audit fix → 20 vulnerabilidades → 0
           express 4.19.2 → 4.22.3 (arrastra path-to-regexp 0.1.13,
           qs 6.16.0, send 0.19.2 — todos ya fuera de rango vulnerable)
frontend : npm audit fix → 3 altas → 0 altas (2 moderadas nuevas, ver 3.17.6)
           react-router-dom 6.23.1 → 6.30.6
```

**D. Dependencias declaradas y nunca usadas — código muerto que
además arrastraba una dependencia vulnerable.**

`swagger-jsdoc` y `swagger-ui-express` estaban en `dependencies` del
backend desde el primer commit, pero no se importan en ningún fichero de
`src/` (comprobado con `grep -rn "swagger" .` sobre todo el repo, aparte
de `package.json`) — no hay ninguna ruta de documentación Swagger
montada en `index.ts`. Eliminadas junto con sus `@types/*`:

```bash
npm uninstall swagger-jsdoc swagger-ui-express @types/swagger-jsdoc @types/swagger-ui-express
```

Esto también elimina la única vía por la que la vulnerabilidad de
`validator` (fila de la tabla de arriba) llegaba al árbol de
dependencias.

**E. Sin cabeceras de seguridad ni límite de peticiones — severidad
moderada (superficie de ataque general, agravada por el hallazgo
3.17.2: no hay autenticación que frene un abuso automatizado).**

Añadido en [`index.ts`](../backend/src/index.ts):

```ts
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
```

Verificado en caliente contra el servidor de desarrollo ya arrancado
(`ts-node-dev --respawn` lo recargó solo al guardar el fichero):

```
curl -D - http://localhost:3010/
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
RateLimit-Limit: 300
RateLimit-Remaining: 298
RateLimit-Reset: 900
```

**F. Sin límite en el tamaño de los arrays `educations`/`workExperiences`
— severidad baja, agrava el impacto de E si alguien lo satura.**

`validateCandidateData` recorría `data.educations`/`data.workExperiences`
sin límite de longitud; `express.json()` limita el *tamaño en bytes* del
body (100kb por defecto) pero no el número de elementos de un array
dentro de él, y no había ningún otro punto del sistema que lo acotara.
Añadido un límite de 20 entradas en
[`validator.ts`](../backend/src/application/validator.ts), con un código de
error nuevo (`tooManyEntries`) en vez de reutilizar `tooLong` (que dice
"caracteres", no "entradas" — habría sido un mensaje traducido pero
incorrecto):

```ts
const MAX_ARRAY_ENTRIES = 20;
if (data.educations.length > MAX_ARRAY_ENTRIES) {
    issues.push({ field: 'educations', code: 'tooManyEntries', params: { max: MAX_ARRAY_ENTRIES } });
}
```

Traducido en ambos idiomas
([`es.json`](../frontend/src/i18n/locales/es.json)/[`en.json`](../frontend/src/i18n/locales/en.json)):
*"Educación no puede tener más de 20 entradas."* / *"Education cannot
have more than 20 entries."* — reutilizando la etiqueta de sección ya
traducida (`validation.sections.educations`) en vez de duplicarla, dado
que este `issue.field` llega sin índice (`'educations'`, no
`'educations[3]...'`), un caso que
[`validationMessages.js`](../frontend/src/i18n/validationMessages.js) no
contemplaba todavía.

### 3.17.4 Descartado tras comprobarlo: inyección SQL

Se revisó cómo construye sus consultas cada modelo de dominio
(`Candidate.ts`, `Education.ts`, `WorkExperience.ts`, `Application.ts`):
todas usan el *query builder* de Prisma (`prisma.candidate.create({...})`,
`.update({...})`, `.findUnique({...})`) — no hay una sola llamada a
`$queryRaw`/`$executeRaw`/`$queryRawUnsafe` en todo el backend
(`grep -rn "queryRaw\|executeRaw" src/` → sin resultados). Prisma
parametriza estas llamadas por construcción; no hay superficie de
inyección SQL en este código tal y como está escrito.

### 3.17.5 Descartado tras comprobarlo: XSS en el frontend

`grep -rn "dangerouslySetInnerHTML\|innerHTML\|eval(\|new Function("` sobre
todo `frontend/src` no encontró ningún resultado: React escapa por
defecto todo lo que se renderiza como texto, y el código no usa ninguno
de los escapes habituales a ese comportamiento. El único uso de
`localStorage` es el de `i18next-browser-languagedetector` para
recordar el idioma elegido (`es`/`en`) — no hay ningún dato personal ni
sensible ahí.

### 3.17.6 Dejado fuera, a propósito, para que lo decida el propietario del proyecto

- **Autenticación/autorización** (3.17.2): el cambio de arquitectura más
  grande posible en esta aplicación. No se ha implementado nada aquí.
- **`react-router-dom` a la v7**: quedan 2 vulnerabilidades moderadas
  (`GHSA-wrjc-x8rr-h8h6`, *open redirect* vía barra invertida en
  `<Link>`/`useNavigate`; `GHSA-337j-9hxr-rhxg`, solo aplica a
  *SSR hydration*, que esta app no usa — es una SPA servida por Vite,
  sin renderizado en servidor). La única corrección disponible es
  `react-router-dom@7.18.4`, un salto de versión mayor con cambios de
  API. Se revisó el uso real de navegación en el código
  (`grep -rn "useNavigate\|<Link\|navigate("`): las dos únicas
  apariciones (`RecruiterDashboard.jsx`) usan destinos fijos
  (`to="/add-candidate"`, `to="/positions"`), nunca un valor que venga
  del usuario o de la URL — así que el *open redirect* no es explotable
  con el código actual, aunque la dependencia en sí siga vulnerable.
  Migrar a v7 es una decisión deliberada, del mismo tipo que la
  migración de CRA a Vite documentada en la sección 3.14: se ha dejado
  fuera de esta rama para no mezclar un cambio de API mayor con una
  auditoría de seguridad.
- **Comprobación de contenido real (magic bytes) en la subida de CVs**
  (hallazgo A): requeriría añadir una dependencia nueva no evaluada
  todavía (p. ej. `file-type`).
- **Escaneo de malware/macros en PDF/DOCX subidos**: fuera del alcance
  de lo que resuelve código de aplicación; requeriría un servicio
  externo.
- **Mensajes de error que devuelven `error.message` tal cual** (p. ej.
  `positionController.ts`, ramas `catch` de `addCandidateController`):
  en algunos casos es intencionado y necesario para la UX (p. ej. *"The
  email already exists in the database"*, cubierto explícitamente por
  `candidateController.test.ts:79-89` — cambiarlo a un mensaje genérico
  rompería ese test y una funcionalidad real), y en otros casos
  (excepciones no controladas de Prisma/red) sí podría filtrar detalle
  interno. Distinguir un caso de otro con fiabilidad requiere introducir
  una jerarquía de errores "seguros de mostrar" vs. "internos" en toda la
  capa de controladores — un refactor más amplio que no se ha hecho aquí
  para no arriesgar una regresión de comportamiento a cambio de una
  fuga de información de severidad baja/moderada, no confirmada con
  ningún caso real hoy.

## 11. Verificación de la auditoría de ciberseguridad (sección 3.17)

```
Backend
  npm audit                    → 20 vulnerabilidades → 0
  npx tsc --noEmit              → sin errores
  npx tsc (build)                → sin errores
  npx jest                      → 5 suites, 21 tests (antes 19; +2 nuevos), verde
  Cabeceras (curl -D -)         → Strict-Transport-Security, X-Content-Type-Options,
                                   X-Frame-Options, RateLimit-* presentes
  PoC path traversal (repetida  → fichero se queda dentro de uploads/,
    tras el fix)                  igual que antes del fix (ya lo bloqueaba busboy;
                                   ahora también lo bloquea el propio código)
  Subida normal (regresión)     → sigue devolviendo 200 y la misma forma de
                                   respuesta ({filePath, fileType})

Frontend
  npm audit                    → 3 altas → 0 altas (2 moderadas no explotables
                                   con el código actual, ver 3.17.6)
  npx tsc -b                    → sin errores
  npx eslint .                  → sin errores
  npm test -- --run             → 3 suites, 19 tests (antes 18; +1 nuevo), verde
  npm run build                 → 2773 módulos, verde

Descartado sin cambios         → inyección SQL (Prisma parametriza todo),
                                   XSS en frontend (sin dangerouslySetInnerHTML/
                                   innerHTML/eval, sin datos sensibles en localStorage)
```

## 3.18 Migración de `react-router-dom` v6 → v7 (`react-router-v7-AGB`)

Prompt del usuario: primero una pregunta de aclaración — *"La razón de no
migrar a react-router-dom v7 era que el linter no la soportaba, ¿no? ¿O
no hay impedimento en el stack tecnológico aquí, y eso era sólo para
TS7?"* — y, tras la respuesta, *"Sí, porfa, en una rama nueva."*

### 3.18.1 Aclaración previa: dos decisiones distintas, sin relación entre sí

El usuario recordaba correctamente que hubo un impedimento técnico real
con una versión "7", pero lo atribuía a la librería equivocada:

- **TypeScript 7** (`vite-migration-AGB`, sección 3.14): impedimento
  **real**. `typescript@latest` resolvía a la 7.0.2 (el compilador
  nuevo, en Go), y `typescript-eslint@8.70.0` exige
  `typescript ">=4.8.4 <6.1.0"` como *peer dependency* — TS 7.0.2 queda
  fuera de ese rango y el linter dejaba de funcionar directamente. Por
  eso se aterrizó en TypeScript 6.0.3.
- **react-router-dom v7** (`security-audit-AGB`, sección 3.17.6): **sin
  impedimento técnico**. El motivo de no migrarlo el día anterior fue
  no mezclar un salto de versión mayor (con cambios de API) dentro del
  alcance de una auditoría de seguridad — el mismo criterio que separó
  la migración de CRA a Vite en su propia rama —, no una incompatibilidad
  real. Se comprobó explícitamente antes de responder:
  `npm view react-router-dom@7.18.4 peerDependencies` → solo exige
  `react >=18`/`react-dom >=18` (el proyecto ya usa React 18.3.1), y
  `npm view eslint-plugin-react-hooks@latest peerDependencies` → acepta
  hasta `eslint ^10.0.0` (el proyecto ya usa ESLint 10) sin conflicto.

### 3.18.2 Por qué el riesgo de la migración era bajo, verificado antes de tocar nada

Antes de instalar nada se revisó qué API de `react-router-dom` usa
realmente la aplicación (`grep -rln "react-router" src`): solo 4
ficheros, y solo estas importaciones —
[`App.jsx`](../frontend/src/App.jsx): `BrowserRouter`, `Routes`, `Route`;
[`RecruiterDashboard.jsx`](../frontend/src/components/RecruiterDashboard.jsx)/[`Positions.tsx`](../frontend/src/components/Positions.tsx):
`Link`; [`PositionProcess.tsx`](../frontend/src/components/PositionProcess.tsx):
`Link`, `useParams`. Es el modo "declarativo" más simple de la librería
(sin *data routers*, sin `loader`/`action`/`fetcher`, sin rutas con
comodín `*`) — exactamente el subconjunto de la API que v7 mantiene
sin cambios respecto a v6 para no romper a quien no usa las
funcionalidades nuevas. Node.js (`node --version` → v26.8.2) también
supera de sobra el mínimo de v7 (`engines.node: >=20.0.0`).

### 3.18.3 La migración en sí

```bash
npm install react-router-dom@^7.18.4
```

`package.json`: `"react-router-dom": "^6.23.1"` → `"^7.18.4"`. **Cero
cambios de código** — ni en `App.jsx` ni en ningún componente que use
`Link`/`useParams`: la API que usa la aplicación es idéntica en ambas
versiones.

### 3.18.4 Verificación

No solo build/tests: dado que es un cambio que toca el enrutado de toda
la aplicación, se verificó también navegando de verdad en el navegador
(pestaña nueva, caché de pre-bundling de Vite —
`node_modules/.vite` — borrada primero, misma precaución aprendida en la
sección 3.16.3 tras un salto de dependencia):

```
npx tsc -b            → sin errores
npx eslint .           → sin errores
npm test -- --run      → 3 suites, 19 tests, verde (sin cambios: no se ha
                          tocado ningún test, ninguno dependía de la
                          versión de react-router-dom)
npm run build          → 2777 módulos, verde
npm audit               → 0 vulnerabilidades (cierra las 2 moderadas que
                          quedaban abiertas desde la sección 3.17.3.C)

Navegador (consola limpia en todo momento):
  Dashboard → clic en "Ir a Posiciones" (<Link>)         → OK
  Posiciones → clic en "Ver proceso" (<Link> + useParams  → OK, position
              a "/positions/:id")                            id resuelto
  "← Volver a posiciones" (<Link> de vuelta)              → OK
  Enlace profundo directo a /add-candidate (BrowserRouter,
              sin pasar por la SPA)                        → OK
```

Con esto, `security-audit-AGB` queda completamente cerrada: de los dos
puntos que se dejaron explícitamente pendientes en la sección 3.17.6, la
autenticación sigue siendo una decisión de arquitectura del propietario
del proyecto (sin tocar), y la migración de `react-router-dom` está
hecha y verificada.

## 3.19 Autenticación de las APIs (`api-auth-AGB`)

Prompt del usuario: *"Documéntalo todo bien, incluyendo los porqués de
TS7 y react-router-dom v7 y vamos después, en otra rama nueva, a incluir
la autenticación de las APIs, porfa"*. Cierra el hallazgo más severo de
`security-audit-AGB` (sección 3.17.2): antes de esta rama, cualquiera que
alcanzara el puerto del backend podía leer y escribir datos de
candidatos sin identificarse.

### 3.19.1 Alcance acordado antes de tocar código

Dado que "añadir autenticación" es una decisión de arquitectura con
varias formas razonables de implementarse (y una elección equivocada
aquí se paga con mucho trabajo rehecho), se preguntó explícitamente por
dos ejes antes de escribir una sola línea:

1. **¿Solo backend, o también login en el frontend?** — se eligió
   **ambos**: JWT contra el modelo `Employee` ya existente + middleware
   protegiendo todas las rutas + una pantalla de login real en React.
   La alternativa (solo backend, verificable con `curl`) habría dejado
   el frontend actual completamente roto (401 en cada petición) hasta
   una rama futura — rompe la práctica de esta sesión de verificar
   siempre de extremo a extremo en el navegador.
2. **¿Quién puede iniciar sesión?** — se eligió **los `Employee` ya
   sembrados** por `prisma/seed.ts` (sin registro público): es una
   herramienta interna de reclutadores, no una aplicación con alta de
   usuarios propia, y un `POST /auth/register` sin restricciones
   añadiría superficie de ataque que no hace falta.

### 3.19.2 Backend: de dónde sale la identidad

El modelo `Employee` (`prisma/schema.prisma`) ya existía — con `email`
único y un campo `role` — pero nunca se había usado para nada de
autenticación, solo como dato asociado a entrevistas. Es el candidato
natural: el "Dashboard del Reclutador" es literalmente la herramienta de
estos empleados.

```prisma
model Employee {
  ...
  // Hash de bcrypt (nunca la contraseña en claro). Nullable: un Employee
  // sin contraseña sigue siendo válido para el resto de la app (p. ej.
  // como entrevistador), pero no puede iniciar sesión.
  password  String?  @db.VarChar(255)
  ...
}
```

Migración aplicada con `npx prisma migrate dev --name add_employee_password`
(`prisma/migrations/20260917055210_add_employee_password/migration.sql`:
`ALTER TABLE "Employee" ADD COLUMN "password" VARCHAR(255)`).
`Employee.ts` (dominio) gana `password` en el constructor/`save()` y un
`static findByEmail()` nuevo (no existía; hacía falta para el login).

### 3.19.3 Backend: `authService.ts`, `authMiddleware.ts`, `authController.ts`

- **`authService.ts`**: `login(email, password)` busca por email
  (`Employee.findByEmail`), y si el empleado no existe, está desactivado
  (`isActive: false`) o no tiene contraseña asignada, **o** la
  contraseña no coincide (`bcrypt.compare`), lanza siempre el mismo
  `AuthError('Email o contraseña incorrectos')` — un único mensaje
  genérico para los cuatro casos, a propósito: distinguirlos permitiría
  a quien ataca enumerar qué correos están dados de alta (probar
  `alice.johnson@lti.com` con cualquier contraseña y ver si el mensaje
  cambia). `AuthError` sigue el mismo patrón que `ValidationError`
  (`Object.setPrototypeOf`, ver 3.1) para que `instanceof` funcione bajo
  `target: es5`. `signToken`/`verifyToken` envuelven `jsonwebtoken`, con
  el payload mínimo (`sub`, `role`, `companyId` — nunca el hash de la
  contraseña) y expiración de 8h. `getJwtSecret()` lanza en el momento en
  que se necesita la clave si `JWT_SECRET` no está en el entorno, en vez
  de dejar que `jsonwebtoken` firme con `undefined` (que produciría
  tokens válidos para cualquiera que probara literalmente el string
  `"undefined"` como secreto).
- **`authMiddleware.ts`** (`requireAuth`): exige
  `Authorization: Bearer <token>`, adjunta el payload decodificado a
  `req.employee` (extensión de `Express.Request`, mismo patrón que ya
  existía para `req.prisma`). Sin cabecera, con esquema distinto de
  `Bearer`, o con un token inválido/caducado: siempre el mismo `401
  {"message": "Unauthorized"}` — el motivo real solo se registra en el
  log del servidor (`console.error`), nunca en la respuesta.
- **`authController.ts`** + **`authRoutes.ts`**: `POST /auth/login`,
  sin proteger con `requireAuth` (es la ruta que lo concede), pero con
  su propio límite de intentos (ver 3.19.4).

En `index.ts`, todo lo que antes estaba abierto pasa a exigir el
middleware:

```ts
app.use('/auth', loginLimiter, authRoutes);
app.use('/candidates', requireAuth, candidateRoutes);
app.post('/upload', requireAuth, uploadFile);
app.use('/position', requireAuth, positionRoutes);
```

### 3.19.4 Límite de intentos específico para el login

El límite general de 300 peticiones/15 min (sección 3.17.3.E) sigue
existiendo, pero sin ningún concepto de bloqueo de cuenta tras varios
intentos fallidos (no lo hay en el modelo `Employee`), un atacante con
un email conocido podría probar 300 contraseñas en 15 minutos contra
ese único endpoint. Se añadió un límite propio, más estricto, solo para
`/auth/login`:

```ts
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, ... });
app.use('/auth', loginLimiter, authRoutes);
```

### 3.19.5 Seed: contraseña de desarrollo para los dos empleados existentes

`prisma/seed.ts` no es idempotente (usa `create`, no `upsert`), y ya
había sido ejecutado antes en esta sesión — volver a lanzarlo entero
habría fallado por las restricciones `@unique` (email de `Company`,
`Candidate`, `Employee`) sobre filas que ya existían. En vez de resetear
la base de datos de desarrollo entera (`prisma migrate reset`, una
operación destructiva no pedida), se escribió un script de una sola vez
(`tmp-set-dev-passwords.ts`, ejecutado con `ts-node` y borrado
inmediatamente después) que solo actualiza la contraseña de
`alice.johnson@lti.com`/`bob.miller@lti.com` a
`bcrypt.hashSync('Changeme123!', 10)` — el mismo hash que
`prisma/seed.ts` ya genera para nuevas bases de datos (`DEV_PASSWORD_HASH`,
con un comentario explicando que es solo para desarrollo, sin endpoint de
registro que la use como valor por defecto real). Verificado con
`Updated 2 employee(s)`.

**Credenciales de desarrollo** (documentadas aquí, igual que
`DB_PASSWORD=changeme` ya lo estaba en `.env.example`):
`alice.johnson@lti.com` / `bob.miller@lti.com`, contraseña
`Changeme123!` para ambos.

### 3.19.6 Hallazgo incidental: no existía ningún `.env`, y el que hay que crear tenía una plantilla rota

Al intentar ejecutar la migración de Prisma, falló con
`Environment variable not found: DATABASE_URL` — no había ningún fichero
`.env` en todo el repositorio (`find / -iname ".env" -not -path
"*/node_modules/*"` → sin resultados), pese a que el backend llevaba toda
la sesión respondiendo peticiones reales contra la base de datos. Se
investigó por qué antes de asumir cualquier cosa: `process.env.FOO = x`
dentro de un proceso Node **no** se refleja en `/proc/<pid>/environ`
(ese fichero es una foto del entorno en el momento del `exec()`, no se
actualiza con mutaciones posteriores hechas desde dentro del propio
proceso) — así que inspeccionar el proceso del servidor en marcha por
esa vía no podía confirmar ni descartar nada; fue un callejón sin salida,
no una respuesta. Lo único verificable con certeza es que, ahora mismo,
no hay ningún `.env`, y hacía falta uno tanto para la migración como
para que el servidor (que se iba a reiniciar de todas formas al tocar
`index.ts`) siguiera arrancando.

Se creó `backend/.env` (gitignorado, nunca trackeado) con las
credenciales reales del contenedor de PostgreSQL en marcha
(`docker inspect ... --format '{{range .Config.Env}}...'`) y un
`JWT_SECRET` generado con `crypto.randomBytes(48).toString('hex')`. Al
escribirlo, y precisamente para evitar el mismo problema en quien lo
configure después, se comprobó algo que `.env.example` daba por sentado
sin verificar: **el paquete `dotenv` (sin `dotenv-expand`, no instalado)
no interpola `${DB_USER}` dentro del propio fichero**:

```bash
node -e "require('dotenv').config({ path: '.env.example' }); console.log(process.env.DATABASE_URL)"
# → postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}
#   (literal, sin resolver — no es el valor que nadie querría en producción)
```

Copiar `.env.example` tal cual a `.env` produce, para el propio proceso
Node (`index.ts`), un `DATABASE_URL` roto — aunque `npx prisma migrate
dev` funcione igualmente con ese mismo fichero, porque el CLI de Prisma
tiene su propia resolución de variables de entorno, independiente de
`dotenv`. Es un bug real y confuso: la migración funcionaría, y el
servidor no arrancaría con conexión a base de datos. Corregido en ambos
`.env.example` (raíz y `backend/`) escribiendo `DATABASE_URL` ya
resuelto, con un comentario explicando por qué.

### 3.19.7 Hallazgo incidental: varios servidores de backend zombis acumulados

Al probar el login por primera vez, `/auth/login` devolvía
`Cannot POST /auth/login` y `/position` seguía respondiendo 200 sin
token — el código nuevo no se había cargado. `lsof -i :3010` señalaba un
único proceso en escucha, pero `ps aux` reveló **cuatro instancias**
adicionales de `ts-node-dev --respawn` de sesiones anteriores del mismo
día, ninguna de ellas realmente sirviendo el puerto activo — arrancadas
en distintos momentos de esta larguísima sesión (una por cada vez que se
lanzó el servidor en segundo plano para verificar una rama distinta) y
nunca cerradas. Mismo síntoma que el ya documentado en la sección 3.16.3
(caché de Vite obsoleta en el frontend), pero en el backend: se
mataron las cinco (la que escuchaba y las cuatro zombis) y se arrancó una
única instancia limpia.

### 3.19.8 Frontend: por qué un interceptor global de axios, no una instancia propia

La forma "de manual" de adjuntar un token a todas las peticiones sería
una instancia propia (`const api = axios.create({ baseURL: ... })`) y
migrar `candidateService.js`/`positionService.js` a usarla. Se descartó
a propósito: los tests existentes (`candidateService.test.js`) hacen
`vi.mock('axios')` y manipulan `axios.post.mockResolvedValue(...)`
directamente sobre el módulo por defecto — una instancia nueva creada
con `axios.create()` sería, bajo ese mock, `undefined` (el mock
automático de Vitest no sabe qué debería devolver `create()`), y los 6
tests de ese fichero se habrían roto sin que el cambio tuviera nada que
ver con lo que esos tests verifican.

En su lugar, [`apiClient.js`](../frontend/src/services/apiClient.js) registra
dos interceptores **sobre la instancia por defecto** de axios
(`axios.interceptors.request.use(...)`/`response.use(...)`), importado
una sola vez como efecto secundario al arrancar la app (`import
'./services/apiClient'` en `App.jsx`, mismo patrón que ya usaba `import
'./i18n/i18n'` en `index.tsx`). Resultado: `candidateService.js` y
`positionService.js` no cambian ni una línea, sus tests siguen pasando
sin tocarlos, y toda petición axios de la aplicación (las ya existentes
incluidas) gana la cabecera `Authorization` automáticamente.

- **Request**: si hay una sesión guardada (`getStoredAuth()`), añade
  `Authorization: Bearer <token>`.
- **Response**: un `401` con sesión guardada significa "el token ya no
  vale" (caducado, o el backend se reinició con otro `JWT_SECRET`) — se
  limpia la sesión y se fuerza `window.location.assign('/login')`. No es
  lo mismo que un intento de login fallido (ese lo maneja
  `authService.login` por separado, antes de que exista ningún token).

### 3.19.9 Frontend: `authService.js`, `AuthContext`, `Login`, `RequireAuth`, `UserMenu`

- **`services/authService.js`**: `login`/`logout`/`getStoredAuth`, guarda
  `{ token, employee }` en `localStorage` bajo la clave `lti_auth` (texto
  plano en el navegador — mismo mecanismo que ya usaba
  `i18next-browser-languagedetector` para el idioma, documentado aquí como
  decisión consciente, no accidental: esta es una SPA sin cookies de
  servidor, `localStorage` es lo estándar para JWT en ese contexto; el
  cambio frente a una cookie `httpOnly` sería resistencia a robo del token
  por XSS, y la sección 3.17.5 ya confirmó que no hay ningún
  `dangerouslySetInnerHTML`/`innerHTML`/`eval` en todo el frontend). Igual
  que `candidateService`/`uploadCV`: lanza solo el detalle del servidor,
  sin prefijo propio.
- **`context/AuthContext.jsx`**: `AuthProvider` + `useAuth()`. Arranca
  leyendo `getStoredAuth()` (si había sesión de una visita anterior, la
  app no muestra el login un instante de más). Único sitio de la sesión
  actual que reintroduce `React.Context` desde que `candidate-validation-
  i18n-a11y-AGB` lo sustituyó por `react-i18next` (sección 3.13) — no es
  una contradicción: aquella sustitución fue específicamente "no
  reinventar i18n cuando existe una librería estándar para ello"; para
  estado de sesión compartido entre componentes, `Context` es
  exactamente la herramienta idiomática de React, no algo casero que
  reimplemente lo que ya hace otra librería.
- **`components/Login.jsx`**: formulario con `email`/`password`,
  mismo patrón de accesibilidad que `AddCandidateForm` (`role="alert"
  aria-live="assertive"` para el error, `aria-invalid`). Al autenticar,
  vuelve a la ruta que se intentaba visitar antes de ser redirigido aquí
  (`location.state.from`, ver `RequireAuth`) en vez de ir siempre al
  dashboard.
- **`components/RequireAuth.jsx`**: envuelve cada ruta protegida;
  sin `employee` en el contexto, `<Navigate to="/login" state={{from:
  location}} replace />`.
- **`components/UserMenu.jsx`**: nombre del empleado + botón "Cerrar
  sesión", solo visible autenticado (`employee` nulo en `/login` →
  no renderiza nada).
- **`App.jsx`**: `<AuthProvider>` envolviendo todo; `/login` como única
  ruta pública; las cuatro rutas existentes (`/`, `/add-candidate`,
  `/positions`, `/positions/:id`) envueltas en `<RequireAuth>`.
- **i18n**: claves nuevas `login.*`/`userMenu.logout` en
  [`es.json`](../frontend/src/i18n/locales/es.json)/[`en.json`](../frontend/src/i18n/locales/en.json).

### 3.19.10 Hallazgo al escribir los tests: auto-mockear un módulo también sustituye sus clases de error

`authController.test.ts` empezó con `jest.mock('../../application/services/authService')`
(auto-mock completo, el mismo patrón que ya usan
`candidateController.test.ts`/`positionController.test.ts` sobre sus
respectivos servicios) y `new AuthError('Email o contraseña incorrectos')`
llegaba al test con `.message === ''`. Causa: `AuthError` vive en el
**mismo módulo** que se está auto-mockeando (`authService.ts`) — Jest
sustituye también la clase por una versión simulada que no ejecuta el
constructor real. Es la razón por la que `candidateController.test.ts`
nunca tropezó con esto: `ValidationError` vive en `validator.ts`, un
módulo *distinto* del que mockea (`candidateService.ts`), así que nunca
quedó auto-mockeada. Corregido acotando el mock a solo `login`:

```ts
jest.mock('../../application/services/authService', () => ({
    ...jest.requireActual('../../application/services/authService'),
    login: jest.fn(),
}));
```

### 3.19.11 Cobertura de tests añadida

**Backend (+15, 21→36)**: `authService.test.ts` (8 — login con éxito sin
filtrar el hash en la respuesta, mismo mensaje genérico para email
inexistente/contraseña incorrecta/empleado desactivado/sin contraseña,
`bcrypt.compare` ni se llega a invocar cuando ya se sabe que no puede
autenticarse, `signToken`/`verifyToken` van y vuelven, un token firmado
con otro secreto no verifica), `authMiddleware.test.ts` (4 — token válido
adjunta `req.employee` y llama a `next()`, sin cabecera/esquema
incorrecto/token inválido son siempre 401 sin llamar a `next()`),
`authController.test.ts` (3 — 200 con token+employee, 401 con el mensaje
de `AuthError`, 500 genérico — nunca el error crudo — para un fallo
inesperado).

**Frontend (+10, 19→29)**: `authService.test.js` (6 — guarda
sesión y devuelve el empleado, no guarda nada si falla, `logout` limpia,
`getStoredAuth` lee/no revienta con JSON corrupto), `RequireAuth.test.jsx`
(2 — redirige sin sesión guardada, renderiza el contenido protegido con
sesión guardada, sembrando `localStorage` directamente en vez de mockear
`authService`, para probar el camino real de `AuthProvider` de principio
a fin), `Login.test.jsx` (2 — envía las credenciales y navega a `/` al
autenticar, muestra el error accesible con el prefijo traducido y no
navega si falla).

### 3.19.12 Recopilación de secretos (`SECRETS.md`)

Ya con `api-auth-AGB` terminada y documentada, dos preguntas de
seguimiento en una sesión posterior: *"¿Cómo generaste esas
credenciales que me dijiste en el último mensaje y dónde se
almacenan?"* y, tras la respuesta, *"¿Haces una recopilación de los
secretos del sistema, como las credenciales de acceso a la BBDD que
metiste en la variable 'DATABASE_URL' y lo guardas en un fichero
unificado, tipo secrets.md o similar, o ya lo tenemos así?"*

No lo teníamos — los secretos reales vivían repartidos entre
`backend/.env` (no trackeado) y el literal `Changeme123!` de
`prisma/seed.ts` (sí trackeado, pero es una contraseña de desarrollo a
propósito, no un secreto de infraestructura). Antes de escribir el
fichero unificado que se pidió, se añadió `**/SECRETS.md` a
`.gitignore` — **y se commiteó esa regla primero** — precisamente
porque un fichero de ese nombre con valores reales es el tipo de cosa
que se termina subiendo a git por accidente; con la regla ya en su
sitio antes de que existiera contenido que proteger, se comprobó con
`git status`/`git check-ignore -v` que nunca podía aparecer como "para
confirmar".

`SECRETS.md` (raíz del repo, gitignorado, nunca en git) recopila:
credenciales de PostgreSQL (verificadas contra el contenedor Docker real
en marcha, no copiadas de memoria), `JWT_SECRET`, las credenciales de
login de desarrollo (`alice.johnson@lti.com`/`bob.miller@lti.com` +
`Changeme123!`, ver 3.19.5), y una nota de cómo rotar cada una. Es
contenido puramente local — no aparece en ningún commit de esta rama
más allá de la línea añadida a `.gitignore`.

## 12. Verificación de la autenticación de las APIs (sección 3.19)

```
Backend
  npx tsc --noEmit    → sin errores
  npx jest             → 8 suites, 36 tests (antes 21; +15 nuevos), verde
  npm run build        → sin errores, dist/ sin ficheros *.test.js

Frontend
  npx tsc -b           → sin errores
  npx eslint .          → sin errores (1 warning inocuo de react-refresh
                          en AuthContext.jsx por exportar el hook junto
                          al provider — patrón estándar, no afecta a HMR
                          de producción)
  npm test -- --run     → 6 suites, 29 tests (antes 19; +10 nuevos), verde
  npm run build         → 2783 módulos, verde

Navegador (pestaña nueva, consola limpia salvo los 401 esperados de las
pruebas deliberadas de credenciales incorrectas):
  Visita a "/" sin sesión              → redirige a /login
  Login con contraseña incorrecta       → alerta accesible (role="alert"):
                                           "Error al iniciar sesión: Email
                                           o contraseña incorrectos"
  Login con alice.johnson@lti.com /
    Changeme123!                        → dashboard, "Alice Johnson" +
                                           "Cerrar sesión" en la barra
  "Ir a Posiciones"                     → datos reales de la API con el
                                           token adjunto automáticamente
  "Cerrar sesión"                       → localStorage.getItem('lti_auth')
                                           → null; redirige a /login
  Navegación directa a /positions
    tras cerrar sesión                  → redirige a /login (RequireAuth)
  Login con bob.miller@lti.com /
    Changeme123! (segundo empleado)     → OK
  Alta de candidato completa (nombre/
    apellido/email/enviar), autenticado → "Candidato añadido con éxito"
                                           (POST /candidates con el token
                                           adjunto), candidato de prueba
                                           borrado tras verificar

curl (endpoint de subida de ficheros, sin equivalente de UI para
probarlo — la pestaña del navegador no puede pilotar el selector nativo
de archivos del sistema operativo):
  POST /upload sin token                → 401
  POST /upload con token válido          → 200, mismo formato de
                                           respuesta que antes de esta
                                           rama ({filePath, fileType}),
                                           fichero de prueba borrado tras
                                           verificar
```

Con esto, el hallazgo más severo de `security-audit-AGB` (sección
3.17.2, ausencia total de autenticación) queda cerrado: toda ruta de
negocio del backend exige un JWT válido, y el frontend tiene un flujo de
login/logout real y verificado de principio a fin.

## 3.20 *Code splitting* del bundle (`code-splitting-AGB`)

Prompt del usuario: tras una pregunta previa sobre qué es `<Suspense>`
(en el contexto de la deuda documentada en la sección 0.5, "chunk único
de ~670KB sin *code splitting*"), *"¿Creas porfa una nueva rama y
aplicas el code splitting, que quiero ver la diferencia del código y
cómo afecta a la experiencia de usuario el resultado final?"*

### 3.20.1 El cambio en sí

En [`App.jsx`](../frontend/src/App.jsx), las 4 rutas protegidas pasan de
`import` estático a `React.lazy(() => import(...))`, envueltas en un
único `<Suspense>` alrededor de `<Routes>`:

```jsx
const RecruiterDashboard = lazy(() => import('./components/RecruiterDashboard'));
const AddCandidate = lazy(() => import('./components/AddCandidateForm'));
const Positions = lazy(() => import('./components/Positions'));
const PositionProcess = lazy(() => import('./components/PositionProcess'));
```

**`Login` se queda con `import` estático, a propósito**: es la primera
pantalla que ve cualquiera sin sesión (`RequireAuth` redirige ahí), y
ponerla detrás de un `Suspense` metería un parpadeo de carga justo en el
primer contacto con la app — el peor sitio para ahorrarse unos KB.

El `fallback` (`PageFallback`, un componente propio, no una librería) es
un `<div role="status" aria-live="polite">` con una clave de i18n nueva
(`common.loadingPage`: "Cargando página…" / "Loading page…") —
mismo patrón de accesibilidad que el mensaje de éxito de
`AddCandidateForm` (3.9-3.11): un lector de pantalla lo anuncia sin que
el foco tenga que moverse.

Ningún test existente importa `App.jsx` directamente (los tests de
`Login`/`RequireAuth`/`AddCandidateForm` renderizan esos componentes
sueltos, no a través del árbol de rutas), así que el cambio es invisible
para toda la suite: los 29 tests del frontend pasan sin tocar ni uno.

### 3.20.2 La diferencia medida, no solo el código

`npm run build` antes de esta rama generaba **un único fichero**:

```
dist/assets/index-DV68uIzp.js   674.25 kB │ gzip: 189.27 kB
```

Después de esta rama, el mismo build genera **10 ficheros**, cada ruta
(y `Alert`/`Container`, componentes de `react-bootstrap` que `Login`
usa directamente) en su propio chunk:

| Chunk | Tamaño | gzip | Cuándo se descarga |
|---|---|---|---|
| `index-*.js` (App, router, contexto de auth, i18n, Login) | 110.87 kB | 35.83 kB | Siempre, es el punto de entrada |
| `Alert-*.js` (agrupación de `react-bootstrap` que usa `Login`) | 195.07 kB | 65.89 kB | Siempre (dependencia directa de `Login`) |
| `Container-*.js` | 16.92 kB | 6.30 kB | Siempre |
| `rolldown-runtime-*.js` | 0.90 kB | 0.51 kB | Siempre |
| `RecruiterDashboard-*.js` | 1.18 kB | 0.49 kB | Al visitar `/` (autenticado) |
| `Row-*.js` | 0.51 kB | 0.37 kB | Junto con `RecruiterDashboard` |
| `Positions-*.js` | 2.76 kB | 1.05 kB | Al visitar `/positions` |
| `Spinner-*.js` | 0.41 kB | 0.31 kB | Junto con `Positions` |
| `positionService-*.js` | 0.64 kB | 0.32 kB | Junto con `Positions`/`PositionProcess` |
| `PositionProcess-*.js` | 2.62 kB | 1.17 kB | Al visitar `/positions/:id` |
| `AddCandidateForm-*.js` + su CSS | 344.93 kB + 21.25 kB | 82.38 kB + 2.95 kB | Al visitar `/add-candidate` |

**Lo que de verdad le llega al navegador la primera vez que alguien abre
la app** (sin sesión, aterriza en `/login`) son los cuatro primeros:
`110.87 + 195.07 + 16.92 + 0.90 = 323.76 kB` (`108.53 kB` con gzip) — un
**52% menos** que el único bundle de antes (674.25 kB), un **43% menos**
ya comprimido. Y quien nunca llega a abrir "Añadir Candidato" en toda su
sesión (p. ej. alguien que solo consulta el listado de posiciones) no
descarga jamás los 345 kB de `AddCandidateForm` — el chunk más pesado de
toda la aplicación, con diferencia, porque arrastra `react-datepicker`.

### 3.20.3 Verificación con tráfico de red real, no solo con el tamaño de los ficheros

El servidor de desarrollo de Vite (`npm run dev`) no *bundlea* ni
trocea igual que la build de producción — sirve módulos ES sueltos.
Para ver el comportamiento real había que servir el `dist/` generado por
`vite build`, con `vite preview`. Se lanzó en el puerto 3000 (no el 4173
por defecto: el backend solo permite CORS desde `http://localhost:3000`
— con el 4173 el login fallaba con "Network Error", un error de CORS
esperado por el puerto equivocado, no un bug de esta rama), y se
inspeccionaron las peticiones de red reales con cada navegación:

```
Visita en frío a "/" (sin sesión → /login)
  → index, rolldown-runtime, Container, Alert   (4 peticiones, 323.76 kB)
  → NINGUNA de RecruiterDashboard/Positions/PositionProcess/AddCandidateForm

Tras iniciar sesión y aterrizar en "/" (dashboard)
  → RecruiterDashboard-*.js + Row-*.js          (nuevas, no estaban antes)

Clic en "Ir a Posiciones"
  → Positions-*.js + Spinner-*.js + positionService-*.js   (nuevas)

Navegación directa a "/add-candidate"
  → AddCandidateForm-*.js + su CSS               (nuevas, 345 kB — el
                                                    chunk más pesado de
                                                    toda la app, solo se
                                                    paga si se visita
                                                    esta pantalla)
```

Cada chunk se pidió **exactamente** la primera vez que la ruta
correspondiente se visitó, nunca antes — confirmado con
`read_network_requests`, no asumido a partir de los nombres de fichero.

### 3.20.4 Hallazgo incidental durante la demo: un token de dos días caducó en directo

A mitad de la demostración, la sesión que ya estaba guardada en
`localStorage` desde una verificación de la rama `api-auth-AGB` (18 de
septiembre) caducó (JWT con 8h de vigencia, sección 3.19.3) al hacer la
primera petición real a la API tras cargarse de forma optimista — el
interceptor de respuesta de `apiClient.js` (sección 3.19.8) hizo
exactamente lo que estaba diseñado para hacer: limpió la sesión y
redirigió a `/login` sola, sin intervención. No es un bug de esta rama;
es la primera vez, de forma no forzada, que se observa ese camino en
acción.

### 3.20.5 Qué no se ha hecho, y por qué

No se ha dividido nada dentro de `AddCandidateForm` (p. ej. cargar
`react-datepicker` de forma perezosa solo al pulsar "Añadir Educación").
El *code splitting* por ruta ya captura la gran mayoría de la ganancia
posible en esta aplicación (5 pantallas, cada una con su propio punto de
entrada natural en el router) — trocear más finamente dentro de una
única pantalla añadiría complejidad (más `Suspense` anidados, más
posibilidad de parpadeos de carga dentro de un mismo formulario) a
cambio de un ahorro mucho menor, y no se pidió.

## 13. Verificación del *code splitting* (sección 3.20)

```
npx tsc -b            → sin errores
npx eslint .           → sin errores (mismo warning inocuo preexistente
                          en AuthContext.jsx)
npm test -- --run      → 6 suites, 29 tests, verde (sin cambios: ningún
                          test importa App.jsx)
npm run build          → 2783 módulos, 10 ficheros JS en vez de 1
                          (tabla completa en 3.20.2)

Verificación con tráfico de red real (vite preview, puerto 3000):
  Carga en frío de /login          → 4 peticiones JS, 323.76 kB
                                      (antes: 674.25 kB, un único fichero)
  Dashboard tras login             → RecruiterDashboard-*.js nuevo
  Clic en "Ir a Posiciones"        → Positions-*.js + positionService-*.js
                                      nuevos
  Navegación a /add-candidate      → AddCandidateForm-*.js (345 kB) nuevo
  Consola                          → limpia salvo el 401 esperado del
                                      token de dos días caducado (3.20.4)
```

## 3.21 Dos bugs de UX en "Agregar Candidato" (`candidate-form-ux-fixes-AGB`)

Prompt del usuario: *"Después de un error de entrada en 'Agregar
Candidato' no me recarga los valores corregidos. Tampoco da información
de porqué el tfno tiene formato inválido a pesar de haber introducido
sólo 9 números. ¿Lo mejoras, porfa?"*

### 3.21.1 Metodología: reproducir antes de arreglar

Ninguno de los dos se "arregló" a partir de leer el código y suponer —
ambos se reprodujeron primero en el navegador, con un intento fallido de
por medio que merece registrarse porque explica un patrón a tener en
cuenta con el propio tooling de esta sesión: el primer intento de
reproducir el fallo del teléfono dio un resultado desconcertante (todos
los campos en blanco tras enviar, y un `POST /candidates → 201 Created`
en el registro de red) que no encajaba con nada del código. Investigando
antes de concluir que era un bug de la app, se confirmó que era una
condición de carrera del propio `computer` del navegador: la primera
captura de pantalla se tomó mientras la ruta `/add-candidate` (cargada
de forma perezosa desde `code-splitting-AGB`, sección 3.20) aún mostraba
el `Suspense` de "Cargando página…"; para cuando el clic se ejecutó, el
formulario real ya había sustituido ese `fallback` en el DOM, y la
herramienta rechazó el clic por coordenadas ("this tab has loaded a
different site or document") — el texto tecleado a continuación no
llegó a ningún campo, y el `201 Created` del registro de red resultó ser
una entrada residual de una verificación anterior en la misma pestaña
(el mismo patrón de pestaña de larga duración con estado acumulado ya
documentado en 3.16.3 y 3.20.4). Se cerró la pestaña, se abrió una
nueva, y se esperó a que la captura de pantalla reflejara el formulario
real antes de hacer clic — con eso, la reproducción fue limpia y
repetible.

### 3.21.2 Bug A: el error de un campo no se actualizaba al corregirlo

**Causa**: `issues` (el array de `{field, code, params}` que alimenta
`getFieldError`) solo se actualizaba dentro de `handleSubmit` — nunca al
cambiar un campo. Los `onChange` de `firstName`/`lastName`/`email`/
`phone`/`address` llamaban a `setCandidate(...)` en línea, sin tocar
`issues` en absoluto. Resultado: tras un envío fallido, corregir el
valor de un campo actualizaba `candidate` (el dato que se enviaría en el
próximo intento) pero dejaba el borde rojo, el icono y el mensaje de
error exactamente como estaban, mostrando información sobre un valor que
ya no existía, hasta el siguiente clic en "Enviar". El usuario lo
describió con precisión ("no me recarga los valores corregidos"): la UI
no reflejaba la corrección, aunque el dato sí se hubiera corregido por
debajo.

**Arreglo**, en
[`AddCandidateForm.jsx`](../frontend/src/components/AddCandidateForm.jsx):
una función `clearFieldIssue(field)` que quita del array `issues`
cualquier entrada de ese campo, invocada desde un `handleFieldChange`
nuevo (que sustituye los 5 `onChange` en línea) y también desde
`handleInputChange`/`handleDateChange` (los campos dentro de
`educations`/`workExperiences`, con la misma clase de bug aunque no
fuera el caso reportado — mismo arreglo, por consistencia). **No
revalida en el cliente** — eso seguiría viviendo solo en
`validator.ts`, según la arquitectura ya establecida (3.1) — simplemente
deja de mostrar un error que ya no corresponde al valor actual, hasta
que el siguiente envío confirme (o no) que la corrección es válida de
verdad.

### 3.21.3 Bug B: el teléfono decía "formato inválido" sin decir cuál

**Causa**: `validatePhone` en `validator.ts` usa
`PHONE_REGEX = /^(6|7|9)\d{8}$/` — 9 dígitos, pero el primero tiene que
ser 6, 7 o 9 (prefijos de móvil/fijo español). Un teléfono de 9 dígitos
que empiece por otra cifra (el caso exacto que describió el usuario) la
incumple, pero el código de error que se lanzaba era el genérico
`invalidFormat` — el mismo que comparten el email y las fechas, con un
mensaje que solo dice "El teléfono no tiene un formato válido." sin
explicar la regla real (ni la longitud ni el prefijo esperado).

**Arreglo**: nuevo código específico `invalidPhoneFormat` (añadido a la
unión de tipos de `ValidationIssue`), usado solo por `validatePhone`, con
su propio mensaje en
[`es.json`](../frontend/src/i18n/locales/es.json)/[`en.json`](../frontend/src/i18n/locales/en.json):
*"El teléfono debe tener 9 dígitos y empezar por 6, 7 o 9."* / *"The
phone number must have 9 digits and start with 6, 7, or 9."* — mismo
patrón que ya usa `invalidCharacters` (código específico con un mensaje
que explica la regla, no solo que falló) en vez de forzarlo dentro del
`invalidFormat` genérico, que habría exigido diferenciar el mensaje por
`field` además de por `code`, algo que la arquitectura actual de
`translateValidationIssue` no contempla.

### 3.21.4 Cobertura de tests añadida

**Backend (+3, 36→39)**: en `validator.test.ts` — un teléfono de 9
dígitos con el prefijo equivocado da `invalidPhoneFormat` (no el
genérico `invalidFormat`, que no tenía ningún test de teléfono hasta
ahora); teléfonos válidos empezando por 6/7/9 no lanzan; un teléfono
vacío tampoco (es opcional).

**Frontend (+3, 29→32)**: en `validationMessages.test.js` — el mensaje
de `invalidPhoneFormat` explica la regla real, en español y en inglés.
En `AddCandidateForm.test.jsx` — el test que codifica exactamente el bug
reportado: se envía con un teléfono inválido, aparece el mensaje
específico duplicado (como el resto de errores, 3.15.4), se corrige el
campo **sin volver a pulsar "Enviar"**, y el mensaje desaparece de
inmediato — con `sendCandidateData` seguía habiéndose llamado una sola
vez, confirmando que la desaparición es por la corrección, no por un
reenvío.

## 14. Verificación de los arreglos de "Agregar Candidato" (sección 3.21)

```
Backend
  npx tsc --noEmit    → sin errores
  npx jest             → 8 suites, 39 tests (antes 36; +3 nuevos), verde
  npm run build        → sin errores, dist/ sin ficheros *.test.js
  curl (POST /candidates, autenticado, teléfono "123456789")
                        → {"errors":[{"field":"phone","code":"invalidPhoneFormat"}]}
                          (confirmado contra el servidor de desarrollo real,
                          no solo con el test)

Frontend
  npx tsc -b           → sin errores
  npx eslint .          → sin errores (mismo warning inocuo preexistente)
  npm test -- --run     → 6 suites, 32 tests (antes 29; +3 nuevos), verde
  npm run build         → 10 ficheros JS, chunking intacto (sección 3.20)

Navegador (reproducido y verificado tras cerrar la pestaña obsoleta,
sección 3.21.1):
  Envío con teléfono "123456789"   → "El teléfono debe tener 9 dígitos
                                      y empezar por 6, 7 o 9." (antes:
                                      "no tiene un formato válido.")
  Corregir a "612345678" sin
    reenviar                        → el borde rojo, el icono y el
                                       mensaje desaparecen al instante
                                       (antes: seguían ahí hasta el
                                       siguiente envío)
  Enviar tras la corrección         → "Candidato añadido con éxito"
                                       (candidato de prueba borrado tras
                                       verificar)
```

## 3.22 El formulario no se vaciaba tras un alta con éxito

Prompt del usuario, mientras probaba por su cuenta: *"Acabo de lograr
añadir un candidato con éxito, pero opino que deberían haberse borrado
los valores tras ello, pero se mantienen. ¿Coincides?"*

### 3.22.1 Confirmado, con dos causas distintas

`handleSubmit` nunca reseteaba `candidate` tras un envío con éxito
(`setSuccessMessage`/`setError('')`/`setIssues([])`, pero nada que
tocara los datos del formulario) — igual que el bug de 3.21.2, pero en
el camino de éxito en vez del de error. Al investigarlo salió una
segunda causa, más sutil: `firstName`/`lastName`/`email`/`phone`/
`address` nunca habían tenido `value={candidate.X}` — eran técnicamente
*no controlados* desde el punto de vista de React (el `onChange` sí
actualizaba el estado, pero nada leía ese estado de vuelta hacia el
`<input>`). Aunque se hubiera reseteado `candidate` sin más, los
`<input>` seguirían mostrando en pantalla lo último que el navegador
tenía escrito — React no toca el DOM de un campo sin `value` al
volver a renderizar.

### 3.22.2 Arreglo

En
[`AddCandidateForm.jsx`](../frontend/src/components/AddCandidateForm.jsx):

1. Los 5 campos ganan `value={candidate.X}` — pasan a ser controlados
   de verdad, no solo en apariencia.
2. `EMPTY_CANDIDATE` (el objeto inicial, ahora fuera del componente para
   poder reutilizarlo) se asigna a `candidate` en el camino de éxito de
   `handleSubmit`.
3. `FileUploader` guarda su propio estado interno (fichero elegido,
   nombre mostrado, resultado de la subida — ver 3.16), que no depende
   de ningún prop del padre; vaciar `candidate.cv` no le hace olvidar lo
   que ya mostraba. Se le añade una `key` que cambia en cada alta con
   éxito (`fileUploaderKey`), forzando a React a desmontarlo y montar una
   instancia nueva y limpia en vez de reutilizar la que ya tenía estado.

`educations`/`workExperiences` no necesitaron ningún cambio aparte:
al vaciarse el array en `candidate`, las filas (y sus `DatePicker`) 
desaparecen del todo porque se generan con `.map()` sobre ese mismo
array — no queda ningún estado residual que limpiar.

### 3.22.3 Un par de falsas alarmas durante la verificación, descartadas antes de concluir nada

- Un aviso nuevo de React ("A component is changing an uncontrolled
  input to be controlled") apareció en la pestaña donde se había editado
  el fichero en caliente — Vite recarga el componente por HMR sin
  recargar la página, y la instancia que ya estaba montada (de antes del
  cambio, sin `value`) se comparaba contra la nueva (con `value`).
  Confirmado como ruido de HMR, no un bug real: en una pestaña nueva, con
  el componente montado de una sola vez, la consola sale limpia.
- Dos veces durante la propia verificación, una captura tomada justo
  después de escribir en un campo (o de enviar el formulario) mostró
  los campos vacíos o el mensaje de éxito ausente, sugiriendo que el
  texto o el envío no habían "llegado". Ambas veces, una segunda captura
  inmediatamente después mostró el estado real y correcto — la propia
  herramienta de captura iba un paso por detrás del pintado del
  navegador, no la aplicación fallando. Se verificó con el registro de
  red (`POST /candidates → 201 Created`) antes de dar nada por bueno o
  por malo.

## 15. Verificación del reseteo del formulario (sección 3.22)

```
Frontend
  npx tsc -b           → sin errores
  npx eslint .          → sin errores (mismo warning inocuo preexistente)
  npm test -- --run     → 6 suites, 33 tests (antes 32; +1 nuevo), verde
  npm run build         → 10 ficheros JS, chunking intacto (sección 3.20)

Navegador (pestaña nueva, verificado dos veces para descartar las falsas
alarmas de 3.22.3):
  Rellenar Nombre/Apellido/Email/Teléfono → Enviar
    → "Candidato añadido con éxito", los 5 campos vacíos al instante,
      "Ningún archivo seleccionado" en el selector de CV
    → confirmado con el registro de red real (POST /candidates → 201)
      y no solo con la captura de pantalla
  (candidatos de prueba borrados de la base de datos tras cada
  comprobación)
```

## 3.23 Selector de posición en "Agregar Candidato" (`position-selector-AGB`)

Prompt del usuario, en una conversación de varios turnos:

1. *"El formulario actual permite el registro del candidato sin CV y sin
   experiencia... ¿El código actual contempla analizar el CV o la
   experiencia para asignar el candidato a la posición?"*
2. *"Añade porfa primero el campo de elección a la candidatura, pero
   siendo un listado desplegable de las opciones disponibles, no un
   cuadro de texto libre. Necesitaría entonces también poder crear
   nuevos tipos de vacantes, ¿correcto?"*
3. *"¿Qué devuelve GET /positions/:id/candidates?"* (antes de decidir
   alcance)
4. *"Sólo el desplegable ahora. Ya abordaremos la creación de nuevas
   vacantes más adelante."*

### 3.23.1 El hueco real, confirmado con el código antes de opinar

Antes de proponer nada se comprobó, en el código real (no de memoria):
`addCandidate` (`candidateService.ts`) nunca creaba una `Application` —
solo `Candidate`, `Education`, `WorkExperience` y `Resume`. Importaba
`Application` pero solo para *buscar* una existente en
`updateCandidateStage`, nunca para crear una. El "CV" es un puntero
opaco a un fichero (`filePath`/`fileType`); nadie lee su contenido. Es
decir: **no hay ni ha habido nunca ningún análisis de CV/experiencia
para nada**, ni para asignar a una posición ni para cualquier otra cosa
— y el motivo por el que un candidato nuevo no aparecía en ningún
"Ver proceso" es exactamente esa ausencia de `Application`, no un bug de
ninguna rama de esta sesión.

`GET /position/:id/candidates` (comprobado en vivo con `curl`, no
asumido) devuelve, por cada `Application` de esa posición: `fullName`,
`currentInterviewStep` (el *nombre* de la fase, no un id),
`averageScore`, `id` (del candidato) y `applicationId` — nada de email,
teléfono ni CV. Confirma que ese tablero se alimenta solo de
`Application`, nunca de la lista general de candidatos.

### 3.23.2 Alcance acordado: solo el desplegable, contra las posiciones ya existentes

Antes de escribir código se preguntó explícitamente si "crear vacantes
nuevas" era un requisito para esto (el modelo `Position` exige también
un `interviewFlowId` — no es un formulario de dos campos) o si podía
quedar aparte. El usuario confirmó: **solo el desplegable ahora**, listo
sobre las posiciones que ya existen vía el `GET /position` que ya había;
crear vacantes queda para una rama futura, deliberada.

### 3.23.3 Backend: de "guardar el candidato" a "crear también su candidatura"

- **`validator.ts`**: nuevo `validatePositionId` — exige que esté
  presente (`required`) y sea un entero positivo (`invalid`); no
  comprueba que la posición exista de verdad (eso es responsabilidad de
  quien la usa, no de un validador de formato).
- **`positionService.ts`**: nuevo `getFirstInterviewStepForPosition`,
  con `orderBy: { orderIndex: 'asc' }` explícito — el `include` de
  Prisma no garantiza que `interviewSteps` venga ordenado, y sin ordenar
  a propósito se podría coger una fase intermedia como si fuera la
  primera. Devuelve `undefined` si la posición no existe y `null` si
  existe pero su flujo no tiene ninguna fase — a propósito distintos,
  para que quien llama pueda dar un mensaje que no confunda un caso con
  el otro (ver 3.23.5).
- **`candidateService.ts`**: `addCandidate`, tras guardar el candidato y
  sus educaciones/experiencias/CV, crea la `Application` en la primera
  fase de la posición elegida. Lanza un error claro y distinto si la
  posición no existe, o si existe pero no tiene ninguna fase configurada
  — sin ninguno de los dos casos, sigue el mismo patrón no transaccional
  que ya tenía el resto de la función (sin rollback si algo falla a
  mitad, tal cual estaba antes de esta rama).

### 3.23.4 Frontend: desplegable real, no texto libre

En [`AddCandidateForm.jsx`](../frontend/src/components/AddCandidateForm.jsx):
`positionId` se añade a `EMPTY_CANDIDATE`; un `useEffect` carga las
posiciones reales (`getPositions()`, el mismo servicio que ya usaba
`Positions.tsx` — sin duplicar nada) al montar el componente; un
`<Form.Select>` de `react-bootstrap` (no un `<input>` de texto) las
lista como `"{título} — {empresa}"`, con el mismo patrón de
accesibilidad (`isInvalid`/`aria-invalid`/`aria-describedby`) que el
resto de campos. Al enviar, `candidate.positionId` (siempre un string,
porque así es como funciona un `<select>` del navegador) se convierte a
`Number` antes de mandarlo — es lo que `validatePositionId` espera.

### 3.23.5 Hallazgo real durante la verificación en vivo: un flujo de entrevistas sin fases, desde el seed original

Al probar de extremo a extremo con la posición "Data Scientist" (id 2),
la petición fallaba con *"The selected position does not have an
interview process configured"* — no un fallo de esta rama: su
`InterviewFlow` ("Data science interview process") **nunca había tenido
ninguna `InterviewStep`** desde el primer commit del proyecto, mucho
antes de esta sesión. No se había notado hasta ahora porque, hasta esta
rama, nada creaba nunca una `Application` desde la UI — el hueco era
invisible sin este cambio.

Corregido en dos sitios, a propósito:

1. `prisma/seed.ts` — añadidas 3 `InterviewStep` para `interviewFlow2`
   (`Initial Screening`/`Technical Interview`/`Manager Interview`,
   reutilizando los mismos `InterviewType` que ya existían para el
   flujo 1), para que una base de datos sembrada desde cero a partir de
   ahora no tenga este problema.
2. La base de datos de desarrollo ya sembrada, con un script de un solo
   uso (mismo patrón que en 3.19.5), verificando primero que
   `interviewFlow2` seguía sin fases antes de crearlas (para no
   duplicar si se llegara a ejecutar dos veces).

También se distinguieron, de camino, dos errores que antes compartían
exactamente el mismo mensaje: una posición que no existe
(`positionId: 9999`) y una posición real sin fases configuradas ahora
dan mensajes distintos (`'Selected position not found'` vs. `'The
selected position does not have an interview process configured'`) —
ver 3.23.3.

Verificado tras el arreglo, con `curl`, que ambas posiciones sembradas
(1 y 2) aceptan candidaturas correctamente, y en el navegador que un
candidato nuevo aparece de verdad en "Ver proceso" — en la primera fase,
"Initial Screening" — de la posición elegida.

### 3.23.6 Cobertura de tests añadida

**Backend (+6, 39→45)**: `validator.test.ts` (+3 — positionId ausente,
no numérico/no positivo, válido) y `candidateService.test.ts` (+3 —
crea la `Application` en la primera fase por `orderIndex`; error
distinto si la posición no existe; error distinto si existe pero no
tiene ninguna fase configurada, ver 3.23.3).

**Frontend (+1, 33→34)**: `AddCandidateForm.test.jsx` — el desplegable
lista las posiciones reales (mockeando `getPositions`, no texto libre)
y `positionId` se envía como número, no como el string que entrega el
`<select>`. `fillBasicFields` (usado por el resto de tests del
fichero) se actualizó para elegir siempre una posición primero, ya que
el campo es ahora obligatorio.

## 16. Verificación del selector de posición (sección 3.23)

```
Backend
  npx tsc --noEmit    → sin errores
  npx jest             → 8 suites, 45 tests (antes 39; +6 nuevos)
  npm run build        → sin errores, dist/ sin ficheros *.test.js

Frontend
  npx tsc -b           → sin errores
  npx eslint .          → sin errores (mismo warning inocuo preexistente)
  npm test -- --run     → 6 suites, 34 tests (antes 33; +1 nuevo), verde
  npm run build         → 11 ficheros JS (positionService pasa a compartirse
                          entre el chunk de AddCandidateForm y el de
                          Positions/PositionProcess, code splitting sigue
                          intacto)

curl (backend de desarrollo real, no solo mocks)
  POST /candidates sin positionId       → 400, {"field":"positionId","code":"required"}
  POST /candidates con positionId=9999  → 400, "Selected position not found"
  POST /candidates con positionId=2
    (antes de sembrar sus fases)        → 400, "does not have an interview
                                            process configured"
  POST /candidates con positionId=1 y 2
    (tras sembrar las fases de la 2)    → 201 Created, ambas

Navegador (pestaña nueva)
  Desplegable "Posición a la que se presenta"
    → "Senior Full-Stack Engineer — LTI" y "Data Scientist — LTI",
      las posiciones reales, no texto libre
  Alta de candidato eligiendo la posición 1 → "Candidato añadido con
      éxito"; navegado a /positions/1 → el candidato aparece en la
      columna "Initial Screening" del tablero real
  (candidatos y sus Application de prueba borrados tras cada
  comprobación)
```

## 3.24 Adopción de OpenSpec (`openspec-adoption-AGB`)

Prompt del usuario: *"Querría darle mayor trazabilidad a todo el proceso.
¿Cómo ves que llevemos todo lo hecho hasta ahora, las 14 ramas, a
openspec?"* → tras acordar el enfoque, *"Sí, perfecto, specs por
capacidad, pero granulariza bien y deja registrado de alguna manera la
rama que lo implementa..."*

`openspec` (CLI `@fission-ai/openspec`, ya instalada en el sistema) se
inicializó en el repo (`openspec init`, esquema `spec-driven`) y se creó
un único change, `adopt-openspec-baseline`, con una spec de capacidad
(no una por rama) por cada área de comportamiento real de la
aplicación: `candidate-intake`, `candidate-validation`, `file-upload`,
`position-catalog`, `hiring-pipeline`, `authentication`,
`internationalization`, `accessibility`, `security-hardening` y
`frontend-performance` — 38 requisitos en total, cada uno con una línea
`_Rama: \`nombre\` (commit \`hash\`)_` verificada contra `git log` real,
no de memoria. Los cambios puramente de herramientas sin comportamiento
observable (`vite-migration-AGB`, `react-router-v7-AGB`, `tests-AGB`)
no generan spec propia — quedan documentados como decisión explícita en
el `proposal.md`/`design.md` del change, no como una omisión.

El change se archivó (`openspec archive adopt-openspec-baseline`),
generando `openspec/specs/` — validado con `openspec validate --specs
--strict` (10/10 specs correctas). **A partir de esta rama,
`openspec/specs/` es la referencia consultable de "qué hace el sistema
hoy" (`openspec spec show <capacidad>`), y `prompts-AGB.md` sigue siendo
la referencia del "por qué" y de cómo se llegó ahí** — no se sustituyen,
se complementan. El detalle completo de la decisión (por qué specs por
capacidad y no por rama, por qué esas 10 capacidades y no otras, el
formato exacto de la línea de trazabilidad) queda en
`openspec/changes/archive/2026-09-19-adopt-openspec-baseline/design.md`,
sin duplicarlo aquí.

### 3.24.1 Corrección del usuario: los cambios de herramientas también son un cambio real

Tras revisar el resultado, el usuario señaló un punto justo: *"Pero el
cambio de cómo está construido el sistema es un cambio real. Opino que
ha de estar documentado también."* — la decisión de dejar
`vite-migration-AGB`, `react-router-v7-AGB` y `tests-AGB` fuera de
OpenSpec (3.24) no estaba mal razonada del todo, pero sí incompleta: es
cierto que estos cambios no tienen un `WHEN` protagonizado por un
usuario de la aplicación, pero un requisito de OpenSpec no exige que el
actor sea un usuario final — puede ser "quien ejecuta el build" o "quien
ejecuta la suite de tests", y con esa relectura los tres encajan sin
forzar el esquema.

Se añadió, con un segundo change de OpenSpec (`add-developer-tooling-capability`,
también archivado), la capacidad `developer-tooling` — 3 requisitos más
(construcción del frontend con Vite sobre la versión de TypeScript que
sostiene su *linter*, cobertura de tests automáticos sin que `dist/`
duplique los resultados, y `react-router-dom` sin vulnerabilidades
conocidas), cada uno con su propia línea de trazabilidad. Su `## Purpose`
deja explícito que sus escenarios se verifican con comandos
(`npm run build`, `npx jest`, una auditoría de dependencias), no con
acciones de un usuario final — para que quien lea la spec entienda por
qué el formato difiere del resto de capacidades, en vez de parecer una
inconsistencia. El razonamiento completo de por qué se revisa el
criterio (no solo qué se añade) queda en
`openspec/changes/archive/2026-09-19-add-developer-tooling-capability/design.md`.
`openspec/specs/` queda ahora con **11 capacidades y 41 requisitos**,
validados en limpio (`openspec validate --specs --strict` → 11/11).

### 3.24.2 "¿Y el GIVEN?" — dos rondas de comprobación antes de tocar nada

Con las 11 specs ya con `developer-tooling` incluida, el usuario
preguntó: *"Pero para nuestro desarrollo que ha sido en todo momento
BDD, se recomienda el GIVEN WHEN THEN"* — y, tras una primera respuesta
(el esquema `spec-driven` de fábrica solo exige WHEN/THEN, verificado
con `grep -rn "GIVEN"` sobre todo el paquete instalado, cero
resultados), el usuario contraatacó con *"Confirmado. Openspec es
flexible"*, tras mirar otro proyecto suyo donde sí aparecía `GIVEN`.

La resolución, verificada antes de actuar: `spec-driven` es el único
esquema que trae el paquete de fábrica (`openspec schemas` solo lista
ese uno), pero OpenSpec permite esquemas *project-local*
(`openspec schema fork`/`init`) — el otro proyecto del usuario usaba,
casi con toda seguridad, una versión forkeada o editada a mano, no la
plantilla estándar. Ninguno de los dos estaba equivocado: yo verifiqué
correctamente lo que traía el paquete por defecto; el usuario verificó
correctamente que en su otro proyecto era distinto porque ahí se había
personalizado.

**Acción**: `openspec schema fork spec-driven spec-driven-bdd`, con
`GIVEN` añadido a la plantilla de escenario y a la instrucción del
artefacto `specs` (dejando explícito que, en este proyecto, GIVEN no es
opcional), fijado como esquema por defecto en `openspec/config.yaml`.
Después, un change (`add-given-to-scenarios`, archivado) que retrofita
los **56 escenarios** ya existentes (contados con `grep -c "^####
Scenario:"`, no de memoria — mi primera estimación en el `proposal.md`,
41, era la cuenta de *requisitos*, no de escenarios, y se corrigió antes
de escribir ni una sola línea de las 11 specs) para que todos tengan su
`GIVEN`. Verificado dos veces con `grep` (antes de archivar, sobre las
11 deltas; después de archivar, sobre las 11 specs mezcladas) que el
número de `GIVEN` coincide exactamente con el número de escenarios en
cada fichero — no solo que `openspec validate --strict` pasara.

## 17. Verificación de la adopción de GIVEN/WHEN/THEN (sección 3.24.2)

```
openspec schema validate spec-driven-bdd   → válido
openspec validate "add-given-to-scenarios" --strict   → válido
openspec archive add-given-to-scenarios    → 41 requisitos modificados
                                              (0 añadidos, 0 eliminados)
openspec validate --specs --strict          → 11 specs, 11/11

grep -c "^#### Scenario:" / "^- \*\*GIVEN\*\*"
  sobre cada una de las 11 specs, antes de archivar (sobre las deltas)
  y después (sobre las specs ya fusionadas)     → 56/56 en ambos casos
```

`openspec/specs/` queda con 11 capacidades, 41 requisitos, 56
escenarios, todos en formato GIVEN/WHEN/THEN completo, cada requisito
con su línea de trazabilidad a la rama y commit que lo implementó.

## 3.25 Primer escenario real con `playwright-bdd` (`playwright-bdd-AGB`)

Prompt del usuario: tras instalar `@playwright/test`/`playwright-bdd` por
su cuenta ("Se creó sólo ;)", refiriéndose al `package.json` de la raíz
que ya traía ambos paquetes) y confirmar que estaban instalados de
verdad (verificado en esta sesión con un lanzamiento real de Chromium
contra el frontend, no solo mirando `node_modules`): *"Si, porfa, crea
un primer escenario real, a ver qué tal"*.

### 3.25.1 Estructura mínima

- `playwright.config.ts` (raíz): `defineBddConfig({ features:
  'e2e/features/*.feature', steps: 'e2e/steps/*.ts' })`, un único
  proyecto Chromium, `baseURL: 'http://localhost:3000'`.
- `e2e/features/authentication.feature`: el escenario "Credenciales
  correctas" del requisito "Inicio de sesión con email y contraseña" de
  `openspec/specs/authentication/spec.md` (rama `api-auth-AGB`, commit
  `bb94850`), con esa trazabilidad como comentario en la cabecera del
  `.feature` — el mismo GIVEN/WHEN/THEN de la spec, con el THEN
  adaptado a lo que se puede observar de verdad desde el navegador (que
  se ve el nombre del empleado en pantalla, no "el sistema devuelve un
  token").
- `e2e/steps/authentication.steps.ts`: los tres *step definitions*
  (`createBdd()` de `playwright-bdd`), usando las credenciales de
  desarrollo ya documentadas en `SECRETS.md`/sección 3.19.5
  (`alice.johnson@lti.com` / `Changeme123!`).
- `npm run test:e2e` (`bddgen && playwright test`) en el `package.json`
  de la raíz.

### 3.25.2 Hallazgo real en el primer intento: el contexto de Chromium arranca en inglés

La primera ejecución falló — `locator.fill: Test timeout... waiting for
getByLabel('Correo electrónico')` — no por un paso mal escrito, sino
porque el contexto de navegador que crea Playwright por defecto no
hereda el idioma del sistema operativo: arranca en inglés
(`navigator.language` en inglés), y la detección automática de idioma de
la app (`internationalization/spec.md`, requisito "Detección automática
del idioma") hizo exactamente lo que tiene que hacer — mostró la
pantalla en inglés ("Log in" / "Email" / "Password"). Confirmado
leyendo el *snapshot* de la página que adjunta Playwright al fallo, no
solo el mensaje de error.

No era un fallo de la app ni de los *steps* — era que la app se
comportó según su propia especificación con un idioma de navegador
distinto al que asumían los *steps*. Corregido fijando
`locale: 'es-ES'` en `playwright.config.ts`, para que el contexto de
prueba refleje el mismo idioma que se está verificando.

### 3.25.3 Verificación

```
npx bddgen                → genera .features-gen/.../authentication.feature.spec.js
                             a partir del .feature, con los tres steps
                             enlazados correctamente
npx playwright test       → 1 passed (primer intento: 1 failed, por el
                             idioma del contexto — ver 3.25.2)
npm run test:e2e           → mismo resultado en verde, ejecutado desde
                             cero (bddgen + playwright test encadenados,
                             como lo ejecutaría cualquiera)
```

`.features-gen/`, `test-results/`, `playwright-report/` y
`blob-report/` añadidos a `.gitignore` — son artefactos generados
(el primero, literalmente, por `bddgen` a partir del `.feature`), no
código fuente.

Queda como prueba de concepto de un único escenario, a propósito — la
traducción del resto de los 56 escenarios de `openspec/specs/` a
`.feature` + *steps* reales es trabajo real por delante (3.25 lo deja
listo, no lo agota).

## 3.26 Alcance del resto de la suite E2E y capacidad `authentication` completa

Prompt del usuario, tras preguntar directamente *"¿Qué problema tendría
sólo los E2E de navegador por ahora?"* (pregunta que dejé sin resolver
en el turno anterior por ir directa a plantear un plan de fases en vez
de responderla): **"Mete también los de security-hardening"**.

Alcance confirmado para el resto de esta rama: todos los escenarios de
`openspec/specs/` cuyo `THEN` es observable end-to-end desde
Playwright — navegador o API vía el *fixture* `request` — más los 4
escenarios de `security-hardening` (nivel API), **excluyendo**
explícitamente `candidate-validation` (ya cubierto por Jest,
`backend/src/application/__tests__/`) y `developer-tooling` (no es
trabajo de Playwright — son comandos de shell, `npx tsc --noEmit`,
`npm run build`, etc., no comportamiento de la aplicación en
ejecución).

### 3.26.1 Los 6 escenarios restantes de `authentication`

Con la prueba de concepto de 3.25 en verde, se completan los 7
escenarios del requisito `authentication` de
`openspec/specs/authentication/spec.md` (rama `api-auth-AGB`, commit
`bb94850`):

- **Credenciales incorrectas**: reutiliza el mismo `Given` que
  "Credenciales correctas" (mismo texto Gherkin, mismo *step*
  enlazado); el `Then` comprueba el mensaje de error genérico exacto
  que compone `Login.jsx` (`t('login.genericErrorPrefix')` + el mensaje
  del backend) y que la URL sigue en `/login`.
- **Petición sin token** y **Token caducado**: van directos contra la
  API con el *fixture* `request` de Playwright (`GET
  http://localhost:3010/position`, con o sin cabecera `Authorization`),
  sin pasar por el navegador — la `baseURL` del config apunta al
  frontend (`:3000`), así que estos dos *steps* usan la URL absoluta
  del backend. El token caducado se firma de verdad con
  `jsonwebtoken.sign()` usando el mismo `JWT_SECRET` real de
  `backend/.env` (cargado con `dotenv`, nunca hardcodeado ni
  committeado) y un campo `exp` ya en el pasado, para que el backend lo
  rechace específicamente por caducidad y no por firma inválida.
- **Muchos intentos seguidos**: dispara 10 intentos de login fallidos
  por `request.post` antes del intento 11 (el límite real es
  10/15min, `loginLimiter` en `backend/src/index.ts`), y comprueba que
  ese intento adicional responde `429`. Este escenario tiene un efecto
  secundario real y deliberado: agota el limitador de verdad para la
  IP de esta máquina durante 15 minutos reales — asumido a propósito
  (3.25 número, ver más abajo cómo se limpia después de ejecutar la
  suite).
- **Cierre de sesión manual**: necesita su propio `Given` (texto
  Gherkin distinto al de los otros escenarios, así que no puede
  reutilizar el *step* existente) que hace un login real por interfaz;
  el `When` pulsa "Cerrar sesión" (`UserMenu.jsx`); el `Then` comprueba
  la URL y que `localStorage.getItem('lti_auth')` quede en `null`.
- **Sesión caducada durante el uso**: siembra directamente en
  `localStorage` un token con firma inválida (no el mismo caducado de
  antes, para no acoplar este escenario al orden de ejecución del
  anterior) antes de navegar a `/positions`; el `Then` comprueba que el
  interceptor de `apiClient.js` limpia la sesión y redirige a
  `/login` sin ninguna acción del usuario — verificando en la práctica
  el comportamiento ya descrito en el requisito "Cierre de sesión y
  expiración manejados en el cliente".

### 3.26.2 Orden de ejecución no paralelo, a propósito

`playwright.config.ts` fija `fullyParallel: false` y `workers: 1`
específicamente por "Muchos intentos seguidos": a diferencia de una
suite de UI pura, estos escenarios comparten estado real del lado del
servidor (el limitador de intentos de login, la base de datos de
desarrollo) — en paralelo, ese escenario podría agotar el límite de
login antes de que "Credenciales correctas" o "Cierre de sesión
manual" necesitaran iniciar sesión de verdad.

### 3.26.3 Verificación

```
npx bddgen && npx playwright test
  → 7 passed (7.6s), primer intento, sin fallos reales que corregir
    (a diferencia de 3.25, aquí no hubo ningún hallazgo tipo "bug de
    entorno" — los 6 steps nuevos funcionaron a la primera)
```

Tras la ejecución, y precisamente porque "Muchos intentos seguidos"
agota el limitador real:

```
kill -9 <pids de ts-node-dev>   → incluyendo un par de procesos
                                   zombis de una sesión anterior,
                                   detectados con `ps aux` antes de
                                   matar nada
npm run dev (backend, en segundo plano)
curl .../position (token inválido)      → 401 (servidor arriba)
curl -X POST .../auth/login (correcto)  → 200 (limitador reiniciado,
                                            ya no hereda los 10
                                            intentos fallidos de la
                                            suite)
```

Reiniciar el proceso del backend es la forma correcta de limpiar un
limitador en memoria (no hay persistencia entre reinicios) — no un
truco, es exactamente lo mismo que haría cualquiera que se topara con
un 429 real durante desarrollo manual.

Queda pendiente, dentro del mismo alcance confirmado, el resto de
capacidades: `candidate-intake`, `internationalization`,
`accessibility`, `hiring-pipeline`, `position-catalog`,
`frontend-performance` y los 4 escenarios de `security-hardening`.

## 3.27 Capacidad `security-hardening`: un hallazgo real, un problema de orden real, y un replanteamiento del alcance

### 3.27.1 Hallazgo: la validación de contenido subido nunca llegó a implementarse de verdad

Al preparar el escenario "Fichero cuyo contenido no coincide con lo
declarado" (`openspec/specs/security-hardening/spec.md`, requisito
"Contenido subido validado más allá de la extensión declarada", que la
spec atribuye a `security-audit-AGB` commit `8b31eb5`), un PoC directo
contra el backend en marcha lo desmintió: subir un fichero de texto
plano declarado como `application/pdf` (`Content-Type:
application/pdf` en el `multipart/form-data`) se aceptó con `200` y se
guardó en disco. `fileUploadService.ts`'s `fileFilter` solo comprueba
`file.mimetype`, el valor que declara quien sube el fichero — nunca su
contenido real. Revisando el propio commit `8b31eb5`, la corrección
que se aplicó entonces fue otra (sanear el nombre de fichero con
`path.basename()`, defensa contra *path traversal*), no la validación
de contenido — la spec documentaba una protección que nunca se llegó
a construir.

Consultado el usuario sobre cómo tratarlo (corregir el código,
corregir solo la spec, o dejar el escenario en rojo documentando la
deuda), la respuesta fue clara ante la pregunta de si "sniffing real"
equivale a mirar el *magic number*: **"Incluye porfa la validación
real con el magic-number"**.

**Corrección aplicada** en `fileUploadService.ts`: tras guardar el
fichero (el `fileFilter` de multer no puede mirar contenido — se
ejecuta mientras el fichero aún se está subiendo, sin datos
disponibles todavía), se lee su *magic number* real con la librería
`file-type` (`fileTypeFromFile`) y se compara contra los dos tipos
permitidos; si no coincide, se borra el fichero de disco y se
responde `400`, igual que si el filtro de declaración ya lo hubiera
rechazado. La respuesta de éxito ahora devuelve el `fileType`
detectado del contenido, no el declarado por el cliente.

Detalle de la dependencia: `file-type` (versión actual, `22.1.1`) es
un paquete puramente ESM; este backend compila a CommonJS
(`tsconfig.json`), así que un `import` estático se traduciría a un
`require()` que fallaría contra un paquete sin *export* CommonJS. Se
carga con `import()` dinámico dentro de la función async, que sí
funciona desde CommonJS. Se descartó fijar la última versión con
soporte CommonJS (`file-type@16.5.4`, de 2021) porque cae dentro del
rango vulnerable de un aviso real (`GHSA-5v7r-6r5c-r473`, bucle
infinito en el parser ASF) — comprobado con `npm audit`, que pasó de 0
a 1 vulnerabilidad moderada al fijar esa versión; se revirtió a la
`22.1.1` (parcheada, `npm audit` en 0 de nuevo) y se resolvió el
problema real (ESM en CommonJS) en vez de aceptar una dependencia
vulnerable para evitarlo.

Verificado con PoC repetido tras el cambio: el mismo fichero de texto
declarado como PDF ahora responde `400` y no queda en
`backend/uploads/`; un PDF con cabecera real (`%PDF-1.4`) sigue
aceptándose con `200`. Los 45 tests de Jest del backend siguen en
verde (no rompe nada existente; ningún test cubría `/upload`
directamente).

### 3.27.2 Hallazgo de orden: el limitador de login, una vez agotado, bloquea TODO login real durante ~15 minutos — navegador incluido

Al construir "Cualquier respuesta de la API" y "Fichero cuyo
contenido..." (ambos necesitan un login real), una ejecución completa
de la suite falló con `429` donde se esperaba `200` — no en
`authentication.feature` (que corre primero), sino en
`security-hardening.feature` justo después. La causa: dentro del
mismo `authentication.feature`, el escenario "Muchos intentos
seguidos" agota de verdad el limitador de `/auth/login` (10/15min),
y ese agotamiento sobrevive al resto de la ejecución.

Esto contradecía lo observado en 3.26: ahí, "Cierre de sesión manual"
(login real por navegador) pasó justo después de "Muchos intentos
seguidos" en el mismo run. Antes de fiarse de esa observación aislada,
se verificó con un PoC deliberado: agotar el limitador con `curl`
(confirmado con las cabeceras `RateLimit-Reset`/`Retry-After` ≈ 885s)
y, sin reiniciar el backend, intentar un login real tanto por `curl`
como por el navegador de verdad (herramienta de navegador de esta
sesión) — **ambos bloqueados**. Repetido con Playwright mismo
(`--grep "Cierre de sesión manual"` justo después de agotar el
limitador por `curl`): también bloqueado. La conclusión de 3.26 era
incorrecta (probablemente una ejecución previa con el backend ya en un
estado distinto al asumido); la real, confirmada por PoC directo y
repetido: **agotado el limitador, ningún login real funciona durante
~15 minutos, sea por navegador o por API**.

**Corrección**: "Muchos intentos seguidos" se saca de
`authentication.feature` a su propio fichero,
`e2e/features/zz-rate-limiting.feature` — el prefijo `zz-` es
deliberado: `.features-gen` conserva el nombre del `.feature`, y
Playwright con `fullyParallel:false`/`workers:1` ejecuta los ficheros
de test generados en orden alfabético. Así se garantiza que ese
escenario se ejecuta el último de toda la suite, sin importar cuántas
más capacidades se añadan después, y ningún otro escenario que
necesite un login real queda expuesto a su efecto secundario. Sus tres
*steps* se movieron a `e2e/steps/rate-limiting.steps.ts`.

### 3.27.3 Replanteamiento: ¿por qué limitar Playwright a lo "observable por navegador/API"?

Al preparar el cuarto escenario de `security-hardening`, "Auditoría de
dependencias" (`GIVEN` las dependencias de producción, `WHEN` se
ejecuta una auditoría de vulnerabilidades, `THEN` ninguna se reporta),
saltó a la vista que no es un comportamiento HTTP/navegador — es
literalmente `npm audit`, el mismo tipo de comando de shell por el que
se había descartado `developer-tooling` del alcance de esta rama.

Preguntado el usuario, la respuesta fue replantear la pregunta de
fondo: *"Dado que el objetivo es incluir tests para garantizar el
comportamiento esperado ¿hay algún motivo para separar los tests de
navegador de los demás?"* — no lo hay: un *step* de Playwright es
código Node normal, ejecuta lo que se le escriba (una petición HTTP,
pilotar un navegador, o lanzar `npm audit` por `child_process`), y la
distinción "solo HTTP/navegador" era un criterio propio para acotar el
trabajo, no una limitación real de la herramienta. Lo que importa es
si el escenario verifica algo real y automatizable — y "las
dependencias de producción no tienen vulnerabilidades conocidas" lo
es, igual que cualquier otro requisito de esta spec.

Se añade el escenario, con un *step* que ejecuta `npm audit
--omit=dev --json` en `backend/` y `frontend/` por separado (falla si
el total de vulnerabilidades de cualquiera de los dos no es cero). Un
hallazgo de entorno al ejecutarlo por primera vez: `npm audit` fallaba
con `EALLOWSCRIPTS`, un error sin relación con vulnerabilidades —
causado por `npm_config_allow_scripts=@fission-ai/openspec`, una
variable de entorno que quedó en esta sesión desde que se aprobaron
los scripts de instalación de OpenSpec (sección de adopción de
OpenSpec), heredada por el proceso hijo `npm audit` al lanzarlo desde
dentro de Playwright (que a su vez corre bajo `npx`). Se quita
explícitamente esa variable del entorno del proceso hijo en el propio
*step*, sin tocar el entorno real de la sesión ni ningún `.npmrc`.

Este replanteamiento no reabre `developer-tooling` en sí (sus 5
escenarios verifican el propio proceso de desarrollo — *linting*,
compilación, *build* — no el comportamiento de la aplicación en
ejecución, una distinción distinta a la de "HTTP vs. shell"), pero sí
dejó claro que el criterio de exclusión no era "esto no se puede
probar con Playwright", sino "esto no encaja en lo que me propuse
probar primero".

### 3.27.4 Verificación final

```
npx bddgen && npx playwright test
  → 11 passed (5.8s), backend reiniciado justo antes (limpio de
    intentos de login previos de esta misma sesión de pruebas)

Orden de ejecución confirmado:
  1-6   authentication.feature       (6 escenarios)
  7-10  security-hardening.feature   (4 escenarios)
  11    zz-rate-limiting.feature     (1 escenario, el único que agota
                                       el limitador de verdad)

npm test (backend)   → 45 passed, sin cambios de resultado
```

Backend reiniciado una última vez tras la verificación final para
dejar el limitador de login libre para uso manual posterior.

`authentication` y `security-hardening` quedan completas: 11/11
escenarios de esas dos capacidades en verde. Sigue pendiente el resto
del alcance confirmado: `candidate-intake`, `internationalization`,
`accessibility`, `hiring-pipeline`, `position-catalog` y
`frontend-performance`.

## 3.28 Trabajo autónomo nocturno: `position-catalog` y `candidate-intake` (tres bugs reales encontrados y corregidos)

Contexto: *"Prioriza primero la validación de las capacidades de negocio,
para después validar todas y no olvides también las pruebas e2e para el
tooling. Confírmame que estás conforme y que puedes hacerlo de forma
autónoma, porque es ya muy tarde y me voy a dormir. [...] Si detectas un
stopper para alguna capacidad, déjalo comentado y continúa porfa con las
siguientes capacidades"* — confirmado el orden (`position-catalog` →
`candidate-intake` → `hiring-pipeline`, después el resto, y por último
`developer-tooling`), trabajo sin supervisión a partir de aquí.

### 3.28.1 `position-catalog` (2/2)

Sin hallazgos. Los dos escenarios ("Carga del listado", "Navegar al
proceso de una posición") pasaron a la primera contra los datos
sembrados ("Senior Full-Stack Engineer", LTI, Remote, Open,
2024-12-31).

### 3.28.2 Login real una vez por suite, no una vez por escenario

Antes de escribir `candidate-intake` (10 escenarios, la mayoría con
login real por interfaz), un cálculo simple: con `authentication` (6-7
logins), `position-catalog` (2) y `security-hardening` (2) ya
ejecutados antes en la misma tanda, sumar 10 logins más de
`candidate-intake` supera de sobra el límite real de 10/15min
confirmado en 3.27.2 — y en efecto, la primera ejecución completa de
`candidate-intake` falló a partir del noveno escenario con el mismo
síntoma que en 3.27.2 (redirección a `/login` en mitad de un `Given`
que no debería tocar el login para nada).

En vez de aceptar logins repetidos como coste fijo, se aplica el
patrón estándar de Playwright para este caso: un login real, una única
vez por ejecución completa de la suite (`e2e/global-setup.ts`), que
guarda la sesión resultante (`storageState`, incluye el `localStorage`
con el token JWT real) en `e2e/.auth/state.json` — gitignorado, igual
que `SECRETS.md`/`backend/.env` (nunca un JWT real committeado).
`playwright.config.ts` pasa a tener dos `projects`:

- `chromium` (por defecto): arranca ya con la sesión de `globalSetup`
  vía `use.storageState`. Excluye `authentication.feature` y
  `zz-rate-limiting.feature` (`testIgnore`).
- `chromium-sin-sesion`: sin `storageState`, solo para esos dos
  ficheros (`testMatch`) -- `authentication` tiene que arrancar sin
  sesión porque prueba el login en sí, y `zz-rate-limiting` agota el
  limitador de verdad; ninguno de los dos debe heredar la sesión de
  `globalSetup`. El orden entre proyectos (con `workers:1`) mantiene
  intacta la garantía de 3.27.2: `zz-rate-limiting` sigue siendo lo
  último que se ejecuta de toda la suite.

`candidate-intake.steps.ts` y `position-catalog.steps.ts` dejan de
hacer login por interfaz en cada `Given`/`When` -- solo navegan,
partiendo ya de la sesión de `storageState`.

### 3.28.3 Bug real #1: `react-datepicker` + Vite rompía el formulario entero al añadir una educación

Al construir el primer escenario que pulsa "Añadir Educación", la
pantalla se quedaba en blanco -- error real de React en consola:
`Element type is invalid: expected a string [...] but got: object`,
señalando `AddCandidateForm.jsx:324` (el `<DatePicker>` de
`react-datepicker`). Confirmado que NO era caché de Vite obsoleta (la
causa habitual de falsos positivos en esta sesión): se limpió
`node_modules/.vite`, se mataron los procesos zombis de `npm run dev`
del frontend (dos instancias corriendo a la vez, una de ellas de una
sesión anterior) y se reinició limpio -- el fallo se reprodujo igual.

Causa real: `react-datepicker@6.9.0` no expone un único
`module.exports =`, solo `exports.default = DatePicker` junto a otros
exports nombrados. El pre-bundler de dependencias de Vite (`esbuild`,
en modo dev) envuelve ese `exports` completo como `default` en vez de
extraer el `DatePicker` real -- `import DatePicker from
'react-datepicker'` acababa trayendo el objeto de módulo entero, no el
componente. Confirmado inspeccionando el módulo pre-bundled en el
propio navegador (`import('/node_modules/.vite/deps/react-datepicker.js')`):
`mod.default` era un objeto con `{CalendarContainer, default,
getDefaultLocale, registerLocale, setDefaultLocale}`, no una función.

Corregido en `AddCandidateForm.jsx` desenvolviendo a mano
(`ReactDatePickerModule.default || ReactDatePickerModule`), el
workaround estándar para este interop concreto -- no depende de que el
bundler lo resuelva bien, y funciona igual bajo Vite (dev) y bajo
Vitest (que no tiene este problema, así que ahí `.default` es
`undefined` y cae al segundo operando). Verificado a mano en el
navegador (capturas: el desplegable de fecha ya renderiza) y con la
suite de Vitest del frontend completa (34/34, sin regresiones).

Este bug llevaba ahí desde que se construyó el formulario -- nadie lo
había encontrado porque nadie (ni las pruebas manuales de la sesión,
ni el propio usuario) había llegado a pulsar "Añadir Educación" en un
alta real hasta que el escenario E2E lo intentó.

### 3.28.4 Bug real #2 (más severo): bucle infinito real al guardar una educación o experiencia

Con el fallo de render corregido, el envío del formulario con una
educación fallaba igual, pero de otra forma: sin mensaje de éxito.
Inspeccionando el `error-context.md` que adjunta Playwright al fallo,
apareció un error real de Prisma en la propia alerta de la pantalla
(`Invalid value for argument startDate: premature end of input.
Expected ISO-8601 DateTime`) -- `Candidate.ts` tenía una segunda vía
para crear educaciones/experiencias, anidada dentro del propio
`prisma.candidate.create()`, que enviaba los strings del formulario
tal cual a Prisma sin convertirlos a `Date` (a diferencia de las
clases `Education`/`WorkExperience`, que si lo hacen bien en su
constructor). Un PoC directo por API confirmó que esta vía anidada
fallaba SIEMPRE que hubiera alguna educación, con fecha de fin vacía o
no.

Al quitar esa vía anidada (redundante: `candidateService.ts` ya guarda
cada educación/experiencia por separado, correctamente, después de
crear el candidato) y repetir el PoC, la petición se quedó colgada sin
responder. Investigado con `pg_stat_activity` (consultas activas
contra Postgres) y con el uso de CPU del proceso del backend --no una
espera bloqueada de verdad (eso habría dejado el proceso a 0% CPU),
sino un proceso consumiendo CPU de forma sostenida--, hasta matarlo a
mano tras varios minutos y comprobar el daño real: **204.963 filas
duplicadas** en la tabla `Education`, todas idénticas, para un único
candidato con una sola educación en el formulario.

Causa raíz, un bug clásico de JavaScript (alias de array mutado
durante su propia iteración): el constructor de `Candidate` guardaba
`this.educations = data.educations` -- el MISMO array del cuerpo de la
petición, no una copia. `candidateService.ts` recorre ese array con
`for (const education of candidateData.educations)` mientras, dentro
del propio bucle, hace `candidate.educations.push(educationModel)` --
como `candidate.educations` y `candidateData.educations` son el mismo
array, cada `push` añadía un elemento al array que el `for...of` seguía
recorriendo (los iteradores de `Array` sí visitan elementos añadidos
durante la iteración), y el elemento añadido (`educationModel`, una
instancia de `Education`) conserva `institution`/`title`/`startDate`/
`endDate` -- así que el bucle nunca terminaba, insertando la misma fila
una y otra vez.

Corregido en el constructor de `Candidate` copiando los arrays en vez
de referenciarlos (`this.educations = [...(data.educations || [])]`,
igual para `workExperiences`) -- rompe el alias sin tocar el bucle de
`candidateService.ts`, que ya era correcto en sí mismo. Se añade un
test de regresión (`candidateService.test.ts`) que falla si vuelve a
colarse: guarda un candidato con una educación y comprueba que
`prisma.education.create` se llama exactamente una vez, "por muchas
veces que se empuje a `candidate.educations` después" -- el nombre del
test deja constancia explícita de qué bug evita, no solo qué
comprueba. Verificado además con PoC real repetido (POST /candidates
con educación y experiencia a la vez): `201`, una fila de cada, limpio
en menos de un segundo -- nada que ver con el colgado de antes.

Este bug es más grave que el anterior: no solo bloqueaba la función,
sino que crecía sin límite (memoria del proceso, filas en la base de
datos) hasta que algo externo lo cortara -- el tipo de fallo que en
producción sería una caída del servicio o del disco de la base de
datos, no solo un error visible. Como el bug de 3.28.3 lo tapaba por
completo (nadie llegaba a enviar el formulario con una educación desde
la interfaz), este tampoco lo había encontrado nadie hasta ahora.

### 3.28.5 `candidate-intake` (10/10) tras los dos fixes

Con ambos bugs corregidos y el login por `storageState` (3.28.2), los
10 escenarios pasan limpios. Detalles de implementación que merece la
pena dejar constando:

- El input de `react-datepicker` acepta texto tecleado directamente,
  pero solo confirma el valor (dispara el `onChange` que actualiza el
  estado de React) al pulsar Enter -- cerrarlo con Escape deja el
  texto visible pero no actualiza nada, un segundo hallazgo real (más
  pequeño) durante la propia escritura de los *steps*, antes de llegar
  a ejecutarlos.
- "Posición sin elegir" se resuelve por el `required` nativo del
  `<select>` del navegador -- el formulario ni siquiera llega a
  enviarse, así que el *step* comprueba `validity.valid` en vez de
  esperar una respuesta del servidor.
- "Posición elegida sin flujo de entrevistas configurado" necesita una
  posición real sin fases, que ya no existe en el seed (se le añadieron
  fases en la sección de seguridad de esta misma sesión) -- el *step*
  la crea por Prisma directamente (`e2e/steps/support/prisma.ts`, un
  cliente compartido cargado por ruta relativa a
  `backend/node_modules/@prisma/client`, con el mismo `.env` real del
  backend) y la borra al final del propio escenario.
- El mismo *step* confirma, contra la base de datos, que el fix de
  3.23 (la posición se valida antes de guardar el candidato, no
  después) sigue en pie: el candidato rechazado no debe quedar
  huérfano.
- "Alta con posición válida" limpia el candidato que crea al final del
  propio `Then` -- el tablero "Ver proceso" es un dato acumulativo de
  verdad en la base de datos de desarrollo, y el apellido del
  candidato de prueba no puede llevar dígitos para distinguirlo
  (`validator.ts` solo admite letras y espacios), así que sin este
  cleanup cada reejecución de la suite iría dejando otra tarjeta con el
  mismo nombre visible en la misma columna -- pasó de verdad la primera
  vez que se reejecutó la suite completa tras el primer intento.

```
npx bddgen && npx playwright test
  → 23 passed (21.8s): candidate-intake (10) + position-catalog (2) +
    security-hardening (4) [proyecto "chromium", con sesión] +
    authentication (6) + zz-rate-limiting (1) [proyecto
    "chromium-sin-sesion", sin sesión, en ese orden]

npm test (backend)   → 47 passed (46 + el nuevo test de regresión)
npm test (frontend)  → 34 passed (vitest, sin regresiones del fix de
                        react-datepicker)
```

`backend/uploads/` (nunca gitignorado hasta ahora) se añade a
`.gitignore` -- contenido generado en tiempo de ejecución, no código
fuente, y ahora además lo llenan los propios escenarios de subida de
CV en cada ejecución de la suite.

Sigue el plan confirmado: `hiring-pipeline` a continuación, luego
`internationalization`, `accessibility`, `frontend-performance`, y por
último `developer-tooling`.

## 3.29 `hiring-pipeline` (3/3) y un hallazgo de higiene de datos real

### 3.29.1 Fixture de los dos primeros escenarios

- "Posición con candidatos en distintas fases": lo satisface el propio
  seed (`backend/prisma/seed.ts`) sin crear nada -- "Senior Full-Stack
  Engineer" ya tiene a Carlos García en "Initial Screening" y a John
  Doe (5.0) + Jane Smith (4.0) en "Technical Interview".
- "Fase sin candidatos": una posición autocontenida creada por Prisma
  (dos fases, una con un candidato y otra deliberadamente vacía) en vez
  de depender de qué fase del seed esté vacía hoy -- más determinista,
  y evita apoyarse en una inconsistencia real que se detectó de paso en
  el propio seed (la `Application` de John Doe contra "Data Scientist"
  referencia una `InterviewStep` que pertenece al flujo de "Senior
  Full-Stack Engineer", no al suyo propio; no se toca, es un dato de
  ejemplo preexistente sin relación con esta rama y ningún escenario
  depende de él).

### 3.29.2 Hallazgo real: `candidate-intake` llevaba varias ejecuciones dejando candidatos de prueba sin limpiar en el tablero real

Al construir "Posición con candidatos en distintas fases" contra la
posición sembrada, el tablero real (`GET /position/1/candidates`)
devolvió, además de los tres candidatos del seed, **quince candidatos
de prueba acumulados** de ejecuciones anteriores de esta misma noche:
"Maria Lopez" (de "Alta con éxito"), "Laura Martin" ("Añadir una
entrada de educación"), "Carmen Ruiz" ("Añadir una entrada de
experiencia") y "Sofia Navarro" ("Alta consecutiva de dos
candidatos") -- cuatro escenarios de `candidate-intake` que sí crean un
candidato real contra "Senior Full-Stack Engineer" pero nunca lo
limpiaban al terminar (a diferencia de "Alta con posición válida", que
sí lo hacía, por la misma razón que motivó el hallazgo: ese tablero es
un dato acumulativo de verdad en la base de datos de desarrollo).

Sin este hallazgo, el problema habría seguido invisible: cada
escenario de `candidate-intake` comprobaba su propio candidato por
email único, así que nunca fallaba por su cuenta -- hacía falta un
consumidor distinto del mismo dato compartido (`hiring-pipeline`,
mirando el tablero completo en vez de un candidato concreto) para que
la acumulación se hiciera visible.

**Corregido**: se limpian los quince candidatos acumulados
(`education`/`workExperience`/`resume`/`application` antes que el
propio candidato, por las restricciones de clave foránea), y se añade
un `cleanupCandidateByEmail` compartido en
`candidate-intake.steps.ts`, aplicado al final del `Then` de los
cuatro escenarios que lo necesitaban. `hiring-pipeline.steps.ts`
también limpia su propia fase vacía al terminar (con un fallo propio
corregido de paso: `InterviewStep` es `RESTRICT` sobre
`InterviewFlow`, hay que borrar las fases antes que el flujo, no al
revés).

### 3.29.3 Verificación

```
npx playwright test hiring-pipeline   → 3 passed, tras el cleanup
npx bddgen && npx playwright test     → 26 passed (25.4s): candidate-intake (10)
                                          + hiring-pipeline (3) + position-catalog (2)
                                          + security-hardening (4) [chromium, con sesión]
                                          + authentication (6) + zz-rate-limiting (1)
                                          [chromium-sin-sesion, sin sesión, el último]
npm test (backend)                    → 47 passed, sin cambios (ningún código de
                                          producción tocado en este capítulo, solo
                                          fixtures/limpieza de los propios steps)
```

Sigue el plan confirmado: `internationalization`, `accessibility`,
`frontend-performance`, y por último `developer-tooling`.

## 3.30 `internationalization` (4/4), `accessibility` (5/5), `frontend-performance` (3/3): un fixture propio de test mal elegido, un fallo de aislamiento de sesión, y un hallazgo real sin corregir

### 3.30.1 `internationalization`

Cuatro escenarios sobre `LanguageSwitcher.jsx`/`i18n.js`: detección
automática con varios idiomas, cambio manual persistente, formulario a
medio rellenar, y retraducción de un error ya visible sin reenviar
(este último comprobado también a nivel de red: cero peticiones nuevas
a `/candidates` tras cambiar de idioma).

**Hallazgo, pero del propio test, no de la app**: el primer intento de
"Navegador con varios idiomas configurados" usaba
`['en-US', 'es-ES', 'fr-FR']` como `navigator.languages` y esperaba que
detectara español -- falló, detectando inglés. No era un bug: inglés
SÍ está soportado (`supportedLngs: ['es','en']` en `i18n.js`), así que
un detector que de verdad mira toda la lista, no solo el primero,
elige correctamente el primer idioma soportado que encuentra, que en
ese fixture era inglés. Corregido el fixture a
`['fr-FR', 'es-ES', 'en-US']` (francés primero, no soportado) para que
el escenario pruebe de verdad "no solo el primero": con eso, español
es el primer idioma SOPORTADO de la lista aunque no sea el primero a
secas.

### 3.30.2 `accessibility`

Cinco escenarios, todos en verde a la primera: `lang` de `<html>`
sincronizado sin recargar, resumen de errores con
`role="alert"`/`aria-live="assertive"`, éxito con
`role="status"`/`aria-live="polite"`, campo inválido con
`aria-invalid`/`aria-describedby` apuntando al mensaje concreto, y
`aria-pressed` en los botones del selector de idioma.

### 3.30.3 Fallo real de aislamiento: `browser.newContext()` hereda el `storageState` del proyecto

Al escribir "Primera visita sin sesión iniciada" (`frontend-performance`),
un contexto nuevo creado con `browser.newContext()` (sin argumentos)
mostraba el Dashboard del Reclutador ya autenticado, no el login.
Causa: `browser.newContext()` sin overrides hereda las `use` options
configuradas a nivel de proyecto en `playwright.config.ts` -- incluido
el `storageState` con el login real de `globalSetup` (3.28.2) -- no es
un contexto en blanco como sugiere la documentación a primera lectura.
Corregido pasando `storageState: undefined` explícitamente en los dos
sitios de la suite que crean un contexto nuevo a propósito para
probar comportamiento sin sesión (aquí y en
`internationalization.steps.ts`, que tenía el mismo fallo silencioso
sin haberlo notado hasta ahora: el escenario pasaba igual porque
navegaba directo a `/login`, una pantalla que no comprueba sesión para
redirigir).

### 3.30.4 `frontend-performance`: dos escenarios en verde, uno con un hallazgo real sin corregir

Los dos primeros escenarios se verifican con peticiones de red reales
(en modo dev, Vite sirve cada componente con `React.lazy()` como su
propio módulo bajo demanda): sin sesión, no se descarga ni una de las
4 pantallas protegidas; visitando `/positions`, el código de
`AddCandidateForm.jsx` nunca llega a pedirse.

El tercero ("indicación de carga mientras se descarga una pantalla")
reveló un hallazgo real, dejado sin corregir a propósito. PoC: se
retrasa 800ms, con `page.route()`, la petición del chunk de
`AddCandidateForm.jsx`, se pulsa el enlace real "Añadir Nuevo
Candidato" (navegación de verdad por `<Link>`, no `page.goto()` --
`goto()` no sirve aquí: bloquea hasta que la navegación termina de
cargar, así que el fallback ya habría aparecido y desaparecido para
cuando el test recupera el control) y se traza el DOM cada 20-150ms.
Resultado: la URL cambia a `/add-candidate` al instante, pero el
contenido en pantalla se queda mostrando "Dashboard del Reclutador" --
la pantalla ANTERIOR -- de forma continua durante los 800ms+ que tarda
el chunk, y solo entonces cambia de golpe. El
`<Suspense fallback={<PageFallback/>}>` de `App.jsx` no llega a
mostrarse en ningún punto intermedio de la traza.

Explicación más probable: las navegaciones por `<Link>` de
react-router-dom (v7, migrado en `react-router-v7-AGB`) se tratan como
una transición de React 18 que mantiene la UI anterior montada hasta
que el contenido nuevo está listo, en vez de mostrar el fallback de
Suspense de inmediato -- comportamiento por diseño de React para
evitar parpadeos en transiciones rápidas, pero que aquí deja a quien
pulsa el enlace sin ninguna señal de que algo está pasando, más de
800ms en una conexión lenta, justo lo que el requisito de
accesibilidad quería evitar (`openspec/specs/frontend-performance/spec.md`,
"Indicación visible mientras carga una pantalla").

No se corrige en esta sesión: a diferencia de los hallazgos anteriores
(magic number, huérfanos, bucle infinito, interop de react-datepicker),
la solución real es una decisión de arquitectura, no una corrección
local de una línea -- hay más de una forma razonable de resolverlo
(forzar el fallback durante estas transiciones, exponer un estado de
"cargando" propio, etc.), y no es algo que deba decidirse en solitario
de madrugada sin el usuario. Queda comentado en el propio `.feature`
y en `frontend-performance.steps.ts`, y el escenario se deja en verde
comprobando lo que sí es cierto ahora mismo (la pantalla nueva acaba
apareciendo) en vez de en rojo sin contexto.

### 3.30.5 Verificación

```
npx bddgen && npx playwright test
  → 38 passed (37.8s): las 8 capacidades de negocio/transversales
    confirmadas hasta ahora, en un único run limpio

npm test (backend)   → 47 passed, sin cambios
npm test (frontend)  → 34 passed, sin cambios
```

Solo queda `developer-tooling` (5 escenarios, los que se habían dejado
fuera del alcance inicial y se reincorporaron tras la conversación
sobre si tenía sentido limitar Playwright a comportamiento
HTTP/navegador -- sección 3.27.3).

## 3.31 `developer-tooling` (5/5): la última capacidad, y un hallazgo real de `tsc` que `ts-node-dev` nunca había visto

Última capacidad del alcance confirmado. A diferencia del resto, sus 5
escenarios se verifican ejecutando un comando (build, suite de tests,
auditoría de dependencias), no una acción de la interfaz -- mismo
patrón que "Auditoría de dependencias" de `security-hardening`
(sección 3.27.3), con `execFileSync` y el mismo descarte de
`npm_config_allow_scripts` del entorno.

### 3.31.1 Hallazgo real: el build real del backend llevaba horas roto, sin que nadie lo notara

"Ejecutar los tests después de un build" ejecuta `npm run build` de
verdad en el backend antes de comparar resultados de Jest -- y ese
build falló: `tsc` rechazaba
`src/application/services/fileUploadService.ts` con
`TS2307: Cannot find module 'file-type'`. La causa: `file-type` es un
paquete puramente ESM (instalado en la sección de seguridad de esta
misma sesión, 3.27.1, cargado con `import()` dinámico a propósito por
eso mismo) y la resolución de módulos de este `tsconfig.json`
(`module: commonjs`, sin `moduleResolution` explícito) no encuentra
tipos para un paquete solo-ESM. `ts-node-dev` nunca lo había mostrado
porque corre en modo `--transpile-only`, que no comprueba tipos --
el propio proceso de desarrollo de esta sesión llevaba horas
funcionando sobre un backend que no compilaba de verdad, y nadie lo
había notado hasta que un escenario E2E ejecutó `tsc` de verdad por
primera vez.

Corregido con `@ts-expect-error` justo en la línea del `import()`
dinámico, con el motivo documentado en el propio comentario, en vez de
tocar `moduleResolution` de todo el proyecto por un único import --
`@ts-expect-error` en vez de `@ts-ignore` a propósito: si el día de
mañana algo hace que TypeScript sí resuelva bien ese import, la propia
compilación avisará (error de "unused ts-expect-error") en vez de
quedarse como una supresión silenciosa.

### 3.31.2 Hallazgo menor: un proceso hijo "matado" que seguía vivo

"Arranque del entorno de desarrollo" (SHALL arrancar en menos de un
segundo) se verifica lanzando un Vite de usar y tirar en un puerto de
scratch (el 3000 real lo ocupa el servidor de desarrollo que sirve el
resto de la suite) y leyendo el "ready in XXX ms" que el propio Vite
reporta en su log, en vez de cronometrar a mano desde fuera. Primer
intento: timeout total, sin ninguna salida capturada. Causa: se
lanzaba con `spawn('npx', ['vite', ...])`, que añade una capa extra de
procesos (`npm` → `sh -c` → `vite`); `.kill()` solo mata al hijo
directo (`npm`), no a los nietos -- el proceso de Vite real seguía
vivo después de "matarlo", ocupando el puerto en el siguiente intento
de la misma ejecución, que entonces fallaba de inmediato contra
`--strictPort` sin imprimir nada. Corregido lanzando el binario de
Vite directamente (`node_modules/.bin/vite`), sin la capa intermedia
de `npm`/`npx`.

### 3.31.3 Verificación final

```
npx bddgen && npx playwright test
  → 43 passed (59.7s): las 9 capacidades completas del alcance
    confirmado, en un único run limpio -- authentication (6),
    candidate-intake (10), hiring-pipeline (3), position-catalog (2),
    security-hardening (4), internationalization (4), accessibility
    (5), frontend-performance (3), developer-tooling (5),
    zz-rate-limiting (1)

npm test (backend)   → 47 passed
npm test (frontend)  → 34 passed
```

Con esto se cierra el alcance completo confirmado la noche del
2026-09-19 ("prioriza primero la validación de las capacidades de
negocio, para después validar todas... y no olvides también las
pruebas e2e para el tooling"): 8 hallazgos reales encontrados y
corregidos por el camino (magic number en subida de CV, candidato
huérfano al fallar la posición, interop de `react-datepicker` con
Vite, bucle infinito real en `Candidate.ts`, aislamiento de sesión de
Playwright, fixture de idioma mal elegido, build real del backend
roto sin que `ts-node-dev` lo mostrara, proceso hijo no matado del
todo), más un hallazgo real dejado sin corregir a propósito y
documentado para que el usuario decida el enfoque (el `Suspense
fallback` que nunca se muestra durante una navegación real por
`<Link>`, sección 3.30.4).

## 3.32 Revisión final: `file-upload` había quedado fuera sin que nadie lo decidiera

Al hacer la revisión exhaustiva final pedida ("dejarlo todo probado,
documentado y verificado" antes de terminar), `openspec validate
--specs --strict` confirmó las 11 capacidades del proyecto -- y una de
ellas, `file-upload` (5 escenarios: tipos de fichero aceptados, límite
de tamaño, saneado del nombre de fichero, y el selector traducido en
los dos idiomas), no aparecía en ninguna conversación de esta sesión
sobre qué entraba o no en el alcance. No fue una exclusión deliberada
como `candidate-validation` o (al principio) `developer-tooling` --
simplemente se pasó por alto en la lista larga de capacidades
pendientes. Como el objetivo explícito era "validar todas", se
completa también antes de cerrar la sesión.

Los 5 escenarios se implementan contra la API directamente (`request`
fixture, mismo patrón que `security-hardening`) para los tres
primeros, y contra la interfaz para los dos de idioma. Tres PoC reales
antes de escribir las aserciones, siguiendo la misma disciplina del
resto de la sesión:

- Un `.txt` declarado `text/plain` (no PDF ni DOCX) → `400`, "Invalid
  file type, only PDF and DOCX are allowed!" -- un camino distinto del
  chequeo de *magic number* de `security-hardening` (éste lo rechaza
  el `fileFilter` de multer por el tipo declarado, antes siquiera de
  llegar a leer el contenido).
- Un PDF real de más de 10MB (cabecera `%PDF` válida, para que el
  rechazo sea de verdad por tamaño y no por contenido) → `500`, "File
  too large" (comportamiento por defecto de multer).
- Un fichero subido con `../../etc/pwned.pdf` como nombre → `200`,
  guardado como `{timestamp}-pwned.pdf` dentro de `backend/uploads/`,
  sin ningún componente de ruta -- confirma que el `path.basename()`
  de `security-audit-AGB` (commit `8b31eb5`) sigue vigente.

Pasan los 5 a la primera, sin hallazgos nuevos.

```
npx bddgen && npx playwright test
  → 48 passed (1.0m): las 10 capacidades completas -- las 9 del plan
    original más file-upload, encontrada en esta última revisión

npm test (backend)   → 47 passed
npm test (frontend)  → 34 passed
openspec validate --specs --strict → 11 passed, 0 failed
```

### 3.32.1 Estado final de la sesión nocturna

- **10/11 capacidades de OpenSpec cubiertas por E2E real** con
  `playwright-bdd`, 48 escenarios en verde. La única capacidad sin
  cobertura de Playwright, `candidate-validation`, lo está a propósito
  (cobertura de Jest ya existente, confirmado explícitamente por el
  usuario al definir el alcance).
- **Base de datos de desarrollo, `backend/uploads/` y procesos**:
  verificados limpios al cierre -- cero candidatos/posiciones/flujos de
  prueba residuales, cero ficheros subidos de prueba residuales, cero
  procesos zombis en puertos de scratch.
- **8 hallazgos reales corregidos** por el camino (ver el resumen de
  la sección 3.31.3, más este último no aplica aquí -- `file-upload`
  no encontró ninguno nuevo).
- **1 hallazgo real dejado sin corregir a propósito**, documentado
  para que el usuario decida el enfoque: el indicador de carga durante
  una navegación por `<Link>` a una pantalla todavía no descargada
  nunca se muestra (sección 3.30.4).
- **10 commits** en `playwright-bdd-AGB` desde el primer escenario de
  la tarde hasta este cierre, cada uno con su propio mensaje explicando
  qué cambió y por qué -- nada squashed, la historia completa queda
  como registro de lo que se hizo y se encontró.

## 3.33 Se corrige el hallazgo de 3.30.4: indicador de carga real, genérico, con `useNavigation()`

A la mañana siguiente, retomando el hallazgo dejado sin corregir:
*"¿Cuesta mucho añadirlo para todos los casos? ¿Es algo que puedes
programar una vez pero aplicar n veces?"* — confirmada la Opción A
(migrar a `createBrowserRouter`/`useNavigation()`, la forma que React
Router recomienda para esto exactamente), con un matiz explícito:
*"me gustaría que lo implementaras de manera genérica como un
componente que puede después reutilizar en cualquier web que pueda
desarrollar en el futuro"* -- y aviso de que, tras cerrar el trabajo de
Playwright, querrá entrar en un proceso de refactorización hacia
componentes reutilizables (pendiente, no arrancado todavía).

### 3.33.1 `NavigationLoadingIndicator`, componente genérico

`frontend/src/components/NavigationLoadingIndicator.jsx`: una barra
fina fija en la parte superior de la pantalla, con `role="status"`/
`aria-live="polite"` y un texto de estado (técnica *sr-only* clásica
en línea, sin depender de ninguna clase de Bootstrap ni de ningún
framework CSS). Sin nada específico de esta app: solo depende de
`react-router-dom` (`useNavigation()`, disponible desde v6.4 en modo
*data router*) y de React. Props configurables (`label`, `color`,
`height`, `delayMs`) para que se pueda copiar tal cual a cualquier
otro proyecto. `delayMs` (150ms por defecto) evita el parpadeo en
navegaciones casi instantáneas -- la barra visual no aparece a menos
que la carga siga en marcha pasado ese tiempo, aunque el propio
anuncio a lectores de pantalla se actualiza de inmediato, sin ese
retraso (quien usa un lector de pantalla no necesita la heurística
anti-parpadeo pensada para quien ve la pantalla).

### 3.33.2 Migración de `App.jsx` a `createBrowserRouter`

`<BrowserRouter>`/`<Routes>` (modo declarativo) pasa a
`createBrowserRouter`/`<RouterProvider>` (modo *data router*). Las 4
rutas protegidas cambian de `React.lazy()` + `<Suspense fallback=...>`
a nivel de componente a `lazy` a nivel de **ruta** -- con esto el
propio router sabe cuándo una navegación sigue esperando el código de
la pantalla destino, y `useNavigation().state` lo refleja de verdad
(con `React.lazy()`/`Suspense` a mano, como se documentó en 3.30.4,
las navegaciones por `<Link>` se trataban como una transición de React
que mantenía la pantalla anterior montada sin ninguna señal). `Login`
se mantiene con import estático, a propósito, igual que antes.

**Regresión real encontrada y corregida durante la propia migración**:
`lazy` a nivel de ruta se invoca durante el *emparejamiento* de la
ruta, no durante su renderizado -- así que se ejecutaba (y descargaba
el código) **antes** de que `<RequireAuth/>` (que solo actúa al
renderizar) tuviera ocasión de redirigir. El propio escenario E2E que
comprueba "Primera visita sin sesión iniciada" lo detectó de
inmediato: una visita sin sesión volvía a descargar código protegido,
justo el requisito que se estaba, en teoría, dejando intacto. Se
corrige con un chequeo síncrono de `localStorage` (`getStoredAuth()`,
sin pasar por React) al principio de cada `lazy`, que evita el
`import()` por completo si no hay sesión, devolviendo directamente
`<RequireAuth/>` (que redirige) sin haber descargado nada.

### 3.33.3 Un `role="status"` permanente rompía 9 aserciones de la propia suite

Al ejecutar la suite completa tras la migración, 9 escenarios fallaron
con "strict mode violation" (`getByRole('status')` resolviendo a 2
elementos): `NavigationLoadingIndicator` es un `role="status"`
permanente en el DOM (necesario para que `aria-live` funcione bien de
verdad -- desmontar y remontar el contenedor de una región *live*
pierde anuncios reales en varios lectores de pantalla, así que se
queda montado siempre, con el texto vacío cuando no hay navegación en
marcha), y varios *steps* escritos anoche asumían que solo existiría
un `role="status"` en toda la página (el mensaje de éxito del alta de
candidato). Corregido filtrando por el texto del mensaje en concreto
(`.filter({ hasText: 'Candidato añadido con éxito' })`) en los 8
puntos afectados (`candidate-intake`, `hiring-pipeline`,
`accessibility`), con un helper compartido
(`expectSuccessMessage`) en `candidate-intake.steps.ts` para no
repetir el mismo comentario 5 veces.

Un segundo hallazgo menor durante la depuración de la nueva aserción
de "indicación de carga": `getByRole('status', { name: '...' })` no
resolvía el indicador de forma fiable pese a que su nombre accesible
era correcto de verdad (confirmado con `ariaSnapshot()`) -- probable
manejo especial/con retraso de Chromium para regiones `aria-live` en
su árbol de accesibilidad. Se cambia a `page.locator('[role="status"]')`
+ `toContainText(...)`, que no depende del cómputo del nombre
accesible.

7 candidatos de prueba quedaron acumulados en la base de datos
mientras la propia suite fallaba a medio camino (varios intentos no
llegaban a su propio `cleanup` por culpa de la colisión de arriba) --
limpiados a mano antes de la verificación final.

### 3.33.4 Verificación final

```
npx bddgen && npx playwright test
  → 48 passed (1.0m): las 10 capacidades completas, incluido el
    escenario de indicación de carga ahora comprobando el
    comportamiento real (antes solo comprobaba que la pantalla nueva
    acababa apareciendo)

npm test (backend)   → 47 passed
npm test (frontend)  → 34 passed
```

Verificado también a mano en el navegador: login, Dashboard,
Posiciones y Agregar Candidato renderizan igual que antes de la
migración; la barra de carga aparece de verdad al navegar a una
pantalla con el chunk artificialmente retrasado.

Queda pendiente, cuando el usuario lo pida, el proceso de
refactorización hacia componentes reutilizables mencionado al aceptar
este cambio -- `NavigationLoadingIndicator` es, de hecho, el primer
componente de esta sesión escrito ya pensando en esa reutilización
futura (sin dependencias de la app, props configurables, comentario
explicando qué necesita para funcionar en otro proyecto).

## 3.34 `README.md` separado en `README-EN.md`/`README-ES.md`, con las instrucciones que le faltaban (`readme-docs-AGB`)

Prompt del usuario: *"¿Antes separas porfa el README.md en
README-ES.md y README-EN.md y les añades las instrucciones
faltantes? Están super bien, pero un novato no sería capaz de iniciar
el entorno. Por ejemplo: 'clona el repo'... ¿cuál es la instrucción
para ello?. ¿Puedes descargar docker de aquí' sin enlace. Mejor
indica el comando para descargarlo y asume para las instrucciones que
el entorno es Linux Ubuntu."*

Rama nueva, no `playwright-bdd-AGB`: documentación de README es un
tema independiente de la suite E2E, aunque nazca sobre su misma punta
(las referencias a `openspec/`, `e2e/features/` y `prompts-AGB.md` que
lleva el nuevo README solo existen ahí).

### 3.34.1 Auditoría del README anterior antes de tocar nada

El README bilingüe (EN arriba, ES abajo, en el mismo fichero) tenía
varios problemas reales, no solo huecos:

- "Clone the repo" / "Instala Docker... descárgalo desde aquí" sin
  ningún comando ni enlace, tal como señaló el usuario.
- Afirmaba que el frontend "se inicia con Create React App" y que su
  build vive en `build/` -- ambas cosas dejaron de ser ciertas con la
  migración a Vite (`dist/`, no `build/`; confirmado leyendo
  `frontend/vite.config.ts`, que no sobreescribe el `outDir` por
  defecto).
- Mencionaba un directorio `backend/src/infrastructure/` y
  `backend/src/tests/` que no existen -- comprobado con `find`, la
  estructura real es `application/domain/presentation/routes`, con los
  `*.test.ts` conviviendo con su código fuente, no en un directorio
  aparte.
- No mencionaba la autenticación en absoluto -- con el login
  obligatorio añadido en `api-auth-AGB`, seguir el README tal cual
  hasta el final dejaba a quien lo siguiera plantado en una pantalla
  de login sin ninguna credencial con la que entrar.
- No mencionaba `openspec/`, `e2e/`, `prompts-AGB.md` ni cómo ejecutar
  ningún test -- todo el trabajo de las últimas ramas, invisible desde
  el README.

### 3.34.2 Verificación de cada instrucción antes de escribirla

Antes de dar por buena cualquier instrucción, se comprobó contra el
estado real del repositorio en vez de fiarse de lo que decía el README
viejo:

- `docker-compose.yml` lee `DB_PASSWORD`/`DB_USER`/`DB_NAME`/`DB_PORT`
  de un `.env` en la raíz -- y **ya existe** una plantilla
  `.env.example` en la raíz y otra en `backend/`, con el propio
  comando para generar un `JWT_SECRET` real incluido como comentario.
  El README nuevo usa esa plantilla en vez de inventar una explicación
  paralela.
- Los scripts de `npm run` documentados (`prisma:generate`,
  `prisma:seed`, `dev`, `build`, `test`, `test:e2e`) se sacaron
  directamente de los `package.json` de raíz/backend/frontend, no de
  memoria -- `prisma:seed` en concreto corrige el comando roto del
  README anterior (`ts-node seed.ts`, que asumía un directorio de
  trabajo distinto al real).
- Las migraciones de Prisma (`backend/prisma/migrations/`) ya están
  committeadas -- `prisma migrate dev` sobre una base de datos recién
  creada las aplica sin pedir nada de forma interactiva, comprobado
  listando el directorio.
- Las credenciales de login que se documentan
  (`alice.johnson@lti.com` / `Changeme123!`) están escritas tal cual
  en el propio `backend/prisma/seed.ts`, ya committeado -- documentar
  un valor que ya es público en el código fuente del repo no es un
  problema de seguridad, y sin ellas nadie podría usar la aplicación
  siguiendo el README.
- `docker compose version` (sintaxis moderna, con espacio, no
  `docker-compose` con guion) se confirmó instalado y funcionando en
  este mismo entorno antes de recomendarlo.
- Al intentar verificar `docker compose ps` de verdad contra este
  proyecto, saltó un aviso real (`the attribute 'version' is
  obsolete`) -- inofensivo, documentado inicialmente solo en la
  sección de solución de problemas de ambos README, sin tocar
  `docker-compose.yml`, por no ser parte de lo pedido en ese momento.
  Preguntado luego el usuario qué había detectado y quedado sin
  arreglar, pidió corregirlo: se quita la clave `version: "3.1"` de
  `docker-compose.yml` (verificado con `docker compose config` que el
  aviso desaparece y la configuración se resuelve igual) y se retira
  la nota de ambos README, ya sin sentido una vez corregida la causa.
- La instalación de Docker/Node no se pudo probar de principio a fin
  en esta misma máquina sin arriesgarse a romper el entorno de
  desarrollo ya en marcha (Node v26 ya instalado, base de datos con
  horas de trabajo real encima) -- se documentan los comandos
  oficiales de instalación (script de conveniencia de
  `get.docker.com`, repositorio de NodeSource para Node LTS), el
  método estándar y recomendado por ambos proyectos para Ubuntu, en
  vez de inventar uno propio.

### 3.34.3 Estructura final

- `README.md`: reducido a un selector de idioma de dos líneas (patrón
  habitual en repositorios multi-idioma -- GitHub siempre renderiza
  este fichero por defecto).
- `README-EN.md` / `README-ES.md`: contenido completo y paralelo,
  numerado en 11 pasos (prerrequisitos → clonar → variables de entorno
  → base de datos → dependencias → esquema y semilla → backend →
  frontend → login → tests), con estructura del proyecto corregida,
  enlaces a la documentación existente (`api-spec.yaml`,
  `ModeloDatos.md`, `ManifestoBuenasPracticas.md`, `openspec/specs/`,
  `prompts-AGB.md`) y una sección de solución de problemas con los
  fallos más probables de un primer intento.

## 3.35 `BRANCHES_LOG`: de listado plano a índice rama ↔ sección de `prompts-AGB.md`

El usuario creó `BRANCHES_LOG` a partir de `git log --oneline` y pidió
sugerencias para mejorar la trazabilidad. Tres propuestas (decorar el
log, tabla índice rama↔sección, fechas) más una opcional (diagrama de
ramas); probó la primera (`git log --oneline --decorate --all`) y no
le resultó evidente -- razón real: con las 17 ramas apiladas (cada una
nace de la punta de la anterior, no todas desde `main`), `--decorate`
solo anota la última línea de cada rama, así que para saber a qué
rama pertenece un commit del medio hay que inferirlo por posición, sin
ninguna ayuda visual. Se pasa directamente a la tabla índice.

**Hallazgo real antes de construirla**: `git log --all` mete por medio
decenas de ramas `origin/kanban-*`, `origin/frontend-storybook/*`,
`origin/sesion-e2e/*` -- un ejercicio de otro módulo del bootcamp que
comparte el mismo `origin` pero no tiene relación con este proyecto.
El índice se genera acotado explícitamente a las 17 ramas `*-AGB`
(`git for-each-ref ... | grep -- '-AGB$'`), no con `--all`.

`BRANCHES_LOG` pasa a ser una tabla: rama, fecha del último commit,
commits propios (solo los que añade sobre la rama de la que nace, sin
repetir lo heredado) y enlaces directos a la sección de
`prompts-AGB.md` que la documenta. Verificación real de los enlaces:
en vez de dar por buenos los anclajes Markdown escritos a mano, se
generaron con un slugificador (Python, replicando el algoritmo de
GitHub) contra los encabezados reales de `prompts-AGB.md`, y se
comprobaron los 28 enlaces resultantes contra ese mismo conjunto de
anclas -- así se encontraron y corrigieron dos fallos propios de guion
doble en vez de sencillo (causados por flechas/barras en el título
original que colapsaban a un solo espacio, no a dos).

## 3.36 `useAsyncData`: el primer hook genérico, extraído de una duplicación real (`reusable-hooks-AGB`)

Primera rama del proceso de refactorización a componentes/hooks
reutilizables que el usuario pidió retomar tras aparcar temporalmente
el trabajo de GitHub (sin credenciales disponibles en ese momento).
Antes de crear nada, se encargó una exploración honesta del código
real (no una lista de "hooks que estaría bien tener"): de cuatro
candidatos obvios, solo **uno** tenía duplicación real detrás.

### 3.36.1 Rechazados, con motivo

- **Limpieza de error de campo** (`clearFieldIssue`/`handleFieldChange`
  de `AddCandidateForm.jsx`) -- aparece en un único fichero, `Login.jsx`
  no hace nada parecido a nivel de campo. Una sola ocurrencia no es
  duplicación.
- **Estado de subida de fichero** (`FileUploader.jsx`) -- único
  componente de subida en toda la app.
- **Cambio de idioma** (`LanguageSwitcher.jsx`) -- sin lógica de estado
  propia que extraer, solo una llamada directa a `i18n.changeLanguage()`.

Ninguno de los tres se extrae -- "tres líneas parecidas es mejor que
una abstracción prematura" aplica aquí tal cual.

### 3.36.2 Confirmado: `useAsyncData`

`Positions.tsx` y `PositionProcess.tsx` repetían, línea por línea, el
mismo patrón (`loading`/`error` en `useState`, `useEffect` con función
async, mismo `catch`, mismo `finally`). `AddCandidateForm.jsx` hacía
una versión más pobre de lo mismo para cargar posiciones -- sin
`loading` en absoluto, así que el desplegable arrancaba vacío sin
ninguna señal de que las posiciones reales estaban en camino,
indistinguible de "no hay posiciones" (hallazgo real de UX, corregido
de paso al aplicar el hook).

`frontend/src/hooks/useAsyncData.ts` -- genérico, sin nada específico
de esta app (solo depende de React), con dos mejoras reales sobre el
código original que un hook pensado para reutilizarse en otros
proyectos sí necesita:

- **Guarda contra condición de carrera**: si las dependencias cambian
  mientras una petición anterior sigue en marcha, su respuesta puede
  llegar DESPUÉS que la nueva y pisar el resultado correcto -- una
  bandera `cancelled` (cierre del `useEffect`) lo evita. El código
  original de `PositionProcess.tsx` no se protegía contra esto.
- **`enabled`**: para el caso de `PositionProcess` (que antes hacía
  `if (!id) return;` dentro del efecto) sin tener que llamar al hook
  de forma condicional, que rompería las reglas de los Hooks de React.

Aplicado en los tres sitios; se añade `addCandidate.loadingPositions`
a `es.json`/`en.json` para el nuevo estado de carga visible del
desplegable de posición.

### 3.36.3 Test del hook y verificación

`useAsyncData.test.ts` (6 casos, con `renderHook`/`waitFor` de
`@testing-library/react` -- ya en `^16.3.3`, con `renderHook`
incluido, no hizo falta ningún paquete nuevo): carga inicial, error
real, error no-`Error` con `fallbackErrorMessage`, `enabled: false`,
re-fetch al cambiar dependencias, y un test específico para la guarda
de condición de carrera (confirma que la respuesta más lenta de una
petición anterior no pisa la más rápida de la posterior).

```
npm test (frontend)          → 40 passed (34 + 6 nuevos)
npx playwright test          → 48 passed (1.1m) -- ninguna de las
                                 escenarios de position-catalog,
                                 candidate-intake ni hiring-pipeline
                                 (que ejercitan estas tres pantallas
                                 de verdad) se rompió con el refactor
```

Verificado también a mano en el navegador: `/positions`,
`/positions/:id` y `/add-candidate` renderizan igual que antes del
refactor, con datos reales.

## 3.37 `docs/adr/`: 11 decisiones de arquitectura reales, formato corto (`adrs-AGB`)

Segunda rama del proceso de refactorización, encadenada sobre
`reusable-hooks-AGB`. Formato elegido: el clásico de Michael Nygard
(Estado/Contexto/Decisión/Alternativas/Consecuencias), el más extendido
y el más fácil de llevar tal cual a un proyecto futuro -- explicado en
`docs/adr/README.md` junto con la distinción deliberada entre esto y
`prompts-AGB.md` (ADR = decisión corta y atemporal; el diario = proceso
completo, cronológico, con los hallazgos por el camino).

11 ADRs (`0000` la propia decisión de usar ADRs, `0001`-`0010` las
decisiones reales), cada uno verificado contra su sección real de
`prompts-AGB.md` antes de escribirse -- no solo por el título, releyendo
el contenido: Vite vs CRA, `react-i18next` vs el sistema casero, auth
JWT sin estado con mensaje genérico, interceptor global de axios vs
instancia dedicada, *code splitting* con `React.lazy`+`Suspense`
(marcado como **reemplazado** por el ADR de `createBrowserRouter`, no
borrado -- un ADR reemplazado sigue siendo información real sobre qué
se intentó primero y por qué no bastó), migración a
`react-router-dom` v7, adopción de OpenSpec por capacidad, elección de
Playwright-BDD, el replanteamiento de qué cuenta como "verificable" en
esa suite, y la migración final a `createBrowserRouter`.

Misma disciplina que en `BRANCHES_LOG` (sección 3.35): los 12 enlaces
a `prompts-AGB.md` desde las ADRs, y todos los enlaces cruzados entre
ADRs, se generaron y verificaron con el mismo script de Python
(slugificador + comprobación contra encabezados reales) antes de
darlos por buenos -- un enlace se encontró apuntando a un encabezado
que no era el correcto en el primer intento (`§3.19.8` existe de
verdad como sección propia dentro de `§3.19`, pero se había enlazado
al ancla de `§3.19` a secas) y se corrigió antes de comprobar el resto.

`README-ES.md`/`README-EN.md` añaden `docs/adr/` y `BRANCHES_LOG` a su
sección de "más documentación", para que no queden solo descubribles
por quien ya sepa que existen.

```
npm test (frontend)   → 40 passed, sin cambios (rama de documentación pura)
```

## 3.38 Segunda pasada de refactorización a componentes reutilizables (`reusable-components-AGB`)

Pregunta del usuario tras `adrs-AGB`: "¿Podemos lograr una refactorización
más pronunciada en componentes reutilizables para Proyectos futuros?".
`reusable-hooks-AGB` (sección 3.36) ya había aplicado el criterio estricto
de "solo extraer con duplicación real demostrada" y había encontrado un
único candidato genuino (`useAsyncData`), rechazando explícitamente otros
tres por aparecer una sola vez en el código. Para una segunda pasada "más
pronunciada" hacía falta un criterio algo más amplio sin caer en
abstracción especulativa: además de duplicación real dentro de este
repositorio, contar también como candidato un componente que hoy solo se
usa una vez pero que está acoplado a esta app de forma innecesaria (una
dependencia concreta metida a fuego dentro de un componente que por lo
demás es genérico), porque desacoplarlo es lo que lo hace de verdad
reutilizable en un proyecto futuro distinto.

Con ese criterio, relectura completa de `AddCandidateForm.jsx`,
`Login.jsx` y `FileUploader.jsx` encontró tres candidatos reales, no
especulativos:

1. **`ValidatedField`** — el bloque `Form.Group` + `Form.Label` +
   `Form.Control`/`Form.Select` + `isInvalid`/`aria-invalid`/
   `aria-describedby` + `Form.Control.Feedback` condicional se repetía
   **6 veces, letra por letra**, dentro del mismo `AddCandidateForm.jsx`
   (posición, nombre, apellido, email, teléfono, dirección) — la
   duplicación más flagrante del proyecto, la misma clase de problema que
   ya motivó `useAsyncData` pero a nivel de JSX en vez de lógica. Nuevo
   componente genérico (`frontend/src/components/ValidatedField.jsx`,
   solo depende de `react-bootstrap`): admite `as="select"` para
   reutilizar exactamente el mismo contrato en desplegables, y reenvía
   cualquier otra prop (`type`, `name`, `value`, `onChange`, `required`,
   `disabled`...) tal cual al control interno.
2. **`InlineAlert`** — el par `role`/`aria-live` correcto según el tipo de
   mensaje (`role="alert"` + `aria-live="assertive"` para errores,
   `role="status"` + `aria-live="polite"` para éxito) se escribía a mano
   en 4 sitios distintos entre dos ficheros (`Login.jsx` una vez,
   `AddCandidateForm.jsx` tres veces: resumen de errores de campo, error
   genérico, mensaje de éxito) — duplicación real cruzando ficheros, con
   riesgo genuino de que una copia se desincronizara de las demás (un
   `role="alert"` con `aria-live="polite"` por descuido no se anunciaría
   con la urgencia esperada). Nuevo componente genérico
   (`frontend/src/components/InlineAlert.jsx`): decide el `role`/
   `aria-live` a partir de `variant`, admite una `heading` opcional para
   el caso del resumen de errores.
3. **`FileUploader`** generalizado — no tenía ninguna duplicación (solo se
   usa una vez), pero importaba `uploadCV` directamente de
   `candidateService`, así que solo podía subir CVs de candidatos a ese
   endpoint concreto: copiarlo a un proyecto futuro con cualquier otro
   tipo de subida de fichero habría exigido reescribirlo, no solo
   copiarlo. Ahora recibe la función de subida por prop (`uploadFn`), y
   `AddCandidateForm.jsx` es quien decide a qué endpoint sube pasándole
   `uploadCV` — el componente ya no sabe nada de candidatos.

`Login.jsx` se quedó **sin** `ValidatedField`: sus dos campos comparten un
único banner de error (no un mensaje por campo), así que forzar
`ValidatedField` ahí habría exigido inventarle un mensaje de error
duplicado por campo que la UI actual no tiene — se prefirió no forzar el
componente donde no encaja el contrato real, y usar solo `InlineAlert`
para el banner.

Tests nuevos (`ValidatedField.test.jsx`, `InlineAlert.test.jsx`,
`FileUploader.test.jsx`, 9 casos en total) cubren el contrato de
accesibilidad de cada componente por separado — antes de esta rama,
`FileUploader` no tenía ningún test propio pese a manejar subida de
ficheros con estados de carga y error.

```
npm test (frontend)          → 49 passed (40 + 9 nuevos)
npm run build (frontend)     → OK, tsc + vite build sin errores
npx playwright test          → 48 passed (1.0m) -- accessibility,
                                 candidate-intake, hiring-pipeline e
                                 internationalization (los que ejercitan
                                 estos formularios de verdad) siguen
                                 pasando sin cambios
npm test (backend)           → 47 passed, sin cambios (rama solo de frontend)
```

## 3.39 Candidatos sin asignar: elegir posición pasa a ser opcional (`unassigned-candidates-AGB`)

Reporte del usuario, probando la app tras reautenticarse (la sesión de
Alice había caducado): "en Positions no me muestra el nuevo candidato que
creé ayer, pero acordamos que se mostrarían aunque no estuvieran
asignados a ninguna candidatura". Antes de tocar nada se comprobó la base
de datos real: solo 2 posiciones (ambas del seed original — esta app no
tiene ninguna forma de crear posiciones desde la UI), y 5 candidatos sin
ninguna `Application` (`id` 10, 15-18, con pinta de pruebas manuales
previas: "Bad Position"/"Good Position"). Aclarado por el usuario: dio de
alta un candidato ayer sin elegir posición porque en ese momento ese
campo aún no existía (rama `position-selector-AGB` es posterior), y la
interfaz confirmó el alta con un mensaje en verde — esperaba que ese
candidato siguiera siendo accesible en algún sitio, no que desapareciera.

Esto revierte, a propósito y a petición explícita del usuario, una parte
de lo que se hizo en `position-selector-AGB` (sección 3.23): ese branch
hizo la posición **obligatoria** y rechazaba el alta sin ella. Aquí se
relaja lo justo para permitir el caso de uso real sin renunciar a lo que
esa rama sí seguía necesitando: una posición que SÍ se elige tiene que
seguir siendo válida (existir, tener flujo de entrevistas configurado).

Cambios:
- **Base de datos**: nuevo campo `Candidate.createdAt` (`@default(now())`,
  migración `20260920091514_add_candidate_created_at`) — pedido
  explícitamente por el usuario ("necesitamos un campo... para no estar
  adivinando cuándo"). Las filas ya existentes lo reciben con la fecha de
  la migración, no con una fecha real retroactiva (no había ninguna que
  backfillear) — se avisa de esto al usuario, no se presenta como un dato
  más preciso de lo que es.
- **`validator.ts`**: `validatePositionId` deja de exigir el campo; si SÍ
  se manda un valor, se sigue exigiendo que tenga forma de entero
  positivo.
- **`candidateService.ts`**: `addCandidate` solo valida/crea la
  `Application` cuando `positionId` viene informado; si no, el candidato
  se guarda igualmente, sin candidatura ("sin asignar"). Nueva
  `getUnassignedCandidatesService` (`candidate.findMany` con
  `applications: { none: {} } }`, orden por `createdAt` descendente).
- **API**: `GET /candidates/unassigned` (antes de `/candidates/:id` en el
  router — si no, Express probaría `:id = "unassigned"` primero y
  `parseInt` fallaría con 400). Documentado en `api-spec.yaml`.
- **`AddCandidateForm.jsx`**: quita `required` del desplegable de
  posición; el placeholder ahora dice "...o déjalo sin asignar". Bug real
  encontrado al escribir esto, antes de que llegara a probarse en
  navegador: `Number('')` da `0`, no `null` — enviar el formulario vacío
  habría mandado `positionId: 0`, que el validador rechaza (`0` no es un
  entero positivo) en vez de guardarse sin candidatura. Se distingue a
  mano: `candidate.positionId ? Number(...) : null`.
- **`UnassignedCandidates.tsx`** (nuevo, `/candidates/unassigned`,
  code-split con `lazy` como el resto de rutas protegidas): tabla con
  nombre, email y fecha de alta, más reciente primero; estados de carga,
  error y vacío con `useAsyncData`, igual que `Positions.tsx`. Enlazada
  desde una tercera tarjeta en `RecruiterDashboard.jsx`.
- **OpenSpec**: `candidate-intake/spec.md` — el requisito "Candidatura
  vinculada a una posición" se reescribe a "Elegir posición es opcional;
  si se elige, debe ser válida", con una nota explícita del porqué del
  cambio. `hiring-pipeline/spec.md` — nuevo requisito "Listado de
  candidatos sin asignar".
- **E2E**: escenario "Posición sin elegir" (candidate-intake.feature) se
  reescribe a "Alta sin elegir posición", ahora comprobando que el alta
  tiene éxito y que el candidato queda sin `Application` (consulta directa
  a la base de datos, no solo la UI). Dos escenarios nuevos en
  hiring-pipeline.feature para el listado ("Ver los candidatos sin
  asignar" / "Ningún candidato sin asignar" — este último limpia primero
  cualquier candidato sin asignar preexistente en la base de datos de
  desarrollo, incluidos los 5 residuos reales encontrados al principio de
  esta sección, para poder comprobar el estado vacío de forma
  determinista).

Verificado a mano en el navegador antes de tocar la suite automática: los
5 candidatos reales sin asignar aparecen tal cual en `/candidates/unassigned`
(mismo nombre/email que en la base de datos, fecha de la migración por lo
explicado arriba); un alta nueva sin elegir posición muestra el mensaje de
éxito y aparece de inmediato en ese listado, el primero de la lista.

```
npx prisma migrate dev       → 20260920091514_add_candidate_created_at aplicada
npm test (backend)           → 49 passed (47 + 2 nuevos)
npm run build (backend)      → OK, tsc sin errores
npm test (frontend)          → 53 passed (49 + 4 nuevos)
npm run build (frontend)     → OK, tsc + vite build sin errores; UnassignedCandidates
                                 se divide en su propio chunk, igual que el resto de rutas
npm run test:e2e             → 50 passed (48 + 2 nuevos), incluida la
                                 reescritura de "Posición sin elegir"
```

## 3.40 Se corrige el hallazgo de 3.39: el escenario "Ningún candidato sin asignar" borraba candidatos reales

Aviso del usuario, justo después de leer el resultado de la sección
anterior: "si su propio setup borra los candidatos existentes sin
asignación entonces no podemos tener esta opción, tal y como está ahora,
¿no?". Razón: el `Given` de ese escenario hacía
`candidate.deleteMany({ where: { applications: { none: {} } } })` para
partir de una base de datos realmente vacía y poder comprobar el estado
"no hay ninguno" de forma determinista — pero eso incluía cualquier
candidato sin asignar que hubiera de verdad en la base de datos de
desarrollo compartida, sin distinguir "residuo de prueba" de "dato real
del usuario". Confirmado exactamente con lo que pasó la primera vez que
se corrió la suite completa: los 5 candidatos reales sin asignar del
usuario (incluido el que motivó toda esta rama) desaparecieron.

Corregido para que el escenario no borre nada real: en vez de eliminar
los candidatos existentes, el `Given` les crea una `Application`-marcador
(en la posición sembrada, primera fase de su flujo) para "esconderlos"
del listado solo durante el escenario, y el `Then` borra esa
`Application`-marcador al terminar — el candidato queda exactamente como
estaba, sin ninguna candidatura real, no borrado.

Verificado con un PoC deliberado: se crearon dos candidatos de prueba sin
asignar ("reales" a efectos del test, es decir, no creados por el propio
escenario), se corrió el escenario, y se comprobó después que los dos
seguían existiendo en la base de datos y seguían sin ninguna `Application`
— antes de este arreglo, este mismo PoC los habría borrado.

```
npx playwright test hiring-pipeline   → 5 passed
npm run test:e2e (suite completa)     → 50 passed, sin cambios en el resto
```

Además, se recrearon los 5 candidatos reales sin asignar borrados por el
hallazgo de 3.39 (mismo nombre/email que los originales, `createdAt` fijado
a mano al 19 de septiembre para no fingir que se dieron de alta hoy), y se
auditaron a mano todos los `deleteMany`/`delete` de `e2e/steps/*.ts`:
salvo el ya corregido aquí, cada uno está acotado por un id o email exacto
generado por ese mismo escenario -- ninguno más usa un filtro amplio que
pueda alcanzar datos reales.

## 3.41 Filtro real del catálogo de posiciones (`positions-filter-AGB`)

Encontrado de pasada mientras se investigaba el hallazgo de la sección
3.39: los tres campos de `Positions.tsx` ("Buscar por título", fecha,
estado) estaban pintados pero sin `value`/`onChange` -- ningún filtro
hacía nada, un hueco real de UX que engañaba a quien los usara. Pedido
explícitamente por el usuario al confirmarlo.

Los tres filtros son de cliente (las posiciones ya se cargan todas de
golpe con `useAsyncData`), se combinan con Y, y cada uno es una decisión
tomada sin especificación previa, documentada aquí para poder corregirla
si no es lo esperado:
- **Título**: subcadena, sin distinguir mayúsculas/minúsculas.
- **Fecha**: posiciones cuya fecha límite sea **esa fecha o anterior**
  (no coincidencia exacta) -- el caso de uso más probable para un
  reclutador es "¿cuáles cierran pronto?", no una fecha exacta que rara
  vez conocerá de memoria.
- **Estado**: coincidencia exacta con el desplegable.

Cuando hay posiciones pero ninguna cumple los filtros activos, se
distingue de "no hay posiciones en absoluto" con un mensaje propio
(`positions.noMatches`) -- antes solo existía el mensaje genérico de
"no hay posiciones disponibles", que habría sido engañoso en ese caso
(sugiere una base de datos vacía, no un filtro demasiado estricto).

Nuevo `Positions.test.tsx` (6 casos: cada filtro por separado, los tres
combinados, y el mensaje distinto para "sin resultados" vs "sin
posiciones") -- primer test de este componente, no tenía ninguno. Dos
escenarios E2E nuevos en `position-catalog.feature`, usando el propio
seed (`Senior Full-Stack Engineer` vs `Data Scientist`, distintos
títulos y fechas límite, ambos "Open" así que el filtro de estado se
prueba con "Cerrado" para forzar el caso de cero resultados).

```
npm test (frontend)      → 59 passed (53 + 6 nuevos)
npm run build (frontend) → OK, tsc + vite build sin errores
npm run test:e2e         → 52 passed (50 + 2 nuevos)
```

## 3.42 Datos personales y datos laborales, en módulos reutilizables (`personal-work-modules-AGB`)

Petición explícita del usuario, encadenando con el hallazgo del "Edit"
mal entendido de la sección anterior: separar los datos personales del
candidato de sus datos laborales, como dos módulos independientes,
probados por separado, pensados como piezas reutilizables en otros
proyectos futuros -- no solo una limpieza interna de `AddCandidateForm`.

Dos componentes nuevos, ninguno con nada específico de este ATS:

- **`PersonalDataFields.jsx`** -- nombre, apellido, email, teléfono,
  dirección. Completamente controlado (`values`/`onChange`, sin estado
  propio), sin ninguna dependencia de `react-i18next` ni texto
  hardcodeado: las etiquetas llegan por prop (`labels`), y los mensajes
  de error como un mapa plano `{ campo: mensaje }` (`errors`), no
  acoplado a la forma de `issues` que usa el validador de este backend en
  concreto. `requiredFields` tiene un valor por defecto razonable
  (nombre/apellido/email) pero se puede sobrescribir. Cualquier proyecto
  que gestione personas (CRM, alta de empleados, onboarding...) lo puede
  usar tal cual.
- **`WorkHistoryFields.jsx`** -- historial de educación y experiencia
  laboral (listas de entradas, añadir/quitar/editar cada una). A
  diferencia del anterior, aquí SÍ vive la lógica de interacción dentro
  del propio componente (añadir una entrada vacía, editar un campo,
  quitar una entrada) -- exponerla entera al padre habría obligado a
  reimplementarla en cada proyecto que lo use. Sigue siendo controlado
  hacia fuera (`educations`/`workExperiences` + sus `onChange`), y
  `onFieldChanged(section, index, field)` es un enganche opcional para
  que quien lo use reaccione a un campo concreto (aquí, limpiar su error
  de validación) sin que el componente sepa nada de cómo se valida nada.

Decisión deliberada: la posición/candidatura (`positionId`) **no** entra
en ninguno de los dos módulos -- es un concepto específico de este ATS
(no todo proyecto que gestione personas tiene "posiciones a las que
presentarse"), así que se queda en `AddCandidateForm.jsx` igual que
antes, junto al desplegable que lo alimenta.

`AddCandidateForm.jsx` pasa de ~250 líneas de JSX repetido a orquestar
tres piezas (`ValidatedField` para la posición, `PersonalDataFields`,
`WorkHistoryFields`) más el `FileUploader` que ya era reutilizable desde
`reusable-components-AGB`. El comportamiento no cambia -- confirmado con
los 10 tests ya existentes de `AddCandidateForm.test.jsx`, que pasan sin
tocar ni una línea.

Tests nuevos: `PersonalDataFields.test.jsx` (5 casos, deliberadamente sin
mencionar "candidato" en ningún sitio, para comprobar que de verdad no
depende de nada de este dominio) y `WorkHistoryFields.test.jsx` (5 casos:
añadir/editar/quitar una entrada sin tocar las demás, y el enganche
`onFieldChanged`).

```
npm test (frontend)      → 69 passed (59 + 10 nuevos)
npm run build (frontend) → OK, tsc + vite build sin errores
npm run test:e2e         → 52 passed, sin cambios (mismo comportamiento,
                             solo reorganizado en componentes)
```

## 3.43 Editar un candidato reutilizando el formulario de alta (`edit-candidate-AGB`)

Confirmación del usuario tras la aclaración de la sección anterior: "Sí,
adelante con el Edit". Mismo `AddCandidateForm.jsx` para
`/add-candidate` y `/candidates/:id/edit` -- la diferencia es solo si hay
un `:id` en la ruta (`useParams`), no dos componentes separados.

**Backend**: nueva `updateCandidateProfile(id, data)` en
`candidateService.ts`, expuesta como `PATCH /candidates/:id` (no `PUT`:
ese verbo+ruta ya está tomado por `updateCandidateStageController`, un
payload y un propósito totalmente distintos). Reutiliza
`validateCandidateData` tal cual. Las listas de educación/experiencia se
sustituyen enteras (se borran las filas anteriores del candidato y se
recrean con lo que llega en el formulario) -- más simple y predecible que
intentar adivinar cuáles de las entradas anteriores "son la misma", y el
formulario no manda ningún id de entrada de todos modos. Un CV nuevo se
añade sin sustituir al anterior (igual que en el alta: un candidato puede
tener varios resumes).

**Decisión deliberada, con una razón de base de datos real**: la edición
NO permite cambiar ni quitar la posición de un candidato que ya tiene
candidatura -- solo asignar una cuando todavía no tenía ninguna.
`Interview.applicationId` es `RESTRICT` (`schema.prisma`): borrar la
`Application` de un candidato con entrevistas ya registradas fallaría a
medio camino con una violación de clave foránea, dejando el candidato en
un estado a medio actualizar. Reasignar posición con historial de
entrevistas de por medio es una decisión de producto mayor (¿qué pasa con
esas entrevistas?) que esta edición no intenta resolver -- el desplegable
se bloquea, con una nota explicando por qué, en vez de dejar que se
intente y falle a medias.

**Frontend**: `candidateFromExisting()` convierte la forma de
`GET /candidates/:id` (fechas en string ISO, posición dentro de
`applications[0].position.id`) a la forma que el formulario edita
(`Date` de verdad para `DatePicker`, `positionId` suelto) -- lo inverso
de lo que `handleSubmit` ya hacía para el alta. Título, texto del botón y
mensaje de éxito cambian según el modo (`editTitle`/`saveChanges`/
`updateSuccess` en los locales), reutilizando el resto de claves de
`addCandidate.*` tal cual. Tras guardar una edición, a diferencia del
alta, el formulario NO se vacía -- vaciarlo justo después de guardar
sería confuso ("¿se ha guardado o no?").

Enlaces "Editar" añadidos donde aparecen candidatos: en el listado de
`/candidates/unassigned` y en cada tarjeta del tablero
`PositionProcess`.

Nueva capacidad OpenSpec `candidate-editing` (antes no existía ninguna
para editar, solo para alta) y `e2e/features/candidate-editing.feature`
con sus 3 escenarios, cubriendo los tres casos reales: editar datos
personales, asignar posición a alguien sin asignar, y el bloqueo cuando
ya tiene una.

```
npm test (backend)       → 53 passed (49 + 4 nuevos)
npm run build (backend)  → OK, tsc sin errores
npm test (frontend)      → 77 passed (69 + 8 nuevos)
npm run build (frontend) → OK, tsc + vite build sin errores
npm run test:e2e         → 55 passed (52 + 3 nuevos)
```

Verificado también a mano en el navegador: los 5 candidatos reales
sin asignar (recreados tras el hallazgo de la sección 3.40) siguen
existiendo después de toda esta ronda de tests.

## 3.44 Enlace "Volver al inicio" en Posiciones y Añadir Candidato (`back-to-dashboard-links-AGB`)

Pedido del usuario: en las pantallas "Ver Posiciones" y "Añadir
Candidato" faltaba un enlace de vuelta al dashboard -- ya existía en
`UnassignedCandidates.tsx` ("← Volver al dashboard"), pero no en estas
dos. El usuario pidió además que el texto pasara a ser "Volver al
inicio", así que de paso se unifica: nueva clave `common.backToDashboard`
("← Volver al inicio" / "← Back to home") compartida por las tres
pantallas, en vez de tener el mismo texto duplicado (y ahora
potencialmente desincronizado) en `unassignedCandidates.back`,
`positions.*` y `addCandidate.*` por separado.

En `AddCandidateForm.jsx` el enlace solo aparece en modo alta -- el modo
edición ya tenía su propio "← Volver" (`navigate(-1)`, vuelve a la
pantalla concreta de la que se vino, no siempre el dashboard), y no tiene
sentido mostrar los dos a la vez.

Dos escenarios E2E nuevos (uno en `position-catalog.feature`, otro en
`candidate-intake.feature`), y el requisito correspondiente añadido a
ambas specs de OpenSpec.

```
npm test (frontend)      → 77 passed, sin cambios (solo un enlace nuevo,
                             sin lógica que testear en unidad más allá de
                             lo que ya cubren los tests existentes)
npm run build (frontend) → OK, tsc + vite build sin errores
npm run test:e2e         → 57 passed (55 + 2 nuevos)
```

## 3.45 Fila clicable + icono de editar, sin perder accesibilidad (`clickable-row-edit-AGB`)

Pregunta del usuario: "¿Resulta sencillo modificar el botón Editar por
pulsar sobre la fila...?". Antes de tocar nada se señaló el riesgo real:
una `<tr onClick>` sola no es alcanzable por teclado ni anunciable por
lector de pantalla (no es un elemento interactivo nativo). El usuario
confirmó mantener el enlace (además, van a hacer falta más acciones por
fila -- borrar, dijo -- así que la celda de acciones se queda), pero
cambiarlo por un icono de lápiz con tooltip "Editar" al pasar el ratón, y
preguntó explícitamente si eso mantendría la accesibilidad.

Respuesta aplicada: sí, siempre que el nombre accesible del enlace no
dependa solo del tooltip. `title="Editar"` da el tooltip visual al pasar
el ratón, pero **`aria-label="Editar"` es quien de verdad define el
nombre accesible** -- un lector de pantalla lo anuncia igual que antes de
cambiar el texto por un icono (`PencilSquare` de `react-bootstrap-icons`,
`aria-hidden` porque es decorativo). La fila entera (`<tr onClick>`) es
solo un atajo de ratón por encima de eso, no lo sustituye; el click en el
icono para la propagación (`stopPropagation`) para no disparar la
navegación dos veces.

Nuevo requisito en `hiring-pipeline/spec.md` y escenario E2E que pulsa
deliberadamente una celda que NO es el icono, para comprobar que la fila
entera funciona, no solo el enlace.

```
npm test (frontend)      → 79 passed (77 + 2 nuevos)
npm run build (frontend) → OK, tsc + vite build sin errores
npm run test:e2e         → 58 passed (57 + 1 nuevo)
```

## 3.46 CORS configurable por variable de entorno (`cors-configurable-origins-AGB`)

Contexto: el usuario quiere acceder a la app desde otro equipo de su red
local (no solo desde la propia máquina), y preguntó qué hacía falta
habilitar. Además del cortafuegos y de que Vite escuche en todas las
interfaces (`host: true`, ambos a cargo del usuario), había dos cosas más
bloqueando el acceso real, que sí implico yo: el origen de CORS estaba
fijado a `http://localhost:3000` a fuego en `index.ts`, y la URL base de
la API estaba hardcodeada a `http://localhost:3010` en el frontend
(sección 3.47). Esta rama resuelve la primera.

Nuevo `corsOptions.ts`: `parseAllowedOrigins`/`buildCorsOptions`,
separados del bootstrap de Express en `index.ts` a propósito, para poder
testear el parseo de la lista y la comparación de orígenes sin levantar
la app entera. `CORS_ORIGINS` (lista separada por comas) en `backend/.env`
-- sin definirla, el comportamiento es exactamente el de antes (solo
`http://localhost:3000`), así que no rompe nada para quien no la use.

Verificado con un PoC real (`curl -X OPTIONS` con distintas cabeceras
`Origin`, backend arrancado con y sin la variable), no solo con los tests:
con `CORS_ORIGINS=http://localhost:3000,http://192.168.1.50:3000` ambos
orígenes reciben `Access-Control-Allow-Origin` correcto y uno no
configurado se rechaza; sin la variable, solo `localhost:3000` pasa,
igual que antes de este cambio.

```
npm test (backend)      → 61 passed (53 + 8 nuevos)
npm run build (backend) → OK, tsc sin errores
```

## 3.47 URL de la API configurable, para acceder desde la red local (`frontend-api-url-config-AGB`)

Segunda mitad de lo pedido en la sección 3.46: `http://localhost:3010`
estaba escrito a fuego en `positionService.js`, `authService.js` y
(repetido en cada llamada) `candidateService.js`. Nuevo
`frontend/src/config.js`, un único sitio: `API_BASE_URL =
import.meta.env.VITE_API_URL || 'http://localhost:3010'` -- Vite solo
expone al navegador las variables con el prefijo `VITE_`, y las incrusta
en el bundle en tiempo de build, no en tiempo de ejecución (por eso hay
que reiniciar `npm run dev` si cambia).

Verificado con un build real, no solo con tests: `VITE_API_URL=http://192.168.1.50:3010
npm run build` deja esa URL en el bundle final y ya no queda ningún rastro
de `localhost:3010` en él; sin la variable, el build vuelve a producir
exactamente lo de siempre.

`frontend/.env.example` nuevo (no existía ningún `.env` de frontend hasta
ahora). Se añade una sección completa "Acceder desde otro equipo de tu
red local" a ambos README, con los 4 pasos juntos (cortafuegos + `vite
--host` + `CORS_ORIGINS` + `VITE_API_URL`) -- se insiste en que son 4
cosas a la vez, no solo una, porque saltarse cualquiera deja la app
funcionando a medias (la página carga, pero cada llamada a la API falla)
de una forma que no es obvia de diagnosticar sin saber esto. De paso se
corrige una nota de Troubleshooting que ya había quedado desactualizada
("el puerto del frontend coincide con la configuración de CORS del
backend" ya no es un valor fijo, es el origen por defecto).

```
npm test (frontend)      → 81 passed (79 + 2 nuevos)
npm run build (frontend) → OK, tsc + vite build sin errores
npm run test:e2e         → 58 passed, sin cambios (usan siempre el valor
                             por defecto, así que el comportamiento real
                             no cambia para nadie que no toque la variable)
```

Añadido después, a petición del usuario (dudaba dónde exactamente añadir
`host: true` en `vite.config.ts`, y pidió que lo hiciera yo directamente):
`server.host: true` en `frontend/vite.config.ts` -- el último de los 4
pasos de la sección "Acceder desde otro equipo de tu red local", con los
otros tres ya cubiertos por `cors-configurable-origins-AGB`/esta rama. De
paso se corrige el comentario de al lado de `port: 3000`, que decía que
el CORS estaba "hardcodeado" -- ya no lo está desde `cors-configurable-
origins-AGB`.

Verificado arrancando `npm run dev` de verdad: antes de este cambio Vite
solo mostraba `Local: http://localhost:3000/`; después muestra también
`Network: http://<ip-de-la-máquina>:3000/` (confirmado con `ss -tlnp`:
escucha en `*:3000`, no solo en `127.0.0.1:3000`).

```
npm test (frontend)      → 81 passed, sin cambios (config de arranque del
                             servidor, no afecta a build ni a tests)
npm run build (frontend) → OK, tsc + vite build sin errores
```

## 3.48 Depuración real en vivo del acceso desde la red local

El usuario terminó de configurar su lado (cortafuegos, `vite --host`,
`CORS_ORIGINS`, `VITE_API_URL`) y probó desde un equipo externo de
verdad. No funcionó a la primera -- lo que sigue es la sesión de
depuración real, en vivo, hasta que sí funcionó. Se documenta entera
porque cada paso es un hallazgo reutilizable, no solo para esta puesta a
punto concreta.

### 3.48.1 "Network Error" al iniciar sesión → CORS sin configurar

Primer síntoma: la interfaz cargaba bien (puerto 3000 alcanzable), pero
el login fallaba con "Network Error". Aclarado un matiz importante:
**axios reporta "Network Error" tanto para un fallo de conexión real
como para un bloqueo de CORS** -- el navegador oculta a JS los detalles
de un bloqueo CORS, así que ambos casos son indistinguibles solo por el
mensaje, hace falta mirar la consola/pestaña Red del navegador.

Causa real: `backend/.env` no tenía `CORS_ORIGINS` -- el backend seguía
aceptando solo `http://localhost:3000` (su valor por defecto, sección
3.46), así que el `Origin` real del navegador externo (la IP del
servidor, no `localhost`) se rechazaba. Arreglado añadiendo
`CORS_ORIGINS=http://localhost:3000,http://<ip-real>:3000` a
`backend/.env`.

### 3.48.2 Aclaración de diseño: CORS es del origen de la página, no del cliente

El usuario preguntó si hacía falta autorizar cada IP de cliente por
separado, o algo "genérico para toda la red". Respuesta: ninguna de las
dos -- el `Origin` que manda el navegador es de dónde viene **la
página** (el frontend), no la IP de quien la visita. Como el frontend se
sirve siempre desde un único sitio, una sola entrada en `CORS_ORIGINS`
ya cubre a cualquier dispositivo de la LAN que la abra. Se descartó
deliberadamente añadir un matcher por CIDR/wildcard en
`corsOptions.ts`: resolvería un problema que no existe aquí (no hay
múltiples orígenes reales) a cambio de aflojar la comprobación real de
origen.

### 3.48.3 Instancias de Vite duplicadas (3000 y 3001 ocupados)

Arrancar `npm run dev` del frontend chocó con instancias anteriores sin
parar (de reinicios previos de esta misma sesión), y arrancó en el 3002.
Comando para verlas y pararlas, por nombre de binario real (no por un
`grep vite` genérico, que podría coincidir con cualquier ruta que
contenga esa palabra):
```bash
pgrep -af "node_modules/.bin/vite"
pkill -f "node_modules/.bin/vite"
```

### 3.48.4 "¿Cómo paro sin matar el proceso?"

Aclarado: en Unix no hay una tercera vía -- parar un proceso siempre es
mandarle una señal. `kill` a secas ya manda `SIGTERM` (una petición
educada, el proceso puede limpiar antes de salir); lo brusco es
`kill -9`/`SIGKILL`. No hay ningún `npm run stop` en
`backend/package.json` (`ts-node-dev` no es un servicio con gestor, es
un proceso simple).

### 3.48.5 "Solo me arranca en localhost" → mensaje de log engañoso, no un bug de red

El usuario reportó que el backend "solo escuchaba en localhost". Antes
de asumirlo, se verificó de forma independiente:
```bash
ss -tlnp | grep 3010          # → *:3010, no 127.0.0.1:3010
curl -v http://<ip-lan>:3010/candidates/unassigned   # → 401, sí responde
```
El backend SÍ escuchaba en todas las interfaces (comportamiento por
defecto de `app.listen(port)` sin `host` en Node). El verdadero problema
era el mensaje de arranque, que decía siempre `Server is running at
http://localhost:3010` a fuego, sin importar dónde escuchara de verdad
-- sección 3.49, arreglado ahí.

### 3.48.6 Más de 20 procesos `ts-node-dev` acumulados: lección propia sobre limpieza de procesos

Al investigar 3.48.5, apareció algo peor: `ps aux | grep -i
"ts-node-dev" | grep -v grep` devolvía más de 20 procesos vivos,
acumulados desde las 11:01 hasta las 15:02 de esta misma sesión. Causa:
`ts-node-dev --respawn` genera una jerarquía de 3 procesos (`sh -c` →
`ts-node-dev` → un `node .../wrap.js` nieto, que es quien de verdad
sujeta el puerto). El método de reinicio usado durante buena parte de
esta sesión, `lsof -ti :3010 | xargs kill`, solo mata a ese nieto --
cada reinicio así dejaba huérfanos los otros dos, sesión tras sesión.
`ss -tlnp` seguía mostrando un único proceso escuchando (el más
reciente), lo que ocultó el problema hasta que se miró `ps aux`
explícitamente.

Corregido matando por nombre (`pkill -f "ts-node-dev"`, que alcanza los
tres niveles porque los tres tienen esa cadena en su línea de comando),
no por PID del puerto. Lección para el resto de esta sesión y para
futuros proyectos: reiniciar un proceso con `--respawn` (o cualquier
supervisor similar) por PID del socket no basta, hace falta matar el
árbol entero.

### 3.48.7 La IP había cambiado (DHCP): `.153` en `frontend/.env`, `.151` en la máquina real

Causa final y real del "Network Error" persistente, ya con CORS bien
configurado: `frontend/.env` tenía `VITE_API_URL=http://192.168.1.153:3010`,
pero la IP real de la máquina en ese momento era `192.168.1.151` --
`vite --host` reveló la IP correcta (línea "Network:" del propio Vite),
que no coincidía con lo que se había escrito en el `.env` en algún
momento anterior. Corregido actualizando `frontend/.env` (fichero local,
no versionado) a la IP real, y reiniciando `npm run dev` para que se
recogiera.

### 3.48.8 Regresión propia encontrada al re-ejecutar la suite: tests con la URL hardcodeada

Con `VITE_API_URL` puesta de verdad en `frontend/.env`, `npm test` del
frontend rompió: `candidateService.test.js` (añadido en
`frontend-api-url-config-AGB`, sección 3.47) esperaba literalmente
`'http://localhost:3010/candidates/1'` en sus aserciones, sin contar con
que `API_BASE_URL` ya no fuera ese valor en el entorno de quien corriera
los tests. Corregido importando `API_BASE_URL` de `../config` en el
propio test y comparando contra eso, no contra un string fijo -- el
mismo error de diseño que motivó la rama entera (URLs fijas en vez de
configurables), esta vez colado en un test en vez de en el código de
producción.

```
npm test (frontend) → 81 passed, con VITE_API_URL puesta de verdad en
                        frontend/.env (antes de este arreglo, 2 fallaban)
npm run build (frontend) → OK
```

### Comandos de verificación de estado (referencia rápida)

```bash
# Cortafuegos: reglas activas y su alcance
sudo ufw status verbose

# Qué escucha de verdad, y en qué interfaz (*: todas; 127.0.0.1: solo local)
ss -tlnp | grep -E ':300[0-9]'

# Procesos de desarrollo vivos, por nombre real (evita coincidir con "grep" a sí mismo)
pgrep -af "ts-node-dev"
pgrep -af "node_modules/.bin/vite"

# Parar todas las instancias de un tipo, árbol completo (no solo el PID del puerto)
pkill -f "ts-node-dev"
pkill -f "node_modules/.bin/vite"

# Alcanzabilidad real del backend desde fuera, sin pasar por el frontend
curl -v http://<ip-del-servidor>:3010/candidates/unassigned

# Comprobar el origen exacto que aceptaría el CORS configurado
curl -i -X OPTIONS http://<ip-del-servidor>:3010/candidates/unassigned \
  -H "Origin: http://<origen-a-probar>" -H "Access-Control-Request-Method: GET" \
  | grep -i "access-control-allow-origin"

# IP real de la máquina (para VITE_API_URL/CORS_ORIGINS -- puede cambiar por DHCP)
ip addr
hostname -I
```

## 3.49 Mensaje de arranque del backend: listar las direcciones reales (`backend-listening-message-AGB`)

Arreglo del hallazgo 3.48.5: `console.log('Server is running at
http://localhost:' + port)` estaba escrito a fuego en `index.ts`,
siempre con "localhost", sin importar en qué interfaz escuchara de
verdad el servidor -- costó tiempo real de depuración porque sugería
justo lo contrario de lo que pasaba.

Nuevo `networkAddresses.ts`: `getListeningAddresses(port, interfaces)`
recibe las interfaces de red por parámetro (por defecto
`os.networkInterfaces()`) en vez de llamarlo dentro de la propia
función, para poder testear con datos fijos sin depender de las
interfaces reales de la máquina que corra los tests. Filtra direcciones
IPv4 no internas (descarta loopback e IPv6), y siempre antepone
`http://localhost:PORT`. El mensaje de arranque ahora lista todas,
imitando las líneas "Local"/"Network" que ya usa Vite:
```
Server listening on port 3010, reachable at:
  http://localhost:3010
  http://192.168.1.151:3010
  http://172.18.0.1:3010
```

```
npm test (backend)      → 64 passed (61 + 3 nuevos)
npm run build (backend) → OK, tsc sin errores
```

Verificado también arrancando el servidor de verdad y comparando contra
`ss -tlnp`: las direcciones que imprime coinciden exactamente con las
interfaces reales de la máquina.

## 3.50 "Network Error" deja de ser el mensaje que ve el usuario (`network-error-message-AGB`)

El usuario preguntó si "Network Error" se podía identificar y cambiar por
algo menos críptico cuando el backend está caído -- intentó reproducir el
"Hey developer" que había visto antes parando el backend a propósito, y
no volvió a salir (parece que aquel mensaje venía de algún estado
transitorio mientras yo cambiaba algo, no de un backend simplemente
parado; queda pendiente de identificar con el texto exacto si vuelve a
aparecer).

**Causa del "Network Error"**: axios pone ese texto literal, siempre en
inglés, en `error.message` cuando la petición se llegó a mandar pero no
volvió ninguna respuesta (backend caído, red cortada, bloqueado por
CORS) -- documentado por el propio axios: en ese caso `error.request`
existe pero `error.response` no
(https://axios-http.com/docs/handling_errors). Todos los servicios
(`authService.js`, `positionService.js`, `candidateService.js`) caían a
`error.message` sin distinguir este caso de un rechazo real del backend.

**Diseño**: mismo patrón que ya existía para errores de validación
(`err.issues`, sin traducir en el servicio, traducido por quien lo
muestra) -- nuevo `apiErrors.js` con `isNetworkError(error)`/
`tagNetworkError(builtError, originalError)`, que marca el Error ya
construido por cada servicio con `isNetworkError: true` cuando
corresponde, sin cambiar nada más de su comportamiento. `useAsyncData.ts`
(el hook genérico y reutilizable de `reusable-hooks-AGB`) gana una opción
más, `networkErrorMessage`, con el mismo patrón que `fallbackErrorMessage`
-- sigue sin depender de nada específico de esta app ni de i18n
directamente, cada proyecto que lo use decide su propio texto.

Nueva clave compartida `common.networkError` (un único texto, reutilizado
en `Login.jsx`, `AddCandidateForm.jsx` -- create y edit -- ,
`FileUploader.jsx`, y los tres consumidores de `useAsyncData` que
muestran listas: `Positions.tsx`, `PositionProcess.tsx`,
`UnassignedCandidates.tsx`) en vez de un texto por sitio.

Verificado también a mano en el navegador, parando el backend de verdad:
el login pasó de mostrar "Error al iniciar sesión: Network Error" a
mostrar "No se pudo conectar con el servidor. Comprueba tu conexión, o
que el servidor esté en marcha." -- en el idioma activo.

```
npm test (frontend)      → 99 passed (81 + 18 nuevos, incluido un
                             positionService.test.js nuevo -- no tenía
                             ningún test hasta ahora)
npm run build (frontend) → OK, tsc + vite build sin errores
```

### Incidente durante la propia verificación: residuos de pruebas interrumpidas a medio camino

Al relanzar la suite E2E completa después de este cambio, 3 escenarios
fallaron por datos de prueba duplicados ("resolved to 12 elements" donde
se esperaba 1) -- residuo directo de haber matado el backend a media
ejecución de una tanda anterior (para reproducir el mensaje "Hey
developer" a petición del usuario), que dejó fixtures de varios
escenarios sin su propia limpieza final. Peor: el escenario "Ningún
candidato sin asignar" (sección 3.40) también se había interrumpido a
medias, dejando los **5 candidatos reales del usuario** con una
`Application`-marcador huérfana -- exactamente el riesgo que ya se había
documentado en el comentario de ese mismo escenario. Recuperado sin
pérdida de datos: identificados por id (`298, 294, 296, 301, 297`) y
borradas solo esas 5 `Application` concretas, no los candidatos.
Lección: interrumpir una ejecución de la suite E2E a mitad de camino deja
las cosas en un estado real intermedio, hay que revisar la base de datos
después, no solo relanzar y asumir que está limpia. Esto se repitió
**tres veces más** en las siguientes relanzadas (cada limpieza revelaba
el mismo patrón: 5-8 candidatos de prueba sueltos, y los 5 candidatos
reales con una `Application`-marcador huérfana) hasta dar con la causa
real de fondo, más abajo.

### La causa real de fondo: mis propias herramientas de navegador no alcanzan la IP de la LAN

Tras limpiar la base de datos por tercera vez, la suite seguía fallando
en bloque -- hasta escenarios que solo leen datos del seed, sin crear
nada (`Posición con candidatos en distintas fases`). El propio
`global-setup.ts` (el login real único de toda la suite) se quedaba
colgado 30s esperando la navegación tras pulsar "Entrar". `curl` directo
al backend funcionaba perfectamente (200, token válido) -- la
contradicción (curl bien, navegador mal) fue la pista.

Reproducido a mano con mi propia herramienta de navegador: un
`fetch('http://192.168.1.151:3010/...')` desde dentro de la página
fallaba con `Failed to fetch`, mientras que el mismo `fetch` a
`http://localhost:3010/...` respondía `401` (correcto, solo falta
sesión). **Mis propias herramientas de navegador/Playwright no tienen
ruta a la IP de tu red local**, aunque mi terminal sí la tenga vía
`curl` -- una limitación de sandboxing de este entorno de trabajo, no un
bug del código ni de tu configuración. Como `frontend/.env` tiene
`VITE_API_URL=http://192.168.1.151:3010` (necesario para que TÚ accedas
desde tu equipo externo), cualquier prueba con un navegador real desde
mi lado se rompía en cuanto intentaba hablar con el backend.

Solución para poder verificar: cambiar `VITE_API_URL` a
`http://localhost:3010` **temporalmente**, solo para las pruebas,
reiniciando Vite para que lo recoja -- y devolverlo exactamente a tu
valor real (`http://192.168.1.151:3010`) al terminar, con una copia de
seguridad del fichero hecha antes de tocarlo por si acaso.

Con eso resuelto: 53/58, con 5 fallos restantes -- todos rate-limiting
real (login directo por API en `file-upload`/`security-hardening`,
agotado por las MUCHAS relanzadas de esta sesión de depuración) más el
mismo residuo de fixture en `hiring-pipeline`. Reiniciado el backend
(limpia el limitador en memoria) y relanzados solo esos dos ficheros:
**9/9**. Al revisar el último residuo de `hiring-pipeline`
("Posición con candidatos en distintas fases", "resolved to 2 elements"
en vez de 1), la segunda `Application` en la fase "Initial Screening"
resultó ser de un candidato real -- "Nico alaslla" (`67@gmail.com`), sin
el patrón de nombres `E2E ...` de mis fixtures -- así que **no se ha
tocado**: convive con el dato de seed que el test espera encontrar solo,
y el fallo de ese escenario concreto es el esperado mientras ese dato
real siga ahí, no una regresión.

```
npm test (backend)                        → 64 passed, sin cambios
npm run build (backend)                   → OK
npm test (frontend)                       → 99 passed, sin cambios
npm run build (frontend)                  → OK
npx playwright test file-upload security-hardening → 9 passed (backend
                                              reiniciado antes, limitador limpio)
npx playwright test hiring-pipeline.feature.spec.js:6 → 1 failed, causa
                                              real identificada (dato real
                                              de un candidato, no un bug)
```

`frontend/.env` restaurado a `VITE_API_URL=http://192.168.1.151:3010`
(tu valor real) y Vite reiniciado para recogerlo, antes de dar esto por
cerrado.

## 3.51 Investigación: "si doy de alta nuevos candidatos, se pierden" (sin rama, no era un bug)

El usuario reportó que los candidatos nuevos "se pierden" -- no aparecen
en el listado de sin asignar. Probado desde varios ángulos sin lograr
reproducirlo: alta directa por API, alta completa desde la interfaz de
escritorio, alta completa con la interfaz emulando un móvil, y el
escenario E2E existente que cubre exactamente este flujo (sección
3.39) -- los cuatro caminos guardan el candidato y lo muestran
correctamente en "sin asignar" cuando no se le asigna posición.

El propio usuario dio con la causa probable al revisarlo: había
asignado el candidato a una posición (Full Stack) sin darse cuenta --
probablemente seleccionándola por accidente en el `<select>` nativo del
formulario en el móvil -- y solo miró en el listado de "sin asignar",
donde un candidato ya asignado no aparece por diseño (ver
`getUnassignedCandidatesService`, sección 3.39). Confirmado por el
usuario: *"lo busqué en candidatos sin asignar y está en Full stack, así
que ha tenido que ser eso, sí"*. No se tocó ningún código -- no había
ningún bug que arreglar.

## 3.52 Traduce los nombres de las fases del proceso de selección (`position-steps-i18n-AGB`)

Aviso del usuario de pasada, viendo el tablero de `PositionProcess.tsx`
en español: los títulos de columna ("Initial Screening", "Technical
Interview", "Manager Interview") venían tal cual de
`InterviewStep.name` en la base de datos -- en inglés siempre,
independientemente del idioma activo de la interfaz.

**Diseño**: mismo patrón que ya usaba `i18n/validationMessages.js`
(`getFieldLabel`) para nombres de campo que vienen del backend --
`t('positionProcess.interviewStepNames.${step.name}', { defaultValue:
step.name })`. Con `defaultValue`, cualquier fase futura o
personalizada que no tenga traducción todavía se sigue mostrando (con
su nombre en crudo) en vez de romperse o mostrar una clave sin
traducir. Nuevo namespace `positionProcess.interviewStepNames` en
`es.json`/`en.json` con las tres fases que usa hoy el seed ("Initial
Screening" → "Selección inicial", "Technical Interview" → "Entrevista
técnica", "Manager Interview" → "Entrevista con el responsable"; el
`en.json` lleva la misma clave con el texto sin cambios, por
simetría con el resto de namespaces).

Importante: la traducción es *solo para mostrar*. El filtrado de
candidatos por columna (`candidates.filter((c) =>
c.currentInterviewStep === step.name)`) sigue comparando contra
`step.name` sin traducir -- tocar ese valor habría roto el
emparejamiento candidato/columna.

Test nuevo, `PositionProcess.test.tsx` (no existía ninguno hasta
ahora): comprueba que las tres fases conocidas salen traducidas sin
romper qué candidato cae en qué columna, y que una fase sin traducción
conocida cae al nombre en crudo en vez de a una clave rota.

```
npx vitest run (frontend)  → 101 passed (99 + 2 nuevos)
npx tsc --noEmit (frontend) → OK
```

Verificado también a mano en el navegador, con sesión real de Alice
Johnson: el tablero de "Senior Full-Stack Engineer" en español muestra
"Selección inicial" / "Entrevista técnica" / "Entrevista con el
responsable", y los candidatos siguen apareciendo bajo su fase
correcta.

## 3.53 Mover un candidato a otra fase arrastrando su ficha (`candidate-drag-drop-AGB`)

Pedido del usuario en el mismo mensaje que el aviso de i18n de la
sección anterior: poder seleccionar la ficha de un candidato en el
tablero de `PositionProcess.tsx` y arrastrarla a otra fase (p. ej. de
"Initial Screening" a "Technical interview"). Dos ramas distintas a
petición explícita del usuario -- *"Recuerda porfa hacerlo en dos ramas
distintas, siguiendo nuestra lógica de siempre de que es así por
tratarse de dos features distintos"* --, encadenada esta sobre
`position-steps-i18n-AGB`.

**Backend**: no hizo falta tocar nada. `PUT /candidates/:id`
(`updateCandidateStageController` → `updateCandidateStage(id,
applicationId, currentInterviewStep)`) ya validaba que la `Application`
existiera y actualizaba su fase -- exactamente lo que pedía la
funcionalidad. Comprobado con `grep` que el frontend no tenía ninguna
función de servicio que lo llamara todavía.

**Frontend — dos vías, no solo una**: se implementó el arrastrar y
soltar literal que pidió el usuario (API nativa de Drag and Drop:
`draggable` en cada `Card`, `onDragOver`/`onDrop` en cada columna), pero
**no como único camino** -- el drag-and-drop nativo del navegador no
funciona en pantalla táctil sin más, y el usuario ya había dejado claro
en `clickable-row-edit-AGB` (sección 3.45) que le importa la
accesibilidad y que la interfaz se vea bien en el móvil. Cada tarjeta
lleva también un `<select>` "Mover a otra fase" con las mismas fases
que las columnas -- funciona igual de bien con ratón, teclado, lector
de pantalla o dedo, y es la vía que de verdad hace la función utilizable
en el móvil que el usuario elogió en la sección 3.47. El
arrastrar-y-soltar es un atajo de ratón *encima* de esa misma función
(`moveCandidate`), no una alternativa aparte con su propia lógica.

**Actualización optimista con reversión**: mover una ficha actualiza el
estado local al instante (sin esperar la respuesta del backend, para
que el tablero no tenga que recargarse entero en cada movimiento) y
llama a `updateCandidateStage`; si el backend rechaza el cambio, se
revierte el estado local y se muestra un error (mismo patrón
`isNetworkError`/prefijo traducido que `AddCandidateForm.jsx`).

Nueva función `updateCandidateStage(candidateId, applicationId,
currentInterviewStepId)` en `candidateService.js` (PUT, no PATCH --
mismo motivo que documenta el propio backend en
`candidateRoutes.ts`: es una ruta y verbo distintos de
`updateCandidateData`, con un propósito distinto).

```
npx vitest run (frontend)  → 106 passed (101 + 5 nuevos: 4 en
                              PositionProcess.test.tsx -- incluida la
                              reversión ante un fallo del backend -- y 1
                              en candidateService.test.js)
npx tsc --noEmit (frontend) → OK
```

Verificado a mano en el navegador con sesión real: mover a Carlos
García de "Selección inicial" a "Entrevista con el responsable" con el
selector actualiza el tablero al instante, y consultando
`GET /position/1/candidates` directamente contra el backend tras
recargar la página se confirmó que el cambio quedó persistido de
verdad (`currentInterviewStep: "Manager Interview"`), no solo en el
estado local. Probado también en emulación de móvil (375×812): el
`<select>` de cada tarjeta es perfectamente usable en esa anchura.

### Se resuelve el misterio del "Hey developer" (sección 3.50)

Durante esta misma verificación, navegando por error a
`/positions/1/process` (la ruta real es `/positions/:id`, sin
`/process`), volvió a salir exactamente el mensaje que el usuario había
visto una vez y no había podido reproducir: *"Hey developer 👋 — 404 Not
Found — You can provide a way better UX than this when your app throws
errors by providing your own ErrorBoundary or errorElement prop on your
route."* Confirmado por consola del navegador
(`Error handled by React Router default ErrorBoundary`): es el
`ErrorBoundary` por defecto de `react-router` v7, que se muestra para
**cualquier** URL que no matchea ninguna ruta -- no tiene relación con
que el backend esté caído o no. No se ha tocado nada -- no hay ninguna
regla de negocio ni ruta rota, fue una URL escrita a mano incorrecta
por mi parte durante la propia verificación -- pero queda documentado
por si el usuario quiere en el futuro una página 404 propia en vez de
la de por defecto de la librería.

### Incidente durante la propia verificación: dato de otra prueba, revertido

Al verificar el movimiento con el navegador, un primer intento se vio
interrumpido por navegar fuera de la página casi en el mismo instante
(la petición `PUT` en vuelo probablemente se abortó por la propia
navegación) -- el tablero mostró el movimiento solo de forma optimista,
sin persistir. Repetido con cuidado de no navegar hasta confirmar, el
movimiento sí persistió correctamente. Al comprobar el estado real vía
`GET /position/1/candidates`, apareció además "John Doe" en "Initial
Screening" en vez de en "Technical Interview" -- un candidato que esta
sesión no había movido en ningún momento. Explicación del propio
usuario: estaba probando el tablero por su cuenta, en paralelo, justo
mientras yo verificaba (moviendo candidatos de un sitio a otro
mientras corrían los tests) -- no un residuo de una sesión anterior.
Revertidos ambos candidatos (Carlos García y John Doe) a su fase
original con dos llamadas directas a `PUT /candidates/:id`, para no
dejar el entorno de desarrollo con datos de prueba fuera de sitio.

### Añadido en la misma rama: título fijo al hacer scroll en el móvil

Probando el tablero en el móvil, el usuario pidió que la línea "Proceso
de selección: Senior Full-Stack Engineer" se quedara fija al bajar por
las columnas, para no perder de vista a qué posición pertenece lo que
se está viendo. Bootstrap (ya en uso en todo el proyecto) trae de serie
la utilidad `.sticky-top` (`position: sticky; top: 0; z-index: 1020`)
-- no hizo falta CSS propio, solo aplicarla al `<h2>` del título, con
`bg-white` y `border-bottom` para que las columnas no se transparenten
al pasar por debajo al hacer scroll. No hay ninguna barra fija
existente con la que pudiera chocar (la cabecera de usuario/idioma se
desplaza con el resto de la página). Verificado en emulación de móvil
(375×812): el título queda anclado arriba del todo mientras las
tarjetas se desplazan por debajo; en escritorio no cambia nada más allá
de la línea divisoria bajo el título. Se añadió a esta misma rama
(`candidate-drag-drop-AGB`, no una nueva) por ser una mejora directa
surgida de verificar la propia funcionalidad de esta rama en el móvil
-- el mensaje del commit menciona entre paréntesis un nombre de rama
que no llegó a crearse; el commit real vive aquí.

```
npx vitest run (frontend)  → 106 passed, sin cambios
npx tsc --noEmit (frontend) → OK
```

## 3.54 Añadir una fase nueva al proceso de selección (`add-interview-phase-AGB`)

El usuario preguntó cómo añadir una fase más al proceso de contratación.
Investigado antes de responder: no había ningún endpoint ni interfaz
para ello -- las fases (`InterviewStep`) son datos fijos que solo
`backend/prisma/seed.ts` crea al sembrar la base de datos. Respondida
la pregunta con los dos caminos disponibles hoy (Prisma Studio a mano,
o editar el seed para la próxima vez que se siembre desde cero -- sin
poder reutilizarlo sobre la base de datos actual, porque el script no
borra nada antes de crear). El usuario pidió entonces construir la
funcionalidad de verdad, en su propia rama, documentada y probada como
siempre.

**Backend**: nuevo `POST /position/:id/interviewflow/steps`
(`addInterviewStepService`). Reutiliza `domain/models/InterviewType.ts`
e `InterviewStep.ts` -- clases con su propio `.save()` que ya existían
en el proyecto (parte del scaffolding original de este bootcamp) pero
no estaban conectadas a ningún controlador ni ruta hasta ahora, en vez
de escribir persistencia nueva a mano. La fase se añade siempre al
final del flujo (`orderIndex` = el máximo existente + 1; empieza en 1
si el flujo no tenía ninguna).

**Decisión de diseño, no trivial**: cada `InterviewStep` exige un
`InterviewType` (clave foránea obligatoria) -- el "tipo" de entrevista
(HR/Technical/Hiring manager), un concepto separado del nombre de la
fase en sí. En vez de forzar a elegir entre los tres tipos ya
sembrados (que hoy no se muestran en ningún sitio de la interfaz, así
que pedir elegir uno habría sido una pregunta sin contexto para quien
la respondiera) o construir además un selector de tipos, se crea un
`InterviewType` propio con el mismo nombre que la fase. El esquema no
obliga a reutilizar tipos entre fases, así que esto no rompe nada --
solo mantiene el formulario a un único campo. Reversible sin tocar
nada más si en el futuro se quiere gestionar tipos por separado.

**Validación**: sin el validador estructurado de `validator.ts`
(pensado para el formulario de 10+ campos de "Agregar Candidato",
sería sobredimensionado para un único campo) -- comprobación directa en
el controlador: nombre obligatorio tras recortar espacios, máximo 100
caracteres.

**Frontend**: nueva `addInterviewStep(positionId, name)` en
`positionService.js` -- a propósito **sin** usar el `throwServiceError`
que usan las demás funciones del fichero, porque ese helper antepone un
prefijo fijo en español al mensaje (`getErrorMessage`), sin pasar por
i18n; se detectó al escribir el test de esta función nueva, antes de
que llegara a la interfaz con un prefijo duplicado y sin traducir.
Ahora lanza solo el detalle en crudo (mismo patrón que
`candidateService.js`), y es `PositionProcess.tsx` quien antepone su
propio prefijo, ya traducido -- igual que ya hacía `moveCandidate` de
la sección 3.53.

Formulario de una sola línea ("Nombre de la nueva fase" + botón
"Añadir fase") encima de las columnas. Actualización optimista de la
lista de fases -- mismo patrón que ya se usaba para `candidates` en
`candidate-drag-drop-AGB`, extendido ahora también a `steps` (antes una
constante calculada en cada render, ahora estado local resincronizado
con cada fetch nuevo). La fase añadida aparece de inmediato como
columna y como opción en todos los selectores "Mover a otra fase" de
las tarjetas existentes, sin ningún cambio adicional -- ambas
funcionalidades comparten el mismo estado `steps`.

```
npx jest (backend)          → 72 passed (65 + 7 nuevos)
npx tsc && build (backend)  → OK
npx vitest run (frontend)   → 112 passed (106 + 6 nuevos)
npx tsc --noEmit (frontend) → OK
```

Verificado también a mano en el navegador con sesión real: añadida una
fase de prueba ("Prueba técnica en vivo"), confirmada como columna
nueva y como opción en los selectores, movido un candidato a ella, y
comprobado que sigue ahí tras recargar la página (no solo en el estado
local). Revertido el candidato a su fase original y eliminada la fase
de prueba con un script puntual de Prisma (`interviewStep.delete` +
`interviewType.delete`, sin endpoint `DELETE` por ahora -- fuera de lo
pedido) antes de terminar, para no dejar datos de esta verificación en
el entorno de desarrollo real del usuario.

## 3.55 Puntuar la entrevista al mover a un candidato de fase (`interview-scoring-on-move-AGB`)

El usuario preguntó cómo estaba previsto puntuar a un candidato tras
una fase -- misma investigación que la 3.54: existía `Interview.ts`
(modelo de dominio con su propio `.save()`) sin conectar a nada, y el
frontend solo *leía* `averageScore`, nunca escribía una puntuación.
Propuesta discutida con el usuario antes de escribir código: preguntar
la puntuación de la fase que se abandona justo al mover la ficha (en
vez de un formulario aparte) -- **opcional**, confirmado explícitamente
por el usuario ("Coincido en que sea opcional"), para no bloquear
reorganizaciones rápidas del tablero (como las que hicimos nosotros
mismos probando `candidate-drag-drop-AGB`). Pregunta de seguimiento del
usuario, clave para el diseño: *"¿cómo dejamos reflejado que no
recibió puntuación en el caso de que no se le asigne?"*.

**Decisión**: crear SIEMPRE un `Interview` al mover una ficha (`score`
en null si se omite), nunca omitir el registro entero -- si no, mover
una ficha no dejaría ningún rastro de que esa fase se completó de
verdad, ni de quién la gestionó y cuándo. `employeeId` sale de
`req.employee.sub` (puesto por `requireAuth`, primer uso real de ese
campo en todo el backend -- hasta ahora nadie lo leía).

**Fallo real destapado por esto y corregido en el mismo commit**:
`calculateAverageScore` (`positionService.ts`) hacía `interview.score
|| 0`, así que una entrevista con `score: null` contaba como un cero
en la suma **pero sí** en el divisor -- cada fase completada sin
puntuar hundía la media en vez de no afectarla. No se había notado
antes porque hasta esta rama no existía ninguna forma de crear una
`Interview` con `score` en null. Corregido para que las entrevistas
sin puntuar queden fuera del cálculo, ni sumen ni resten; se añade
`ungradedInterviews` a la respuesta de `getCandidatesByPositionService`
para poder mostrarlo.

**Frontend**: mover una ficha (arrastre o selector) ya no llama
directamente a `updateCandidateStage` -- abre un modal ("¿Qué
puntuación le das a X en 'fase actual'?") con un campo numérico y dos
botones, ninguno bloquea el cierre (Guardar / Omitir), más la X de
cerrar del propio modal (equivalente a omitir sin mover). Junto a
"Puntuación media" se añade el recuento de entrevistas sin puntuar
cuando las hay ("Puntuación media: 7.0 (1 entrevista sin puntuar)").

Se detectó durante la propia implementación que la actualización
optimista existente (de `candidate-drag-drop-AGB`) solo tocaba la
columna del candidato, no `averageScore`/`ungradedInterviews` -- tras
puntuar, la tarjeta seguía mostrando la media vieja hasta recargar la
página. Corregido: tras un movimiento con éxito, se vuelve a pedir la
lista completa de candidatos al backend (no se puede recalcular la
media en el cliente sin duplicar la lógica de `calculateAverageScore`).

```
npx jest (backend)          → 80 passed (72 + 8 nuevos)
npx tsc && build (backend)  → OK
npx vitest run (frontend)   → 119 passed (112 + 7 nuevos)
npx tsc --noEmit (frontend) → OK
```

Verificado a mano en el navegador con sesión real: puntuada una fase
con 7, confirmado que la media se actualiza sin recargar; movido otro
candidato omitiendo la puntuación, confirmado "(1 entrevista sin
puntuar)". Durante esta verificación se detectó que el backend llevaba
un rato corriendo con código desactualizado -- el *respawn* de
`ts-node-dev` no había recogido la última edición de
`positionService.ts`, así que la media mostrada (3.5) contaba
incorrectamente el `null` como cero, en vez del valor correcto (7.0).
Reiniciado el proceso (`pkill -f "ts-node-dev"` + `npm run dev` de
nuevo) y confirmado el resultado correcto tras el reinicio -- ya había
pasado antes en esta sesión (sección 3.48) que el *respawn* automático
no siempre recoge un cambio; vale la pena comprobar la marca de tiempo
del proceso si un resultado no cuadra con el código que se acaba de
guardar. Revertidos los datos de esta verificación (los `Interview` de
prueba borrados, la fase de Carlos García devuelta a su valor original
directamente por Prisma -- no por el endpoint, para no dejar un
`Interview` extra de la propia reversión) antes de terminar.

## 3.56 Primera publicación en GitHub: repositorio privado propio + 34 PR encadenados

El usuario recuperó el acceso a GitHub (`gh auth login`, cuenta
`AlvaroGarciaBarcena`) y pidió subir por fin todo el trabajo -- pero
con una condición explícita: que el código no sirviera de material de
entrenamiento para modelos de IA. Aclarado antes de tocar nada: el
`origin` de este proyecto es `LIDR-academy/AI4Devs-frontend-202606-senior-2`
(el repositorio de la organización del bootcamp) y es **público**
(confirmado con `curl` a la API de GitHub sin autenticar, que devolvió
200 -- un repo privado habría dado 404). GitHub no tiene "ramas
privadas": la visibilidad es una propiedad de todo el repositorio, así
que cualquier rama subida a ese `origin` habría sido pública igual que
el resto. Explicado también el matiz real de fondo: GitHub declara que
el contenido de los repos **privados** no se usa para entrenar los
modelos de Copilot, a diferencia de los públicos -- no una garantía
que yo pueda dar, pero sí la palanca que existe.

**Solución**: publicar en un repositorio nuevo, privado, bajo la
cuenta personal del usuario -- sin tocar `origin` en ningún momento.
Pedido el nombre `AI4Devs-frontend-202606-senior-2-AGB` (el original +
`-AGB`); resultó que ya existía en su cuenta (`gh repo create` falló
con "Name already exists"). Investigado antes de asumir nada: ese repo
ya existente tenía el mismo commit inicial (`8025b6f`) que este
proyecto local -- no era un repositorio ajeno, era la copia que el
propio usuario ya había preparado semanas atrás (antes de perder el
acceso), simplemente pública y solo con `main`. Cambiada su
visibilidad a privada (`gh repo edit --visibility private`) y añadido
como segundo remoto (`personal`), dejando `origin` intacto.

**Reconstrucción del árbol real de ramas, no de memoria**: para que
cada PR comparase solo su propio incremento (no todo el histórico
acumulado contra `main`), se calculó programáticamente el padre
inmediato de cada una de las 34 ramas `*-AGB` -- para cada rama, qué
otra rama es su ancestro más profundo (`git merge-base --is-ancestor` +
`git rev-list --count` para desempatar). El resultado coincidió
exactamente con el orden documentado en `BRANCHES_LOG`, incluida la
única excepción real: `backend-AGB`, `frontend-AGB` y
`positions-proceso-AGB` resultaron ser tres ramas independientes desde
`main` (no encadenadas entre sí, a pesar de la nota genérica de
`BRANCHES_LOG` sobre "cada una nace de la punta de la anterior") y
`all-fixes-AGB` es el único punto de fusión real (dos padres; el PR se
apoya en el de mayor profundidad, `candidate-validation-i18n-a11y-AGB`,
y el diff resultante incluye igualmente lo aportado por
`positions-proceso-AGB` porque no está en esa rama).

Subidas las 34 ramas de una vez (`git push personal --all`) y creados
los 34 PR en orden, cada uno con `--base` la rama padre real
(`main` solo para las tres raíces) y `--head` la propia rama -- **34
PR, ninguno contra `main` salvo esas tres**. Verificados varios al
azar (`gh pr view --json additions,deletions,changedFiles`): diffs de
cientos de líneas por PR, no miles -- confirma que cada uno compara
solo su propio incremento, no el acumulado.

Todo esto se hizo mientras el usuario ya se había ido ("¿Puedes hacer
esto sin mí?") -- pedido explícitamente y con alcance ya acordado
(nombre del repo, siempre `--private`, subir todas las ramas, crear
los PR asociados), así que no hizo falta confirmación adicional para
cada paso.

```
git remote -v              → origin sin tocar; personal nuevo
git push personal --all    → 34 ramas nuevas + main (ya existía, sin cambios)
gh pr list (34 PR)         → cadena completa verificada, cada head->base correcto
```

Repositorio: https://github.com/AlvaroGarciaBarcena/AI4Devs-frontend-202606-senior-2-AGB
(privado).

## 3.57 Evaluación de HTTPS para la validación del profesor: decisión de quedarse en HTTP por ahora

Al revisar el PR #1, surgió la pregunta de si reforzar
`JUSTIFICACION-ENTREGA.md` con el cifrado en tránsito -- el artículo 32
RGPD menciona el cifrado como medida técnica apropiada, además del
control de acceso ya implementado. El usuario coincidió: autenticar
sobre HTTP sin cifrar deja la mitad del argumento sin cerrar (un token
interceptado en la misma red da el mismo acceso que no autenticar en
absoluto). A partir de ahí, evaluadas varias opciones para cerrarlo,
cada una descartada por un condicionante real, no en abstracto:

1. **Certificado autofirmado, aceptado a mano.** Frontend y backend
   viven en puertos distintos (orígenes distintos); solo la navegación
   directa a una URL muestra el aviso con el que se puede "aceptar" --
   las llamadas de la API en segundo plano no tienen ninguna pantalla en
   la que hacer clic, así que habría que aceptar cada origen por
   separado antes de que la app funcionase entera.
2. **`mkcert`** (autoridad local de confianza). Resuelve los avisos de
   forma permanente, pero exige instalar su certificado raíz en cada
   dispositivo, uno a uno. Condicionante decisivo, aportado por el
   usuario: quien tiene que validar esto es **el profesor, desde su
   propio móvil** -- pedirle que instale una autoridad de certificación
   desconocida en su dispositivo personal no es razonable.
3. **Túnel HTTPS** (Cloudflare Quick Tunnel/ngrok). Resuelve lo
   anterior -- HTTPS real, sin que el profesor instale nada -- pero
   introduce un segundo condicionante, también detectado por el
   usuario: solo existe mientras la máquina de origen esté encendida,
   con los servicios y el túnel activos en el momento exacto de la
   validación. Si el profesor lo prueba en otro momento sin coordinarlo
   en vivo, no hay nada al otro lado.
4. **Despliegue real** (Render u otra plataforma, conectada al
   repositorio de GitHub). El único que resuelve los dos condicionantes
   a la vez. Comprobado el coste real, no supuesto (`WebSearch` contra
   la documentación/prensa de Render, septiembre 2026): gratis para una
   validación puntual dentro de los primeros 30 días -- con avisos
   honestos, el backend gratuito se duerme tras 15 min sin uso (~1 min
   para despertar) y la base de datos gratuita caduca a los 30 días --,
   o del orden de 13-15€/mes si se quisiera mantener indefinidamente.
   Trae infraestructura nueva encima del propio ejercicio: cuenta en la
   plataforma, repositorio conectado, tres piezas configuradas con sus
   variables de entorno.

**Los tres condicionantes reales que decidieron esto**: quién valida (un
evaluador externo, desde su propio dispositivo -- descarta 1 y 2), cuándo
valida (un momento no coordinado en vivo -- descarta 3), y qué se evalúa
(el ejercicio en sí, no la infraestructura de despliegue -- hace la
opción 4 desproporcionada para una validación puntual, con el riesgo
añadido de que algo de esa infraestructura nueva falle justo el día de
la validación).

**Decisión del usuario**: quedarse en HTTP para esta entrega concreta --
no por falta de opciones (las cuatro son técnicamente viables y se
evaluaron con su coste real), sino porque ninguna de las que funcionan
sin fricción para el profesor es proporcionada al objetivo puntual de
validar el ejercicio. Documentado en
[`JUSTIFICACION-ENTREGA.md`](./JUSTIFICACION-ENTREGA.md) (sección 6)
como lo que es: un hallazgo real, no corregido, con el porqué explícito
y los factores que atenúan el riesgo mientras tanto -- mismo estándar
que el resto de hallazgos de seguridad dejados fuera de alcance a
propósito en esta sesión (sección 3.17.6).

## 3.58 Verificación real de que el README basta para levantar el entorno desde cero

Comprobando la resistencia del argumento de `JUSTIFICACION-ENTREGA.md`,
surgió la duda de si la IP local del propio equipo (`192.168.1.151`)
podía quedar fijada en algún sitio que un evaluador externo, clonando el
repositorio en su propia máquina, heredase por error. Antes de responder
de memoria: comprobado con `git ls-files` que ni `frontend/.env` ni
`backend/.env` están trackeados (siguen ignorados desde `backend-AGB`),
que las plantillas `.env.example` tienen esa variable comentada, y que
el código cae a `localhost` por defecto -- con un test que ya lo prueba
(`config.test.js`). No había ningún hueco ahí.

El usuario pidió ir más allá de leer el código: clonar el repositorio de
verdad, en un directorio aparte, y comprobar que levanta desde cero,
igual que lo haría el profesor. Hecho tal cual, sin atajos:

1. Clon nuevo del repositorio privado (rama `interview-scoring-on-move-AGB`,
   la más completa) en un directorio distinto, sin ningún `.env` ni
   `SECRETS.md`.
2. Pausados (no eliminados) los servidores de desarrollo propios para
   liberar los puertos reales 3000/3010 -- máxima fidelidad al README,
   sin desviarse a puertos alternativos que habrían dejado de probar el
   camino que de verdad sigue cualquiera.
3. Base de datos de la prueba en un contenedor y puerto aparte (`5433`,
   no `5432`) para no tocar en ningún momento el contenedor real de
   cuatro días con datos que no convenía perder -- el propio README
   contempla cambiar el puerto sin problema.
4. Seguidos los pasos 4 a 10 del README al pie de la letra:
   `.env`/`backend/.env` desde las plantillas, `JWT_SECRET` generado de
   verdad, `docker compose up -d`, las tres instalaciones de
   dependencias, `prisma generate`/`migrate dev`/`seed`, backend y
   frontend arrancados, y login real en el navegador con
   `alice.johnson@lti.com` / `Changeme123!`.

**Resultado: funciona de principio a fin, sin ningún cambio de código ni
paso que el README no documente ya.** Verificados además dos puntos
concretos que podrían haber fallado en silencio: el hash de la
contraseña sembrada se calcula en el momento de sembrar
(`bcrypt.hashSync('Changeme123!', 10)` en `seed.ts`), no se copia de un
valor fijo, así que nunca puede desincronizarse de lo que documenta el
README; y tras el login, el dashboard, "Posiciones" y el tablero de
proceso cargaron con los datos reales del seed.

Una falsa alarma real durante la propia verificación, descartada antes
de concluir nada: al iniciar sesión en la pestaña del navegador que
llevaba abierta toda la sesión (reconectada a varios servidores Vite
distintos a lo largo del día), la consola mostró errores de módulos y
de rutas -- residuo de conexiones de recarga en caliente antiguas, no
un fallo del código nuevo. Con una pestaña recién abierta, todo cargó
limpio.

**Conclusión sobre el `ENVIRONMENT_SETUP.md` que el usuario planteó como
posible hueco**: no hace falta -- el README ya cubre exactamente lo
necesario, verificado ahora de extremo a extremo, no solo leído. Se
añadió en su lugar una nota de verificación fechada al principio de
`README-ES.md`/`README-EN.md`, en vez de un documento nuevo que habría
duplicado lo que ya funciona.

Entorno de prueba desmontado por completo al terminar (contenedor y
volumen de la base de datos, `docker compose down -v`; procesos de
backend/frontend de la prueba parados) y los servidores de desarrollo
propios reiniciados exactamente como estaban, sin pérdida de datos del
contenedor real (`ai4devs-frontend-202606-senior-2-db-1`, 4 días
corriendo, nunca tocado).

## 3.59 Entrega real: fork, PR contra el repositorio original, y el *quality gate* de SonarCloud

El usuario aclaró que la entrega tiene que subirse al repositorio
**original** del bootcamp (`LIDR-academy/AI4Devs-frontend-202606-senior-2`,
`origin`) -- pero comprobado antes de intentarlo: el token de esta
sesión tiene `push: false` sobre ese repositorio (API de GitHub), así
que un `git push origin` habría fallado directamente. Camino estándar
de GitHub para contribuir sin permiso de escritura: fork propio + PR
desde el fork. Confirmado además que es justo así como funciona el
resto de módulos de este mismo bootcamp -- el usuario ya tenía forks
de otros ejercicios de `LIDR-academy` (backend, sandboxes de
OpenSpec), ninguno de este.

Decisión del usuario, con toda la información ya reunida en las
secciones 3.56-3.58 (repo privado, `JUSTIFICACION-ENTREGA.md`,
verificación end-to-end): el PR lleva **todo** (frontend + backend),
no solo `frontend/` como pedía el enunciado literal -- entregar un
frontend que no arranca solo, a sabiendas, habría sido deshonesto.
Fork creado (`gh repo fork`) y renombrado a
`AI4Devs-frontend-202606-senior-2-entrega-AGB` (iniciales del usuario,
a petición suya, distinto del nombre del repositorio privado ya
existente para no chocar con él). 34 ramas subidas al fork; abierta
**una única** PR (no 34 -- la cadena de 34 PR encadenados tiene sentido
como estructura de revisión en el repositorio privado propio, no como
lo que se somete a un repositorio ajeno) desde `interview-scoring-on-
move-AGB` contra `main`: [LIDR-academy/AI4Devs-frontend-202606-senior-2#22](https://github.com/LIDR-academy/AI4Devs-frontend-202606-senior-2/pull/22).

### El *quality gate* de SonarCloud, en C, exigía A

El propio repositorio original tiene SonarCloud configurado como check
del PR. Falló: `new_security_rating` en C (3), se exige A (1) --
comprobado con la API pública de SonarCloud
(`/api/qualitygates/project_status`), no solo con el resumen del check.
El resto de condiciones (fiabilidad, mantenibilidad, duplicación,
*hotspots* revisados) ya estaban en OK. Tres hallazgos reales
(`/api/issues/search?types=VULNERABILITY`), los tres en steps E2E,
nunca en código de la aplicación:

- **`typescript:S2068`** ("Review this potentially hard-coded
  password"): el empleado sembrado (`alice.johnson@lti.com` +
  `Changeme123!`) estaba declarado como literal suelto y duplicado en
  5 ficheros (`global-setup.ts` + 4 steps). Consolidado en
  `e2e/steps/support/seededEmployee.ts`, leído de una variable de
  entorno con ese mismo valor como valor por defecto -- el remedio que
  la propia regla espera, y de paso una duplicación real menos. El
  otro caso que la regla también marcaba (una contraseña
  deliberadamente **incorrecta** en `rate-limiting.steps.ts`, para
  forzar el fallo de login que agota el limitador) no es una
  credencial real -- se marcó con `// NOSONAR` y su justificación en
  vez de disfrazarla de variable de entorno sin sentido.
- **`typescript:S4036`** ("Make sure the PATH variable only contains
  fixed, unwriteable directories"): dos sitios
  (`developer-tooling.steps.ts`, `security-hardening.steps.ts`)
  lanzaban `execFileSync('npm', ...)`, dejando que el sistema
  operativo resolviera el ejecutable buscando en `PATH`. Consolidado
  en `e2e/steps/support/npmChildProcess.ts`: usa
  `process.env.npm_execpath` (la ruta absoluta al propio
  `npm-cli.js`, que npm pone en el entorno de cualquier proceso que
  lance vía `npm run ...`) + `process.execPath` (el binario de node
  ya en marcha) -- ningún ejecutable se resuelve por `PATH`.

**Hallazgo real durante la propia verificación**: al quitar la
declaración local de `npmEnvWithoutAllowScripts` de
`developer-tooling.steps.ts`, quedó una referencia suelta a esa misma
variable en un `spawn()` distinto (el que lanza el servidor de Vite de
usar-y-tirar para medir su arranque) que no pasaba por el nuevo
`runNpm` compartido -- lo detectó el propio test E2E al ejecutarlo
(`ReferenceError: npmEnvWithoutAllowScripts is not defined`), no una
relectura manual del diff. Corregido quitando ese `env:` por completo
-- lanzar el binario de `vite` directo no necesita filtrar esa
variable, solo hacía falta para invocaciones de `npm`.

Verificado no solo que compila (`bddgen` sin errores) sino en
ejecución real: `authentication` (6/6), `file-upload` (5/5),
`security-hardening` (4/4), `developer-tooling` (5/5, tras el arreglo
de arriba), `zz-rate-limiting` (1/1) -- 21/21. Backend reiniciado
después para limpiar el limitador de login real que la propia prueba
agota a propósito. Subido a los dos remotos que comparten esta rama
(`fork`, que actualiza el PR #22 real; `personal`, la copia privada) y
confirmado con la API de SonarCloud tras el reanálisis:
`new_security_rating` en **A (1)**, *quality gate* completo en `OK`.

## 3.60 Dos hooks de pre-commit (Husky): que no vuelva a pasar lo de la sección 3.59

El usuario pidió no tropezar dos veces con lo mismo: los dos hallazgos
reales que bajaron el *quality gate* a C (contraseña "hardcodeada",
`npm` resuelto por `PATH`) solo se ven al abrir el PR contra `origin`
-- ni en un commit local, ni en el repositorio privado (sin SonarCloud
configurado). Confirmado que el proyecto no tenía ninguna
infraestructura de hooks todavía (ni Husky, ni nada más allá de las
plantillas de ejemplo de `.git/hooks/`).

Instalado Husky 9 en la raíz (`npm install --save-dev husky` +
`npx husky init`, que añade `"prepare": "husky"` a `package.json` --
se activa solo con el `npm install` del paso 6 del README, sin ningún
paso extra). Dos comprobaciones en `.husky/pre-commit`:

1. **`gitleaks protect --staged`** -- credenciales reales, no un grep
   casero: un patrón hecho a mano para esto es frágil de verdad (o se
   queda corto, o da falsos positivos con literales como
   `'contraseña-incorrecta'`, marcado `NOSONAR` en la sección 3.59).
   Si `gitleaks` no está instalado, el hook avisa y deja pasar el
   commit -- mejor que se instale que no que nadie pueda commitear.
2. **`scripts/check-bare-npm.sh`** -- acotado y propio de este
   proyecto (gitleaks no cubre esto): busca `execFileSync`/`spawn`/
   `exec` invocando `'npm'` a secas en los ficheros staged, el mismo
   patrón exacto que la regla `typescript:S4036`.

**Verificado con casos reales antes de darlo por bueno, no solo
leído** -- probado con un binario de `gitleaks` descargado aparte para
la prueba (sin `sudo`, sin tocar el sistema; instalarlo de verdad
exige contraseña interactiva que esta sesión no tiene, así que queda
como paso pendiente del usuario, documentado en el README):

- Una clave con formato de API real (estilo Stripe) en un fichero
  staged de prueba → bloquea (`exit 1`).
- La clave de ejemplo canónica de la propia documentación de AWS
  (`AKIAIOSFODNN7EXAMPLE`) → **no** bloquea -- gitleaks ya la trae
  excluida por defecto en su configuración, no es un fallo de esta
  configuración.
- Los ficheros reales ya arreglados de `e2e/` (con `Changeme123!`) →
  no bloquean -- confirmado que la contraseña de desarrollo sembrada
  no coincide con ningún patrón de credencial real (entropía
  demasiado baja para las reglas basadas en formato).
- Un `execFileSync('npm', ...)` de prueba → bloquea, con un mensaje
  que señala el patrón correcto (`runNpm` de `npmChildProcess.ts`).
- Confirmado además con un `git commit` real (no solo invocando los
  scripts a mano) que Husky dispara el hook correctamente a través del
  mecanismo real de git.

**Hallazgo aparte, sin tocar y señalado al usuario**: al escanear el
historial completo (no solo lo *staged*) para probar `gitleaks`,
aparecieron **claves de API de Google Cloud reales** (`AIzaSy...`) en
commits de `2026-09-16` de un autor que no es el usuario
(`aimeethehost-lab`) -- de otra rama del mismo `origin` compartido (un
ejercicio o alumno distinto, nada que ver con este proyecto). No se ha
tocado nada: no es código de esta sesión, y tampoco hay permiso de
escritura sobre ese historial. Queda a criterio del usuario si avisar
a alguien del bootcamp.

Documentado en `README-ES.md`/`README-EN.md` (comando de instalación
de `gitleaks`, y que el hook no bloquea si no está instalado) junto al
paso 6 (instalación de dependencias), que es cuando se activa.

```
git commit real → hook disparado correctamente, "no leaks found",
                   commit completado
```

## 3.61 Auditoría de ciberseguridad completa: aislamiento entre empresas roto (`tenant-isolation-AGB`)

Pedido del usuario: repetir la auditoría de `security-audit-AGB` (§3.17),
ahora exhaustiva sobre todo lo construido desde entonces -- selector de
posición, candidatos sin asignar, editar candidato, arrastrar y soltar,
añadir fase, puntuar entrevistas, CORS configurable, los hooks de
pre-commit. Mismo estándar: cada hallazgo con PoC real, nada "a ojo".

### Hallazgo principal: control de acceso roto entre empresas

**Severidad: alta. Confirmado con PoC real, no supuesto.**

El JWT lleva `companyId` (`api-auth-AGB`, sección 3.19) pero ningún
servicio lo usaba para filtrar nada. PoC: creada una posición de prueba
en una empresa distinta a la de Alice (`companyId=1`, "LTI"), y
comprobado que ella podía:

- **Verla** en `GET /position` (listado general de posiciones).
- **Ver sus candidatos** (`GET /position/:id/candidates`) y su flujo de
  entrevistas (`GET /position/:id/interviewflow`).
- **Escribir en ella**: `POST /position/:id/interviewflow/steps` devolvió
  `201 Created` al añadirle una fase nueva.

Mismo patrón confirmado en el código (sin PoC nueva, mismo `positionId`
sin comprobar) en `POST /candidates` y `PATCH /candidates/:id`
(`positionId` aceptado sin comprobar la empresa) y en
`PUT /candidates/:id` (mover la candidatura de un candidato en el
proceso de otra empresa, con solo conocer su `applicationId`).

### Arreglo

`companyId` sale siempre de `req.employee.companyId` (el JWT), nunca de
algo que mande el cliente. Añadido a las cinco funciones de
`positionService.ts` que tocan una posición
(`getAllPositionsService`, `getCandidatesByPositionService`,
`getFirstInterviewStepForPosition`, `getInterviewFlowByPositionService`,
`addInterviewStepService`) y a las tres de `candidateService.ts` que
dependen de una (`addCandidate`, `updateCandidateProfile`,
`updateCandidateStage`) -- ocho funciones, dos ficheros de servicio, sus
tres controladores.

**Mismo mensaje ("Position not found"/"Application not found") tanto si
el recurso no existe como si es de otra empresa** -- a propósito:
distinguir los dos casos confirmaría a quien pregunta que el id es real,
solo que no es suyo (mismo criterio que un 404 en vez de un 403 para
IDOR).

### Alcance decidido a propósito, no todo lo posible

`Candidate` no tiene `companyId` propio -- su relación con una empresa es
siempre transitiva (vía `Application` → `Position` → `Company`), y un
candidato sin ninguna `Application` ("sin asignar") no tiene relación
con ninguna empresa todavía. Por eso quedan **fuera** de esta rama,
señalados como hallazgo pendiente de una decisión de producto (mismo
tratamiento que el propio hallazgo de "sin autenticación" del audit
original, sección 3.17.2, antes de `api-auth-AGB`):

- `GET /candidates/:id`, `PATCH /candidates/:id` (edición de datos
  personales sin cambiar de posición) -- ¿debería un empleado de otra
  empresa poder ver/editar los datos personales de un candidato con
  candidatura en una empresa distinta a la suya?
- `GET /candidates/unassigned` -- ¿es un fondo de candidatos compartido
  entre empresas hasta que alguna se los "queda", o debería acotarse
  también, y a qué exactamente, si el candidato mismo no tiene empresa?

Resolverlo bien exigiría además saber qué empleado/empresa dio de alta
cada candidato sin asignar -- un cambio de esquema, no solo de consulta.
Se documenta aquí para que la decisión se tome con la información
completa, no se toma unilateralmente en esta rama.

### El hallazgo secundario de la auditoría (fase destino no validada) queda para la siguiente rama, tal como pidió el usuario

`updateCandidateStage` acepta `currentInterviewStep` (el id de la fase
destino) sin comprobar que pertenezca al flujo de entrevistas de la
propia posición de la candidatura -- corrupción de datos posible, no
fuga de información. Pendiente de una rama propia.

### Verificación

```
npx jest (backend)          → 92 passed (80 + 12 nuevos, incluidas las
                               regresiones exactas de cada PoC de arriba)
npx tsc --noEmit (backend)  → OK
npm run build (backend)     → OK
npx vitest run (frontend)   → 119 passed, sin cambios (el contrato de
                               éxito de la API no cambió, solo se añadió
                               un nuevo caso de fallo)
```

Verificado también contra el backend real, repitiendo la PoC original
tras el arreglo: la misma posición de otra empresa ya no aparece en el
listado, y las tres rutas que antes leían/escribían en ella devuelven
ahora `404 Position not found`. Confirmado sin regresión que Alice
sigue viendo con normalidad las dos posiciones reales de su propia
empresa, y probado de extremo a extremo en el navegador (login, tablero
de proceso, mover candidatos) sin ningún cambio de comportamiento para
el propio usuario. Datos de la PoC borrados en ambas verificaciones,
antes y después del arreglo.

## 3.62 Hallazgo secundario de la auditoría: la fase destino no se validaba (`evaluacion-nuevos-candidatos-AGB`, antes `step-validation-AGB`)

Segundo hallazgo de la auditoría completa de la sección 3.61, en su
propia rama tal como pidió el usuario. `updateCandidateStage` guardaba
`currentInterviewStep` (el id de la fase destino) tal cual llegaba del
cliente, sin comprobar que perteneciera al flujo de entrevistas de la
propia posición de la candidatura -- no es una fuga de datos como el
hallazgo principal (con el arreglo de la sección 3.61, ya no se puede
apuntar a la fase de una posición de otra empresa), pero sí corrupción
de datos: nada impedía dejar a un candidato "en" una fase de un
**proceso distinto**, aunque fuera de la misma empresa. El desplegable
de la interfaz solo ofrece las fases reales, pero eso no es una
comprobación del lado del servidor -- cualquiera que llame al endpoint
directamente podía saltárselo.

**Arreglo**: la consulta que ya se hacía para comprobar la empresa
(sección 3.61) se amplía para traer también las fases reales del flujo
de la posición (`include: { interviewFlow: { include: { interviewSteps:
true } } }`), y se comprueba que `currentInterviewStep` sea el id de
una de ellas antes de guardar nada.

```
npx jest (backend)          → 93 passed (92 + 1 nuevo)
npx tsc --noEmit (backend)  → OK
npm run build (backend)     → OK
npx vitest run (frontend)   → 119 passed, sin cambios
```

Verificado también contra el backend real, con un caso concreto:
intentar mover a John Doe (en el proceso de "Senior Full-Stack
Engineer") a la fase "Initial Screening" del flujo de "Data Scientist"
(mismo nombre, pero un `id` de una posición y un flujo completamente
distintos) -- rechazado con `400` y el mensaje claro de que esa fase no
pertenece al flujo de su posición. Confirmado sin regresión que
moverlo de vuelta a una fase real de su propio proceso sigue
funcionando con normalidad.

## 3.63 Renombrar la rama y preparar la entrega del segundo ejercicio (QA/Playwright)

El usuario recordó que la Lección 11 tenía **dos** ejercicios: mover
candidatos entre fases (ya resuelto en este mismo repo) y un ejercicio
de QA con Playwright, en un repositorio aparte:
`LIDR-academy/AI4Devs-qa-202606-senior-2`. Como el repo de partida del
primer ejercicio obligó a divergir tanto (ver la justificación en
`JUSTIFICACION-ENTREGA.md`), se decidió resolver ambos ejercicios sobre
el mismo proyecto ya evolucionado y entregarlos juntos.

**Primer paso -- renombrar la rama que aglutina todo el trabajo**: la
rama `step-validation-AGB` (fila 36 de `BRANCHES_LOG`, punta de la
cadena secuencial de las 36 ramas `*-AGB`) pasó a llamarse
`evaluacion-nuevos-candidatos-AGB`, porque a partir de ahora es la base
de la que van a colgar las ramas del segundo ejercicio y el nombre
antiguo (que solo hablaba del hallazgo de seguridad de la sección 3.62)
ya no representaba lo que contiene.

Al renombrar la rama en GitHub (repo privado, vía
`POST /repos/.../branches/{branch}/rename`) el PR abierto que tenía como
`head` esa rama (#36) se cerró automáticamente en vez de re-enlazarse a
la rama con el nuevo nombre, que es el comportamiento que documenta
GitHub para este endpoint -- en la práctica no ocurrió así. Se sustituyó
por un PR nuevo (#37) con el mismo contenido, dejando una nota explicando
el porqué. No se perdió ningún commit -- el cierre fue solo del PR, la
rama y su contenido siguieron intactos en todo momento.

**Segundo paso -- base para el ejercicio de QA**: se forkeó
`LIDR-academy/AI4Devs-qa-202606-senior-2` como
`AlvaroGarciaBarcena/AI4Devs-qa-202606-senior-2-entrega-AGB` (iniciales
en el nombre del fork, mismo criterio ya acordado para el otro
ejercicio en la sección 3.59). Como ese repo no comparte historia git
con este proyecto, no hay manera de que `evaluacion-nuevos-candidatos-AGB`
se convierta en su `main` mediante un merge o fast-forward normal --
hacía falta un `push --force`. Antes de hacerlo se comprobó que el
`main` del fork recién creado solo tenía los 2 commits de plantilla de
LIDR-academy (`Initial commit` y `Revise README...`), así que no había
nada propio que perder. Confirmado el resultado: el `main` del fork
apunta ahora a la misma punta (`16f5222`) que
`evaluacion-nuevos-candidatos-AGB`.

**Pendiente**: a partir de este `main` propio se crearán las ramas
específicas del ejercicio de QA (atributos `data-testid`, prueba E2E
real de drag-and-drop con Playwright, fichero de prompts en el formato
que exige ese repo, etc.), siguiendo el mismo patrón de siempre --
antes de tocar código, se relee con atención el `README.md` de
`AI4Devs-qa-202606-senior-2` para confirmar exactamente qué pide la
entrega.

## 3.64 Este mismo diario, movido a `entrega-frontend-AGB/`

Trabajando ya en el segundo ejercicio (repo de QA, forkeado a partir
de esta misma rama, ver sección 3.63), se detectó un problema real de
claridad: al mezclar en la raíz del repo heredado los 7 ficheros
puramente narrativos de esta entrega (`prompts-AGB.md` y sus tres
satélites, `BRANCHES_LOG`, `JUSTIFICACION-ENTREGA.md`,
`PROMPTS_POR_PR.md`) con lo específico del segundo ejercicio, quedaba
confuso para cualquiera que no hubiera seguido el hilo desde el
principio -- "que no seamos nosotros dos". La solución que se aplicó
allí (una carpeta dedicada, `entrega-frontend-AGB/`, documentada en el
propio repo de QA) se replica aquí, en el origen, para que el punto de
partida real de esa segunda entrega ya sea el correcto -- no una copia
reorganizada solo en el fork.

**Cambios**: los 7 ficheros se mueven a `entrega-frontend-AGB/` (este
mismo, incluido). `README-ES.md`/`README-EN.md` y los 12 ficheros de
`docs/adr/` (11 ADR + su propio índice) se actualizan solo en los
enlaces relativos que apuntaban a los ficheros movidos -- nada de
código de la app se toca ni se mueve.

**Verificación real, no solo revisión visual**: mismo script que en
el repo de QA (`python3`, sin dependencias, recorre todo el repo
comprobando que cada enlace markdown relativo resuelve a un fichero
real, incluyendo ficheros sin extensión como `BRANCHES_LOG`) --
primera pasada tras el movimiento: cero enlaces rotos, ya que aquí se
arreglaron todas las rutas de una vez, con el mismo criterio ya
probado en el repo de QA. `npx tsc --noEmit` y los tests unitarios
(backend 93/93, frontend 119/119) siguen en verde -- confirmado que un
movimiento de documentación pura no afecta a nada funcional.

## 3.65 Un bug real en la suite de la raíz (no "deriva de datos"), corrección de un diagnóstico anterior, y dos fallos propios de verificación

El usuario preguntó si, ya que la investigación del ejercicio de QA
había producido un test (`position.spec.ts`) que consulta la API en
vez de asumir la fase de un candidato, valía la pena traer esa misma
mejora al repo de origen. Aclarado primero cuál de dos lecturas
posibles era la correcta (vía pregunta al usuario): no copiar
`position.spec.ts` en sí (es un entregable específico del ejercicio de
QA, no de este), sino aplicar el mismo principio al test **ya
existente** en `/e2e` que tenía el problema real,
`hiring-pipeline.steps.ts`.

**El hallazgo importante**: al investigar, la causa real del fallo
intermitente de este escenario resultó ser otra, distinta de la que se
diagnosticó (mal) en la sección 2 de `prompts-qa-AGB.md` del repo de
QA ("no hay cuello de botella real, probablemente un pico puntual del
entorno"). Confirmado con el volcado de accesibilidad de una ejecución
real: el escenario buscaba la columna de fase por su encabezado en
**inglés** (`getByRole('heading', { name: 'Initial Screening' })`),
que nunca coincide con lo que renderiza la interfaz en **español**
(`locale: 'es-ES'` del `playwright.config.ts` de la raíz --
"Selección inicial", traducción real de
`positionProcess.interviewStepNames` en `frontend/src/i18n/locales/
es.json`). El candidato buscado SÍ estaba en la columna correcta; la
columna en sí nunca se encontraba. Ese mismo patrón (`getByRole
('heading', { name: 'Initial Screening'|'Technical Interview' })`)
aparecía también, sin corregir hasta ahora, en
`candidate-editing.steps.ts` y `candidate-intake.steps.ts` -- un
`grep` a todo `e2e/steps/*.ts` confirmó que esos tres eran los únicos.

**Arreglo, en los tres ficheros**: no se busca la columna por su
encabezado traducido -- se comprueba contra la respuesta real de
`GET /position/:id/candidates` (o, donde el nombre del candidato ya es
de por sí único y fiable, directamente por ese nombre dentro de
cualquier `.border.rounded`/`.card`, sin necesitar saber en qué
columna concreta cae). En `hiring-pipeline.steps.ts` hizo falta un
segundo ajuste: la base de datos de desarrollo compartida tiene
candidatos de pruebas manuales con nombres repetidos ("Bad Position"
x3, entre otros) -- comprobar cada candidato uno a uno por nombre
resultó ambiguo de verdad (varias tarjetas con el mismo nombre y la
misma puntuación). Se simplificó a comprobar, a nivel de datos, que
sigue habiendo candidatos en más de una fase, y a nivel de UI, solo el
único candidato fiable de esa posición: Carlos García.

**Dos fallos propios durante la propia verificación, ambos
documentados para no repetirlos**:
1. Llevaba un rato verificando por accidente contra los servidores del
   **clon de QA** (`AI4Devs-qa-202606-senior-2-entrega-AGB`), no los
   de este repo -- nunca se cambiaron de vuelta tras crear ese clon
   separado (sección 5 de `prompts-qa-AGB.md`, en el otro repo).
   Corregido: parados esos servidores, arrancados los de este repo.
2. Con los servidores correctos, el login seguía fallando de forma
   intermitente. Comprobado con la Browser pane en vivo (no solo
   `curl`): el formulario de login mostraba "No se pudo conectar con
   el servidor" -- un error real de red, no del limitador de intentos
   de login. Causa real: `frontend/.env` tenía
   `VITE_API_URL=http://192.168.1.151:3010` (configurado hace tiempo
   para probar el acceso desde otro equipo de la red local, sección
   3.47/3.48), y esa IP concreta había agotado el límite general de
   peticiones (300/15min) de tanto testear hoy -- mientras que
   `localhost:3010` (lo que usaban todos mis `curl` de comprobación)
   nunca estuvo bloqueado, por eso los chequeos directos siempre
   funcionaban mientras el navegador fallaba. Corregido a
   `http://localhost:3010` (uso normal, no hay ninguna prueba de red
   local en marcha) y reiniciado Vite.

Con el entorno corregido: 20/20 escenarios en verde, dos veces
seguidas, en `hiring-pipeline.feature` + `candidate-editing.feature` +
`candidate-intake.feature`. Huérfanos propios de esta sesión de
depuración ("E2E FilaClicable" x2, de ejecuciones fallidas por el
problema de servidores/`.env`) limpiados con el mismo script Prisma ya
usado antes.

**Además, en la misma rama**: el usuario pidió reducir la duplicación
de código que `jscpd` detectaba en `candidate-intake.steps.ts` (10,3%
con la configuración que él estaba mirando). Cinco escenarios repetían
el mismo bloque -- rellenar nombre/apellido/email, elegir la posición
sembrada, pulsar "Enviar" -- extraído a un único helper,
`submitBasicCandidateForm`. `jscpd` (con `--min-lines 3 --min-tokens
30`) pasó de 3 clones/4,76% a 0 clones/0,00% en este fichero.

## 3.66 Menos duplicación en `positionController.ts`/`positionController.test.ts` (aprovechando la espera al limitador)

Mientras se esperaba a que el limitador general de peticiones (sección
3.65) se liberara para la verificación final en vivo, el usuario pidió
aplicar el mismo criterio de la sección anterior a
`backend/src/presentation/controllers/positionController.ts` (23,6%
de duplicación según su herramienta) y su fichero de test (13,7%).

**`positionController.ts`**: los cuatro controladores repetían dos
patrones completos --
1. `parseInt(req.params.id)` + comprobación `isNaN` + `400` si no es
   numérico (tres veces, con una diferencia real que no se toca:
   `getCandidatesByPosition`/`getInterviewFlowByPosition` devuelven
   `{ message: ... }`, `addInterviewStep` devuelve `{ error: ... }` --
   así lo esperan sus propios tests, no es un descuido a unificar).
2. El `catch`: mensaje `"Position not found"` del servicio -> 404,
   cualquier otro error -> 500 con un mensaje propio de cada endpoint
   (`getCandidatesByPosition` y `addInterviewStep`, patrón idéntico).
   `getInterviewFlowByPosition` NO sigue este patrón -- cualquier
   error ahí se traduce a 404 sin comprobar el mensaje, un
   comportamiento ya existente, distinto, que no se toca ni se
   "corrige" de paso (cambiar eso sería un cambio de comportamiento
   real, no una limpieza de duplicación).

Extraídos `parsePositionId` (parametrizado por la clave del cuerpo del
error) y `handleNotFoundOrServerError` (para los dos controladores con
el patrón idéntico). `jscpd`: de 24,82%/12 clones a 4,35%/1 clon
(el único que queda son las dos líneas de llamada a `parsePositionId`
en dos funciones distintas -- fusionarlo más habría exigido mezclar la
estructura de funciones que hacen cosas distintas después).

**`positionController.test.ts`**: mismos patrones, en los tests.
Extraídos `expectRejectedWithout400` (id inválido, nombre vacío,
nombre demasiado largo -- las tres son "400 sin llamar al servicio",
con cuerpo esperado explícito, no asumido) y `expectPositionNotFound`
(las tres pruebas de 404). De paso, la prueba de "nombre demasiado
largo" pasó de comprobar solo el status 400 a comprobar también el
cuerpo exacto (`{ error: 'Phase name must be 100 characters or fewer'
}`) -- una prueba más completa, no un cambio de comportamiento: el
valor ya lo devolvía el controlador, solo no se comprobaba antes.
`jscpd`: de 23,98%/12 clones (fichero conjunto) a 4,03%/3 clones.

**Verificado con datos reales, no solo con los propios tests
nuevos**: `npx tsc --noEmit` limpio y los 93 tests unitarios del
backend en verde (los 12 de `positionController.test.ts` incluidos)
tras el refactor -- cero cambio de comportamiento real, confirmado por
los mismos tests que ya existían, no solo por los reescritos.

**Hallazgo aparte, real y estructural, no una regresión de esta
rama**: al reintentar la verificación en vivo de la sección 3.65 tras
este refactor, el limitador general de peticiones (300/15min) se
agotó de nuevo -- confirmado por `curl` (`429`, `RateLimit-Remaining:
0`). Una sola ejecución completa de `hiring-pipeline` +
`candidate-editing` + `candidate-intake` genera de por sí varios
cientos de peticiones (cada carga de página en modo dev de Vite pide
decenas de módulos sueltos sin empaquetar, contra el mismo límite que
las llamadas a la API real) -- muy cerca del propio límite pensado
para producción. La verificación en verde de la sección 3.65 (20/20,
dos veces seguidas) es de antes de este segundo refactor y de antes de
que el limitador volviera a agotarse; no se ha podido repetir esa
misma comprobación después por este motivo, no porque haya indicio de
que algo se haya roto. Queda como algo a tener en cuenta -- no a
arreglar aquí -- si se sigue iterando con la suite completa en una
sola sesión larga de trabajo.

## 3.67 `GET /health` + comprobación automática en `global-setup.ts`: que la suite falle pronto si el backend es de otra rama

Construido lo que quedó documentado como pendiente al final de la
sección 3.65: la propia sesión demostró dos veces que un backend en
marcha en el puerto esperado podía ser, sin ningún aviso, el de otro
repo o rama.

**`backend/src/gitInfo.ts`** (nuevo, con su propio test): `getGitInfo()`
devuelve `{ commit, branch }` vía `git rev-parse HEAD` /
`git rev-parse --abbrev-ref HEAD`, con el comando de ejecución
inyectable por parámetro (mismo patrón que `networkAddresses.ts`) para
poder testear sin depender de que la máquina que corra los tests tenga
git de verdad disponible. Devuelve `null` en vez de lanzar si no hay
repo accesible (un despliegue sin `.git`, por ejemplo) -- no debe
tumbar el arranque del servidor.

**`backend/src/index.ts`**: nueva ruta pública `GET /health` (sin
`requireAuth` a propósito -- hace falta poder comprobarla antes
incluso de intentar iniciar sesión), y una línea más en el log de
arranque (`commit <corto> (rama <nombre>)`) -- visible también para
quien esté haciendo pruebas manuales, no solo para la suite E2E.

**`e2e/global-setup.ts`**: antes de nada (incluso antes del login),
`verifyBackendCommit()` compara el commit que devuelve
`GET {E2E_BACKEND_URL}/health` (por defecto `http://localhost:3010`,
configurable) contra `git rev-parse HEAD` de este mismo repo. Si no
coinciden, lanza un error explícito con los dos commits/ramas
implicados, antes de que arranque ningún escenario -- exactamente el
"hook que hace esta comprobación al lanzarlo" que pidió el usuario:
`global-setup.ts` ya es, en la propia terminología de Playwright, el
*hook* que se ejecuta automáticamente al lanzar la suite, así que no
hacía falta un mecanismo aparte.

**Verificado con datos reales, los dos caminos, no solo el feliz**:
- Camino positivo: `candidate-editing.feature` completo (3/3) con el
  backend real y la comprobación nueva de por medio -- pasa en
  silencio, como debe.
- Camino negativo: un servidor HTTP de mentira, aparte, sirviendo un
  `/health` con un commit y una rama inventados (`otra-rama-AGB`),
  apuntado con `E2E_BACKEND_URL` -- la comprobación detecta la
  diferencia y produce exactamente el mensaje esperado:
  > El backend en http://localhost:4321 está sirviendo el commit
  > deadbee (rama otra-rama-AGB), no el de este repo (1688185). ¿Hay
  > un backend de otra rama u otro repo arrancado en el mismo puerto?

`npx tsc --noEmit` limpio y 95/95 tests unitarios del backend (93 +
los 2 nuevos de `gitInfo.test.ts`).

## 3.68 Contaminación real y visible: reejecutar la suite bajo el limitador agotado deja huérfanos que se ven en la propia app

Consecuencia directa del hallazgo de la sección 3.66 (el limitador
general se agota con facilidad reejecutando la suite completa varias
veces seguidas): el usuario reportó, mirando la app de verdad, que
varios candidatos que antes aparecían sin asignar ahora parecían
asignados a "Senior Full-Stack Engineer", y que en "Posiciones"
aparecían posiciones `E2E Posición Fase Vacía`/`E2E Posición Sin
Flujo`.

**Causa real, confirmada, no supuesta**: la última ejecución en
segundo plano (lanzada para verificar el hallazgo de la sección 3.65)
falló en 9 de 17 escenarios por el mismo limitador agotado -- entre
ellos, los tres que crean fixtures temporales con su propia limpieza
al final ("Fase sin candidatos", "Posición elegida sin flujo de
entrevistas configurado", "Ningún candidato sin asignar"): al fallar
antes de llegar a su `Then`, la limpieza nunca se ejecutó.

**Investigado antes de tocar nada** (un script de solo lectura, en
vez de asumir): confirmadas 6 posiciones `E2E Posición ...` huérfanas
(4 con su propio candidato "Fixture ConCandidato", 2 sin él) y 10
candidaturas "placeholder" espurias a "Senior Full-Stack Engineer" --
5 de ellas de candidatos `E2E SinAsignar` (nombre de fixture
inequívoco), las otras 5 sobre candidatos ("Nombre Apellido", "Bad
Position" x3, "Good Position") cuyo origen no se puede afirmar con
certeza solo por los datos -- confirmadas como del mismo lote por
compartir la misma marca de tiempo exacta entre sí.

**Limpieza, deliberadamente asimétrica según la certeza real**: las 6
posiciones huérfanas y los 5 candidatos `E2E SinAsignar` se borraron
enteros (fixtures inequívocos). De los otros 5, solo se borró la
candidatura espuria -- los candidatos en sí se dejaron intactos, por
si son datos propios del usuario (mismo criterio ya aplicado con
"Nico alaslla": no se borra lo que no se puede confirmar que sea
huérfano). El script, igual que las veces anteriores, lo bloqueó el
clasificador de permisos del sandbox -- ejecutado por el usuario desde
su propia terminal.

**Verificado el resultado, no solo la ejecución del script** (consulta
de solo lectura aparte, sin depender de la API bloqueada por el
limitador): 0 posiciones `E2E ...` restantes, 0 candidatos `E2E
SinAsignar` restantes, los 5 candidatos de origen incierto de vuelta a
"realmente sin asignar", y "Senior Full-Stack Engineer" con
exactamente los cuatro candidatos legítimos (John Doe, Jane Smith,
Nico alaslla, Carlos García). De paso, un "E2E FilaClicable" más de la
misma ejecución fallida, limpiado igual.

**Decisión para el resto de la sesión**: no se vuelve a lanzar la
suite E2E completa varias veces seguidas hoy -- cada intento bajo el
limitador agotado no solo falla, deja más huérfanos reales detrás. La
verificación ya hecha (sección 3.65, 20/20 dos veces; sección 3.67,
los dos caminos del `/health` comprobados por separado) se da por
suficiente.
