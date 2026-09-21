import { PrismaClient } from '@prisma/client';
import { Position } from '../../domain/models/Position';
import { InterviewType } from '../../domain/models/InterviewType';
import { InterviewStep } from '../../domain/models/InterviewStep';

const prisma = new PrismaClient();

// Una entrevista con `score` en null ("se movió de fase sin puntuar",
// ver candidateService.ts) debe quedar FUERA de la media, ni sumar ni
// restar -- antes de esta rama, `interview.score || 0` la contaba como un
// cero en la suma pero SÍ en el divisor, así que cada entrevista sin
// puntuar hundía la media en vez de no afectarla.
const calculateAverageScore = (interviews: any[]) => {
    const scored = interviews.filter((interview) => interview.score !== null && interview.score !== undefined);
    if (scored.length === 0) return 0;
    const totalScore = scored.reduce((acc, interview) => acc + interview.score, 0);
    return totalScore / scored.length;
};

const countUngradedInterviews = (interviews: any[]) =>
    interviews.filter((interview) => interview.score === null || interview.score === undefined).length;

// `companyId` sale siempre del JWT (`req.employee.companyId`), nunca de
// algo que mande el cliente -- ver prompts-AGB.md, sección 3.61 (hallazgo
// real con PoC: sin este filtro, cualquier empleado autenticado veía y
// modificaba posiciones de OTRAS empresas, con solo conocer o adivinar un
// id secuencial).
export const getAllPositionsService = async (companyId: number) => {
    const positions = await prisma.position.findMany({
        where: { companyId },
        include: {
            company: {
                select: { name: true }
            }
        },
        orderBy: { id: 'asc' }
    });

    return positions.map(position => ({
        id: position.id,
        title: position.title,
        companyName: position.company.name,
        location: position.location,
        status: position.status,
        applicationDeadline: position.applicationDeadline
    }));
};

export const getCandidatesByPositionService = async (positionId: number, companyId: number) => {
    const position = await prisma.position.findUnique({ where: { id: positionId } });
    // Mismo mensaje tanto si la posición no existe como si es de otra
    // empresa -- distinguirlos confirmaría a quien pregunta que el id sí
    // existe, solo que no es suyo. Fuera del try/catch de abajo a
    // propósito: ese catch envuelve cualquier error en uno genérico, y
    // este mensaje concreto sí importa distinguirlo (lo usa el controlador
    // para responder 404 en vez de 500).
    if (position?.companyId !== companyId) {
        throw new Error('Position not found');
    }

    try {
        const applications = await prisma.application.findMany({
            where: { positionId },
            include: {
                candidate: true,
                interviews: true,
                interviewStep: true
            }
        });

        return applications.map(app => ({
            fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
            currentInterviewStep: app.interviewStep.name,
            averageScore: calculateAverageScore(app.interviews),
            ungradedInterviews: countUngradedInterviews(app.interviews),
            id: app.candidate.id,
            applicationId: app.id
        }));
    } catch (error) {
        console.error('Error retrieving candidates by position:', error);
        throw new Error('Error retrieving candidates by position');
    }
};

// Usado al dar de alta un candidato con una posición elegida
// (candidateService.ts): toda candidatura nueva arranca en la primera
// fase del flujo de entrevistas de esa posición. `orderBy` es necesario
// -- el `include` de Prisma no garantiza que interviewSteps venga en el
// orden de `orderIndex`, y sin ordenar explícitamente se podría escoger
// una fase intermedia como si fuera la primera.
//
// `undefined` (posición inexistente) y `null` (posición real, pero sin
// ninguna fase configurada en su flujo) se distinguen a propósito: son
// dos fallos distintos y quien llama (candidateService.ts) necesita
// poder dar un mensaje que no los confunda.
export const getFirstInterviewStepForPosition = async (positionId: number, companyId: number) => {
    const position = await prisma.position.findUnique({
        where: { id: positionId },
        include: {
            interviewFlow: {
                include: {
                    interviewSteps: { orderBy: { orderIndex: 'asc' } }
                }
            }
        }
    });

    // Una posición de otra empresa se trata igual que una inexistente --
    // quien llama (candidateService.ts) ya distingue undefined/null, no
    // hace falta un tercer caso.
    if (position?.companyId !== companyId) return undefined;
    return position.interviewFlow.interviewSteps[0] ?? null;
};

export const getInterviewFlowByPositionService = async (positionId: number, companyId: number) => {
    const positionWithInterviewFlow = await prisma.position.findUnique({
        where: { id: positionId },
        include: {
            interviewFlow: {
                include: {
                    interviewSteps: true
                }
            }
        }
    });

    if (positionWithInterviewFlow?.companyId !== companyId) {
        throw new Error('Position not found');
    }

    // Formatear la respuesta para incluir el nombre de la posición y el flujo de entrevistas
    return {
        positionName: positionWithInterviewFlow.title,
        interviewFlow: {
            id: positionWithInterviewFlow.interviewFlow.id,
            description: positionWithInterviewFlow.interviewFlow.description,
            interviewSteps: positionWithInterviewFlow.interviewFlow.interviewSteps.map(step => ({
                id: step.id,
                interviewFlowId: step.interviewFlowId,
                interviewTypeId: step.interviewTypeId,
                name: step.name,
                orderIndex: step.orderIndex
            }))
        }
    };
};

// Añade una fase nueva al final del flujo de entrevistas de una posición.
// Cada InterviewStep necesita un InterviewType (FK obligatoria) -- en vez de
// forzar a elegir entre los tres tipos ya sembrados (HR/Technical/Hiring
// manager, que hoy no se muestran en ningún sitio de la interfaz), se crea
// un InterviewType propio con el mismo nombre. El esquema no obliga a
// reutilizar tipos entre fases, así que esto no rompe nada -- solo evita
// tener que construir además un selector de tipos que la interfaz no
// necesitaba hasta ahora.
export const addInterviewStepService = async (positionId: number, name: string, companyId: number) => {
    const position = await prisma.position.findUnique({
        where: { id: positionId },
        include: {
            interviewFlow: {
                include: { interviewSteps: true }
            }
        }
    });

    if (position?.companyId !== companyId) {
        throw new Error('Position not found');
    }

    const maxOrderIndex = position.interviewFlow.interviewSteps.reduce(
        (max, step) => Math.max(max, step.orderIndex), 0
    );

    const interviewType = await new InterviewType({ name }).save();
    const interviewStep = await new InterviewStep({
        interviewFlowId: position.interviewFlow.id,
        interviewTypeId: interviewType.id,
        name,
        orderIndex: maxOrderIndex + 1
    }).save();

    return {
        id: interviewStep.id,
        interviewFlowId: interviewStep.interviewFlowId,
        interviewTypeId: interviewStep.interviewTypeId,
        name: interviewStep.name,
        orderIndex: interviewStep.orderIndex
    };
};
