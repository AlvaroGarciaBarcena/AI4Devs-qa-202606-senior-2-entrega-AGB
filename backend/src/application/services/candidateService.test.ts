import { addCandidate, getUnassignedCandidatesService, updateCandidateProfile, updateCandidateStage } from './candidateService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Los distintos modelos de dominio que toca addCandidate (Candidate,
// Application, Position vía positionService) hacen cada uno su propio
// `new PrismaClient()` -- con este mock, todos comparten la misma
// instancia simulada, así que hace falta declarar aquí los métodos de
// cada uno que se vaya a necesitar, no solo los de `application`.
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    candidate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    education: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    workExperience: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    position: {
      findUnique: jest.fn(),
    },
    application: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    // Interview.ts (domain/models/Interview.ts) hace su propio `new
    // PrismaClient()` -- comparte esta misma instancia simulada, así que
    // sus llamadas a `prisma.interview.create` acaban también aquí.
    interview: {
      create: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

const COMPANY_ID = 1;
const OTHER_COMPANY_ID = 2;

// Forma repetida en casi todos los tests que tocan una posición: una
// posición de COMPANY_ID con un único paso de entrevista ("Initial
// Screening"). Los tests que necesitan algo distinto (varios pasos, sin
// pasos, otra empresa) lo indican con overrides en vez de reescribir el
// objeto entero -- jscpd señalaba este bloque literal repetido 6 veces
// (`positionController.test.ts`, sección 3.66 del diario, ya siguió este
// mismo criterio).
const mockPosition = (overrides: {
  companyId?: number;
  interviewSteps?: { id: number; orderIndex: number; name?: string }[];
} = {}) => ({
  id: 1,
  companyId: overrides.companyId ?? COMPANY_ID,
  interviewFlow: {
    interviewSteps: overrides.interviewSteps ?? [{ id: 100, orderIndex: 1, name: 'Initial Screening' }],
  },
});

describe('addCandidate', () => {
  const baseCandidateData = {
    firstName: 'Ana',
    lastName: 'García',
    email: 'ana.garcia@example.com',
    positionId: 1,
  };

  // Repetido en casi todos los tests de este describe -- solo cambian los
  // datos del candidato en el único test que da de alta sin posición.
  const stubCandidateCreate = (data: any = baseCandidateData) =>
    jest.spyOn(prisma.candidate, 'create').mockResolvedValue({ id: 10, ...data } as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Caso que motivó este cambio: antes, un candidato se guardaba pero
  // nunca quedaba vinculado a ninguna posición, así que no aparecía en el
  // tablero "Ver proceso" de ninguna. Ahora addCandidate crea también la
  // Application, en la primera fase (por orderIndex) del flujo de
  // entrevistas de la posición elegida.
  it('creates an Application in the first interview step of the chosen position', async () => {
    stubCandidateCreate();
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue(mockPosition({
      interviewSteps: [
        { id: 100, orderIndex: 1, name: 'Initial Screening' },
        { id: 101, orderIndex: 2, name: 'Technical Interview' },
      ],
    }) as any);
    jest.spyOn(prisma.application, 'create').mockResolvedValue({
      id: 500,
      positionId: 1,
      candidateId: 10,
      currentInterviewStep: 100,
      applicationDate: new Date(),
      notes: null,
    });

    await addCandidate(baseCandidateData, COMPANY_ID);

    expect(prisma.position.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1 } }));
    expect(prisma.application.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ positionId: 1, candidateId: 10, currentInterviewStep: 100 }),
    });
  });

  // Regresión de un bucle infinito real: Candidate guardaba
  // `this.educations = data.educations` (el mismo array, no una copia).
  // candidateService recorre ese array con un for...of mientras empuja
  // cada entrada ya guardada a `candidate.educations` -- como era el
  // mismo array, cada `push` alargaba el array que el propio for...of
  // seguía recorriendo, así que nunca terminaba: una sola entrada de
  // educación producía inserciones sin fin (confirmado contra la base de
  // datos real: 204.963 filas duplicadas antes de matar el proceso a
  // mano). Este test falla si esa duplicación de array vuelve a colarse.
  it('saves exactly one Education row per education entry, however many are pushed onto candidate.educations afterwards', async () => {
    stubCandidateCreate();
    jest.spyOn(prisma.education, 'create').mockResolvedValue({ id: 1 } as any);
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue(mockPosition() as any);
    jest.spyOn(prisma.application, 'create').mockResolvedValue({ id: 500 } as any);

    await addCandidate({
      ...baseCandidateData,
      educations: [{ institution: 'Uni X', title: 'Grado X', startDate: '2018-09-01', endDate: '2020-09-01' }],
    }, COMPANY_ID);

    expect(prisma.education.create).toHaveBeenCalledTimes(1);
  });

  it('throws a clear error when the selected position has no interview steps configured', async () => {
    stubCandidateCreate();
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue(mockPosition({ interviewSteps: [] }) as any);

    await expect(addCandidate(baseCandidateData, COMPANY_ID)).rejects.toThrow('does not have an interview process configured');
    expect(prisma.application.create).not.toHaveBeenCalled();
  });

  // Antes la posición se comprobaba al final, después de guardar el
  // candidato: un alta rechazada por este motivo dejaba igualmente un
  // candidato huérfano en la base de datos (PoC real documentado en
  // prompts-AGB.md). Ahora la posición se valida antes de guardar nada.
  it('does not save the candidate at all when the selected position has no interview steps configured', async () => {
    stubCandidateCreate();
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue(mockPosition({ interviewSteps: [] }) as any);

    await expect(addCandidate(baseCandidateData, COMPANY_ID)).rejects.toThrow('does not have an interview process configured');
    expect(prisma.candidate.create).not.toHaveBeenCalled();
  });

  // Distinto del caso de arriba a propósito: una posición inexistente y
  // una posición real sin fases configuradas son dos fallos distintos, y
  // no deberían compartir el mismo mensaje (ver positionService.ts).
  it('throws a distinct error when the selected position does not exist', async () => {
    stubCandidateCreate();
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue(null as any);

    await expect(addCandidate(baseCandidateData, COMPANY_ID)).rejects.toThrow('Selected position not found');
    expect(prisma.application.create).not.toHaveBeenCalled();
    expect(prisma.candidate.create).not.toHaveBeenCalled();
  });

  // Hallazgo real con PoC, sección 3.61: antes de este arreglo, un
  // empleado podía vincular un candidato nuevo a una posición de OTRA
  // empresa -- mismo mensaje que "no existe", no uno distinto que
  // confirmara que el id era real.
  it('treats a position belonging to another company the same as a non-existent one', async () => {
    stubCandidateCreate();
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue(mockPosition({ companyId: OTHER_COMPANY_ID }) as any);

    await expect(addCandidate(baseCandidateData, COMPANY_ID)).rejects.toThrow('Selected position not found');
    expect(prisma.candidate.create).not.toHaveBeenCalled();
  });

  // Caso pedido por el usuario tras probarlo a mano: un candidato dado de
  // alta sin elegir posición debe guardarse igualmente, sin ninguna
  // Application ni comprobación de posición -- "sin asignar" es un estado
  // válido, no un error.
  it('saves the candidate without creating an Application or checking any position when positionId is not provided', async () => {
    const { positionId, ...withoutPositionId } = baseCandidateData;
    stubCandidateCreate(withoutPositionId);

    await addCandidate(withoutPositionId, COMPANY_ID);

    expect(prisma.candidate.create).toHaveBeenCalledTimes(1);
    expect(prisma.position.findUnique).not.toHaveBeenCalled();
    expect(prisma.application.create).not.toHaveBeenCalled();
  });
});

