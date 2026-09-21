import { execSync } from 'child_process';

export type GitInfo = { commit: string; branch: string };

// Hallazgo real (prompts-AGB.md, sección 3.65): más de una vez, el
// backend que respondía en el puerto esperado resultó ser el de otro
// repo/rama -- mismo puerto, mismo aspecto, código distinto, y ningún
// aviso. `exec` se recibe por parámetro (igual que `networkAddresses.ts`)
// para poder testear sin depender de que la máquina que corra los tests
// tenga git de verdad disponible.
export const getGitInfo = (
    exec: (cmd: string) => string = (cmd) => execSync(cmd, { encoding: 'utf-8' }).trim(),
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
