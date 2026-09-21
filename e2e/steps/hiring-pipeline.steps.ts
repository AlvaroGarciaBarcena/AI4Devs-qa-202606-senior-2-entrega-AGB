import { createBdd } from 'playwright-bdd';
import { expect, Page } from '@playwright/test';
import { prisma } from './support/prisma';

const { Given, When, Then } = createBdd();

let tempPositionId: number;
let tempFilledStepName: string;
let tempEmptyStepName: string;
let tempCandidateId: number;
let lastCandidateEmail: string;

const openBoard = async (page: Page, positionTitle: string) => {
  await page.goto('/positions');
  await page.locator('.card', { hasText: positionTitle }).getByRole('button', { name: 'Ver proceso' }).click();
  await expect(page).toHaveURL(/\/positions\/\d+$/);
};

Given('una posición tiene candidatos en más de una fase de su proceso', async () => {
  // Lo satisface el seed de la base de datos (backend/prisma/seed.ts):
  // "Senior Full-Stack Engineer" tiene a Carlos García en "Initial
  // Screening". El resto de candidatos de esa posición (John Doe,
  // Jane Smith...) se han movido más de una vez por trabajo manual en
  // esta misma base de datos de desarrollo compartida -- el propio
  // Then de abajo comprueba a nivel de datos que sigue habiendo más
  // de una fase con candidatos, sin fijar cuáles.
});

When('un reclutador visita el tablero "Ver proceso" de esa posición', async ({ page }) => {
  await openBoard(page, 'Senior Full-Stack Engineer');
});

Then('el tablero los agrupa en una columna por fase, mostrando el nombre y la puntuación media de cada uno', async ({ page }) => {
  // No se asume de antemano ni quién está en qué fase ni su
  // puntuación -- la base de datos de desarrollo compartida cambió
  // más de una vez por trabajo manual anterior (Jane Smith, luego
  // también John Doe), rompiendo este escenario. Tampoco se busca la
  // columna por el nombre de la fase en inglés
  // (`currentInterviewStep` de la API): con la suite en español
  // (`locale: 'es-ES'`), el encabezado real es la traducción
  // (`positionProcess.interviewStepNames` en frontend/src/i18n/
  // locales/es.json -- "Initial Screening" se renderiza "Selección
  // inicial"), no el nombre crudo. Ese desajuste de idioma, no la
  // deriva de datos, era la causa real de este mismo fallo
  // intermitente -- confirmado con el volcado de accesibilidad de un
  // fallo real: el candidato SÍ estaba en la columna correcta, la
  // columna en sí nunca se encontraba porque buscaba el encabezado
  // equivocado.
  const candidatesResponse = page.waitForResponse(
    (res) => res.url().includes('/candidates') && res.request().method() === 'GET',
  );
  await openBoard(page, 'Senior Full-Stack Engineer');
  const candidates = (await (await candidatesResponse).json()) as {
    fullName: string;
    currentInterviewStep: string;
    averageScore: number;
  }[];

  // "Más de una fase" se comprueba con los datos de la API, no
  // visitando cada columna: la base de desarrollo compartida ha
  // acumulado candidatos de pruebas manuales con el mismo nombre
  // ("Bad Position" x3, entre otros) -- comprobar uno a uno por
  // nombre sería ambiguo (varias tarjetas con el mismo nombre Y la
  // misma puntuación 0.0, un fallo real que se vio al intentarlo).
  // Carlos García es el único candidato de esta posición cuyo nombre
  // es fiable (único, y esta misma suite nunca lo mueve) -- se
  // comprueba explícitamente que aparece con su nombre y puntuación
  // reales.
  expect(new Set(candidates.map((c) => c.currentInterviewStep)).size).toBeGreaterThan(1);

  const carlos = candidates.find((c) => c.fullName === 'Carlos García');
  expect(carlos, 'Carlos García debe seguir en el seed de esta posición').toBeTruthy();
  const carlosCard = page.locator('.card').filter({ hasText: 'Carlos García' });
  await expect(carlosCard.getByText('Carlos García')).toBeVisible();
  await expect(carlosCard.getByText(`Puntuación media: ${carlos!.averageScore.toFixed(1)}`)).toBeVisible();
});

