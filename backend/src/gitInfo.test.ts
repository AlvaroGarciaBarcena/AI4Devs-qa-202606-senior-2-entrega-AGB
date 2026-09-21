import { getGitInfo } from './gitInfo';

describe('getGitInfo', () => {
    it('returns the commit and branch reported by the injected exec function', () => {
        const exec = jest.fn()
            .mockReturnValueOnce('abc1234567890')
            .mockReturnValueOnce('mi-rama-AGB');

        expect(getGitInfo(exec)).toEqual({ commit: 'abc1234567890', branch: 'mi-rama-AGB' });
        expect(exec).toHaveBeenCalledWith('git rev-parse HEAD');
        expect(exec).toHaveBeenCalledWith('git rev-parse --abbrev-ref HEAD');
    });

    // Caso real que motivó esto: un despliegue (o un entorno) sin .git
    // accesible no debe tumbar el arranque del servidor.
    it('returns null instead of throwing when git is not available', () => {
        const exec = jest.fn(() => {
            throw new Error('not a git repository');
        });

        expect(getGitInfo(exec)).toBeNull();
    });
});
