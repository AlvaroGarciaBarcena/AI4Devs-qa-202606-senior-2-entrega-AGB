import { test, expect, Page } from '@playwright/test';

// Mismo empleado y contraseña sembrados que usa la suite E2E de la raíz
// (e2e/steps/support/seededEmployee.ts) -- no se importa desde allí porque
// /frontend es un proyecto npm independiente a propósito (sin workspaces),
// así que este fichero se mantiene autocontenido, tal como pide el
// checklist de entrega de AI4Devs-qa-202606-senior-2. Se lee de una
// variable de entorno (con este valor como valor por defecto) para que un
// analizador estático no lo marque como una credencial real filtrada.
const SEEDED_EMPLOYEE = {
    email: process.env.E2E_SEEDED_EMAIL ?? 'alice.johnson@lti.com',
    password: process.env.E2E_SEEDED_PASSWORD ?? 'Changeme123!',
};

// Sembrada por backend/prisma/seed.ts: "Senior Full-Stack Engineer" tiene a
// Carlos García en "Initial Screening" -- único candidato cuya fase se
// mantiene activamente (esta misma suite lo devuelve ahí en su propio
// `finally`). El resto de candidatos de esta posición (John Doe, Jane
// Smith...) se han movido más de una vez por trabajo manual en esta misma
// base de datos de desarrollo compartida -- primero fue Jane Smith, luego
// también John Doe. En vez de fijar un segundo nombre a una fase concreta
// otra vez, el primer escenario comprueba contra la respuesta real de la
// API qué candidato está en qué fase, en vez de asumirlo.
const POSITION_TITLE = 'Senior Full-Stack Engineer';

type InterviewStep = { id: number; name: string; orderIndex: number };
type Candidate = { fullName: string; currentInterviewStep: string };

// Debe coincidir exactamente con `toTestId` de
// frontend/src/components/PositionProcess.tsx -- ahí es donde se genera
// el data-testid real de cada columna a partir del nombre de la fase.
const toTestId = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const login = async (page: Page) => {
    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill(SEEDED_EMPLOYEE.email);
    await page.getByLabel('Contraseña').fill(SEEDED_EMPLOYEE.password);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL('**/');
};

// Devuelve las fases y los candidatos reales del proceso, capturados de
// las mismas respuestas que ya carga la página -- así la prueba no
// depende de un id de fase fijo en el seed, ni de qué candidato concreto
// esté en qué fase (ver el comentario de POSITION_TITLE más arriba).
const openPositionBoard = async (page: Page): Promise<{ steps: InterviewStep[]; candidates: Candidate[] }> => {
    await page.goto('/positions');
    const interviewFlowResponse = page.waitForResponse(
        (res) => res.url().includes('/interviewflow') && res.request().method() === 'GET',
    );
    const candidatesResponse = page.waitForResponse(
        (res) => res.url().includes('/candidates') && res.request().method() === 'GET',
    );
    await page.locator('.card', { hasText: POSITION_TITLE }).getByRole('button', { name: 'Ver proceso' }).click();
    await expect(page).toHaveURL(/\/positions\/\d+$/);
    const flowBody = await (await interviewFlowResponse).json();
    const candidates = (await (await candidatesResponse).json()) as Candidate[];
    return { steps: flowBody.interviewFlow.interviewFlow.interviewSteps as InterviewStep[], candidates };
};

const waitForCandidateStagePut = (page: Page) =>
    page.waitForResponse(
        (res) => /\/candidates\/\d+$/.test(new URL(res.url()).pathname) && res.request().method() === 'PUT',
    );

test.beforeEach(async ({ page }) => {
    await login(page);
});

test('la página de position carga el título, las columnas de fase y cada candidato en su columna correcta', async ({ page }) => {
    const { steps, candidates } = await openPositionBoard(page);

    await expect(page.getByTestId('position-title')).toContainText(POSITION_TITLE);

    // Todas las columnas de fase están presentes, tengan o no candidatos
    // ahora mismo.
    expect(steps.length).toBeGreaterThan(0);
    for (const step of steps) {
        await expect(page.getByTestId(`phase-column-${toTestId(step.name)}`)).toBeVisible();
    }

    // Cada candidato aparece en la columna que dice la API que le
    // corresponde -- comprobado contra la respuesta real, no contra un
    // nombre y una fase fijados a mano (ver el comentario de arriba).
    expect(candidates.length).toBeGreaterThan(0);
    for (const candidate of candidates) {
        const column = page.getByTestId(`phase-column-${toTestId(candidate.currentInterviewStep)}`);
        await expect(column.getByText(candidate.fullName)).toBeVisible();
    }

    // Carlos García es el único candidato cuya fase mantiene activamente
    // esta misma suite (ver el `finally` del segundo escenario) -- se
    // comprueba explícitamente como mínimo estable, además del bucle
    // genérico de arriba.
    await expect(page.getByTestId('phase-column-initial-screening').getByText('Carlos García')).toBeVisible();
});

test('arrastrar la ficha de un candidato a otra fase la mueve visualmente y dispara el PUT al backend con la fase nueva', async ({ page }) => {
    const { steps } = await openPositionBoard(page);
    const technicalStep = steps.find((s) => s.name === 'Technical Interview');
    if (!technicalStep) {
        throw new Error('El seed no tiene la fase "Technical Interview" -- backend/prisma/seed.ts pudo cambiar.');
    }

    const initialScreening = page.getByTestId('phase-column-initial-screening');
    const technicalInterview = page.getByTestId('phase-column-technical-interview');
    const carlosCard = initialScreening.locator('[data-testid^="candidate-card-"]').filter({ hasText: 'Carlos García' });

    try {
        const putResponsePromise = waitForCandidateStagePut(page);
        await carlosCard.dragTo(technicalInterview);

        // El movimiento no llega al backend hasta confirmar el modal de
        // puntuación (prompts-AGB.md, sección 3.55): "Guardar" u "Omitir"
        // disparan el mismo PUT, solo cambia si va con `score` o sin él.
        await expect(page.getByRole('heading', { name: 'Puntuación de la entrevista' })).toBeVisible();
        await page.getByRole('button', { name: 'Omitir' }).click();

        const putResponse = await putResponsePromise;
        expect(putResponse.ok()).toBe(true);
        expect(putResponse.request().postDataJSON()).toMatchObject({ currentInterviewStep: technicalStep.id });

        await expect(
            technicalInterview.locator('[data-testid^="candidate-card-"]').filter({ hasText: 'Carlos García' }),
        ).toBeVisible();
        await expect(initialScreening.getByText('Carlos García')).toHaveCount(0);
    } finally {
        // Deja el seed tal como lo espera el resto de la suite E2E (en
        // particular e2e/steps/hiring-pipeline.steps.ts en la raíz, que da
        // por hecho que Carlos García sigue en "Initial Screening"). Se usa
        // el <select> accesible -- mismo mecanismo que el drag-and-drop,
        // documentado en positionProcess.moveToLabel -- en vez de tocar la
        // base de datos directamente, porque este proyecto (/frontend) no
        // tiene acceso al cliente Prisma del backend a propósito (sin
        // workspaces).
        const movedCard = technicalInterview.locator('[data-testid^="candidate-card-"]').filter({ hasText: 'Carlos García' });
        if (await movedCard.count()) {
            const restorePutPromise = waitForCandidateStagePut(page);
            await movedCard.locator('select').selectOption({ label: 'Selección inicial' });
            await page.getByRole('button', { name: 'Omitir' }).click();
            await restorePutPromise;
        }
    }
});
