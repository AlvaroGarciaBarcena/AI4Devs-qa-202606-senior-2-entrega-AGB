import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

export type GitInfo = { commit: string; branch: string };

// SonarCloud (typescript:S4036, "Make sure the PATH variable only
// contains fixed, unwriteable directories") -- restringir el PATH
// heredado (como probó primero esta misma función) no lo conforme: la
// regla exige que el propio ejecutable se invoque por una ruta absoluta,
// no que el PATH usado para resolverlo sea de fiar. git no tiene un
// equivalente al npm_execpath que resuelve
// e2e/steps/support/npmChildProcess.ts sin buscar en PATH, así que se
// prueba una lista corta de rutas absolutas habituales (confirmado con
// `which git` en esta máquina y en los runners de GitHub Actions:
// /usr/bin/git) y solo si ninguna existe se cae a resolverlo por PATH
// como último recurso.
const GIT_BINARY_CANDIDATES = ['/usr/bin/git', '/usr/local/bin/git', '/opt/homebrew/bin/git'];
const resolveGitBinary = (): string => GIT_BINARY_CANDIDATES.find(existsSync) ?? 'git';

// Hallazgo real (prompts-AGB.md, sección 3.65): más de una vez, el
// backend que respondía en el puerto esperado resultó ser el de otro
// repo/rama -- mismo puerto, mismo aspecto, código distinto, y ningún
// aviso. `exec` se recibe por parámetro (igual que `networkAddresses.ts`)
// para poder testear sin depender de que la máquina que corra los tests
// tenga git de verdad disponible.
export const getGitInfo = (
    exec: (args: string[]) => string = (args) =>
        execFileSync(resolveGitBinary(), args, { encoding: 'utf-8' }).trim(),
): GitInfo | null => {
    try {
        return {
            commit: exec(['rev-parse', 'HEAD']),
            branch: exec(['rev-parse', '--abbrev-ref', 'HEAD']),
        };
    } catch {
        // Sin repo git accesible (p. ej. una imagen de despliegue sin
        // .git) -- no debe tumbar el arranque del servidor por esto.
        return null;
    }
};
