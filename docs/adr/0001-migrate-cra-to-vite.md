# ADR-0001: Migrar de Create React App a Vite

## Estado
Aceptado

## Contexto
El frontend arrancó con Create React App (`react-scripts`), oficialmente descontinuado por el equipo de React. `react-scripts` fija TypeScript a `^3.2.1 || ^4` como *peer dependency* — un techo que empezaba a bloquear la instalación de librerías modernas (tipos más recientes, ESLint 9+, etc.) y que solo iba a empeorar con el tiempo, no a resolverse solo.

## Decisión
Migrar el frontend completo a [Vite](https://vite.dev): servidor de desarrollo, build de producción (`dist/`, no `build/`) y la config de tests (Vitest, no Jest+react-scripts).

## Alternativas consideradas
- **Forzar la actualización de TypeScript dentro de CRA** (con `--legacy-peer-deps` o similar): rechazado por tratar el síntoma, no la causa — el mismo muro de *peer dependencies* iba a repetirse con la siguiente librería moderna que se quisiera instalar, ya que `react-scripts` en sí mismo no recibe mantenimiento.
- **`eject` de CRA** para tener control manual sobre la config de Webpack: rechazado por el mantenimiento que exige (toda la config queda en el propio repo, sin actualizaciones futuras de CRA) a cambio de nada que Vite no resuelva ya de forma nativa y con mejor rendimiento en desarrollo.
- **Craco** (wrapper de configuración sobre CRA sin *eject*): rechazado por seguir dependiendo de `react-scripts` como base, sin resolver el techo de versión de TypeScript.

## Consecuencias
- Arranque del servidor de desarrollo bajo un segundo (Vite usa ES modules nativos, sin empaquetar todo de antemano) frente a los varios segundos de CRA.
- El puerto del frontend queda fijado a `3000` en `vite.config.ts` porque el backend tiene el CORS hardcodeado a ese origen — un acoplamiento a tener en cuenta si se cambia el puerto en el futuro.
- Cualquier variable de entorno del lado del cliente pasa de `REACT_APP_*` a `VITE_*` (no llegó a haber ninguna en este proyecto, pero es la convención a seguir si se añade alguna).

Más contexto y verificación real (arranque cronometrado antes/después): [`prompts-AGB.md` §3.14](../../entrega-frontend-AGB/prompts-AGB.md#314-migración-de-create-react-app-a-vite).
