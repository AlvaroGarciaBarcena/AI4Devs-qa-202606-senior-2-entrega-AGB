# ADR-0005: *Code splitting* por ruta con `React.lazy` + `Suspense`

## Estado
Reemplazado por [ADR-0010](./0010-data-router-for-navigation-state.md)

## Contexto
Todo el código de las 4 pantallas protegidas (panel del reclutador, alta de candidato, listado de posiciones, proceso de selección) se descargaba de golpe en el bundle inicial, incluso para alguien que todavía no había iniciado sesión y solo iba a ver la pantalla de login.

## Decisión
`React.lazy(() => import(...))` para cada una de las 4 rutas protegidas, envueltas en un único `<Suspense fallback={<PageFallback/>}>` alrededor de `<Routes>`. `Login` se mantiene con import estático a propósito — es la primera pantalla que ve todo el mundo sin sesión, y una carga diferida ahí metería una espera justo en el primer contacto con la app.

## Alternativas consideradas
- **Un `<Suspense>` por ruta en vez de uno compartido**: rechazado por simplicidad — con solo 4 rutas y un único punto de entrada (`<Routes>`), un `Suspense` compartido bastaba.
- **No hacer *code splitting* en absoluto**: descartado tras medir el bundle inicial — el código de las 4 pantallas no debería llegar a nadie sin sesión.

## Consecuencias
- **Regresión real encontrada después**: con `<BrowserRouter>`/`<Routes>` (modo declarativo), las navegaciones por `<Link>` se tratan como una transición de React 18 que mantiene la pantalla anterior montada hasta que el código nuevo está listo, en vez de mostrar el `Suspense fallback` de inmediato — quien pulsaba un enlace no veía ninguna señal de que algo estaba pasando, más de 800ms en una conexión lenta. Ver ADR-0010, que sustituye este enfoque por uno que sí da una señal real de carga.

Más contexto: [`prompts-AGB.md` §3.20](../../entrega-frontend-AGB/prompts-AGB.md#320-code-splitting-del-bundle-code-splitting-agb) (decisión original) y [§3.30.4](../../entrega-frontend-AGB/prompts-AGB.md#330-internationalization-44-accessibility-55-frontend-performance-33-un-fixture-propio-de-test-mal-elegido-un-fallo-de-aislamiento-de-sesión-y-un-hallazgo-real-sin-corregir) (la regresión encontrada).
