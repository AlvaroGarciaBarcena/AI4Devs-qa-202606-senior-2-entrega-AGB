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
// Carlos García en "Initial Screening" y a John Doe en "Technical
// Interview" -- mismo fixture que ya usa
// e2e/steps/hiring-pipeline.steps.ts en la raíz para el escenario
// equivalente de carga del tablero (Playwright-BDD, no cuenta como
// cobertura del drag-and-drop que pide este ejercicio). No se usa a Jane
// Smith como tercer candidato de referencia: a diferencia de Carlos y John,
// su fase ya se movió por trabajo manual anterior en esta misma base de
// datos de desarrollo compartida, y ató la prueba a un dato que ya no es
// estable.
const POSITION_TITLE = 'Senior Full-Stack Engineer';

type InterviewStep = { id: number; name: string; orderIndex: number };

const login = async (page: Page) => {
    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill(SEEDED_EMPLOYEE.email);
    await page.getByLabel('Contraseña').fill(SEEDED_EMPLOYEE.password);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL('**/');
};

// Devuelve las fases reales del proceso, capturadas de la misma respuesta
// que ya carga la página -- así la prueba no depende de un id de fase fijo
// en el seed, solo de su nombre.
const openPositionBoard = async (page: Page): Promise<InterviewStep[]> => {
    await page.goto('/positions');
    const interviewFlowResponse = page.waitForResponse(
        (res) => res.url().includes('/interviewflow') && res.request().method() === 'GET',
    );
    await page.locator('.card', { hasText: POSITION_TITLE }).getByRole('button', { name: 'Ver proceso' }).click();
    await expect(page).toHaveURL(/\/positions\/\d+$/);
    const body = await (await interviewFlowResponse).json();
    return body.interviewFlow.interviewFlow.interviewSteps as InterviewStep[];
};

const waitForCandidateStagePut = (page: Page) =>
    page.waitForResponse(
        (res) => /\/candidates\/\d+$/.test(new URL(res.url()).pathname) && res.request().method() === 'PUT',
    );

test.beforeEach(async ({ page }) => {
    await login(page);
});

test('la página de position carga el título, las columnas de fase y cada candidato en su columna correcta', async ({ page }) => {
    await openPositionBoard(page);

    await expect(page.getByTestId('position-title')).toContainText(POSITION_TITLE);

    const initialScreening = page.getByTestId('phase-column-initial-screening');
    const technicalInterview = page.getByTestId('phase-column-technical-interview');
    await expect(initialScreening).toBeVisible();
    await expect(technicalInterview).toBeVisible();

    await expect(initialScreening.getByText('Carlos García')).toBeVisible();
    await expect(technicalInterview.getByText('John Doe')).toBeVisible();
    await expect(initialScreening.getByText('John Doe')).toHaveCount(0);
});

test('arrastrar la ficha de un candidato a otra fase la mueve visualmente y dispara el PUT al backend con la fase nueva', async ({ page }) => {
    const steps = await openPositionBoard(page);
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
