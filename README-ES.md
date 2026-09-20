# LTI - Sistema de Seguimiento de Talento

Una aplicación full-stack de reclutamiento (ATS): un frontend en React + TypeScript (construido con [Vite](https://vite.dev)) y un backend en Express + TypeScript, usando [Prisma](https://www.prisma.io) como ORM sobre PostgreSQL.

> 🇬🇧 Looking for the English version? Read [README-EN.md](./README-EN.md).

Esta guía asume una máquina **Ubuntu** recién instalada, sin nada configurado todavía. Si ya tienes git, Node.js y Docker instalados, salta directamente a [Obtén el código](#3-obtén-el-código).

> ✅ **Verificado de extremo a extremo el 2026-09-20**: estos pasos, tal cual están escritos, se siguieron uno por uno sobre un clon nuevo del repositorio (sin ningún `.env` ni dato previo) y terminaron en un inicio de sesión real con las credenciales del [paso 10](#10-inicia-sesión). No hace falta ningún conocimiento ni fichero adicional a los que ya se documentan aquí.

## Contenido

- [1. Requisitos previos](#1-requisitos-previos)
- [2. Instala Git, Node.js y Docker](#2-instala-git-nodejs-y-docker)
- [3. Obtén el código](#3-obtén-el-código)
- [4. Configura las variables de entorno](#4-configura-las-variables-de-entorno)
- [5. Arranca la base de datos](#5-arranca-la-base-de-datos)
- [6. Instala las dependencias del proyecto](#6-instala-las-dependencias-del-proyecto)
- [7. Crea el esquema de la base de datos y los datos de ejemplo](#7-crea-el-esquema-de-la-base-de-datos-y-los-datos-de-ejemplo)
- [8. Arranca el backend](#8-arranca-el-backend)
- [9. Arranca el frontend](#9-arranca-el-frontend)
- [10. Inicia sesión](#10-inicia-sesión)
- [11. Ejecuta las pruebas automáticas](#11-ejecuta-las-pruebas-automáticas)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Acceder desde otro equipo de tu red local](#acceder-desde-otro-equipo-de-tu-red-local)
- [Más documentación](#más-documentación)
- [Solución de problemas](#solución-de-problemas)

## 1. Requisitos previos

Necesitas una terminal en Ubuntu (o cualquier Linux basado en Debian) con acceso a `sudo`. Todo lo de abajo es un comando por paso, listo para copiar y pegar — nada requiere visitar ninguna web ni hacer clic en "descargar".

## 2. Instala Git, Node.js y Docker

### Git

```bash
sudo apt update
sudo apt install -y git
```

### Node.js (LTS, vía el repositorio oficial de NodeSource)

El proyecto no fija una versión concreta de Node, pero una LTS actual (22.x o superior) funciona bien:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # debería mostrar v22.x.x o superior
npm --version
```

### Docker (script oficial de instalación — la base de datos corre en un contenedor)

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh
```

Añade tu usuario al grupo `docker` para no tener que escribir `sudo` antes de cada comando `docker`, y luego **cierra sesión y vuelve a entrar** (o ejecuta `newgrp docker` en tu terminal actual) para que se aplique:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

Verifica que funciona:

```bash
docker run hello-world
```

## 3. Obtén el código

```bash
git clone https://github.com/LIDR-academy/AI4Devs-frontend-202606-senior-2.git
cd AI4Devs-frontend-202606-senior-2
```

Todos los comandos de aquí en adelante asumen que estás dentro de este directorio `AI4Devs-frontend-202606-senior-2/`, salvo que un paso diga lo contrario.

## 4. Configura las variables de entorno

El proyecto necesita **dos** ficheros `.env` — uno para Docker Compose (raíz) y otro para el propio backend. Ambos ya tienen una plantilla `.env.example` en el repositorio:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Abre `backend/.env` y genera un valor real para `JWT_SECRET` (se usa para firmar las sesiones de login — nunca reutilices el valor de ejemplo, ni siquiera en local):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copia el resultado en `backend/.env`, sustituyendo `JWT_SECRET=changeme`. El resto de valores (`DATABASE_URL`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`) ya funcionan tal cual para desarrollo local — no hace falta cambiarlos salvo que quieras otros distintos (si lo haces, mantén los mismos valores en **ambos** ficheros `.env`, porque Docker Compose y el backend tienen que coincidir en las credenciales de la base de datos).

## 5. Arranca la base de datos

```bash
docker compose up -d
```

Esto arranca un contenedor de PostgreSQL en segundo plano (`-d` = *detached*). Comprueba que está corriendo:

```bash
docker compose ps
```

Para pararlo más adelante: `docker compose down` (tus datos se quedan en disco; añade `-v` solo si quieres borrarlos).

## 6. Instala las dependencias del proyecto

Tres `package.json` distintos, tres instalaciones:

```bash
npm install              # raíz — la suite E2E de Playwright (paso 11) y los hooks de pre-commit (más abajo)
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

`npm install` en la raíz también activa dos comprobaciones automáticas antes de cada commit (Husky, `.husky/pre-commit`): que no se cuele ninguna credencial real en lo que vas a commitear, y que ningún proceso hijo lance `npm` sin una ruta fija (`execFileSync('npm', ...)`, vulnerable a que el sistema operativo lo resuelva por `PATH`) — ambas nacieron de hallazgos reales del *quality gate* de SonarCloud del PR de entrega (`prompts-AGB.md`, sección 3.59). La primera necesita [`gitleaks`](https://github.com/gitleaks/gitleaks) instalado:

```bash
sudo apt install -y gitleaks
```

Si no lo tienes instalado, el commit sigue funcionando igual — el hook solo avisa de que esa comprobación en concreto se ha omitido, no bloquea.

## 7. Crea el esquema de la base de datos y los datos de ejemplo

Desde el directorio `backend/`:

```bash
cd backend
npm run prisma:generate
npx prisma migrate dev
npm run prisma:seed
cd ..
```

- `prisma:generate` construye el cliente de Prisma a partir de `prisma/schema.prisma`.
- `prisma migrate dev` aplica las migraciones ya incluidas en `prisma/migrations/` sobre tu base de datos recién creada.
- `prisma:seed` la rellena con empresas, posiciones y candidatos de ejemplo, además de dos cuentas de empleado con las que iniciar sesión (ver el [paso 10](#10-inicia-sesión)).

## 8. Arranca el backend

En una terminal, desde `backend/`:

```bash
cd backend
npm run dev
```

Esto arranca la API en **http://localhost:3010** con recarga en caliente (`ts-node-dev`). Deja esta terminal abierta.

## 9. Arranca el frontend

En una **segunda** terminal, desde `frontend/`:

```bash
cd frontend
npm run dev
```

Esto arranca la aplicación en **http://localhost:3000**. Deja esta terminal abierta también.

## 10. Inicia sesión

Abre [http://localhost:3000](http://localhost:3000) en tu navegador. Todas las pantallas exigen sesión iniciada — no hay registro público, los empleados se siembran directamente en la base de datos. Usa una de las dos cuentas creadas en el paso 7:

| Email | Contraseña |
| --- | --- |
| `alice.johnson@lti.com` | `Changeme123!` |
| `bob.miller@lti.com` | `Changeme123!` |

Son credenciales solo para desarrollo, escritas directamente en `backend/prisma/seed.ts` — nunca se usan en ningún despliegue real.

## 11. Ejecuta las pruebas automáticas

Tres suites independientes:

```bash
# Tests unitarios/de integración del backend (Jest, base de datos mockeada — no hace falta ningún servidor arrancado)
cd backend && npm test && cd ..

# Tests unitarios del frontend (Vitest)
cd frontend && npm test && cd ..

# Tests end-to-end (Playwright) — necesitan el backend Y el frontend arrancados (pasos 8-9),
# y los propios navegadores de Playwright instalados una vez:
npx playwright install --with-deps chromium
npm run test:e2e
```

La suite E2E pilota un navegador real contra tu aplicación en marcha y cubre autenticación, alta de candidatos, el tablero de proceso de selección, cabeceras de seguridad, accesibilidad, internacionalización, subida de ficheros y más — consulta [`e2e/features/`](./e2e/features/) para ver la lista completa de escenarios en Gherkin, en lenguaje llano.

## Estructura del proyecto

```
.
├── backend/                 API en Express + TypeScript
│   ├── src/
│   │   ├── index.ts          Punto de entrada (configuración del servidor, middlewares, rutas)
│   │   ├── application/      Lógica de aplicación y servicios (los *.test.ts viven junto a su código fuente)
│   │   ├── domain/models/    Modelos de dominio (Candidate, Position, Application...), cada uno con sus propias llamadas a Prisma
│   │   ├── presentation/     Controladores y middlewares (incl. autenticación)
│   │   └── routes/           Definición de rutas de Express
│   ├── prisma/                schema.prisma, migrations/, seed.ts
│   ├── api-spec.yaml           Especificación OpenAPI de cada endpoint
│   ├── ModeloDatos.md           Descripción y diagrama del modelo de datos
│   └── ManifestoBuenasPracticas.md   Convenciones de código del backend
├── frontend/                 Aplicación en React + TypeScript (Vite)
│   └── src/
│       ├── components/        Componentes y pantallas de la interfaz
│       ├── services/          Llamadas al API (axios)
│       ├── context/            Contexto de React (estado de sesión)
│       └── i18n/                Traducciones español/inglés
├── e2e/                      Tests end-to-end con Playwright (BDD, Gherkin)
│   ├── features/               Ficheros *.feature — un escenario = una historia de usuario real
│   └── steps/                   Implementación de los pasos
├── openspec/                 Especificaciones de capacidad de lo que hace el sistema hoy, con trazabilidad a la rama/commit que implementó cada una
├── prompts-AGB.md            Diario de desarrollo: cada rama, prompt y hallazgo de la construcción de este proyecto
└── docker-compose.yml        Definición del contenedor de PostgreSQL
```

## Acceder desde otro equipo de tu red local

Por defecto, todo lo de arriba solo es accesible desde la propia máquina donde corre (`localhost`). Llegar desde otro dispositivo de tu red local (un móvil, un portátil, otro PC) exige cuatro cosas distintas, todas a la vez -- si te dejas alguna, no funciona (o parece que funciona a medias: la página carga, pero la app solo muestra errores):

1. **Cortafuegos** -- abre los dos puertos, acotado a tu propia subred (ajusta `192.168.1.0/24` a la tuya), no a todo internet:
   ```bash
   sudo ufw allow from 192.168.1.0/24 to any port 3000 proto tcp
   sudo ufw allow from 192.168.1.0/24 to any port 3010 proto tcp
   ```
2. **Vite tiene que escuchar en todas las interfaces de red**, no solo en `localhost` -- arranca el servidor de desarrollo con `--host`, o añade `host: true` al bloque `server` de `frontend/vite.config.ts`:
   ```bash
   cd frontend && npx vite --host
   ```
3. **El CORS del backend tiene que permitir el nuevo origen** -- añádelo a `CORS_ORIGINS` en `backend/.env` (separado por comas; deja también `http://localhost:3000` si sigues queriendo usar la app desde el propio servidor), con la IP real de tu red local:
   ```
   CORS_ORIGINS=http://localhost:3000,http://192.168.1.50:3000
   ```
4. **El frontend necesita saber la dirección real del backend** -- define `VITE_API_URL` en `frontend/.env` (mira `frontend/.env.example`) con esa misma IP de tu red local, puerto 3010, y reinicia `npm run dev` para que se recoja:
   ```
   VITE_API_URL=http://192.168.1.50:3010
   ```

Sin el paso 4, la página carga bien en el otro equipo, pero todas las llamadas a la API fallan -- el navegador de ese equipo interpretaría `localhost:3010` como su propio localhost, no el de tu servidor.

Encuentra la IP de tu red local con `ip addr` (normalmente la línea `inet` bajo tu interfaz `eth0`/`wlan0`/`enp*`) -- si tu red usa DHCP, puede cambiar entre reinicios; si algo deja de funcionar que antes iba bien, es lo primero a comprobar. Esta configuración está pensada solo para una red local de confianza -- este backend usa credenciales solo de desarrollo y no está preparado para exponerse a internet.

### Verificar que funciona

Antes de probar desde el navegador del otro equipo, cada pieza se puede comprobar por separado:

```bash
# El cortafuegos está activo y con las reglas esperadas
sudo ufw status verbose

# El proceso escucha de verdad en todas las interfaces (*:3000), no solo en localhost (127.0.0.1:3000)
ss -tlnp | grep -E ':300[0-9]'

# El backend responde desde fuera, sin pasar por el frontend (401 es correcto: llegó, solo pide sesión)
curl -v http://<ip-de-tu-servidor>:3010/candidates/unassigned

# El origen configurado en CORS_ORIGINS es aceptado de verdad
curl -i -X OPTIONS http://<ip-de-tu-servidor>:3010/candidates/unassigned \
  -H "Origin: http://<ip-de-tu-servidor>:3000" -H "Access-Control-Request-Method: GET" \
  | grep -i "access-control-allow-origin"
```

Si arranca más de una instancia de `vite` o de `ts-node-dev` a la vez (p. ej. tras varios reinicios sin parar los anteriores), pueden quedar procesos huérfanos ocupando puertos o consumiendo recursos sin que lo notes. Para verlos y pararlos todos, por nombre de proceso real (no solo el PID que ocupa el puerto, que puede dejar huérfano el resto del árbol de procesos):

```bash
pgrep -af "ts-node-dev"
pgrep -af "node_modules/.bin/vite"

pkill -f "ts-node-dev"
pkill -f "node_modules/.bin/vite"
```

## Más documentación

- [`backend/api-spec.yaml`](./backend/api-spec.yaml) — especificación OpenAPI de cada endpoint del backend.
- [`backend/ModeloDatos.md`](./backend/ModeloDatos.md) — descripción y diagrama del modelo de datos.
- [`backend/ManifestoBuenasPracticas.md`](./backend/ManifestoBuenasPracticas.md) — convenciones de código del backend.
- [`openspec/specs/`](./openspec/specs/) — lo que hace el sistema hoy, capacidad por capacidad, con cada requisito trazado a la rama y el commit que lo implementó.
- [`docs/adr/`](./docs/adr/) — las decisiones de arquitectura reales del proyecto, una por fichero, formato corto (Nygard): qué se decidió, por qué, qué alternativas se rechazaron.
- [`BRANCHES_LOG`](./BRANCHES_LOG) — índice de las 37 ramas de este proyecto, con enlace directo a la sección de `prompts-AGB.md` que documenta cada una.
- [`prompts-AGB.md`](./prompts-AGB.md) — el historial de desarrollo completo de este proyecto: cada rama, el razonamiento detrás y los fallos reales encontrados y corregidos por el camino.

## Solución de problemas

**`docker compose up -d` falla con un error de permisos** — probablemente no has vuelto a iniciar sesión después del `usermod -aG docker` del paso 2. Ejecuta `newgrp docker` o abre una terminal nueva.

**El backend no puede conectar con la base de datos** — comprueba que `docker compose ps` muestra el contenedor `db` como `Up`, y que el `DATABASE_URL` de `backend/.env` coincide con las credenciales del `.env` de la raíz (mismo usuario/contraseña/nombre de base de datos/puerto).

**El puerto 3000 o 3010 ya está en uso** — algo más en tu máquina está usando ese puerto. Encuéntralo y detenlo (`sudo lsof -i :3000`), o ten en cuenta que el puerto del frontend está fijado en `frontend/vite.config.ts` para coincidir con el origen de CORS por defecto del backend (`http://localhost:3000`, ver `backend/src/corsOptions.ts` y `CORS_ORIGINS` en `backend/.env`), así que cambiarlo exige actualizar los dos.

**`npx prisma migrate dev` pide reiniciar la base de datos** — esto solo pasa si tu base de datos local ya tiene datos en conflicto de una configuración previa distinta. En una base de datos recién creada con `docker compose` esto no debería ocurrir; si ocurre y no te importa perder los datos locales, confirma el reinicio.