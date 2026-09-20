# LTI - Talent Tracking System

A full-stack recruiting/ATS application: a React + TypeScript frontend (built with [Vite](https://vite.dev)) and an Express + TypeScript backend, using [Prisma](https://www.prisma.io) as the ORM over PostgreSQL.

> 🇪🇸 ¿Buscas la versión en español? Lee [README-ES.md](./README-ES.md).

This guide assumes a fresh **Ubuntu** machine with nothing installed yet. If you already have git, Node.js and Docker set up, skip straight to [Get the code](#3-get-the-code).

> ✅ **Verified end-to-end on 2026-09-20**: these steps, exactly as written, were followed one by one against a fresh clone of the repository (no `.env` files, no prior data) and ended in a real login with the credentials from [step 10](#10-log-in). No extra knowledge or files beyond what's documented here are needed.

## Contents

- [1. Prerequisites](#1-prerequisites)
- [2. Install Git, Node.js and Docker](#2-install-git-nodejs-and-docker)
- [3. Get the code](#3-get-the-code)
- [4. Configure environment variables](#4-configure-environment-variables)
- [5. Start the database](#5-start-the-database)
- [6. Install project dependencies](#6-install-project-dependencies)
- [7. Create the database schema and seed data](#7-create-the-database-schema-and-seed-data)
- [8. Run the backend](#8-run-the-backend)
- [9. Run the frontend](#9-run-the-frontend)
- [10. Log in](#10-log-in)
- [11. Run the automated tests](#11-run-the-automated-tests)
- [Project structure](#project-structure)
- [Accessing from another machine on your network](#accessing-from-another-machine-on-your-network)
- [Further documentation](#further-documentation)
- [Troubleshooting](#troubleshooting)

## 1. Prerequisites

You need a terminal on Ubuntu (or another Debian-based Linux) with `sudo` access. Everything below is a single copy-pasteable command per step — nothing requires visiting a website or clicking "download".

## 2. Install Git, Node.js and Docker

### Git

```bash
sudo apt update
sudo apt install -y git
```

### Node.js (LTS, via the official NodeSource repository)

The project doesn't pin a specific Node version, but a current LTS (22.x or newer) works well:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # should print v22.x.x or newer
npm --version
```

### Docker (official install script — the database runs in a container)

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh
```

Add your user to the `docker` group so you don't have to type `sudo` before every `docker` command, then **log out and back in** (or run `newgrp docker` in your current terminal) for it to take effect:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

Verify it works:

```bash
docker run hello-world
```

## 3. Get the code

```bash
git clone https://github.com/LIDR-academy/AI4Devs-frontend-202606-senior-2.git
cd AI4Devs-frontend-202606-senior-2
```

Every command from here on assumes you're inside this `AI4Devs-frontend-202606-senior-2/` directory unless a step says otherwise.

## 4. Configure environment variables

The project needs **two** `.env` files — one for Docker Compose (root) and one for the backend app itself. Both have a `.env.example` template already in the repo:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Open `backend/.env` and generate a real value for `JWT_SECRET` (used to sign login sessions — never reuse the placeholder, even for local development):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy the output into `backend/.env`, replacing `JWT_SECRET=changeme`. The other values (`DATABASE_URL`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`) already work out of the box for local development — no need to change them unless you know you want different ones (if you do, keep the same values in **both** `.env` files, since Docker Compose and the backend need to agree on the database credentials).

## 5. Start the database

```bash
docker compose up -d
```

This starts a PostgreSQL container in the background (`-d` = detached). Check it's running:

```bash
docker compose ps
```

To stop it later: `docker compose down` (your data stays on disk; add `-v` only if you want to wipe it).

## 6. Install project dependencies

Three separate `package.json` files, three installs:

```bash
npm install              # root — the Playwright E2E suite (step 11) and the pre-commit hooks (below)
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

`npm install` at the root also enables two automatic pre-commit checks (Husky, `.husky/pre-commit`): that no real credential sneaks into what you're about to commit, and that no child process launches `npm` without a fixed path (`execFileSync('npm', ...)`, vulnerable to the OS resolving it via `PATH`) — both came from real findings on the delivery PR's SonarCloud quality gate (`prompts-AGB.md`, section 3.59). The first one needs [`gitleaks`](https://github.com/gitleaks/gitleaks) installed:

```bash
sudo apt install -y gitleaks
```

If you don't have it installed, commits still go through — the hook just warns that this particular check was skipped, it doesn't block.

## 7. Create the database schema and seed data

From the `backend/` directory:

```bash
cd backend
npm run prisma:generate
npx prisma migrate dev
npm run prisma:seed
cd ..
```

- `prisma:generate` builds the Prisma client from `prisma/schema.prisma`.
- `prisma migrate dev` applies the migrations already committed in `prisma/migrations/` to your fresh database.
- `prisma:seed` populates it with example companies, positions, candidates and two employee accounts you can log in with (see [step 10](#10-log-in)).

## 8. Run the backend

In one terminal, from `backend/`:

```bash
cd backend
npm run dev
```

This starts the API at **http://localhost:3010** with hot reload (`ts-node-dev`). Leave this terminal running.

## 9. Run the frontend

In a **second** terminal, from `frontend/`:

```bash
cd frontend
npm run dev
```

This starts the app at **http://localhost:3000**. Leave this terminal running too.

## 10. Log in

Open [http://localhost:3000](http://localhost:3000) in your browser. Every screen requires a session — there's no public sign-up, employees are seeded directly into the database. Use one of the two accounts created in step 7:

| Email | Password |
| --- | --- |
| `alice.johnson@lti.com` | `Changeme123!` |
| `bob.miller@lti.com` | `Changeme123!` |

These are development-only credentials, hardcoded in `backend/prisma/seed.ts` — never used in any real deployment.

## 11. Run the automated tests

Three independent suites:

```bash
# Backend unit/integration tests (Jest, mocked database — no server needs to be running)
cd backend && npm test && cd ..

# Frontend unit tests (Vitest)
cd frontend && npm test && cd ..

# End-to-end tests (Playwright) — needs backend AND frontend running (steps 8-9),
# and Playwright's own browser binaries installed once:
npx playwright install --with-deps chromium
npm run test:e2e
```

The E2E suite drives a real browser against your running app and covers authentication, candidate intake, the hiring pipeline, security headers, accessibility, internationalization, file uploads and more — see [`e2e/features/`](./e2e/features/) for the full list of scenarios in plain-language Gherkin.

## Project structure

```
.
├── backend/                 Express + TypeScript API
│   ├── src/
│   │   ├── index.ts          Entry point (server setup, middleware, routes)
│   │   ├── application/      Application/business logic and services (*.test.ts files live next to their source)
│   │   ├── domain/models/    Domain models (Candidate, Position, Application...), each owning its own Prisma calls
│   │   ├── presentation/     Controllers and middleware (incl. auth)
│   │   └── routes/           Express route definitions
│   ├── prisma/                schema.prisma, migrations/, seed.ts
│   ├── api-spec.yaml           OpenAPI spec for every endpoint
│   ├── ModeloDatos.md           Data model description and diagram
│   └── ManifestoBuenasPracticas.md   Backend coding conventions
├── frontend/                 React + TypeScript app (Vite)
│   └── src/
│       ├── components/        UI components and pages
│       ├── services/          API client calls (axios)
│       ├── context/            React context (auth state)
│       └── i18n/                Spanish/English translations
├── e2e/                      Playwright end-to-end tests (BDD, Gherkin)
│   ├── features/               *.feature files — one scenario = one real user story
│   └── steps/                   Step implementations
├── openspec/                 Capability specs describing what the system does today, with traceability to the branch/commit that implemented each one
├── entrega-frontend-AGB/     Development journal for the first exercise (Lesson 11): every branch, prompt and finding
└── docker-compose.yml        PostgreSQL container definition
```

## Accessing from another machine on your network

By default everything above is reachable only from the machine running it (`localhost`). Reaching it from another device on your local network — a phone, a laptop, another PC — needs four separate things, all of them together; skipping one leaves it not working (or looking like it half-works: the page loads but the app shows only errors):

1. **Firewall** — open the two ports, scoped to your own subnet (adjust `192.168.1.0/24` to yours), not to the whole internet:
   ```bash
   sudo ufw allow from 192.168.1.0/24 to any port 3000 proto tcp
   sudo ufw allow from 192.168.1.0/24 to any port 3010 proto tcp
   ```
2. **Vite must listen on every network interface**, not just `localhost` — run the dev server with `--host`, or add `host: true` to `frontend/vite.config.ts`'s `server` block:
   ```bash
   cd frontend && npx vite --host
   ```
3. **Backend CORS must allow the new origin** — add it to `CORS_ORIGINS` in `backend/.env` (comma-separated; keep `http://localhost:3000` too if you still want to use the app from the server itself), using the server's real LAN IP:
   ```
   CORS_ORIGINS=http://localhost:3000,http://192.168.1.50:3000
   ```
4. **The frontend needs to know the backend's real address** — set `VITE_API_URL` in `frontend/.env` (see `frontend/.env.example`) to that same LAN IP, port 3010, and restart `npm run dev` for it to take effect:
   ```
   VITE_API_URL=http://192.168.1.50:3010
   ```

Without step 4, the page loads fine on the other device, but every API call fails — that device's browser would otherwise resolve `localhost:3010` to *its own* localhost, not your server's.

Find your machine's LAN IP with `ip addr` (usually the `inet` line under your `eth0`/`wlan0`/`enp*` interface) — if your network uses DHCP, it can change across reboots; that's the first thing to check if something that used to work stops working. This setup is meant for a trusted local network only — this backend uses development-only credentials and isn't hardened for exposure to the public internet.

### Verifying it works

Before testing from the other device's browser, each piece can be checked on its own:

```bash
# The firewall is active and has the expected rules
sudo ufw status verbose

# The process really listens on every interface (*:3000), not just localhost (127.0.0.1:3000)
ss -tlnp | grep -E ':300[0-9]'

# The backend responds from outside, without going through the frontend (401 is correct: it was reached, it just wants a session)
curl -v http://<your-server-ip>:3010/candidates/unassigned

# The origin configured in CORS_ORIGINS is genuinely accepted
curl -i -X OPTIONS http://<your-server-ip>:3010/candidates/unassigned \
  -H "Origin: http://<your-server-ip>:3000" -H "Access-Control-Request-Method: GET" \
  | grep -i "access-control-allow-origin"
```

If more than one `vite` or `ts-node-dev` instance ends up running at once (e.g. after restarting a few times without stopping the previous one), orphaned processes can end up holding ports or eating resources without you noticing. To see and stop all of them, by real process name (not just the PID holding the port, which can leave the rest of its process tree orphaned):

```bash
pgrep -af "ts-node-dev"
pgrep -af "node_modules/.bin/vite"

pkill -f "ts-node-dev"
pkill -f "node_modules/.bin/vite"
```

## Further documentation

- [`backend/api-spec.yaml`](./backend/api-spec.yaml) — OpenAPI specification of every backend endpoint.
- [`backend/ModeloDatos.md`](./backend/ModeloDatos.md) — data model description and diagram.
- [`backend/ManifestoBuenasPracticas.md`](./backend/ManifestoBuenasPracticas.md) — backend coding conventions.
- [`openspec/specs/`](./openspec/specs/) — what the system does today, capability by capability, each requirement traced to the branch and commit that implemented it.
- [`docs/adr/`](./docs/adr/) — this project's real architecture decisions, one per file, short Nygard format: what was decided, why, and which alternatives were rejected.
- [`entrega-frontend-AGB/BRANCHES_LOG`](./entrega-frontend-AGB/BRANCHES_LOG) — index of the first exercise's (Lesson 11) 36 branches, each linked directly to the `prompts-AGB.md` section that documents it.
- [`entrega-frontend-AGB/prompts-AGB.md`](./entrega-frontend-AGB/prompts-AGB.md) — the full development history of that first exercise: every branch, the reasoning behind it, and real bugs found and fixed along the way. (The second exercise, QA/Playwright, has its own journal under [`entrega-qa-AGB/`](./entrega-qa-AGB/).)

## Troubleshooting

**`docker compose up -d` fails with a permission error** — you likely haven't re-logged in after step 2's `usermod -aG docker`. Run `newgrp docker` or open a new terminal.

**Backend can't connect to the database** — make sure `docker compose ps` shows the `db` container as `Up`, and that `backend/.env`'s `DATABASE_URL` matches the credentials in the root `.env` (same user/password/db name/port).

**Port 3000 or 3010 already in use** — something else on your machine is using that port. Find and stop it (`sudo lsof -i :3000`), or note that the frontend's port is hardcoded in `frontend/vite.config.ts` to match the backend's default CORS origin (`http://localhost:3000`, see `backend/src/corsOptions.ts` and `CORS_ORIGINS` in `backend/.env`), so changing it requires updating both.

**`npx prisma migrate dev` asks to reset the database** — this only happens if your local database already has conflicting data from a previous, different setup. On a genuinely fresh `docker compose` database this shouldn't happen; if it does and you don't mind losing local data, confirm the reset.