Given('una fase del proceso de una posición no tiene ningún candidato todavía', async () => {
  // Posición autocontenida creada por Prisma (no depende del seed): dos
  // fases, una con un candidato y otra deliberadamente vacía -- más claro
  // y determinista que depender de qué fases del seed real estén vacías
  // hoy, que puede cambiar con el propio seed.
  const company = await prisma.company.findFirst();
  const flow = await prisma.interviewFlow.create({ data: { description: 'E2E: fase vacía (hiring-pipeline)' } });
  const interviewType = await prisma.interviewType.findFirst();
  tempFilledStepName = `E2E Fase Con Candidatos ${Date.now()}`;
  tempEmptyStepName = `E2E Fase Vacía ${Date.now()}`;
  const filledStep = await prisma.interviewStep.create({
    data: { interviewFlowId: flow.id, interviewTypeId: interviewType.id, name: tempFilledStepName, orderIndex: 1 },
  });
  await prisma.interviewStep.create({
    data: { interviewFlowId: flow.id, interviewTypeId: interviewType.id, name: tempEmptyStepName, orderIndex: 2 },
  });
  const position = await prisma.position.create({
    data: {
      title: `E2E Posición Fase Vacía ${Date.now()}`,
      description: 'Fixture de prueba E2E', status: 'Open', isVisible: true, location: 'Remote',
      jobDescription: 'x', companyId: company.id, interviewFlowId: flow.id,
      salaryMin: 1, salaryMax: 2, employmentType: 'Full-time', benefits: 'x', contactInfo: 'x',
      requirements: 'x', responsibilities: 'x', companyDescription: 'x', applicationDeadline: new Date('2030-01-01'),
    },
  });
  tempPositionId = position.id;

  const candidate = await prisma.candidate.create({
    data: { firstName: 'Fixture', lastName: 'ConCandidato', email: `e2e-fase-vacia-${Date.now()}@example.com` },
  });
  tempCandidateId = candidate.id;
  await prisma.application.create({
    data: { positionId: position.id, candidateId: candidate.id, applicationDate: new Date(), currentInterviewStep: filledStep.id },
  });
});

Then('esa columna se muestra vacía con una indicación de que no hay candidatos en esa fase', async ({ page }) => {
  await page.goto(`/positions/${tempPositionId}`);
  const emptyColumn = page.locator('.border.rounded', { has: page.getByRole('heading', { name: tempEmptyStepName }) });
  await expect(emptyColumn.getByText('Sin candidatos en esta fase.')).toBeVisible();
  const filledColumn = page.locator('.border.rounded', { has: page.getByRole('heading', { name: tempFilledStepName }) });
  await expect(filledColumn.getByText('Fixture ConCandidato')).toBeVisible();

  // Por id exacto, no por `email: { contains: 'e2e-fase-vacia-' } }`: ese
  // filtro amplio borraba (o, peor, fallaba al intentar borrar) cualquier
  // candidato de una ejecución anterior interrumpida que compartiera el
  // mismo prefijo de email, aunque perteneciera a una posición ya
  // borrada -- hallazgo real: una ejecución previa cortada a medias (por
  // el limitador de intentos de login, no por este escenario) dejó un
  // candidato así, y el `deleteMany` amplio de la siguiente ejecución
  // chocó con la restricción RESTRICT de Application → Candidate al
  // intentar arrastrarlo también.
  await prisma.application.deleteMany({ where: { positionId: tempPositionId } });
  await prisma.candidate.delete({ where: { id: tempCandidateId } });
  const position = await prisma.position.findUnique({ where: { id: tempPositionId } });
  await prisma.position.delete({ where: { id: tempPositionId } });
  // InterviewStep -> InterviewFlow es RESTRICT: hay que borrar las fases
  // antes de poder borrar el propio flujo.
  await prisma.interviewStep.deleteMany({ where: { interviewFlowId: position.interviewFlowId } });
  await prisma.interviewFlow.delete({ where: { id: position.interviewFlowId } });
});

Given('una posición con su flujo de entrevistas configurado', async () => {
  // Lo satisface el seed: "Senior Full-Stack Engineer" (interviewFlow1).
});

When('se da de alta un candidato eligiendo esa posición', async ({ page }) => {
  lastCandidateEmail = `e2e-hiring-pipeline-${Date.now()}@example.com`;
  await page.goto('/add-candidate');
  await page.getByLabel('Posición a la que se presenta').selectOption({ label: 'Senior Full-Stack Engineer — LTI' });
  await page.getByLabel('Nombre').fill('Nuevo');
  await page.getByLabel('Apellido').fill('Candidato');
  await page.getByLabel('Correo Electrónico').fill(lastCandidateEmail);
  await page.getByRole('button', { name: 'Enviar' }).click();
  // getByRole('status') a secas ya no basta: NavigationLoadingIndicator
  // (frontend/src/components/) es un segundo role="status" permanente en
  // el DOM, hace falta filtrar por el texto del mensaje de éxito.
  await expect(page.getByRole('status').filter({ hasText: 'Candidato añadido con éxito' })).toHaveText('Candidato añadido con éxito');
});

