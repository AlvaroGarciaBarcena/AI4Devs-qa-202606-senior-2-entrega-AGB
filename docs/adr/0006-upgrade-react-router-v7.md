# ADR-0006: Actualizar `react-router-dom` de v6 a v7

## Estado
Aceptado

## Contexto
Una auditoría de dependencias (`npm audit`) marcó `react-router-dom` v6 con vulnerabilidades conocidas. La actualización a v7 se había dejado deliberadamente fuera de una rama anterior de seguridad, no por incompatibilidad conocida, sino por higiene de alcance — no mezclar una actualización mayor de una librería con correcciones de seguridad puntuales en el mismo cambio.

## Decisión
Actualizar `react-router-dom` de v6 a v7, tras confirmar que solo 4 ficheros del proyecto usan el subconjunto declarativo de la librería (`<Link>`, `useParams`, `useNavigate`, `useLocation`) — ninguno de los *breaking changes* de v7 afecta a ese subconjunto.

## Alternativas consideradas
- **`npm audit fix --force` sin revisar el impacto**: rechazado por el propio hábito de esta sesión de no aceptar cambios automáticos de versión mayor sin verificar qué se rompe.
- **Quedarse en v6 y silenciar el aviso de auditoría**: rechazado — resuelve el síntoma (el aviso) sin resolver la vulnerabilidad real.

## Consecuencias
- Sin cambios de comportamiento observables en ese momento (verificado con la suite de tests existente) — la actualización en sí fue de bajo riesgo real, aunque de alto riesgo *percibido* por ser un salto de versión mayor.
- Dejó el camino libre para `createBrowserRouter`/`RouterProvider` (ADR-0010) más adelante en la sesión, que sí depende de v7.

Más contexto: [`prompts-AGB.md` §3.18](../../entrega-frontend-AGB/prompts-AGB.md#318-migración-de-react-router-dom-v6-v7-react-router-v7-agb).
