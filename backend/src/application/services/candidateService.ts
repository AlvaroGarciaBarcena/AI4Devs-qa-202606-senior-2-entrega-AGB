import { PrismaClient } from '@prisma/client';
import { Candidate } from '../../domain/models/Candidate';
import { validateCandidateData } from '../validator';
import { Education } from '../../domain/models/Education';
import { WorkExperience } from '../../domain/models/WorkExperience';
import { Resume } from '../../domain/models/Resume';
import { Application } from '../../domain/models/Application';
import { Interview } from '../../domain/models/Interview';
import { getFirstInterviewStepForPosition } from './positionService';

const prisma = new PrismaClient();

// Elegir posición es opcional: un candidato puede registrarse sin
// candidatura todavía y quedar "sin asignar" (ver
// getUnassignedCandidatesService más abajo) -- eso es un estado válido, no
// un huérfano accidental. Lo que sigue siendo un error es indicar una
// posición que no existe, o que existe pero no tiene ningún flujo de
// entrevistas configurado. Se valida ANTES de guardar nada del candidato:
// antes esta comprobación vivía al final, y un alta contra una posición sin
// fases configuradas dejaba un candidato huérfano ya guardado en la base de
// datos, sin ninguna Application, ocupando su email para siempre.
const resolveFirstStepForNewApplication = async (positionId: number | undefined, companyId: number) => {
    if (!positionId) return null;

    const firstStep = await getFirstInterviewStepForPosition(positionId, companyId);
    if (firstStep === undefined) {
        throw new Error('Selected position not found');
    }
    if (firstStep === null) {
        throw new Error('The selected position does not have an interview process configured');
    }
    return firstStep;
};

const saveCandidateEducations = async (candidate: Candidate, candidateId: number, educations: any[] | undefined) => {
    if (!educations) return;
    for (const education of educations) {
        const educationModel = new Education(education);
        educationModel.candidateId = candidateId;
        await educationModel.save();
        candidate.educations.push(educationModel);
    }
};

const saveCandidateWorkExperiences = async (candidate: Candidate, candidateId: number, workExperiences: any[] | undefined) => {
    if (!workExperiences) return;
    for (const experience of workExperiences) {
        const experienceModel = new WorkExperience(experience);
        experienceModel.candidateId = candidateId;
        await experienceModel.save();
        candidate.workExperiences.push(experienceModel);
    }
};

const saveCandidateResume = async (candidate: Candidate, candidateId: number, cv: any) => {
    if (!cv || Object.keys(cv).length === 0) return;
    const resumeModel = new Resume(cv);
    resumeModel.candidateId = candidateId;
    await resumeModel.save();
    candidate.resumes.push(resumeModel);
};

export const addCandidate = async (candidateData: any, companyId: number) => {
    validateCandidateData(candidateData); // Validar los datos del candidato (lanza su propio Error con mensaje claro si falla)

    const firstStep = await resolveFirstStepForNewApplication(candidateData.positionId, companyId);

    const candidate = new Candidate(candidateData); // Crear una instancia del modelo Candidate
    try {
        const savedCandidate = await candidate.save(); // Guardar el candidato en la base de datos
        const candidateId = savedCandidate.id; // Obtener el ID del candidato guardado

        await saveCandidateEducations(candidate, candidateId, candidateData.educations);
        await saveCandidateWorkExperiences(candidate, candidateId, candidateData.workExperiences);
        await saveCandidateResume(candidate, candidateId, candidateData.cv);

        // Crear la candidatura a la posición elegida, en la primera fase de
        // su flujo de entrevistas -- sin esto, el candidato quedaba
        // guardado pero nunca aparecía en el tablero "Ver proceso" de
        // ninguna posición, porque ese tablero se alimenta de Application,
        // no de la lista general de candidatos. (firstStep ya se validó
        // arriba, antes de guardar nada.) Si no se eligió posición,
        // firstStep sigue siendo null aquí a propósito: el candidato se
        // queda guardado sin ninguna Application, sin asignar.
        if (firstStep) {
            const applicationModel = new Application({
                positionId: candidateData.positionId,
                candidateId,
                applicationDate: new Date(),
                currentInterviewStep: firstStep.id,
            });
            await applicationModel.save();
            candidate.applications.push(applicationModel);
        }

        return savedCandidate;
    } catch (error: any) {
        if (error.code === 'P2002') {
            // Unique constraint failed on the fields: (`email`)
            throw new Error('The email already exists in the database');
        } else {
            throw error;
        }
    }
};

