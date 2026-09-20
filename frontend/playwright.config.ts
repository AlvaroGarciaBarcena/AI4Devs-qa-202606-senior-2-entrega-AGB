import { defineConfig, devices } from '@playwright/test';

// Config independiente de la de la raíz del repo (../playwright.config.ts,
// que cubre backend + frontend con Playwright-BDD). Esta es la que pide el
// ejercicio de QA (AI4Devs-qa-202606-senior-2): un proyecto Playwright
// autocontenido dentro de /frontend, que asume -- igual que su propio
// README -- que el backend y el frontend ya están arrancados en local, sin
// levantarlos ella misma.
export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    workers: 1,
    reporter: 'list',
    use: {
        baseURL: process.env.VITE_APP_URL || 'http://localhost:3000',
        trace: 'retain-on-failure',
        // Sin esto, Chromium arranca en inglés y la detección de idioma de
        // la app renderiza en inglés -- mismo motivo que en el config de la
        // raíz (ver su comentario).
        locale: 'es-ES',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