describe('getUnassignedCandidatesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists candidates with no application, most recently registered first', async () => {
    jest.spyOn(prisma.candidate, 'findMany').mockResolvedValue([
      { id: 18, firstName: 'Bad', lastName: 'Position', email: 'bad.position3@example.com', createdAt: new Date('2026-09-19') },
      { id: 10, firstName: 'Nombre', lastName: 'Apellido', email: 'nombre1apellido1@email.com', createdAt: new Date('2026-09-10') },
    ] as any);

    const result = await getUnassignedCandidatesService();

    expect(prisma.candidate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { applications: { none: {} } } }),
    );
    expect(result).toEqual([
      { id: 18, fullName: 'Bad Position', email: 'bad.position3@example.com', createdAt: new Date('2026-09-19') },
      { id: 10, fullName: 'Nombre Apellido', email: 'nombre1apellido1@email.com', createdAt: new Date('2026-09-10') },
    ]);
  });
});

describe('updateCandidateProfile', () => {
  const existingCandidate = {
    id: 20,
    firstName: 'Ana',
    lastName: 'García',
    email: 'ana.garcia@example.com',
    phone: null,
    address: null,
  };
  const updateData = {
    firstName: 'Ana',
    lastName: 'García Actualizada',
    email: 'ana.garcia@example.com',
    phone: '612345678',
    address: 'Nueva dirección',
    educations: [{ institution: 'MIT', title: 'BSc', startDate: '2018-01-01', endDate: '2020-01-01' }],
    workExperiences: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates the personal fields and replaces educations/workExperiences wholesale', async () => {
    jest.spyOn(prisma.candidate, 'findUnique')
      .mockResolvedValueOnce({ ...existingCandidate, applications: [] } as any) // comprobación de candidatura existente
      .mockResolvedValueOnce({ ...existingCandidate, ...updateData, educations: [], workExperiences: [], resumes: [], applications: [] } as any); // Candidate.findOne al final
    jest.spyOn(prisma.candidate, 'update').mockResolvedValue(existingCandidate as any);
    jest.spyOn(prisma.education, 'deleteMany').mockResolvedValue({ count: 1 } as any);
    jest.spyOn(prisma.education, 'create').mockResolvedValue({ id: 1 } as any);
    jest.spyOn(prisma.workExperience, 'deleteMany').mockResolvedValue({ count: 0 } as any);

    await updateCandidateProfile(20, updateData, COMPANY_ID);

    expect(prisma.candidate.update).toHaveBeenCalledWith({
      where: { id: 20 },
      data: expect.objectContaining({
        firstName: 'Ana',
        lastName: 'García Actualizada',
        phone: '612345678',
        address: 'Nueva dirección',
      }),
    });
    // Las listas se sustituyen enteras: se borran todas las entradas
    // anteriores del candidato y se recrean las que llegan en el payload,
    // no se intenta adivinar cuáles "son la misma" entrada de antes.
    expect(prisma.education.deleteMany).toHaveBeenCalledWith({ where: { candidateId: 20 } });
    expect(prisma.education.create).toHaveBeenCalledTimes(1);
    expect(prisma.workExperience.deleteMany).toHaveBeenCalledWith({ where: { candidateId: 20 } });
  });

  it('assigns a position when the candidate did not have one yet', async () => {
    jest.spyOn(prisma.candidate, 'findUnique')
      .mockResolvedValueOnce({ ...existingCandidate, applications: [] } as any)
      .mockResolvedValueOnce({ ...existingCandidate, educations: [], workExperiences: [], resumes: [], applications: [] } as any);
    jest.spyOn(prisma.candidate, 'update').mockResolvedValue(existingCandidate as any);
    jest.spyOn(prisma.education, 'deleteMany').mockResolvedValue({ count: 0 } as any);
    jest.spyOn(prisma.workExperience, 'deleteMany').mockResolvedValue({ count: 0 } as any);
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue(mockPosition() as any);
    jest.spyOn(prisma.application, 'create').mockResolvedValue({ id: 500 } as any);

    await updateCandidateProfile(20, { ...updateData, positionId: 1 }, COMPANY_ID);

    expect(prisma.application.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ positionId: 1, candidateId: 20, currentInterviewStep: 100 }),
    });
  });

  // Hallazgo real con PoC, sección 3.61: asignar por primera vez una
  // posición de OTRA empresa se rechaza igual que si no existiera.
  it('treats a position belonging to another company the same as a non-existent one', async () => {
    jest.spyOn(prisma.candidate, 'findUnique').mockResolvedValueOnce({ ...existingCandidate, applications: [] } as any);
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue(mockPosition({ companyId: OTHER_COMPANY_ID }) as any);

    await expect(updateCandidateProfile(20, { ...updateData, positionId: 1 }, COMPANY_ID))
      .rejects.toThrow('Selected position not found');
    expect(prisma.candidate.update).not.toHaveBeenCalled();
  });

  // Regla explícita: reasignar la posición de un candidato que ya tiene
  // candidatura no se soporta desde esta edición (ver el comentario junto
  // a updateCandidateProfile en candidateService.ts) -- Interview.
  // applicationId es RESTRICT, borrar esa Application a medias podría
  // dejar el candidato en un estado inconsistente.
  it('rejects changing the position of a candidate that already has an application', async () => {
    jest.spyOn(prisma.candidate, 'findUnique').mockResolvedValueOnce({
      ...existingCandidate,
      applications: [{ id: 1, positionId: 1, candidateId: 20 }],
    } as any);

    await expect(updateCandidateProfile(20, { ...updateData, positionId: 2 }, COMPANY_ID))
      .rejects.toThrow('Cannot change the position');
    expect(prisma.candidate.update).not.toHaveBeenCalled();
  });

  it('throws a clear error when the candidate does not exist', async () => {
    jest.spyOn(prisma.candidate, 'findUnique').mockResolvedValueOnce(null as any);

    await expect(updateCandidateProfile(999, updateData, COMPANY_ID)).rejects.toThrow('Candidate not found');
  });
});