// Candidatos guardados sin ninguna candidatura (ver la nota sobre
// positionId opcional en addCandidate) -- sin esto no existe ninguna
// pantalla en la app donde un candidato así pueda aparecer: Positions
// lista posiciones, y el tablero de cada posición solo lista candidatos
// con Application en esa posición concreta.
export const getUnassignedCandidatesService = async () => {
    const candidates = await prisma.candidate.findMany({
        where: { applications: { none: {} } },
        orderBy: { createdAt: 'desc' }
    });

    return candidates.map(candidate => ({
        id: candidate.id,
        fullName: `${candidate.firstName} ${candidate.lastName}`,
        email: candidate.email,
        createdAt: candidate.createdAt
    }));
};

// A propósito NO permite cambiar o quitar una posición ya asignada --
// Interview.applicationId es RESTRICT (ver schema.prisma), así que borrar
// la Application de un candidato con entrevistas ya registradas fallaría a
// medio camino, dejando el candidato en un estado a medio actualizar.
// Reasignar posición con historial de entrevistas de por medio es una
// decisión de producto mayor (¿qué pasa con esas entrevistas?) que esta
// edición no intenta resolver.
const resolveFirstStepForProfileUpdate = async (
    positionId: number | undefined,
    existingApplicationPositionId: number | undefined,
    companyId: number,
) => {
    if (!positionId) return null;

    if (existingApplicationPositionId !== undefined) {
        if (positionId !== existingApplicationPositionId) {
            throw new Error('Cannot change the position of a candidate that already has an application');
        }
        return null;
    }

    const firstStep = await getFirstInterviewStepForPosition(positionId, companyId);
    if (firstStep === undefined) {
        throw new Error('Selected position not found');
    }
    if (firstStep === null) {
        throw new Error('The selected position does not have an interview process configured');
    }
    return firstStep;
};

// Las listas de educación/experiencia se sustituyen enteras por lo que
// llega en el formulario -- más simple y predecible que intentar adivinar
// cuáles de las entradas anteriores siguen siendo "la misma" para
// actualizarlas en vez de recrearlas (el formulario no manda ningún id de
// entrada, solo su contenido).
const replaceCandidateEducations = async (candidateId: number, educations: any[] | undefined) => {
    await prisma.education.deleteMany({ where: { candidateId } });
    if (!educations) return;
    for (const education of educations) {
        const educationModel = new Education(education);
        educationModel.candidateId = candidateId;
        await educationModel.save();
    }
};

const replaceCandidateWorkExperiences = async (candidateId: number, workExperiences: any[] | undefined) => {
    await prisma.workExperience.deleteMany({ where: { candidateId } });
    if (!workExperiences) return;
    for (const experience of workExperiences) {
        const experienceModel = new WorkExperience(experience);
        experienceModel.candidateId = candidateId;
        await experienceModel.save();
    }
};

