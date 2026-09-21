import { getAllPositions, getCandidatesByPosition, getInterviewFlowByPosition, addInterviewStep } from './positionController';
import { Request, Response } from 'express';
import { getAllPositionsService, getCandidatesByPositionService, getInterviewFlowByPositionService, addInterviewStepService } from '../../application/services/positionService';

jest.mock('../../application/services/positionService');

beforeEach(() => {
  jest.clearAllMocks();
});

const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
}) as unknown as Response;

// requireAuth (delante de toda /position) siempre deja req.employee puesto
// antes de llegar aquí -- se simula igual en cada test de este fichero.
const authenticatedReq = (rest: object) => ({ ...rest, employee: { sub: 1, role: 'Interviewer', companyId: 1 } }) as unknown as Request;

type Controller = (req: Request, res: Response) => Promise<unknown>;

// Patrón repetido en los tres controladores que reciben un :id de posición:
// un id no numérico se rechaza con 400 sin llegar a llamar al servicio.
// El cuerpo esperado varía (`message` en dos, `error` en addInterviewStep,
// ver positionController.ts) -- se pasa explícito, no se asume.
const expectRejectedWithout400 = async (run: Controller, req: Request, service: jest.Mock, expectedBody: object) => {
  const res = mockResponse();
  await run(req, res);
  expect(service).not.toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith(expectedBody);
};

// Patrón repetido en los tres controladores que consultan una posición por
// id: cuando el servicio rechaza con "Position not found" (no existe, o es
// de otra empresa -- mismo mensaje a propósito, sección 3.61), responden
// 404 con el mismo cuerpo.
const expectPositionNotFound = async (run: Controller, req: Request, service: jest.Mock) => {
  const res = mockResponse();
  service.mockRejectedValue(new Error('Position not found'));
  await run(req, res);
  expect(res.status).toHaveBeenCalledWith(404);
  expect(res.json).toHaveBeenCalledWith({ message: 'Position not found', error: 'Position not found' });
};

describe('getAllPositions', () => {
  it('should return 200 and the list of positions, scoped to the company of the authenticated employee', async () => {
    const req = authenticatedReq({});
    const res = mockResponse();

    (getAllPositionsService as jest.Mock).mockResolvedValue([
      { id: 1, title: 'Senior Full-Stack Engineer', companyName: 'LTI', location: 'Remote', status: 'Open', applicationDeadline: new Date('2024-12-31') },
    ]);

    await getAllPositions(req, res);

    expect(getAllPositionsService).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      { id: 1, title: 'Senior Full-Stack Engineer', companyName: 'LTI', location: 'Remote', status: 'Open', applicationDeadline: new Date('2024-12-31') },
    ]);
  });
});

describe('getCandidatesByPosition', () => {
  it('should return 200 and candidates data', async () => {
    const req = authenticatedReq({ params: { id: '1' } });
    const res = mockResponse();

    (getCandidatesByPositionService as jest.Mock).mockResolvedValue([
      { fullName: 'John Doe', currentInterviewStep: 'Technical Interview', averageScore: 4 },
    ]);

    await getCandidatesByPosition(req, res);

    expect(getCandidatesByPositionService).toHaveBeenCalledWith(1, 1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      { fullName: 'John Doe', currentInterviewStep: 'Technical Interview', averageScore: 4 },
    ]);
  });

  // Verificado a mano con `curl http://localhost:3010/position/abc/candidates`
  // durante la sesión (backend-AGB, sección 3.6): antes de ese arreglo, un id
  // no numérico llegaba a Prisma como NaN y daba un 500 poco claro.
  it('returns 400 without calling the service when the id is not numeric', async () => {
    await expectRejectedWithout400(
      getCandidatesByPosition,
      authenticatedReq({ params: { id: 'abc' } }),
      getCandidatesByPositionService as jest.Mock,
      { message: 'Invalid position ID format' },
    );
  });

  // Hallazgo real con PoC, sección 3.61: antes de este arreglo, esto
  // devolvía 200 con los candidatos de una posición de otra empresa.
  it('returns 404 when the position belongs to another company', async () => {
    await expectPositionNotFound(
      getCandidatesByPosition,
      authenticatedReq({ params: { id: '72' } }),
      getCandidatesByPositionService as jest.Mock,
    );
  });
});

