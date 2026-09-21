import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { runNpm } from './support/npmChildProcess';

const { Given, When, Then } = createBdd();

const REPO_ROOT = path.resolve(__dirname, '../..');
const BACKEND_DIR = path.join(REPO_ROOT, 'backend');
const FRONTEND_DIR = path.join(REPO_ROOT, 'frontend');

type JestJsonResult = { numPassedTests: number; numFailedTests: number; numTotalTests: number };

const runJestJson = (): JestJsonResult => {
  let output: string;
  try {
    output = runNpm(['exec', '--', 'jest', '--json'], BACKEND_DIR);
  } catch (error) {
    // jest --json sigue escribiendo el JSON en stdout incluso si termina
    // con código != 0 (por ejemplo, si algún test falla) -- solo hace
    // falta capturarlo igual que con npm audit en security-hardening.
    output = (error as { stdout?: string }).stdout ?? '';
  }
  // jest --json puede mezclar avisos de npm antes del JSON real; se queda
  // solo con la primera línea que empieza por '{', la salida de jest.
  const jsonLine = output.split('\n').find((line) => line.trimStart().startsWith('{'));
  if (!jsonLine) throw new Error(`No se encontró JSON en la salida de jest:\n${output}`);
  return JSON.parse(jsonLine) as JestJsonResult;
};

let devServerProcess: ReturnType<typeof spawn> | undefined;

Given('el código fuente del frontend en su estado actual', async () => {
  // Nada que preparar: se opera directamente sobre el código ya presente
  // en el repositorio.
});

When('se ejecuta "npm run build"', async () => {
  runNpm(['run', 'build'], FRONTEND_DIR);
});

