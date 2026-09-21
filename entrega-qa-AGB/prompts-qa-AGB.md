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

> **Corrección posterior (2026-09-21)**: esta conclusión era
> incorrecta. Sí había un cuello de botella real -- no de rendimiento,
> sino de corrección: el escenario buscaba la columna de fase por su
> encabezado en **inglés**, que nunca coincide con la interfaz en
> **español** (mismo volcado de accesibilidad que ya se citó aquí
> arriba, releído con más atención: el candidato SÍ estaba en la
> columna correcta, la columna en sí nunca se encontraba). Detalle
> completo, con el arreglo real, en `AI4Devs-frontend-202606-senior-2`
> (repo de origen), `prompts-AGB.md`/`entrega-frontend-AGB/`, sección
> 3.65.

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

## 10. Borrado `/VERSION`: vestigio del starter, sin ningún uso

El usuario preguntó para qué servía `/VERSION` (contenido: `0.0.0.001`,
presente desde el *Initial commit*). Comprobado antes de responder: sin
ninguna referencia en todo el código (backend, frontend, Docker, CI,
`package.json`...) ni en ningún README o doc del proyecto -- vestigio
de la plantilla de partida de LIDR-academy, sin relación con esta app.
Borrado a petición del usuario ("si no aporta, fuera").

Solo en este repo -- el mismo fichero sigue existiendo en
`AI4Devs-frontend-202606-senior-2` (la entrega del primer ejercicio,
ya cerrada), que no se toca por esto.

## 11. Los cinco arreglos del repo de origen (bug de idioma + menos duplicación), traídos aquí

El repo de origen (`AI4Devs-frontend-202606-senior-2`, "cerrado" salvo
comentario de los profesores) siguió recibiendo trabajo real: el bug
de idioma en `hiring-pipeline.steps.ts`/`candidate-editing.steps.ts`/
`candidate-intake.steps.ts` (sección 3.65 de `prompts-AGB.md` de ese
repo -- corrige también el diagnóstico equivocado de la sección 2 de
este mismo fichero, ver la nota añadida ahí) y menos duplicación en
`positionController.ts`/`.test.ts` (sección 3.66). El usuario pidió
traer esos mismos cinco ficheros aquí, para que este repo parta de la
misma base -- después de confirmar explícitamente (con `diff` real
entre ambos árboles de trabajo, no de memoria) que no había ninguna
colisión: los únicos ficheros que ya difieren a propósito entre los
dos repos son los README (el aviso de las dos carpetas) y
`package-lock.json` (el campo `name`).

**Cómo se hizo**: `main` de este fork, fast-forward otra vez
(`3077f97` -> `1688185`, mismo mecanismo que las veces anteriores).
Los cinco ficheros de la rama `qa-e2e-position-AGB` (que no había
tocado ninguno de los cinco hasta ahora) se copiaron tal cual desde el
repo de origen -- ya verificados allí en vivo, no hacía falta
rehacerlo desde cero. Confirmado con `diff` que quedan byte a byte
idénticos entre los dos repos.

**Verificado en este repo también, no solo copiado a ciegas**: `npx
tsc --noEmit` limpio, 93/93 tests unitarios del backend en verde, y
`bddgen` genera sin errores los `.feature` afectados. No se repitió la
verificación E2E en vivo de los tres escenarios de `hiring-pipeline`/
`candidate-editing`/`candidate-intake` -- el limitador general de
peticiones seguía agotado (mismo hallazgo de la sección 2/nota de
corrección) y el contenido es idéntico byte a byte al ya verificado en
vivo en el repo de origen, así que no aportaba nada repetirlo aquí.

## 12. Necesidad detectada: comprobar qué rama sirve realmente el backend antes de fiarse de un resultado E2E (pendiente de construir)

Durante la sección 3.65 (repo de origen) se dieron, en la misma
sesión, dos incidentes relacionados -- ninguno de los dos causado por
los cambios en sí, los dos capaces de dar una conclusión equivocada
sobre un resultado E2E si no se detectan:

