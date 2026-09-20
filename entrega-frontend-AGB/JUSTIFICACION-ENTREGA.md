# Por qué el entregable incluye cambios en backend y no solo en frontend

Este documento justifica, con hallazgos concretos y verificados (no
supuestos), por qué el trabajo entregado diverge del backend original del
ejercicio (`LIDR-academy/AI4Devs-frontend-202606-senior-2`, commit
`8025b6f`) en lugar de limitarse a `frontend/`. La causa no fue una
preferencia técnica: el backend original trataba datos personales de
candidatos sin ningún control de acceso, lo que constituye un
incumplimiento activo de las obligaciones que impone el RGPD sobre el
tratamiento de esos datos. Corregirlo exigió, por su propia naturaleza,
tocar backend y frontend a la vez — no es posible proteger una API solo
desde el cliente que la consume.

Una vez fuera del alcance estrictamente delimitado a "frontend", se
aprovechó para aplicar el resto de lo trabajado durante el bootcamp
(internacionalización, accesibilidad, calidad de herramientas, tests,
trazabilidad de requisitos) — detallado en la sección 5.

## 1. Qué datos trata esta aplicación

El sistema (un ATS — *Applicant Tracking System*) almacena, por cada
candidato: nombre y apellidos, email, teléfono, dirección postal,
historial educativo, experiencia laboral y el CV subido (fichero). Todo
esto es **dato personal** en el sentido del artículo 4.1 del RGPD
("toda información sobre una persona física identificada o
identificable"), y su tratamiento por parte de una empresa (el
reclutador que usa la herramienta) cae de lleno dentro del ámbito de
aplicación del reglamento.

## 2. Hallazgo central en el código original: ausencia total de autenticación