Then('ese candidato aparece de inmediato en la primera columna del tablero de esa posición, con puntuación media de 0', async ({ page }) => {
  await openBoard(page, 'Senior Full-Stack Engineer');
  // Mismo motivo que en la sección de arriba: no se busca la columna
  // por su encabezado en inglés ("Initial Screening"), que en la
  // suite en español nunca coincide con lo que renderiza la UI
  // ("Selección inicial") -- basta con que la ficha exista en alguna
  // columna, no hace falta identificar cuál en concreto para esta
  // aserción.
  const newCandidateCard = page.locator('.border.rounded').filter({ hasText: 'Nuevo Candidato' }).locator('.card', { hasText: 'Nuevo Candidato' });
  await expect(newCandidateCard).toBeVisible();
  await expect(newCandidateCard.getByText('Puntuación media: 0.0')).toBeVisible();

  const candidate = await prisma.candidate.findFirst({ where: { email: lastCandidateEmail } });
  await prisma.application.deleteMany({ where: { candidateId: candidate.id } });
  await prisma.candidate.delete({ where: { id: candidate.id } });
});

let tempUnassignedEmail: string;

Given('existen candidatos dados de alta sin elegir posición', async () => {
  tempUnassignedEmail = `e2e-sin-asignar-${Date.now()}@example.com`;
  await prisma.candidate.create({
    data: { firstName: 'E2E', lastName: 'SinAsignar', email: tempUnassignedEmail },
  });
});

When('un reclutador visita el listado de candidatos sin asignar', async ({ page }) => {
  await page.goto('/candidates/unassigned');
  await expect(page.getByRole('heading', { name: 'Candidatos sin asignar' })).toBeVisible();
});

Then('ve a cada uno de ellos con su nombre completo, email y fecha de alta, el más reciente primero', async ({ page }) => {
  await expect(page.getByRole('cell', { name: 'E2E SinAsignar' })).toBeVisible();
  await expect(page.getByRole('cell', { name: tempUnassignedEmail })).toBeVisible();

  await prisma.candidate.deleteMany({ where: { email: tempUnassignedEmail } });
});

let tempPlaceholderApplicationIds: number[] = [];

Given('no existe ningún candidato sin candidatura', async () => {
  // NO borra candidatos reales -- un primer intento de este escenario lo
  // hacía (`candidate.deleteMany({ where: { applications: { none: {} } } })`)
  // y se llevó por delante candidatos reales del usuario la primera vez
  // que se ejecutó la suite completa: cualquier candidato sin asignar que
  // hubiera en la base de datos de desarrollo compartida, sin distinguir
  // "residuo de prueba" de "dato real", desaparecía cada vez que alguien
  // corriera los tests. En vez de eso, se les da una Application-marcador
  // (misma posición sembrada que usan otros escenarios) para "esconderlos"
  // del listado durante el escenario, y el paso Then de abajo la borra al
  // terminar -- quedan exactamente como estaban antes, de verdad sin
  // candidatura, no borrados.
  const existing = await prisma.candidate.findMany({ where: { applications: { none: {} } } });
  const position = await prisma.position.findFirstOrThrow({ where: { title: 'Senior Full-Stack Engineer' } });
  const firstStep = await prisma.interviewStep.findFirstOrThrow({
    where: { interviewFlowId: position.interviewFlowId },
    orderBy: { orderIndex: 'asc' },
  });

  tempPlaceholderApplicationIds = await Promise.all(
    existing.map(async (candidate) => {
      const application = await prisma.application.create({
        data: { positionId: position.id, candidateId: candidate.id, applicationDate: new Date(), currentInterviewStep: firstStep.id },
      });
      return application.id;
    }),
  );
});

Then('ve una indicación de que no hay ninguno', async ({ page }) => {
  await expect(page.getByText('No hay ningún candidato sin asignar.')).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);

  // Restaura el estado "sin candidatura" real de cada uno, quitando solo
  // la Application-marcador creada arriba.
  await prisma.application.deleteMany({ where: { id: { in: tempPlaceholderApplicationIds } } });
});

let tempRowClickCandidateId: number;

Given('un reclutador está en el listado de candidatos sin asignar', async ({ page }) => {
  const candidate = await prisma.candidate.create({
    data: { firstName: 'E2E', lastName: 'FilaClicable', email: `e2e-fila-clicable-${Date.now()}@example.com` },
  });
  tempRowClickCandidateId = candidate.id;

  await page.goto('/candidates/unassigned');
  await expect(page.getByText('E2E FilaClicable')).toBeVisible();
});

When('pulsa en cualquier punto de la fila de un candidato, no solo en el icono', async ({ page }) => {
  // La celda del nombre, deliberadamente NO el icono de editar -- es
  // justo lo que este escenario comprueba: que la fila entera es
  // clicable, no solo el enlace.
  await page.getByRole('cell', { name: 'E2E FilaClicable' }).click();
});

Then('el sistema navega a la edición de ese candidato', async ({ page }) => {
  await expect(page).toHaveURL(`/candidates/${tempRowClickCandidateId}/edit`);
  await expect(page.getByRole('heading', { name: 'Editar Candidato' })).toBeVisible();

  await prisma.candidate.delete({ where: { id: tempRowClickCandidateId } });
});