describe('getInterviewFlowByPosition', () => {
  it('should return 200 with the interview flow', async () => {
    const req = authenticatedReq({ params: { id: '1' } });
    const res = mockResponse();

    (getInterviewFlowByPositionService as jest.Mock).mockResolvedValue({
      positionName: 'Senior Full-Stack Engineer',
      interviewFlow: { id: 1, description: null, interviewSteps: [] },
    });

    await getInterviewFlowByPosition(req, res);

    expect(getInterviewFlowByPositionService).toHaveBeenCalledWith(1, 1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      interviewFlow: {
        positionName: 'Senior Full-Stack Engineer',
        interviewFlow: { id: 1, description: null, interviewSteps: [] },
      },
    });
  });

  it('returns 400 without calling the service when the id is not numeric', async () => {
    await expectRejectedWithout400(
      getInterviewFlowByPosition,
      authenticatedReq({ params: { id: 'abc' } }),
      getInterviewFlowByPositionService as jest.Mock,
      { message: 'Invalid position ID format' },
    );
  });

  // Verificado a mano navegando a /positions/999 (positions-proceso-AGB,
  // sección 4): una posición inexistente debe dar 404, no un 500. Desde la
  // sección 3.61, el mismo 404 cubre también "existe, pero es de otra
  // empresa" -- a propósito, para no confirmar que el id es real.
  it('returns 404 when the position does not exist (or belongs to another company)', async () => {
    await expectPositionNotFound(
      getInterviewFlowByPosition,
      authenticatedReq({ params: { id: '999' } }),
      getInterviewFlowByPositionService as jest.Mock,
    );
  });
});

describe('addInterviewStep', () => {
  it('returns 201 with the created step', async () => {
    const req = authenticatedReq({ params: { id: '1' }, body: { name: 'Live coding test' } });
    const res = mockResponse();

    (addInterviewStepService as jest.Mock).mockResolvedValue({
      id: 50, interviewFlowId: 10, interviewTypeId: 99, name: 'Live coding test', orderIndex: 3,
    });

    await addInterviewStep(req, res);

    expect(addInterviewStepService).toHaveBeenCalledWith(1, 'Live coding test', 1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Interview step added successfully',
      data: { id: 50, interviewFlowId: 10, interviewTypeId: 99, name: 'Live coding test', orderIndex: 3 },
    });
  });

  it('returns 400 without calling the service when the id is not numeric', async () => {
    await expectRejectedWithout400(
      addInterviewStep,
      authenticatedReq({ params: { id: 'abc' }, body: { name: 'Live coding test' } }),
      addInterviewStepService as jest.Mock,
      { error: 'Invalid position ID format' },
    );
  });

  it('returns 400 without calling the service when the name is blank', async () => {
    await expectRejectedWithout400(
      addInterviewStep,
      authenticatedReq({ params: { id: '1' }, body: { name: '   ' } }),
      addInterviewStepService as jest.Mock,
      { error: 'Phase name is required' },
    );
  });

  it('returns 400 without calling the service when the name is too long', async () => {
    await expectRejectedWithout400(
      addInterviewStep,
      authenticatedReq({ params: { id: '1' }, body: { name: 'a'.repeat(101) } }),
      addInterviewStepService as jest.Mock,
      { error: 'Phase name must be 100 characters or fewer' },
    );
  });

  // Hallazgo real con PoC, sección 3.61: exactamente el caso que
  // demostró el fallo original -- Alice (companyId 1) añadía una fase a
  // una posición de otra empresa (id 72) y recibía 201 Created.
  it('returns 404 when the position does not exist (or belongs to another company)', async () => {
    await expectPositionNotFound(
      addInterviewStep,
      authenticatedReq({ params: { id: '999' }, body: { name: 'Live coding test' } }),
      addInterviewStepService as jest.Mock,
    );
  });
});
