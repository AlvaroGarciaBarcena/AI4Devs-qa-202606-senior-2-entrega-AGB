import path from 'node:path';
import { execSync } from 'node:child_process';
import { chromium, FullConfig } from '@playwright/test';
import { SEEDED_EMPLOYEE } from './steps/support/seededEmployee';

export const AUTH_STATE_PATH = path.resolve(__dirname, '.auth/state.json');

const BACKEND_URL = process.env.E2E_BACKEND_URL ?? 'http://localhost:3010';

type HealthResponse = { git: { commit: string; branch: string } | null };

// Hallazgo real (prompts-AGB.md, sección 3.65): más de una vez, el
// backend que respondía en el puerto esperado resultó ser el de otro
// repo/rama -- mismo puerto, mismo aspecto, código distinto, sin
// ningún aviso, y la suite entera dio un diagnóstico equivocado por
// ello. Se comprueba contra backend/src/index.ts (`GET /health`) antes
// de tocar nada más, para fallar aquí, con un mensaje claro, en vez de
// dejar que fallen escenarios sueltos difíciles de explicar.
const verifyBackendCommit = async () => {
  const localCommit = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();

  let health: HealthResponse;
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    health = (await response.json()) as HealthResponse;
  } catch (error) {
    throw new Error(
      `No se pudo comprobar ${BACKEND_URL}/health -- ¿está arrancado el backend? (${(error as Error).message})`,
    );
  }

  if (!health.git) {
    console.warn(`Aviso: ${BACKEND_URL}/health no devolvió información de git (¿entorno sin repo accesible?) -- se continúa sin comprobar la rama.`);
    return;
  }

  if (health.git.commit !== localCommit) {
    throw new Error(
      `El backend en ${BACKEND_URL} está sirviendo el commit ${health.git.commit.slice(0, 7)} ` +
      `(rama ${health.git.branch}), no el de este repo (${localCommit.slice(0, 7)}). ` +
      `¿Hay un backend de otra rama u otro repo arrancado en el mismo puerto?`,
    );
  }
};

// Un único login real por ejecución de la suite, en vez de uno por
// escenario -- con muchos escenarios necesitando sesión (candidate-intake,
// position-catalog, hiring-pipeline...), repetir el login real de verdad
// en cada uno agota el limitador de /auth/login (10/15min) a mitad de
// suite (confirmado: 10 escenarios de candidate-intake por sí solos ya lo
// dejaban en el límite). El login en sí ya lo cubren a fondo los
// escenarios de authentication.feature; el resto de capacidades solo
// necesita partir de una sesión válida, no volver a probar el login.
export default async function globalSetup(config: FullConfig) {
  await verifyBackendCommit();

  const baseURL = (config.projects[0].use.baseURL as string) ?? 'http://localhost:3000';
  const browser = await chromium.launch();
  const page = await browser.newPage({ locale: 'es-ES' });

  await page.goto(`${baseURL}/login`);
  await page.getByLabel('Correo electrónico').fill(SEEDED_EMPLOYEE.email);
  await page.getByLabel('Contraseña').fill(SEEDED_EMPLOYEE.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(`${baseURL}/`);

  await page.context().storageState({ path: AUTH_STATE_PATH });
  await browser.close();
}
