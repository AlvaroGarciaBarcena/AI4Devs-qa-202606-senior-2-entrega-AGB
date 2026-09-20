# ADR-0010: Migrar a `createBrowserRouter` para tener estado real de navegación

## Estado
Aceptado — sustituye a [ADR-0005](./0005-route-based-code-splitting.md)

## Contexto
El *code splitting* original (ADR-0005, `React.lazy` + `Suspense` a nivel de componente, con `<BrowserRouter>`/`<Routes>` en modo declarativo) tenía un defecto real descubierto al escribir su propio test E2E: retrasando a propósito el chunk de una pantalla protegida y trazando el DOM cada 20-150ms tras pulsar un enlace real, el `Suspense fallback` nunca llegaba a mostrarse. React 18 trata las navegaciones por `<Link>` en este modo como una transición que mantiene la UI anterior montada hasta que el contenido nuevo está listo, sin ninguna señal intermedia — quien pulsaba el enlace no tenía forma de saber que algo estaba pasando durante más de 800ms en una conexión lenta.

## Decisión
Migrar `App.jsx` de `<BrowserRouter>`/`<Routes>` (modo declarativo) a `createBrowserRouter`/`<RouterProvider>` (modo *data router*), y de `React.lazy`+`Suspense` a nivel de componente a `lazy` a nivel de **ruta**. Con esto, `useNavigation().state` refleja de verdad si una navegación sigue esperando el código de la pantalla destino, y un componente genérico (`NavigationLoadingIndicator`, pensado para reutilizarse en otros proyectos) lo usa para mostrar una barra de carga real.

## Alternativas consideradas
- **Forzar el `Suspense fallback` a mostrarse igualmente** (p. ej. envolviendo la navegación en `startTransition` a mano, de forma distinta): rechazado — no resuelve el problema de raíz (el propio mecanismo de código diferido no expone ningún estado consultable), solo intenta forzar un síntoma visual sin una señal real detrás.
- **Un estado de "cargando" propio con un `useTransition()` manual por cada `<Link>`**: viable, pero exige recordar usar un componente `<Link>` propio en cualquier sitio nuevo en vez del de `react-router-dom` directamente — más frágil a largo plazo que una única fuente de verdad (`useNavigation()`) disponible en cualquier punto del árbol.

## Consecuencias
- **Regresión real encontrada durante la propia migración**: `lazy` a nivel de ruta se invoca durante el *emparejamiento* de la ruta, antes de que el componente que comprueba la sesión (`RequireAuth`) tenga ocasión de redirigir al renderizar — una visita sin sesión volvía a descargar código de pantallas protegidas, justo el requisito de *code splitting* que se pretendía mantener intacto. Corregido con un chequeo síncrono de `localStorage` antes del `import()`, detectado por el propio escenario E2E que comprueba justo ese requisito.
- `NavigationLoadingIndicator` es un `role="status"` permanente en el DOM (necesario para que `aria-live` no pierda anuncios reales) — rompió 9 escenarios E2E existentes que asumían un único `role="status"` en cada página; corregidos filtrando por el texto concreto del mensaje que cada uno esperaba.

Más contexto: [`prompts-AGB.md` §3.33](../../entrega-frontend-AGB/prompts-AGB.md#333-se-corrige-el-hallazgo-de-3304-indicador-de-carga-real-genérico-con-usenavigation).
