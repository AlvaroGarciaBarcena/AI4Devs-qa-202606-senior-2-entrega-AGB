# ADR-0002: Adoptar `react-i18next` en vez del sistema de i18n casero

## Estado
Aceptado

## Contexto
La app empezó con un sistema de internacionalización construido a mano: un `Context` de React guardando el idioma activo, detección manual de `navigator.languages`, y funciones propias de traducción llamadas explícitamente con el idioma como parámetro. Funcionaba, pero tenía límites reales: sin pluralización, sin interpolación estándar, y — el problema más serio — acoplaba la traducción a React Context, así que código que no es un componente (como los mensajes de validación, que se construyen a partir de la respuesta del backend) tenía que recibir el idioma activo como parámetro explícito en vez de simplemente pedirlo.

## Decisión
Sustituir el sistema casero por [`react-i18next`](https://react.i18next.com/), la librería estándar del ecosistema React para i18n.

## Alternativas consideradas
- **Seguir ampliando el sistema casero** (añadir pluralización, interpolación, etc. a mano): rechazado por reinventar, con más código propio que mantener, lo que una librería madura ya resuelve y con casos límite ya cubiertos (formatos de fecha/número, plurales irregulares, etc.).
- **`react-intl` / `FormatJS`**: no descartado por ningún defecto concreto, simplemente `react-i18next` tiene una integración más directa con el patrón "traducir fuera de un componente" que este proyecto necesitaba (`i18n.t()` como función global, no solo un hook).

## Consecuencias
- `i18n.t()` puede llamarse desde fuera de un componente (p. ej. `i18n/validationMessages.js`, que traduce la respuesta del backend) sin pasar el idioma como parámetro — el problema que motivó el cambio queda resuelto de raíz.
- `useTranslation()` en un componente suscribe automáticamente a los cambios de idioma — un cambio de idioma re-renderiza todo lo que usa `t()`, incluidos mensajes de error ya visibles en pantalla, sin volver a enviar ninguna petición.
- Nueva dependencia de terceros (`i18next-browser-languagedetector` para la detección automática) en vez de la detección manual que había antes — mismo comportamiento observable, pero mantenido fuera del proyecto.

Más contexto: [`prompts-AGB.md` §3.13](../../entrega-frontend-AGB/prompts-AGB.md#313-migración-a-react-i18next-cómo-se-hace-bien).
