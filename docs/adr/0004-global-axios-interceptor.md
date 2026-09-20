# ADR-0004: Interceptor global de axios en vez de una instancia dedicada

## Estado
Aceptado

## Contexto
Al añadir autenticación JWT (ADR-0003), el frontend necesitaba dos cosas nuevas en cada petición: adjuntar el token guardado como cabecera `Authorization`, y reaccionar a un `401` limpiando la sesión y redirigiendo a `/login`. La forma más habitual de hacer esto en un proyecto con axios es crear una instancia dedicada (`axios.create()`) con sus propios interceptores. Pero `candidateService.js` y `positionService.js` ya llamaban a `axios.get`/`axios.post` directamente sobre la instancia por defecto, y sus tests (`vi.mock('axios')`) mockean esa instancia por defecto — una instancia nueva creada con `axios.create()` habría resuelto sus métodos como `undefined` bajo ese mock, rompiendo los tests existentes sin tocar su código.

## Decisión
Registrar los interceptores (`request` para añadir el token, `response` para reaccionar a un `401`) directamente sobre la instancia **por defecto** de axios, en un módulo (`services/apiClient.js`) importado una sola vez, como efecto secundario, al arrancar la app.

## Alternativas consideradas
- **`axios.create()` con una instancia dedicada**: rechazado por el motivo de arriba — habría exigido migrar `candidateService.js`/`positionService.js` (y sus tests) a la nueva instancia, un cambio más amplio que lo que la propia tarea de autenticación pedía.
- **Adjuntar el token a mano en cada llamada** (sin interceptor): rechazado por el riesgo de olvidarlo en alguna llamada nueva en el futuro — un interceptor lo hace imposible de olvidar, se aplica a toda petición sin excepción.

## Consecuencias
- Efecto secundario global al importar `apiClient.js` — cualquier código que use axios en este proyecto queda afectado por los interceptores, para bien (no hay que acordarse de nada) y para mal (no es obvio solo con leer un `service.js` cualquiera que sus peticiones llevan already un interceptor por delante, hay que saber que existe `apiClient.js`).
- Un `401` fuerza `window.location.assign('/login')` (recarga completa), no una navegación de React Router — deliberado: el interceptor vive fuera del árbol de componentes, sin acceso limpio al router, y una recarga completa garantiza que no quede ningún estado de la sesión anterior a medias en memoria.

Más contexto: [`prompts-AGB.md` §3.19.8](../../entrega-frontend-AGB/prompts-AGB.md#3198-frontend-por-qué-un-interceptor-global-de-axios-no-una-instancia-propia).
