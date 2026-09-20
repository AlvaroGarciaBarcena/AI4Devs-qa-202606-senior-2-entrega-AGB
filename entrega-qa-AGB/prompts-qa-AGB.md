# Registro de prompts y arreglos — Ejercicio de QA (Playwright), Lección 11

Autor: garciabarcenaalvaro@gmail.com
Asistente: Claude Code (Sonnet 5)
Fecha: 2026-09-20 / 2026-09-21

Rama base: `evaluacion-nuevos-candidatos-AGB` (commit `16f5222`, antes
`step-validation-AGB`) -- la punta de toda la entrega del primer
ejercicio (frontend), reutilizada tal cual como `main` propio del fork
de este segundo repo (`AI4Devs-qa-202606-senior-2-entrega-AGB`, ver
`prompts-AGB.md`, sección 3.63, en el repo del primer ejercicio). Ese
histórico -- 63 secciones sobre backend, frontend, i18n, auth,
seguridad, etc. -- no se repite aquí: este fichero documenta solo lo
específico del segundo ejercicio (Playwright/QA), igual que el índice
de ramas correspondiente vive aparte en
[`BRANCHES_LOG-qa`](./BRANCHES_LOG-qa) en vez de seguir sumando filas
al `BRANCHES_LOG` del primer ejercicio.

> Motivo de separar los ficheros: este código va a acabar en un PR
> contra el `main` real de `LIDR-academy/AI4Devs-qa-202606-senior-2` --
> mezclar ahí un diario de 65 secciones sobre un ejercicio distinto
> (aunque el código de base venga de él) sería confuso para quien lo
> revise. `prompts-AGB.md`/`BRANCHES_LOG` se quedan congelados tal como
> estaban al cerrar la entrega del primer ejercicio (sección 3.63 / fila
> 36); todo lo de aquí en adelante para este segundo ejercicio se
> documenta en este par de ficheros.

## 1. Primer test E2E del ejercicio de QA: `position.spec.ts` (`qa-e2e-position-AGB`)

Antes de escribir nada, se contrastó el checklist de entrega de
`AI4Devs-qa-202606-senior-2` contra el estado real de este repo: 0
atributos `data-testid` en todo `frontend/src`, `playwright.config.ts`
en la raíz (no en `/frontend`), y ningún `/frontend/tests/e2e/
position.spec.ts`. El usuario preguntó explícitamente qué problema
habría en mover la suite `/e2e` de la raíz (Playwright-BDD, backend +
frontend) a `/frontend/tests/e2e/` -- la respuesta, explicada y
aceptada: gran parte de esa suite no es de frontend (seguridad,
rate-limiting, hooks de Husky...), el `playwright.config.ts` de la raíz
orquesta ambos servidores, y decenas de referencias en la documentación
ya publicada apuntan a esa ruta. Decisión final: `/e2e` se queda tal
cual, y se crea `/frontend/tests/e2e/` aparte, solo con lo que pide
este segundo ejercicio.

**Cambios**:
- `PositionProcess.tsx`: `data-testid="position-title"` en el título,
  `data-testid="phase-column-<slug>"` en cada columna (slug del nombre
  real de la fase, sin tildes -- las fases son configurables) y
  `data-testid="candidate-card-<applicationId>"` en cada ficha.
- `frontend/playwright.config.ts`: config independiente de la de la
  raíz, sin `webServer` propio (el README de QA da por hecho que
  backend y frontend ya están arrancados).
- `frontend/tests/e2e/position.spec.ts`: los dos escenarios que exige
  el checklist -- carga del tablero (título, columnas, candidatos en su
  columna) y arrastrar una ficha a otra fase, comprobando que se mueve
  visualmente y que se dispara `PUT /candidates/:id` (endpoint real,
  confirmado en `candidateService.js`/`candidateRoutes.ts` -- el README
  usa `/candidate/:id` solo como ejemplo genérico) con la fase nueva en
  el body y respuesta exitosa.
- `frontend/package.json`: `@playwright/test` como devDependency (misma
  versión que la raíz) + script `test:e2e`.
- `frontend/vite.config.ts`: `test.exclude` amplía la lista por defecto
  de Vitest con `tests/e2e/**` -- sin esto, Vitest intentaba cargar
  `position.spec.ts` como si fuera un test suyo por el propio nombre
  del fichero (`*.spec.ts`) y fallaba al toparse con `test.beforeEach`
  de Playwright.