1. **El backend/frontend en marcha eran de otra rama/repo**: con los
   mismos puertos de siempre (`3000`/`3010`), los procesos que
   respondían ahí llevaban un rato siendo los de
   `AI4Devs-qa-202606-senior-2-entrega-AGB` (el clon de QA, sección 5),
   no los de `AI4Devs-frontend-202606-senior-2` -- nunca se pararon al
   volver a trabajar en este otro repo. La suite E2E del repo de
   origen se estuvo ejecutando de verdad contra el código de este otro
   repo, sin ningún aviso: mismos puertos, mismo aspecto, código
   distinto.
2. **Un mismo backend, dos direcciones, dos límites de peticiones
   distintos**: `frontend/.env` apuntaba a `http://192.168.1.151:3010`
   (IP de red local) en vez de `http://localhost:3010`. Es el mismo
   proceso -- un único `app.listen()` no distingue por qué dirección
   le llega la petición -- pero el limitador de peticiones
   (`express-rate-limit`, por IP de origen) contaba las peticiones que
   llegaban por cada dirección en un cubo separado: `curl
   localhost:3010` daba por bueno que "el backend responde", mientras
   las peticiones reales del navegador (por la IP) ya estaban
   bloqueadas con `429`. Comprobar por un lado y ejecutar la suite por
   otro llevó a un diagnóstico equivocado durante buena parte de la
   sesión.

**Lo que hace falta, todavía sin construir**: alguna forma de
comprobar, antes de fiarse de un resultado E2E, qué versión del código
está sirviendo de verdad el backend que responde en el puerto
esperado -- no solo que responde, sino qué commit/rama es. Una opción
concreta: un endpoint tipo `GET /health` (o similar) que devuelva el
commit actual (`git rev-parse HEAD`, leído una vez al arrancar el
proceso) y que `e2e/global-setup.ts` compruebe contra el commit local
antes de arrancar la suite, fallando pronto y con un mensaje claro
("el backend en marcha es de otro commit") en vez de dejar que fallen
escenarios sueltos de forma difícil de explicar. Pendiente de
construir -- documentado aquí primero porque el usuario pidió dejar
constancia del hallazgo antes de decidir si se construye ahora o más
adelante.

## 13. `GET /health` + hook automático, y un incidente real de contaminación visible en la app -- traídos del repo de origen

Construido lo que quedó pendiente en la sección 12, en el repo de
origen (`AI4Devs-frontend-202606-senior-2`, `prompts-AGB.md`, secciones
3.67-3.68), y traído aquí igual que los cinco arreglos de la sección
11.

**`GET /health` + `backend/src/gitInfo.ts`**: expone el commit/rama
actuales del backend en marcha (`git rev-parse HEAD`, comando
inyectable para poder testear sin depender de git real -- mismo patrón
que `networkAddresses.ts`). Ruta pública a propósito, sin
`requireAuth`: hace falta comprobarla antes incluso de intentar el
login.

**`e2e/global-setup.ts`**: antes de nada, compara ese commit contra
`git rev-parse HEAD` de este mismo repo -- si no coinciden, falla con
un mensaje explícito en vez de escenarios sueltos difíciles de
explicar. Es el "hook que hace esta comprobación al lanzarlo" que
pidió el usuario: `global-setup.ts` ya es, en la propia terminología
de Playwright, el hook que se ejecuta automáticamente al lanzar la
suite -- no hacía falta un mecanismo aparte. Verificado en el repo de
origen con los dos caminos (positivo: `candidate-editing.feature`
completo en verde con la comprobación de por medio; negativo: un
servidor de mentira sirviendo un commit distinto, detectado con el
mensaje esperado).

**Incidente real, con consecuencia visible en la propia app**: en el
repo de origen, la misma base de datos de desarrollo compartida con
este repo (ambos backends apuntan al mismo Postgres local) terminó con
posiciones y candidaturas de prueba huérfanas -- visibles de verdad
para el usuario en "Posiciones" y en el listado de candidatos sin
asignar -- por escenarios que fallaron bajo el limitador de peticiones
agotado antes de llegar a su propia limpieza. Investigado con una
consulta de solo lectura antes de tocar nada, y limpiado de forma
asimétrica: fixtures inequívocos (nombres de test, sin ambigüedad)
borrados enteros; candidatos de origen incierto solo desligados de la
candidatura espuria, no borrados (mismo criterio que "Nico alaslla").
Como la base de datos es la misma para los dos repos, este incidente y
su limpieza son compartidos -- no hace falta repetir nada aquí, ya
queda resuelto por la limpieza hecha en el repo de origen.