Then('el build se completa sin errores, usando Vite, sin ninguna dependencia de react-scripts', async () => {
  // runNpm ya lanza si el build termina con código != 0 -- llegar aquí
  // ya prueba "sin errores". El resto: que el build lo hizo Vite de
  // verdad (dist/ con su huella característica) y que react-scripts no
  // está en las dependencias.
  const distIndex = path.join(FRONTEND_DIR, 'dist', 'index.html');
  expect(fs.existsSync(distIndex)).toBe(true);
  const distAssets = fs.readdirSync(path.join(FRONTEND_DIR, 'dist', 'assets'));
  expect(distAssets.some((file) => /^index-.*\.js$/.test(file))).toBe(true);

  const packageJson = JSON.parse(fs.readFileSync(path.join(FRONTEND_DIR, 'package.json'), 'utf-8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  expect(allDeps['react-scripts']).toBeUndefined();
});

When('se ejecuta "npm run dev"', async () => {
  // No se puede arrancar en el puerto 3000 real: ya lo ocupa el servidor
  // de desarrollo que sirve el resto de esta misma suite E2E. Se lanza
  // uno de usar y tirar en un puerto de scratch, midiendo el mismo dato
  // que Vite ya reporta en su propio log ("ready in XXX ms"), en vez de
  // cronometrar a mano desde fuera (más fiel a lo que Vite considera que
  // ha tardado, sin el ruido del arranque del propio proceso de Node).
  // El binario de vite se lanza directo (no vía "npx vite"): npx/npm exec
  // añade una capa extra de procesos (npm -> sh -c -> vite), y
  // devServerProcess.kill() solo mata al hijo directo, no a los nietos --
  // el vite real seguía vivo después de "matarlo", ocupando el puerto en
  // el siguiente intento (hallazgo real: la siguiente ejecución fallaba
  // con --strictPort contra un puerto que ya estaba en uso, sin ninguna
  // salida).
  // El binario de vite se lanza directo, no a través de `npm` -- el filtro
  // de npm_config_allow_scripts (ver support/npmChildProcess.ts) es
  // irrelevante aquí, así que hereda el entorno tal cual (comportamiento
  // por defecto de `spawn` sin `env` explícito).
  devServerProcess = spawn(path.join(FRONTEND_DIR, 'node_modules', '.bin', 'vite'), ['--port', '5999', '--strictPort'], {
    cwd: FRONTEND_DIR,
  });
});

Then('el servidor de desarrollo arranca sobre Vite en menos de un segundo', async () => {
  const readyMs = await new Promise<number>((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error(`Vite no arrancó a tiempo. Salida hasta ahora:\n${output}`)), 10_000);
    devServerProcess!.stdout!.on('data', (chunk) => {
      output += chunk.toString();
      // Vite colorea su propio log incluso sin TTY -- los códigos ANSI de
      // color quedan en mitad del texto ("ready in " + color + "161 ms"),
      // rompiendo una búsqueda ingenua del número.
      // eslint-disable-next-line no-control-regex
      const plainOutput = output.replace(/\x1b\[[0-9;]*m/g, '');
      const match = /ready in (\d+) ?ms/.exec(plainOutput);
      if (match) {
        clearTimeout(timeout);
        resolve(Number(match[1]));
      }
    });
    devServerProcess!.on('error', reject);
  });

  devServerProcess!.kill();
  expect(readyMs).toBeLessThan(1000);
});

Given('ni la base de datos ni ningún servidor de la aplicación están arrancados', async () => {
  // No se apagan de verdad los servidores de desarrollo de esta sesión
  // (los necesita el resto de la suite E2E que corre en la misma tanda)
  // -- pero da igual para lo que prueba este escenario: tanto
  // candidateService.test.ts (backend/src/application/services/candidateService.test.ts)
  // como la suite del frontend mockean @prisma/client y los servicios de
  // red por completo (jest.mock/vi.mock), así que su resultado no
  // depende de si hay algo arrancado o no -- es justo eso lo que exige
  // este requisito ("ejecutable sin necesidad de una base de datos ni de
  // servidores en marcha").
});

When('se ejecuta "npx jest" en el backend y "npm test" en el frontend', async () => {
  runNpm(['exec', '--', 'jest'], BACKEND_DIR);
  runNpm(['test'], FRONTEND_DIR);
});

Then('todos los tests se ejecutan y terminan en verde', async () => {
  // Los dos comandos del When ya habrían lanzado si algún test hubiera
  // fallado (execFileSync lanza en código de salida != 0) -- llegar aquí
  // ya es la prueba.
});

let jestResultBeforeBuild: JestJsonResult;

Given('se acaba de ejecutar "npm run build" en el backend', async () => {
  jestResultBeforeBuild = runJestJson();
  runNpm(['run', 'build'], BACKEND_DIR);
});

When('a continuación se ejecuta "npx jest"', async () => {
  // Se guarda para el Then -- nada que ejecutar aquí todavía, el propio
  // helper runJestJson lo hace al comparar.
});

Then('el resultado de los tests es el mismo que sin haber ejecutado el build antes', async () => {
  const jestResultAfterBuild = runJestJson();
  expect(jestResultAfterBuild.numPassedTests).toBe(jestResultBeforeBuild.numPassedTests);
  expect(jestResultAfterBuild.numFailedTests).toBe(0);
  expect(jestResultAfterBuild.numTotalTests).toBe(jestResultBeforeBuild.numTotalTests);

  // Además, la razón concreta por la que esto podría no cumplirse:
  // backend/tsconfig.json excluye los ficheros *.test.ts del build para
  // que no se dupliquen en dist/ (ver prompts-AGB.md, hallazgo de
  // sesiones anteriores) -- se comprueba directamente que sigue siendo
  // así, no solo que el número de tests cuadra.
  const distDir = path.join(BACKEND_DIR, 'dist');
  const hasCompiledTestFiles = (dir: string): boolean =>
    fs.readdirSync(dir, { withFileTypes: true }).some((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return hasCompiledTestFiles(fullPath);
      return entry.name.endsWith('.test.js');
    });
  expect(hasCompiledTestFiles(distDir)).toBe(false);
});

Given('las dependencias del frontend en su versión actual', async () => {
  // Nada que preparar: se audita node_modules ya instalado.
});

let frontendAuditVulnerabilities: Array<{ name: string; severity: string }>;

When('se ejecuta una auditoría de vulnerabilidades sobre las dependencias del frontend', async () => {
  let output: string;
  try {
    output = runNpm(['audit', '--json'], FRONTEND_DIR);
  } catch (error) {
    output = (error as { stdout?: string }).stdout ?? '';
  }
  const report = JSON.parse(output) as { vulnerabilities: Record<string, { name: string; severity: string }> };
  frontendAuditVulnerabilities = Object.values(report.vulnerabilities ?? {});
});

Then('no se reporta ninguna vulnerabilidad de react-router-dom ni de sus dependencias', async () => {
  const routerVulnerabilities = frontendAuditVulnerabilities.filter((v) => v.name.startsWith('react-router'));
  expect(routerVulnerabilities).toEqual([]);
});
