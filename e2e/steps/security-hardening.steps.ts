import path from 'node:path';
import { createBdd } from 'playwright-bdd';
import { expect, APIResponse } from '@playwright/test';
import { SEEDED_EMPLOYEE } from './support/seededEmployee';
import { runNpm } from './support/npmChildProcess';

const { Given, When, Then } = createBdd();

const API_URL = 'http://localhost:3010';
const REPO_ROOT = path.resolve(__dirname, '../..');

let responses: APIResponse[] = [];
let authToken: string;
let auditedVulnerabilityCounts: Record<string, number>;

type NpmAuditReport = { metadata: { vulnerabilities: { total: number } } };

const runNpmAuditProductionVulnerabilityCount = (cwd: string): number => {
  // npm audit termina con código de salida != 0 en cuanto encuentra alguna
  // vulnerabilidad -- por eso no se puede usar el helper habitual que
  // lanza si el proceso falla, hay que capturar la salida igualmente y
  // leer el JSON para decidir qué significa ese fallo.
  try {
    const output = runNpm(['audit', '--omit=dev', '--json'], cwd);
    return (JSON.parse(output) as NpmAuditReport).metadata.vulnerabilities.total;
  } catch (error) {
    const output = (error as { stdout?: string }).stdout;
    if (!output) throw error;
    return (JSON.parse(output) as NpmAuditReport).metadata.vulnerabilities.total;
  }
};

Given('la API está en marcha', async ({ request }) => {
  // GET /health (backend/src/index.ts) -- sin efectos secundarios ni
  // autenticación, pensada justo para esto. Antes se usaba un login
  // deliberadamente fallido (sin ruta de health-check dedicada en aquel
  // momento); ese literal de contraseña de mentira ya no hace falta.
  const response = await request.get(`${API_URL}/health`);
  expect(response.status()).toBeLessThan(500);
});

When('se realiza una petición que tiene éxito y otra que falla', async ({ request }) => {
  responses = [
    await request.post(`${API_URL}/auth/login`, {
      data: { email: SEEDED_EMPLOYEE.email, password: SEEDED_EMPLOYEE.password },
    }),
    await request.get(`${API_URL}/position`),
  ];
});

Then('ambas respuestas incluyen las cabeceras de seguridad estándar', async () => {
  expect(responses).toHaveLength(2);
  const [success, failure] = responses;
  expect(success.status()).toBe(200);
  expect(failure.status()).toBe(401);
  for (const response of responses) {
    const headers = response.headers();
    // helmet() por defecto -- nosniff es la que más importa aquí: sin ella,
    // un navegador podría intentar reinterpretar la respuesta JSON como
    // otro tipo de contenido.
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBeTruthy();
  }
});

Given('un origen no ha superado el límite de peticiones configurado en los últimos 15 minutos', async () => {
  // Nada que preparar: el propio worker de Playwright, en serie
  // (playwright.config.ts), no ha hecho peticiones previas a este
  // escenario que se acerquen al límite de 300/15min.
});

When('ese origen realiza un uso normal de la API', async ({ request }) => {
  responses = [];
  for (let i = 0; i < 5; i += 1) {
    responses.push(await request.get(`${API_URL}/position`));
  }
});

Then('ninguna de sus peticiones se ve afectada por el límite', async () => {
  for (const response of responses) {
    expect(response.status()).not.toBe(429);
  }
});

Given('un fichero cuyo contenido real no coincide con el tipo que declara al subirlo', async ({ request }) => {
  const loginResponse = await request.post(`${API_URL}/auth/login`, {
    data: { email: SEEDED_EMPLOYEE.email, password: SEEDED_EMPLOYEE.password },
  });
  authToken = (await loginResponse.json()).token;
});

When('se sube ese fichero', async ({ request }) => {
  responses = [
    await request.post(`${API_URL}/upload`, {
      headers: { Authorization: `Bearer ${authToken}` },
      multipart: {
        file: {
          name: 'cv-falso.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('esto no es un PDF de verdad, es texto plano'),
        },
      },
    }),
  ];
});

Then('el sistema lo rechaza en vez de tratarlo como de confianza solo por la extensión o el tipo declarado', async () => {
  expect(responses[0].status()).toBe(400);
});

Given('las dependencias de producción del backend y del frontend en su versión actual', async () => {
  // Nada que preparar: las dependencias ya instaladas (node_modules) son
  // las que se auditan en el WHEN, las mismas que se desplegarían.
});

When('se ejecuta una auditoría de vulnerabilidades sobre ellas', async () => {
  auditedVulnerabilityCounts = {
    backend: runNpmAuditProductionVulnerabilityCount(path.join(REPO_ROOT, 'backend')),
    frontend: runNpmAuditProductionVulnerabilityCount(path.join(REPO_ROOT, 'frontend')),
  };
});

Then('no se reporta ninguna vulnerabilidad en las dependencias que se despliegan a producción', async () => {
  expect(auditedVulnerabilityCounts).toEqual({ backend: 0, frontend: 0 });
});