**Verificado en este repo, no solo copiado a ciegas**: `tsc` limpio y
95/95 tests unitarios del backend (93 + los 2 de `gitInfo.test.ts`).

## 14. `git merge origin/main`: cierra la divergencia real entre `main` y esta rama

El usuario preguntó por qué `main` y `qa-e2e-position-AGB` no eran
idénticas -- al comprobarlo con `git merge-base --is-ancestor`, salió
que `main` **no** era antepasado real de esta rama, aunque el
contenido de los ficheros coincidiera. Motivo: cada vez que `main`
recibía algo nuevo del repo de origen (secciones 3, 11 y 13 de este
mismo diario), se copiaba el contenido final de los ficheros como
commits nuevos en esta rama, en vez de fusionarlo -- las dos líneas de
historia divergieron en `3077f97` (el commit del renombrado) y nunca
volvieron a converger, aunque el resultado final coincidiera cada vez.

**`git merge origin/main`**, con 2 conflictos reales (no falsos
positivos): `README-ES.md`/`README-EN.md`, en las dos líneas donde
cada rama había reescrito el mismo texto de forma distinta (esta rama
menciona "Lección 11"/el segundo ejercicio en `entrega-qa-AGB/`, la
rama de origen no). Resueltos a favor del texto de esta rama en los
dos casos -- es el que describe correctamente este repo, que sí
contiene ambos ejercicios. `entrega-frontend-AGB/BRANCHES_LOG` y
`prompts-AGB.md` se fusionaron solos, sin conflicto (solo `main` había
seguido añadiendo secciones ahí desde `3077f97`).

**Verificado antes de comitear la fusión**: `git diff` contra el
estado previo de esta rama, excluyendo los 4 ficheros con conflicto
real -- ningún otro fichero cambió de contenido. `tsc` limpio y 95/95
tests unitarios siguen en verde. Confirmado con
`git merge-base --is-ancestor origin/main HEAD` que ahora sí es una
relación de antepasado real, no solo contenido coincidente.

## 15. Cierre: evidencia regenerada, descripción del PR actualizada, y apertura del PR real

Repaso final del checklist de entrega a petición del usuario -- todo
hecho salvo el propio PR, nunca abierto hasta ahora (comprobado con
`gh pr list` contra el fork y contra el repo real, ninguno de los dos
tenía nada).

**Evidencia de ejecución, regenerada contra el commit final**: los
servidores que corrían eran los del repo de origen, no los de este
clon -- parados y arrancados de nuevo desde aquí (el log de arranque
con el commit/rama, sección 13, lo confirmó al momento: `commit
f3fd8fb (rama qa-e2e-position-AGB)`). `position.spec.ts` ejecutado dos
veces seguidas (2/2 ambas) contra el commit real que lleva este PR, no
contra uno de hace horas.

**`PR-DESCRIPTION-QA.md` actualizada** con una sección nueva
("Robustez, traída del repo hermano una vez verificada allí") que
resume el bug de idioma corregido, la menos duplicación en
`positionController.ts`, `GET /health` + el hook de `global-setup.ts`,
y el `merge` que cerró la divergencia de historia -- sin inflar la
descripción, solo lo justo para que quien revise sepa que existe y
dónde mirar el detalle completo.

**Un obstáculo real al intentar abrir el PR**: GitHub lo rechazó --
"no history in common" -- tanto por `gh pr create` como por la propia
API REST. Consecuencia directa de haber forzado `main` de este fork a
la entrega del primer ejercicio hace tiempo (sección 5): ese `main`
nunca compartió historia con la plantilla real de
`LIDR-academy/AI4Devs-qa-202606-senior-2`, y GitHub exige un ancestro
común para crear un PR. Comprobado también que la propia plantilla
(`upstream/main`, recién añadida como remoto) sigue siendo la app
original del bootcamp (JS, sin TypeScript en el frontend, sin
autenticación...) -- confirma otra vez por qué se decidió divergir en
vez de partir de ahí.