- `/prompts/prompts-AGB.md` (nuevo, distinto de este fichero): la lista
  plana de prompts que exige el README de QA, sin respuestas ni
  narrativa -- formato distinto a este fichero a propósito.

**Verificación real, no solo escrita**:
```
npx tsc --noEmit (frontend)         → OK
npm test (frontend, vitest)         → 119 passed, sin cambios
npx playwright test (frontend, x2)  → 2 passed las dos veces (comprobado
                                       que es repetible, no solo que pasa
                                       una vez)
```
El primer intento de `position.spec.ts` falló dos veces por asumir
datos del seed (`backend/prisma/seed.ts`) sin comprobar el estado real
de la base de datos de desarrollo, que llevaba toda la sesión
acumulando cambios manuales:
1. Se esperaba a Jane Smith en "Technical Interview" -- de verdad está
   en "Entrevista cultural" (una fase añadida a mano en pruebas
   anteriores del primer ejercicio). Se quitó esa aserción, dejando
   solo a Carlos García y John Doe como referencia (comprobados de
   verdad contra la API antes de escribir la aserción, no solo leyendo
   el fichero de seed).
2. La respuesta real de `GET /position/:id/interviewflow` viene anidada
   un nivel más de lo asumido (`interviewFlow.interviewFlow.
   interviewSteps`, no `interviewFlow.interviewSteps`) -- corregido tras
   inspeccionar la respuesta real con `curl`.

Tras el arreglo, `position.spec.ts` se ejecutó dos veces seguidas con
resultado idéntico (2/2), y se confirmó por `curl` (no solo por la
propia aserción del test) que la restauración final deja a Carlos
García de vuelta en "Initial Screening" -- el mismo estado que da por
bueno `e2e/steps/hiring-pipeline.steps.ts` en la raíz.

**Hallazgo colateral, sin resolver todavía**: al re-ejecutar
`hiring-pipeline.feature` de la raíz para comprobar que este cambio no
la rompía, 2 de sus 6 escenarios fallaron -- pero por datos huérfanos
de sesiones manuales anteriores (dos candidatos "Nuevo Candidato" sin
limpiar, restos de una ejecución anterior de "Alta de candidato
reflejada en el tablero" que falló a mitad y nunca llegó a su propia
línea de `prisma.candidate.delete`), no por nada de esta rama. Se
intentó limpiarlos con un script Prisma aparte
(`backend/cleanup-e2e-orphans.ts`, borrado después de usarlo) pero el
clasificador de permisos del entorno bloqueó su ejecución (mutación
directa de base de datos fuera de un test). Queda pendiente, marcado
para el usuario en vez de forzarlo.

## 2. Limpieza de los huérfanos, "Nico alaslla" y la lentitud puntual de `hiring-pipeline.feature`: investigado, sin cuello de botella real

Continuación directa de la sección 1. El usuario pidió instrucciones
para limpiar él mismo los candidatos huérfanos "Nuevo Candidato" (el
mismo script de la sección anterior, esta vez ejecutado fuera del
sandbox -- sin el clasificador de permisos de por medio, sí funcionó).
Al reejecutar `hiring-pipeline.feature` para confirmar la limpieza, el
propio escenario "Alta de candidato reflejada en el tablero" volvió a
fallar y dejó **otro** huérfano (id 409) -- limpiado también, con el
mismo script.

El volcado de accesibilidad que capturó Playwright al fallar mostraba
al candidato ya presente en la columna correcta en el momento del
fallo: la aserción `toBeVisible()` expiró (5s) antes de que la página
terminara de renderizar, no porque el dato estuviera mal. Eso, junto
con que `Carlos García` seguía confirmado por API en su fase correcta
mientras tanto, señalaba a lentitud/timing, no a un fallo de lógica --
ni de esta rama (los `data-testid` son aditivos) ni del propio
`hiring-pipeline.feature` (no se tocó).

El usuario aclaró además que **"Nico alaslla" no es un huérfano**: es
un candidato que creó él mismo a propósito, como prueba de que el alta
de un candidato nuevo funciona, y debía seguir existiendo. El filtro
del script de limpieza (`firstName: 'Nuevo', lastName: 'Candidato'`)
nunca lo tocó -- confirmado con la misma llamada real a la API que ya
se venía usando en toda esta sección, no de memoria.

