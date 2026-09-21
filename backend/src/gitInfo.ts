import { execSync } from 'node:child_process';

export type GitInfo = { commit: string; branch: string };

// Hallazgo real (prompts-AGB.md, sección 3.65): más de una vez, el
// backend que respondía en el puerto esperado resultó ser el de otro
// repo/rama -- mismo puerto, mismo aspecto, código distinto, y ningún
// aviso. `exec` se recibe por parámetro (igual que `networkAddresses.ts`)
// para poder testear sin depender de que la máquina que corra los tests
// tenga git de verdad disponible.
//
// SonarCloud (typescript:S4036, "Make sure the PATH variable only
// contains fixed, unwriteable directories") -- git no tiene un
// equivalente al npm_execpath que resuelve
// e2e/steps/support/npmChildProcess.ts sin buscar en PATH, así que aquí
// se restringe el PATH del propio proceso hijo a las rutas de sistema
// habituales (confirmado con `which git`: /usr/bin/git, tanto en esta
// máquina como en los runners de GitHub Actions) en vez de heredar el
// PATH completo del proceso, que sí puede incluir directorios
// escribibles por el usuario (p. ej. node_modules/.bin).
const TRUSTED_PATH = '/usr/bin:/bin:/usr/local/bin';

export const getGitInfo = (
    exec: (cmd: string) => string = (cmd) =>
        execSync(cmd, { encoding: 'utf-8', env: { ...process.env, PATH: TRUSTED_PATH } }).trim(),
): GitInfo | null => {
    try {
        return {
            commit: exec('git rev-parse HEAD'),
            branch: exec('git rev-parse --abbrev-ref HEAD'),
        };
    } catch {
        // Sin repo git accesible (p. ej. una imagen de despliegue sin
        // .git) -- no debe tumbar el arranque del servidor por esto.
        return null;
    }
};