**Arreglo**: `git merge -s ours --allow-unrelated-histories
upstream/main` -- une el historial (para que GitHub acepte el PR) sin
traer ni un byte de contenido de la plantilla; confirmado con
`git diff --stat` contra el commit anterior: ninguna diferencia. `tsc`
sigue limpio después.

## 16. `Quality gate` de SonarCloud: B security rating, de nuevo el mismo patrón que la primera vez

El usuario avisó de que el PR #15 no pasaba el *quality gate* de
SonarCloud -- "B Security Rating on New Code" (comentario real del bot
en el PR, confirmado con `gh pr view --json comments`). El proyecto de
SonarCloud de `LIDR-academy` no es accesible vía API pública ni por
navegador sin sesión (a diferencia del mirror privado propio, en el
otro repo) -- confirmado con varios intentos (`components/show`,
`issues/search`, `hotspots/search`, todos "Project doesn't exist").
Como "New Code" aquí es, en la práctica, casi todo el repo (la
plantilla original no comparte casi nada con nuestro código), se buscó
el mismo patrón que ya causó esto la primera vez (regla
`typescript:S2068`, "hard-coded password": literales asignados a una
propiedad/variable con nombre de contraseña).

**Encontrado**: `e2e/steps/security-hardening.steps.ts`, un login
deliberadamente fallido (`password: 'x'`) usado solo para confirmar
que la API responde, sin ningún efecto secundario, antes de comparar
cabeceras -- mismo propósito exacto que el `GET /health` que acabamos
de construir (sección 13). Su propio comentario decía literalmente "no
hay una ruta de health-check dedicada" -- ya no es verdad. Cambiado a
usar `GET /health` directamente: elimina el literal de contraseña por
completo (mejor que envolverlo en `// NOSONAR`, que sigue siendo el
literal ahí) y de paso dejaba de fingir un login para lo que ya no
hace falta fingir.

Revisados también el resto de literales tipo contraseña/secreto/token
del repo (`grep` amplio) -- el resto son valores de mentira en ficheros
`*.test.ts`/`*.test.js` (mocks de Jest/Vitest, patrón estándar y muy
común, no tocados por ahora) o ya tenían su `// NOSONAR` desde la
primera entrega (`rate-limiting.steps.ts`). Sin acceso al listado real
de SonarCloud, no hay forma de confirmar con certeza que este era el
único hallazgo -- verificado en vivo (`security-hardening.feature`,
4/4) y `tsc` limpio; se sabrá con certeza tras el reescaneo automático
que dispara el nuevo commit.

## 17. El reescaneo seguía en rojo: el listado real de anotaciones de SonarCloud sí es accesible (por otra vía), y van 23, no una

El primer arreglo (sección 16) no bastó -- `gh pr checks 15` seguía en
`fail` tras un reescaneo genuinamente nuevo (31s de duración). La API
pública de SonarCloud sigue sin servir nada para este proyecto, pero
las *anotaciones* que el propio check de GitHub deja sobre el commit
sí son accesibles vía la API de GitHub (`gh api
repos/.../commits/<sha>/check-runs` para encontrar el `check_run` de
SonarCloud, y `.../check-runs/<id>/annotations` para su detalle) --
vía distinta a la usada hasta ahora, encontrada al buscar una forma de
confirmar la sospecha de que `gitInfo.ts` (fichero nuevo, nunca
escaneado hasta este PR) tuviera el mismo problema que ya se había
corregido para `npm` (`npmChildProcess.ts`, regla `typescript:S4036`,
"PATH variable").

Resultado: 23 anotaciones repartidas por casi todo el repo, no una.
Confirma la sospecha de la sección 16 sobre qué es "New Code" aquí --
al ser el primer análisis real del proyecto en SonarCloud, cuenta como
nuevo casi cualquier fichero, no solo lo tocado en este PR.