Verificado con una auditoría de seguridad exhaustiva sobre el código tal
y como estaba (rama `security-audit-AGB`, [sección 3.17 de
`prompts-AGB.md`](./prompts-AGB.md#317-auditoría-de-ciberseguridad-exhaustiva-security-audit-agb)),
no "a ojo" — cada hallazgo con una prueba de concepto real contra el
backend en marcha:

> Ningún endpoint del backend (`POST /candidates`, `GET /candidates/:id`,
> `PUT /candidates/:id`, `POST /upload`, `GET /position`,
> `GET /position/:id/candidates`, `GET /position/:id/interviewflow`)
> exige identidad ni comprueba permisos. Cualquiera que alcance el
> puerto 3010 puede leer y escribir datos personales de candidatos
> (nombre, email, teléfono, dirección, ruta del CV) y cambiar la fase de
> entrevista de cualquier candidatura, sin más que conocer un `id`
> numérico secuencial (no hay que adivinar nada: `GET /candidates/1`,
> `/2`, `/3`... enumera candidatos completos).

No existía ningún concepto de usuario, sesión, rol ni permiso en el
código — el campo `role` del modelo `Employee` no se usaba en ninguna
ruta ni middleware para autorizar nada. No era un fallo puntual
corregible con un parche puntual: era la ausencia completa de una capa
entera del sistema.

### Otros hallazgos reales de la misma auditoría, agravados por el anterior

- **Subida de ficheros sin comprobar su contenido real**: el filtro de
  tipo de archivo solo miraba el `Content-Type` que declara quien sube
  el fichero (`file.mimetype`), no el contenido. PoC real: un fichero
  HTML con `<script>` se aceptó y guardó bajo extensión `.pdf` con
  `200 OK`.
- **Nombre de fichero sin sanear** antes de construir la ruta de
  guardado (patrón CWE-22, *path traversal*) — no explotable hoy solo
  porque una dependencia de tercer nivel (`busboy`) lo neutraliza sin
  que sea parte documentada de su contrato; corregido igualmente como
  defensa en profundidad.
- **Credenciales de la base de datos en texto plano**, hardcodeadas en
  `schema.prisma` y commiteadas en el historial de git desde el primer
  commit.
- **La validación de datos de entrada se podía saltar por completo**
  enviando cualquier `id` en el cuerpo de la petición de alta.
- **20 vulnerabilidades de dependencias** en el backend (`npm audit`,
  varias de severidad alta y alcanzables en producción: ReDoS, DoS, XSS
  por plantilla, vía `express`) y 3 de severidad alta en el frontend
  (*open redirect* vía `react-router-dom`) — todas corregidas dentro del
  propio rango semver ya declarado.
- **Sin cabeceras de seguridad ni límite de peticiones** — sin
  autenticación de por medio, nada frenaba un abuso automatizado de
  cualquiera de los puntos anteriores.

Todos estos hallazgos están documentados con su PoC exacta, comando por
comando, en la sección 3.17 de `prompts-AGB.md`.

## 3. Por qué esto no era una mejora opcional: el marco legal (RGPD)

El RGPD no deja la seguridad del tratamiento como una buena práctica
recomendable — la exige como obligación legal directa:

- **Artículo 5.1.f (principio de integridad y confidencialidad)**: los
  datos personales serán tratados "de tal manera que se garantice una
  seguridad adecuada..., incluida la protección contra el tratamiento no
  autorizado o ilícito...".
- **Artículo 32 (seguridad del tratamiento)**: el responsable y el
  encargado del tratamiento deben aplicar "medidas técnicas y
  organizativas apropiadas" para garantizar un nivel de seguridad
  adecuado al riesgo, mencionando expresamente "la capacidad de
  garantizar la confidencialidad" de los sistemas de tratamiento.

Un backend donde cualquiera que conozca la URL puede enumerar `GET
/candidates/1`, `/2`, `/3`... y leer o modificar los datos personales de
cualquier candidato **no cumple ninguno de los dos artículos**. No es un
matiz de implementación ni una cuestión de estilo de arquitectura: es la
ausencia de la medida de seguridad más elemental posible (control de
acceso) sobre un sistema que trata datos personales de forma rutinaria.
Por eso el hallazgo de la sección 3.17.2 se documentó como severidad
**crítica**, y por eso implementar autenticación dejó de ser una
decisión de producto aplazable en cuanto se tuvo constancia del hallazgo.

## 4. Por qué la solución exige backend y frontend a la vez

Añadir autenticación real no es algo que se pueda hacer solo en un lado:

- **El control de acceso que importa de verdad vive en el backend.**
  Es el servidor quien decide si una petición se atiende o no — un
  cambio únicamente en el frontend (por ejemplo, ocultar botones u
  ocultar rutas en el router) no protege nada: cualquiera puede seguir
  llamando a `GET /candidates/1` directamente con `curl`, sin pasar por
  ninguna pantalla. Es el principio básico de que **el cliente nunca es
  de confianza** — la autorización se aplica donde vive el dato, no
  donde se pinta.
- **Sin el frontend correspondiente, un backend protegido es
  inutilizable.** En cuanto el backend exige un token válido en cada
  petición (`api-auth-AGB`: JWT + `requireAuth` delante de
  `/candidates`, `/upload` y `/position`), hace falta necesariamente un
  flujo de login real, gestión de sesión y envío del token en cada
  petición — sin eso, la propia aplicación que se pretende proteger deja
  de funcionar para sus usuarios legítimos.

Por ese motivo, `api-auth-AGB` implementó ambas mitades a la vez, de
forma deliberada: JWT + `bcrypt` + límite de intentos específico para
`/auth/login` en el backend, y `AuthContext`/`Login`/`RequireAuth` +
interceptor global de `axios` (adjuntando el token a cada petición) en
el frontend. Ninguna de las dos mitades por separado habría resuelto el
hallazgo de la sección 3.17.2.

## 5. Una vez fuera del alcance original: aplicar el resto de lo aprendido

Divergir del backend original por el motivo anterior abrió la puerta a
tratar este ejercicio como un proyecto real, no solo como el alcance
mínimo pedido. A partir de ahí se aplicó, de forma incremental y cada
una en su propia rama documentada, el resto de lo trabajado durante el
bootcamp:

- **Internacionalización (i18n)**: `react-i18next`, español/inglés,
  detección automática + selector explícito, mensajes de validación
  traducidos por código estructurado (el backend nunca redacta texto en
  ningún idioma).
- **Accesibilidad (a11y)**: `aria-invalid`/`aria-describedby` en
  formularios, `role="alert"`/`aria-live` en mensajes de error y éxito,
  `<html lang>` reactivo, iconos con `aria-label` además de `title`,
  navegación por teclado — mapeado explícitamente a criterios WCAG 2.1
  concretos, no como "buena práctica" genérica.
- **Calidad de herramientas**: migración de Create React App
  (descontinuado) a Vite, `react-router-dom` v6→v7, TypeScript
  actualizado hasta el techo real compatible con el resto del stack,
  ESLint 9 configurado de verdad (encontró 5 bugs reales de manejo de
  errores invisibles hasta entonces).
- **Tests automáticos**: cobertura de backend y frontend que antes no
  existía (0 tests de frontend al principio de la sesión), *code
  splitting* por ruta, y una suite E2E real con Playwright BDD sobre
  las especificaciones de OpenSpec.
- **Trazabilidad**: adopción de OpenSpec (specs por capacidad,
  GIVEN/WHEN/THEN, cada requisito enlazado a la rama y commit que lo
  implementó) y este mismo diario (`prompts-AGB.md`), que documenta cada
  decisión con su porqué, no solo el qué.

Cada una de estas líneas tiene su propia rama, su propio PR y su propia
sección en `prompts-AGB.md` — nada de esto se hizo "de más" sin dejar
rastro: [`BRANCHES_LOG`](./BRANCHES_LOG) enlaza cada rama con su sección,
y [`PROMPTS_POR_PR.md`](./PROMPTS_POR_PR.md) recoge el prompt exacto que
originó cada una.

## 6. Limitación conocida, decidida a propósito: el transporte sigue sin cifrar (HTTP, no HTTPS)

El propio artículo 32 del RGPD (sección 3) menciona el cifrado como
ejemplo de medida técnica apropiada, junto al control de acceso — así
que, siendo estrictos, esta entrega cierra la mitad del hallazgo de la
sección 3.17.2 (quién puede acceder) pero no la otra mitad (cómo viaja
el dato una vez autenticado). Con la aplicación sirviendo por HTTP, un
token JWT interceptado en la misma red durante sus 8h de vigencia
concede el mismo acceso que tendría sin cifrar la conexión.

Se decidió explícitamente no cerrar este hallazgo en esta entrega, tras
evaluar el coste real de las alternativas: un certificado autofirmado
exige que cada dispositivo que valide la entrega instale manualmente una
autoridad de confianza (inviable pedírselo a un evaluador externo); un
túnel HTTPS (Cloudflare/ngrok) depende de que la máquina de origen esté
encendida y los servicios activos en el momento exacto de la validación;
y un despliegue real (dominio + hosting, gratuito para una validación
puntual, del orden de 13-15€/mes si se quisiera mantener de forma
permanente) añade piezas de infraestructura ajenas al propio ejercicio.
Para validar el ejercicio en concreto, cualquiera de las tres opciones
complicaba la entrega más de lo que aportaba.

**Factores que atenúan el riesgo real mientras esto no se resuelve**: la
aplicación no está expuesta a internet — corre en local o, como mucho,
en una red WiFi de confianza acotada por firewall (sección 3.48); el
control de acceso en sí (a quién se le expide un token) sigue intacto,
así que esto no reabre el hallazgo original de la sección 3.17.2 (acceso
sin ninguna credencial); y la ventana de exposición es la de una
validación puntual, no un servicio en producción con tráfico continuo.

Queda documentado aquí como lo que es: un hallazgo real, no corregido,
con el porqué explícito de por qué no se ha corregido — el mismo
estándar que el resto de decisiones de esta sesión (ver, por ejemplo, la
sección 3.17.6 de `prompts-AGB.md` para el mismo tratamiento aplicado a
otros hallazgos de seguridad dejados fuera de alcance a propósito).

## 7. Resumen

| | Backend original | Backend entregado |
|---|---|---|
| Autenticación/autorización | Ninguna — cualquiera lee/escribe PII con un id secuencial | JWT + `bcrypt`, toda ruta protegida |
| Cifrado en tránsito (HTTPS) | No | Tampoco — limitación conocida, ver sección 6 |
| Cumplimiento RGPD (art. 5.1.f, art. 32) | No — sin ninguna medida de seguridad | Parcial: control de acceso sí, cifrado en tránsito no (sección 6) |
| Subida de ficheros | Tipo de archivo confiado al cliente; nombre sin sanear | Filtro + saneado explícito (defensa en profundidad) |
| Dependencias | 20 vulnerabilidades (backend), 3 altas (frontend) | 0 |
| Credenciales | Contraseña de BD en texto plano, commiteada | Vía `.env`, no trackeado |

La conclusión práctica: **entregar solo `frontend/` contra el backend
original no es una opción sin más**, y no por preferencia estilística —
el propio backend, sin los cambios de `api-auth-AGB` y
`security-audit-AGB`, incumple una obligación legal directa sobre los
datos que la aplicación trata. La divergencia entre lo entregado y el
punto de partida del ejercicio es la consecuencia de corregir eso, no la
causa de un alcance descontrolado.
