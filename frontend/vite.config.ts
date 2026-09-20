/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Puerto fijo en 3000: es el origen por defecto que acepta el CORS del
    // backend (backend/src/corsOptions.ts, configurable por CORS_ORIGINS en
    // backend/.env) -- se mantiene el mismo puerto que usaba Create React
    // App para no tener que tocarlo.
    port: 3000,
    // Escucha en todas las interfaces de red, no solo en localhost -- así
    // es accesible desde otro equipo de la red local (ver la sección
    // "Acceder desde otro equipo de tu red local" en README-ES.md/
    // README-EN.md para la puesta a punto completa: cortafuegos,
    // CORS_ORIGINS y VITE_API_URL además de esto).
    host: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // tests/e2e/ es de Playwright (ver playwright.config.ts), no de
    // Vitest -- sin esto, Vitest intenta cargar position.spec.ts como si
    // fuera uno de los suyos por el propio nombre del fichero (*.spec.ts)
    // y falla al encontrar `test.beforeEach` de Playwright en vez del
    // suyo.
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  },
});