**La única de seguridad real (`Vulnerability`, la que de verdad baja
el *rating*)**: `e2e/global-setup.ts:20`, "Make sure the PATH variable
only contains fixed, unwriteable directories" (`typescript:S4036`) --
exactamente la sospecha original sobre `gitInfo.ts`, pero en la
llamada gemela de `global-setup.ts`. Arreglada igual que
`npmChildProcess.ts` ya arregló el caso de `npm`: `git` no tiene un
equivalente a `npm_execpath` (ninguna variable de entorno da su ruta
absoluta), así que se restringe el `PATH` del proceso hijo a rutas de
sistema fijas (`/usr/bin:/bin:/usr/local/bin`, confirmado con `which
git` tanto en esta máquina como en los runners de GitHub Actions) en
vez de heredar el `PATH` completo, que sí puede incluir directorios
escribibles por el usuario. Se aplica el mismo arreglo en
`gitInfo.ts`, aunque SonarCloud no lo señalara ahí -- mismo patrón
exacto, y de lo contrario habría bastado con que un reescaneo futuro
lo detectara por separado.

**El resto (22), todo `Code Smell`/`warning`, no bajan el *rating* de
seguridad pero se corrigen igual a petición expresa del usuario**
("las notas son de warnings... corrígelos todos... a menos que no esté
conforme, en cuyo caso lo comentamos"):

- Import sin prefijo `node:` (`gitInfo.ts`, `networkAddresses.ts`,
  `fileUploadService.ts`).
- `isNaN`/`parseInt` globales en vez de `Number.isNaN`/`Number.parseInt`
  (`candidateController.ts`, `positionController.ts` -- se corrigen
  también las apariciones idénticas no señaladas por Sonar en los
  mismos ficheros, por consistencia).
- Cadena de opcionales (`position?.companyId !== companyId` en vez de
  `!position || position.companyId !== companyId`) en
  `positionService.ts` (×4) y `candidateService.ts` (×1) -- equivalencia
  comprobada a mano antes de aplicarla.
- Catch que descartaba el error sin usarlo ni explicar por qué
  (`candidateController.ts`, `getUnassignedCandidates`) -- se añade
  `console.error`, mismo patrón que ya usan otros catches del propio
  backend; corregido también el caso gemelo no señalado
  (`getCandidateById`).
- **Complejidad cognitiva por encima del límite** en
  `candidateService.ts`: `addCandidate` (18/15) y
  `updateCandidateProfile` (26/15). Único arreglo no mecánico de la
  tanda -- se extraen funciones auxiliares
  (`resolveFirstStepForNewApplication`, `saveCandidateEducations`,
  `saveCandidateWorkExperiences`, `saveCandidateResume`,
  `resolveFirstStepForProfileUpdate`, `replaceCandidateEducations`,
  `replaceCandidateWorkExperiences`) sin cambiar comportamiento --
  verificado con los 42 tests ya existentes del fichero, ninguno
  tocado.
- **Índice del array como `key` de React** en `WorkHistoryFields.jsx`
  (×2, educación y experiencia) -- este no es solo un aviso de Sonar,
  es un bug real: quitar una entrada que no sea la última hace que
  React reutilice el `DatePicker` equivocado (su estado interno --
  calendario abierto, foco -- se queda pegado a la posición, no a la
  entrada). Las entradas no tienen ningún id propio a propósito (se
  quita al cargar un candidato existente, ver `AddCandidateForm.jsx`,
  para no arrastrar el id de la BD en un formulario que sustituye la
  lista entera al guardar). Arreglo: un hook local
  (`useEntryKeys`) que genera una clave estable por entrada, calculada
  durante el propio render con una `ref` (sin `useEffect` de por
  medio), ajena a los datos del formulario -- nunca se manda al padre.
  **Verificado a mano en el navegador** (no solo con los tests
  unitarios, que no habrían detectado esto): con el calendario de la
  fila 3 de 5 abierto, al eliminar la fila 1, el calendario se queda
  abierto y correctamente asociado a su fila (que ahora es la 2) --
  antes se habría cerrado solo, sin avisar.
- Rol ARIA `group` sobre un `<div>` en vez del elemento nativo
  (`LanguageSwitcher.jsx`) -- cambiado a `<fieldset>`/`<legend>` (con
  estilos en línea para deshacer su apariencia por defecto), que ya
  trae el rol "group" implícito y una etiqueta accesible sin
  `aria-label` redundante.
- Regex con backtracking potencialmente superlineal
  (`PositionProcess.tsx`, `toTestId`) -- `/^-+|-+$/g` partido en dos
  `.replace()` sin alternancia.
- Objeto de contexto recreado en cada render (`AuthContext.jsx`) --
  envuelto en `useMemo`.
- `String.match` en vez de `RegExp.exec` (`developer-tooling.steps.ts`).

**No corregido, comentado en vez de aplicado a ciegas**:
`e2e/steps/support/prisma.ts:8`, "Do not use internal APIs of your
dependencies" -- importa `@prisma/client` por ruta relativa desde
`backend/node_modules/`. El propio comentario del fichero ya explica
por qué: sin *npm workspaces* (decisión explícita del usuario para
este proyecto), es la única forma de reutilizar el cliente Prisma ya
generado en `backend/` sin duplicarlo ni desincronizarlo del schema
real. Un arreglo "de verdad" aquí sería un cambio de arquitectura
(workspaces, o una dependencia `@prisma/client` propia de la raíz con
su propio `prisma generate`), no algo para colar en una tanda de
limpieza de avisos.

**Verificación completa** antes de commitear: `tsc --noEmit` limpio en
backend y frontend; 95 tests de backend y 119 de frontend, todos en
verde; `npm run build` del frontend sin avisos; y 44 escenarios E2E
reales (no solo los tocados: `accessibility`, `candidate-intake`,
`candidate-editing`, `hiring-pipeline`, `position-catalog`,
`file-upload`, `security-hardening`, `developer-tooling`) verdes
contra el backend y frontend reiniciados desde este mismo clon.

## 18. Menos duplicación en `candidateService.ts`/`.test.ts`, traída del repo hermano una vez verificada allí

Tras cerrar el *quality gate* (secciones 16-17), el usuario preguntó
en el repo hermano (`AI4Devs-frontend-202606-senior-2`, PR #22) qué
quedaba pendiente. Se detectó con `jscpd` una duplicación real en
`candidateService.ts` (5,61%/3 clones), residuo del propio refactor
de complejidad cognitiva de la sección 16 -- dos funciones
(`resolveFirstStepForNewApplication`/`resolveFirstStepForProfileUpdate`)
repetían el mismo bloque de validación del flujo de entrevistas, y
otras dos parejas (`saveCandidateEducations`/`saveCandidateWorkExperiences`,
`replaceCandidateEducations`/`replaceCandidateWorkExperiences`)
repetían la misma forma de "crear una entrada por cada elemento de una
lista" variando solo el modelo de dominio.

Arreglado allí primero (mismo criterio que `positionController.ts`,
extraer solo lo genuinamente idéntico): `requireInterviewFlowConfigured`
compartido por las dos funciones `resolveFirstStep*`, y un único
`saveEntries<T>` genérico (parametrizado por el constructor del
modelo y un callback opcional) usado por las cuatro funciones de
guardado/sustitución. `jscpd`: 5,61%/3 clones -> 0,00%/0. El fichero
de test tenía aún más duplicación (14,87%/11 clones) -- extraídos
`mockPosition(overrides)` y `stubCandidateCreate(data)`; `jscpd`:
14,87%/11 -> 4,39%/5 (el resto exigiría fusionar tests que comprueban
cosas realmente distintas, igual que ya se aceptó con
`positionController.test.ts`).

**Traído aquí una vez verificado allí** (mismo patrón que las
secciones 11 y 13: arreglo nacido en el repo hermano, portado después
de confirmarlo en verde). Los dos ficheros de este repo estaban en el
mismo estado previo al refactor -- confirmado con `diff` antes de
copiar, no a ciegas -- así que la copia fue directa y exacta. `jscpd`
sobre ambos ficheros aquí: 2,44%/5 clones (el conjunto sobre 737
líneas, coherente con los números individuales de arriba).

**Verificado de nuevo en este repo, no solo confiado en la
verificación del hermano**: `tsc --noEmit` limpio, 95 tests de backend
en verde (16 de `candidateService.test.ts`, ninguna aserción
reescrita), y 20 escenarios E2E reales (`candidate-intake`,
`candidate-editing`, `hiring-pipeline`) contra el backend/frontend de
este mismo clon, ejercitando `addCandidate`/`updateCandidateProfile`/
`updateCandidateStage` contra la base de datos real.