describe('updateCandidateStage', () => {
  const mockApplication = {
    id: 1,
    positionId: 1,
    candidateId: 1,
    currentInterviewStep: 1,
    applicationDate: new Date(),
    notes: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(prisma.application, 'findFirst').mockResolvedValue(mockApplication);
    jest.spyOn(prisma.application, 'update').mockResolvedValue({
      ...mockApplication,
      currentInterviewStep: 2,
    });
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue(mockPosition({
      interviewSteps: [{ id: 1, orderIndex: 1 }, { id: 2, orderIndex: 2 }],
    }) as any);
    jest.spyOn(prisma.interview, 'create').mockResolvedValue({ id: 1 } as any);
  });

  it('should update the candidate stage and return the updated application', async () => {
    const result = await updateCandidateStage(1, 1, 2, 7, COMPANY_ID, 5);
    expect(result).toEqual(expect.objectContaining({
      ...mockApplication,
      currentInterviewStep: 2,
    }));
  });

  // El punto de esta rama: dejar constancia de que la fase anterior se
  // completó, con quién la gestionó -- para la fase de la que sale (1,
  // el valor de `currentInterviewStep` ANTES de actualizarlo), no la de
  // destino.
  it('creates an Interview record for the stage being left, with the given score', async () => {
    await updateCandidateStage(1, 1, 2, 7, COMPANY_ID, 5);

    expect(prisma.interview.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationId: 1,
        interviewStepId: 1,
        employeeId: 7,
        score: 5,
      }),
    });
  });

  // Pedido por el usuario: no puntuar no debe bloquear el movimiento, pero
  // sí debe quedar constancia de que la fase se completó sin puntuación
  // (score en null, no ausencia de registro).
  it('creates the Interview record with a null score when no score is given', async () => {
    await updateCandidateStage(1, 1, 2, 7, COMPANY_ID, undefined);

    expect(prisma.interview.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ score: undefined }),
    });
  });

  it('throws when the application does not exist, without creating an Interview', async () => {
    jest.spyOn(prisma.application, 'findFirst').mockResolvedValueOnce(null as any);

    await expect(updateCandidateStage(999, 1, 2, 7, COMPANY_ID, 5)).rejects.toThrow('Application not found');
    expect(prisma.interview.create).not.toHaveBeenCalled();
  });

  // Hallazgo real con PoC, sección 3.61: antes de este arreglo, un
  // empleado podía mover la candidatura de un candidato en el proceso de
  // OTRA empresa con solo conocer su applicationId -- mismo mensaje que
  // "no existe", para no confirmar que el id es real.
  it('throws "Application not found" (not moving anything) when the application\'s position belongs to another company', async () => {
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue({ id: 1, companyId: OTHER_COMPANY_ID } as any);

    await expect(updateCandidateStage(1, 1, 2, 7, COMPANY_ID, 5)).rejects.toThrow('Application not found');
    expect(prisma.application.update).not.toHaveBeenCalled();
    expect(prisma.interview.create).not.toHaveBeenCalled();
  });

  // Hallazgo secundario de la auditoría, sección 3.61/3.62: antes de este
  // arreglo, `currentInterviewStep` se guardaba tal cual, sin comprobar
  // que perteneciera al flujo de entrevistas de la propia posición.
  it('rejects a target step that does not belong to this position\'s interview flow', async () => {
    // El mock de posición de este describe solo tiene los pasos 1 y 2
    // (ver beforeEach) -- 999 es de otro flujo cualquiera.
    await expect(updateCandidateStage(1, 1, 999, 7, COMPANY_ID, 5))
      .rejects.toThrow('does not belong to this position\'s interview flow');
    expect(prisma.application.update).not.toHaveBeenCalled();
    expect(prisma.interview.create).not.toHaveBeenCalled();
  });
});
