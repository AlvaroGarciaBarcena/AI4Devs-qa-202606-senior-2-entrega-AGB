# ADR-0003: Autenticación JWT sin estado, con mensaje de error genérico

## Estado
Aceptado

## Contexto
Una auditoría de seguridad exhaustiva (`security-audit-AGB`) encontró que la API no exigía ningún tipo de autenticación — cualquiera con la URL podía leer o modificar candidatos y posiciones. Era el hallazgo más severo de la auditoría, dejado sin corregir a propósito en esa rama porque decidir el modelo de autenticación es una decisión de arquitectura que merecía su propia conversación, no una corrección de seguridad más entre otras.

## Decisión
Autenticación basada en JWT sin estado (sin sesiones en el servidor): login con email/contraseña de un `Employee` ya sembrado en la base de datos (sin registro público), token válido 8 horas, verificado en cada petición a las rutas de negocio. Los cuatro motivos posibles de fallo del login (usuario inexistente, inactivo, sin contraseña asignada, contraseña incorrecta) devuelven el **mismo mensaje genérico**, para no filtrar por el mensaje de error si un email concreto existe en el sistema.

## Alternativas consideradas
- **Sesiones de servidor (cookies + almacén de sesión)**: rechazado por añadir estado que este backend, pensado para ser simple de desplegar, no necesitaba — JWT permite verificar sin consultar ninguna tabla de sesiones.
- **Mensajes de error distintos por motivo de fallo** ("email no existe" / "contraseña incorrecta"): rechazado explícitamente por seguridad — permitiría a quien ataca enumerar qué emails existen en el sistema probando uno a uno.
- **OAuth / login con terceros**: fuera de alcance — no hay ningún caso de uso de este proyecto que lo justifique, y añade una dependencia externa real (un proveedor de identidad) por una ganancia que no aplica aquí.

## Consecuencias
- Cerrar sesión es una operación puramente del cliente (borrar el token guardado) — el servidor no puede invalidar un token antes de que caduque por su cuenta (no hay lista de revocación). Aceptable para las 8 horas de validez elegidas, pero a tener en cuenta si se necesitara revocación inmediata en el futuro.
- Un límite de intentos de login (`express-rate-limit`, 10/15min, más estricto que el límite general de la API) es el único freno real contra fuerza bruta, dado que no hay bloqueo de cuenta tras varios fallos.
- El `JWT_SECRET` es la única pieza crítica de este modelo — su filtración compromete cualquier sesión pasada o futura hasta que se rote.

Más contexto: [`prompts-AGB.md` §3.19](../../entrega-frontend-AGB/prompts-AGB.md#319-autenticación-de-las-apis-api-auth-agb).