// Edita un candidato ya existente: datos personales, educación y
// experiencia laboral, y opcionalmente asignarle una posición si todavía
// no tenía ninguna.
export const updateCandidateProfile = async (id: number, candidateData: any, companyId: number) => {
    validateCandidateData(candidateData);

    const existing = await prisma.candidate.findUnique({ where: { id }, include: { applications: true } });
    if (!existing) {
        throw new Error('Candidate not found');
    }

    const firstStep = await resolveFirstStepForProfileUpdate(
        candidateData.positionId,
        existing.applications[0]?.positionId,
        companyId,
    );

    try {
        await prisma.candidate.update({
            where: { id },
            data: {
                firstName: candidateData.firstName,
                lastName: candidateData.lastName,
                email: candidateData.email,
                phone: candidateData.phone,
                address: candidateData.address,
            },
        });

        await replaceCandidateEducations(id, candidateData.educations);
        await replaceCandidateWorkExperiences(id, candidateData.workExperiences);

        if (firstStep) {
            const applicationModel = new Application({
                positionId: candidateData.positionId,
                candidateId: id,
                applicationDate: new Date(),
                currentInterviewStep: firstStep.id,
            });
            await applicationModel.save();
        }

        // Un CV nuevo se AÑADE, no sustituye al anterior -- igual que en
        // addCandidate, un candidato puede tener varios resumes (ver
        // Candidate.resumes en el modelo de dominio); decidir cuál es "el
        // vigente" no es algo que esta edición necesite resolver todavía.
        if (candidateData.cv && Object.keys(candidateData.cv).length > 0) {
            const resumeModel = new Resume(candidateData.cv);
            resumeModel.candidateId = id;
            await resumeModel.save();
        }

        return await Candidate.findOne(id);
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new Error('The email already exists in the database');
        }
        throw error;
    }
};

export const findCandidateById = async (id: number): Promise<Candidate | null> => {
    try {
        const candidate = await Candidate.findOne(id); // Cambio aquí: pasar directamente el id
        return candidate;
    } catch (error) {
        console.error('Error al buscar el candidato:', error);
        throw new Error('Error al recuperar el candidato');
    }
};

// `score` es opcional a propósito: preguntar la puntuación de la fase que
// se abandona al mover una ficha es útil, pero no debe bloquear el
// movimiento si el usuario no la tiene a mano todavía (o solo está
// reorganizando el tablero). Se cree o no una puntuación, SIEMPRE se deja
// un registro de la entrevista (`Interview`) para la fase anterior -- si
// no, mover una ficha no dejaría ningún rastro de que esa fase se
// completó de verdad, ni de quién la gestionó y cuándo. Ver
// positionService.ts (`calculateAverageScore`): una entrevista con
// `score` en null cuenta como "sin puntuar", no como un cero.
export const updateCandidateStage = async (
    id: number,
    applicationIdNumber: number,
    currentInterviewStep: number,
    employeeId: number,
    companyId: number,
    score?: number,
) => {
    const application = await Application.findOneByPositionCandidateId(applicationIdNumber, id);
    if (!application) {
        throw new Error('Application not found');
    }

    // La candidatura pertenece a una posición, y la posición a una
    // empresa -- sin esto, cualquier empleado autenticado podía mover la
    // candidatura de un candidato en el proceso de OTRA empresa, con solo
    // conocer su applicationId (ver prompts-AGB.md, sección 3.61). Mismo
    // mensaje que "no existe": no hay que confirmar que el id es real si
    // no es tuyo.
    const position = await prisma.position.findUnique({
        where: { id: application.positionId },
        include: { interviewFlow: { include: { interviewSteps: true } } },
    });
    if (position?.companyId !== companyId) {
        throw new Error('Application not found');
    }

    // Hallazgo secundario de la auditoría de la sección 3.61: `currentInterviewStep`
    // llegaba del cliente sin comprobar que esa fase perteneciera al flujo
    // de entrevistas de la propia posición -- se podía dejar a un
    // candidato "en" una fase de un proceso completamente distinto (aunque
    // fuera de la misma empresa, tras el arreglo anterior), sin que nada
    // lo impidiera si algo llama a este endpoint directamente (el
    // desplegable de la interfaz solo ofrece las fases reales, pero eso no
    // es una comprobación real del lado del servidor).
    const targetStepBelongsToFlow = position.interviewFlow.interviewSteps.some(
        (step) => step.id === currentInterviewStep,
    );
    if (!targetStepBelongsToFlow) {
        throw new Error('The target interview step does not belong to this position\'s interview flow');
    }

    const previousInterviewStep = application.currentInterviewStep;

    // Actualizar solo la etapa de la entrevista actual de la aplicación específica
    application.currentInterviewStep = currentInterviewStep;

    // Guardar la aplicación actualizada
    await application.save();

    await new Interview({
        applicationId: applicationIdNumber,
        interviewStepId: previousInterviewStep,
        employeeId,
        interviewDate: new Date(),
        score,
    }).save();

    return application;
};