**Investigación de la lentitud, a petición del usuario ("no me gustó
ese fallo recurrente de lentitud")** -- se comprobó cada sospechoso
habitual con datos reales, no solo leyendo el código:

- Tiempos reales de los tres endpoints que carga el tablero
  (`/position`, `/position/:id/candidates`, `/position/:id/
  interviewflow`), medidos con `curl -w "%{time_total}"` tres veces
  seguidas: **2-4 milisegundos** cada uno. Sin margen para explicar un
  timeout de 5 segundos.
- Login (`authService.ts`): usa `bcrypt.compare` (asíncrono), no
  `compareSync` -- no bloquea el event loop de Node.
- `getCandidatesByPositionService` (`positionService.ts`): un único
  `findMany` con `include` (candidato, entrevistas, fase); la media y
  el conteo de entrevistas sin puntuar se calculan en memoria después
  -- no hay patrón N+1.
- El rate limiter (`express-rate-limit`) usa un mapa en memoria, O(1)
  por petición.
- Modo dev del backend (`ts-node-dev --transpile-only`): sin chequeo de
  tipos en caliente, no añade lentitud extra sobre el modo compilado.
- Se revisó también si el propio `ts-node-dev --respawn` podía estar
  reiniciando el proceso al crear/borrar `backend/cleanup-e2e-
  orphans.ts` (dentro de `backend/`, el propio directorio que vigila) --
  descartado revisando el log real del proceso (`[INFO] ts-node-dev`
  arrancó una vez, sin ningún "Restarting" posterior).
- Único hallazgo real, inofensivo: en desarrollo, `React.StrictMode`
  duplica cada fetch al montar un componente (se ve literalmente cada
  `GET` repetido dos veces en milisegundos en el log del backend) --
  comportamiento deliberado de React para detectar efectos secundarios
  mal escritos, no existe en producción, y con 2-4ms por llamada no
  acerca nada a un timeout de 5s.

**Conclusión, documentada para no repetir esta misma investigación si
vuelve a pasar**: no hay ningún cuello de botella real identificado en
backend, base de datos ni frontend -- lo más probable es un pico
puntual del propio entorno (arranque de Chromium, una pausa de
garbage collection, contención del sandbox en el que corre esta
sesión), no un problema de la aplicación. A petición explícita del
usuario, **no se sube el timeout de Playwright** -- ni aquí ni en
ningún otro sitio -- para no enmascarar un fallo real futuro. Si
`hiring-pipeline.feature` (u otro escenario) vuelve a fallar así --
dato correcto en el volcado de accesibilidad, aserción de visibilidad
expirada -- ya se sabe que no hace falta repetir esta ronda completa de
comprobaciones: revisar primero si fue un pico puntual (reejecutar sin
cambiar nada) antes de sospechar de una regresión real.

## 3. Este mismo reorden: `prompts-qa-AGB.md` y `BRANCHES_LOG-qa` en vez de seguir el diario del primer ejercicio

El usuario notó que, al partir la base de este ejercicio de la rama
final del primer ejercicio (sección 3.63 de `prompts-AGB.md`), las
secciones 3.64 y 3.65 recién escritas -- y la fila 37 de
`BRANCHES_LOG` -- estaban mezclando la documentación de un ejercicio
completamente distinto en los ficheros del primero. Se deshizo esa
mezcla: `prompts-AGB.md` y `BRANCHES_LOG` vuelven a su estado exacto al
cerrar la sección 3.63 / fila 36 (el mismo contenido que ya está
publicado en el PR #22 del repo original y el PR #37 del repo privado),
y las secciones 1 y 2 de arriba -- junto con la fila 1 de
`BRANCHES_LOG-qa` -- son la primera documentación que vive
exclusivamente en este par de ficheros nuevos, dedicados solo al
ejercicio de QA.

## 4. `/prompts/prompts-AGB.md` reescrito como instrucciones, no como narrativa

El usuario aclaró un punto de las instrucciones de entrega que se
había pasado por alto: el README de `AI4Devs-qa-202606-senior-2` pide
"únicamente la lista de prompts... no es necesario incluir las
respuestas ni explicaciones adicionales", con ejemplos que son
instrucciones directas y concretas ("Genera una prueba E2E con
Playwright que valide..."), no preguntas exploratorias ni diálogo.

Las 12 entradas que ya tenía `/prompts/prompts-AGB.md` eran citas
literales de los mensajes reales del usuario -- fieles, pero muchas
eran preguntas o negociaciones ("¿Qué te parece si...?", "No, no lo
conviertas..."), no instrucciones. Se reescribieron las 12, más 2
nuevas de esta misma conversación, como instrucciones en imperativo,
una por prompt real, en el mismo orden -- sin inventar ninguna, solo
destilando la instrucción efectiva de cada mensaje real. Este fichero
(`prompts-qa-AGB.md`) sigue siendo narrativo a propósito -- es el
diario de trabajo propio del proyecto, no el entregable que exige el
README de QA.

## 5. Clon local propio para el ejercicio de QA, separado de `AI4Devs-frontend-202606-senior-2`

Hasta aquí, todo el trabajo de este ejercicio se había hecho dentro
del mismo directorio de trabajo que el primer ejercicio
(`AI4Devs-frontend-202606-senior-2`), usando un remoto extra (`qa-fork`)
para publicar la rama en el fork del repo de QA. El usuario pidió ir
un paso más allá: un **directorio local propio**, clonado directamente
del fork de QA, para que la separación entre ambos ejercicios sea
total (carpeta, remotos, procesos), no solo a nivel de ficheros dentro
del mismo repo.

**Cómo se hizo**:
1. `qa-e2e-position-AGB` (con todo el trabajo hecho hasta ahora) se
   publicó también con su propio nombre en el fork de QA -- sin tocar
   su `main`, que ya apuntaba a la misma punta desde la sección 3 (el
   commit compartido con la entrega del primer ejercicio).
2. Se clonó ese fork en un directorio nuevo,
   `~/IA/AI4Devs/AI4Devs-qa-202606-senior-2-entrega-AGB`, y se hizo
   `checkout` de esa misma rama.
3. Se añadió `upstream` -> `LIDR-academy/AI4Devs-qa-202606-senior-2`
   (el repo real), para el PR final.
4. Verificado que el clon es fiel antes de seguir: `diff -rq` contra el
   directorio original (excluyendo `.git`, `node_modules` y artefactos
   de build) no mostró ninguna diferencia de código fuente -- solo
   ficheros ya ignorados por git (`.env`, `dist/`, `test-results/`,
   `SECRETS.md`...), que se copiaron a mano porque son configuración
   local de este mismo equipo, no algo que viva en el repo.
5. `npx tsc --noEmit` y los tests unitarios (backend: 93/93, frontend:
   119/119) pasan igual desde este directorio nuevo.
6. Se pararon los procesos de backend y frontend que corrían desde
   `AI4Devs-frontend-202606-senior-2` y se arrancaron de nuevo desde
   aquí -- de ahora en adelante la app corre siempre desde este clon,
   no desde el otro directorio.
7. `npx playwright test` (los dos escenarios de `position.spec.ts`)
   ejecutado contra este backend y frontend nuevos: 2/2, igual que
   antes.

La rama `qa-e2e-position-AGB` sigue existiendo también en
`AI4Devs-frontend-202606-senior-2` (no se ha borrado, es historia
local sin publicar en ningún otro sitio) -- pero deja de ser donde se
trabaja: de aquí en adelante, todo lo de este segundo ejercicio pasa
por este directorio.

El usuario señaló, correctamente, que dejar `qa-e2e-position-AGB`
también en `AI4Devs-frontend-202606-senior-2` era justo la mezcla que
se acababa de quitar de los ficheros -- si esta pasa a ser la rama del
segundo ejercicio, no tiene sentido que siga en el directorio del
primero. Antes de borrarla se confirmó que no se perdía nada: su
commit (`c7d4a13`) coincide exactamente con `qa-fork/qa-e2e-position-AGB`
y con `origin/qa-e2e-position-AGB` de este mismo clon. Con eso
confirmado, en `AI4Devs-frontend-202606-senior-2` se volvió a
`evaluacion-nuevos-candidatos-AGB`, se borró la rama
(`git branch -D qa-e2e-position-AGB`) y se eliminó el remoto `qa-fork`
(ya no tiene ninguna función ahí). Ese repo vuelve a estar centrado
solo en el primer ejercicio.

## 6. Sincronización final del `main` del fork y evidencia de ejecución para la entrega

Al comprobar que `AI4Devs-frontend-202606-senior-2` coincidía al 100%
con lo publicado en GitHub (PR #22 y PR #37), salió a la luz un
commit de documentación (`3077f97`, sección 3.63: el renombrado de la
rama y la creación de este mismo fork) que nunca se había empujado a
ninguno de los dos remotos -- ni tampoco, por tanto, al `main` de este
fork de QA, que seguía en `16f5222`. Sincronizados los tres: `fork`
(PR #22), `personal` (PR #37) y el `main` de este fork -- los tres en
`3077f97`, confirmado por hash antes y después de cada `push`.

Capturada también la evidencia de ejecución que exige el checklist de
entrega: salida completa de `npx playwright test` (los dos escenarios
de `position.spec.ts`, 2/2) contra el backend y frontend reales
arrancados desde este mismo directorio, guardada en
[`/prompts/evidencia-ejecucion-AGB.txt`](../prompts/evidencia-ejecucion-AGB.txt).

## 7. Qué parte de `/e2e` es realmente "de frontend" (sin moverla)

Al preparar la descripción del PR, el usuario propuso un refinamiento
de la idea de la sección 1 (mover `/e2e` a `/frontend/tests/e2e`): en
vez de todo o nada, mover solo las features que de verdad son E2E de
frontend (navegador real), dejando el resto donde está. Comprobado
grep por grep sobre cada `*.steps.ts` (no solo por el nombre del
`.feature`, para no dar nada por hecho):

**Sí usan un navegador real (`page.goto`/`page.locator`/etc.) -- E2E
de frontend en el sentido estricto**: `accessibility`,
`authentication`, `candidate-editing`, `candidate-intake`,
`file-upload`, `frontend-performance`, `hiring-pipeline`,
`internationalization`, `position-catalog` (9 de 12).

**No abren ningún navegador -- backend/tooling puro, usan
Playwright-BDD solo como *runner*, no para interacción con la
interfaz**: `security-hardening` y `developer-tooling` (llaman a la
API directamente con `APIResponse`, o lanzan procesos: `npm audit`,
`npm exec jest`, los propios hooks de Husky), y `rate-limiting`, mismo
patrón (3 de 12).

**Por qué no se mueve, aun así**: esa suite ya está publicada y
revisada como parte de la entrega del primer ejercicio (PR #22 de
`AI4Devs-frontend-202606-senior-2`, que se da por cerrado salvo
comentario de los profesores). El `playwright.config.ts` de la raíz
tiene lógica no trivial atada a que las doce estén juntas
(`defineBddConfig` con un único glob, la exclusión de
`authentication`/`zz-rate-limiting` del proyecto con sesión, un
`globalSetup` compartido) -- separar 9 de 12 exige reescribir esa
configuración, no solo mover ficheros, y ese trabajo le corresponde al
propio repo del primer ejercicio (que sigue abierto a seguir
evolucionando) cuando toque, no a este PR de QA. Queda documentado
aquí como referencia para esa futura reorganización, si se decide
hacerla.

## 8. Descripción del PR guardada como fichero, además de en el scratchpad

La descripción del PR (plantilla del checklist + una sección "Punto de
partida" explicando por qué el diff es grande y qué es realmente nuevo,
y otra justificando las dos configuraciones de Playwright) se redactó
primero en un fichero temporal fuera del repo. El usuario pidió
guardarla también aquí, para no depender de que sobreviva el
directorio temporal de la sesión hasta el momento de abrir el PR de
verdad: [`/prompts/PR-DESCRIPTION-QA.md`](./PR-DESCRIPTION-QA.md).

## 9. Carpetas propias por entrega (`entrega-frontend-AGB/`, `entrega-qa-AGB/`) y un segundo caso de deriva de datos

Al revisar la descripción del PR, el usuario señaló un problema real de
claridad: aunque el aviso al principio de `README.md` explicara el
punto de partida, mezclar en la misma raíz los ficheros del primer
ejercicio (`prompts-AGB.md`, `BRANCHES_LOG`...) con los de este
segundo, sin más separación que un aviso de texto, seguía siendo
confuso para alguien que no hubiera seguido el hilo -- "que no seamos
nosotros dos". Se evaluaron y descartaron dos alternativas antes de
llegar a esta:

- Renombrar `/prompts/` a `/prompts-qa/`: descartado -- esa ruta
  exacta la exige el propio README de `AI4Devs-qa-202606-senior-2`
  ("Registra todos los prompts utilizados en:
  `/prompts/prompts-[tus-iniciales].md`"), no es un nombre nuestro.
- Un aviso de texto al principio del README, sin mover nada: era la
  propuesta inicial de esta misma sección de trabajo, pero no resolvía
  el problema de fondo -- los ficheros seguían físicamente mezclados.

**Solución final**: dos carpetas dedicadas, mismo criterio en ambos
lados --

- `entrega-frontend-AGB/`: los 7 ficheros que son pura narrativa del
  primer ejercicio (`prompts-AGB.md` y sus tres satélites,
  `BRANCHES_LOG`, `JUSTIFICACION-ENTREGA.md`, `PROMPTS_POR_PR.md`).
  `README-ES.md`/`README-EN.md` (instrucciones para levantar el
  entorno, las necesita también quien corra las pruebas de QA) y
  `docs/adr/`/`openspec/specs/` (documentación técnica de la propia
  app) se quedan donde estaban -- no son "ruido" del otro ejercicio.
- `entrega-qa-AGB/`: `prompts-qa-AGB.md` (este fichero) y
  `BRANCHES_LOG-qa`, más `PR-DESCRIPTION-QA.md` -- ninguno de los tres
  exigido por ninguna ruta concreta del checklist. `/prompts/` se deja
  con exactamente lo que sí exige o menciona el checklist:
  `prompts-AGB.md` (ruta obligatoria) y `evidencia-ejecucion-AGB.txt`
  (el ítem "evidencia de ejecución exitosa").

**Verificación real de los enlaces, no solo revisión visual**: un
script (`python3`, sin dependencias) recorrió todos los `.md`/`.txt`
del repo buscando enlaces markdown relativos y comprobando que
cada ruta resuelve a un fichero real. Primera pasada: 15 rotos --
13 rutas a código fuente dentro de `prompts-AGB.md` (necesitaban un
`../` más al bajar un nivel), 4 líneas en los README apuntando al
grupo movido, y **11 ficheros de `docs/adr/`** enlazando a
`../../prompts-AGB.md`, que el primer repaso manual (solo miró enlaces
dentro y hacia el propio grupo de 7) no había cubierto. Arreglados los
15, segunda pasada del script: cero rotos. De paso se corrigió también
un enlace que ya estaba mal desde que se creó `PR-DESCRIPTION-QA.md`
en la sección 8 (apuntaba a `prompts/prompts/evidencia-ejecucion-AGB.txt`,
doblemente anidado).

Se añadió además un aviso corto al principio de `README.md` (lo
primero que ve cualquiera que abra el repo) señalando las dos carpetas
y su propósito.

**Verificado que el reorden no rompía nada funcional** -- no tocaba
código de la app, pero se comprobó igual: al reejecutar
`position.spec.ts` después de mover los ficheros, falló un escenario
que no tenía nada que ver con el movimiento. La causa real: un
**segundo caso de deriva de datos** en la base de desarrollo
compartida (ver sección 2) -- John Doe, que el primer escenario
asumía en "Technical Interview" como segunda referencia junto a Carlos
García, había pasado a "Manager Interview" por trabajo manual anterior
en esta misma sesión (Jane Smith ya había tenido el mismo problema al
escribir la sección 1 original).

En vez de fijar un tercer nombre a una fase concreta (mismo error
repetido una vez más), se reescribió el escenario para que compruebe
contra la respuesta real de `GET /position/:id/candidates` qué
candidato está en qué fase, en vez de asumirlo -- inmune a que la base
de datos compartida siga cambiando. Carlos García se mantiene como
comprobación explícita adicional (es el único cuya fase mantiene
activamente esta misma suite, en el `finally` del segundo escenario).
Verificado tras el cambio: `tsc` limpio, 119/119 tests unitarios sin
cambios, y `position.spec.ts` ejecutado dos veces seguidas (2/2 ambas
veces) -- evidencia de ejecución regenerada en
`/prompts/evidencia-ejecucion-AGB.txt`.
