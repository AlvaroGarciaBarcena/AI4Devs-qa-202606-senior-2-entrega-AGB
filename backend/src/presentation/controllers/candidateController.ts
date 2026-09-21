import { Request, Response } from 'express';
import { addCandidate, findCandidateById, updateCandidateStage, updateCandidateProfile, getUnassignedCandidatesService } from '../../application/services/candidateService';
import { ValidationError } from '../../application/validator';

export const addCandidateController = async (req: Request, res: Response) => {
    try {
        const candidateData = req.body;
        const candidate = await addCandidate(candidateData, req.employee!.companyId);
        res.status(201).json({ message: 'Candidate added successfully', data: candidate });
    } catch (error: unknown) {
        if (error instanceof ValidationError) {
            // Errores de validación: se devuelven como códigos (sin texto ya
            // redactado) para que el frontend los traduzca al idioma del
            // usuario y los asocie al campo concreto que falló.
            res.status(400).json({ message: 'Validation failed', errors: error.issues });
        } else if (error instanceof Error) {
            res.status(400).json({ message: 'Error adding candidate', error: error.message });
        } else {
            res.status(400).json({ message: 'Error adding candidate', error: 'Unknown error' });
        }
    }
};

export const getUnassignedCandidates = async (req: Request, res: Response) => {
    try {
        const candidates = await getUnassignedCandidatesService();
        res.status(200).json(candidates);
    } catch (error) {
        console.error('Error retrieving unassigned candidates:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getCandidateById = async (req: Request, res: Response) => {
    try {
        const id = Number.parseInt(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        const candidate = await findCandidateById(id);
        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }
        res.json(candidate);
    } catch (error) {
        console.error('Error retrieving candidate by id:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateCandidateProfileController = async (req: Request, res: Response) => {
    try {
        const id = Number.parseInt(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        const candidate = await updateCandidateProfile(id, req.body, req.employee!.companyId);
        res.status(200).json({ message: 'Candidate updated successfully', data: candidate });
    } catch (error: unknown) {
        if (error instanceof ValidationError) {
            res.status(400).json({ message: 'Validation failed', errors: error.issues });
        } else if (error instanceof Error) {
            if (error.message === 'Candidate not found') {
                res.status(404).json({ message: 'Candidate not found', error: error.message });
            } else {
                res.status(400).json({ message: 'Error updating candidate', error: error.message });
            }
        } else {
            res.status(400).json({ message: 'Error updating candidate', error: 'Unknown error' });
        }
    }
};

export const updateCandidateStageController = async (req: Request, res: Response) => {
    try {
        const id = Number.parseInt(req.params.id);
        const { applicationId, currentInterviewStep, score } = req.body;
        const applicationIdNumber = Number.parseInt(applicationId);
        if (Number.isNaN(applicationIdNumber)) {
            return res.status(400).json({ error: 'Invalid position ID format' });
        }
        const currentInterviewStepNumber = Number.parseInt(currentInterviewStep);
        if (Number.isNaN(currentInterviewStepNumber)) {
            return res.status(400).json({ error: 'Invalid currentInterviewStep format' });
        }

        // Opcional: ausente/null/cadena vacía significa "sin puntuar", no un
        // error -- ver el comentario de updateCandidateStage en
        // candidateService.ts.
        let scoreValue: number | undefined;
        if (score !== undefined && score !== null && score !== '') {
            const parsedScore = Number(score);
            if (!Number.isInteger(parsedScore) || parsedScore < 0) {
                return res.status(400).json({ error: 'Invalid score: must be a non-negative integer' });
            }
            scoreValue = parsedScore;
        }

        // Garantizado por el middleware requireAuth, que ya protege esta ruta
        // -- de lo contrario esta petición nunca habría llegado hasta aquí.
        const employeeId = req.employee!.sub;

        const updatedCandidate = await updateCandidateStage(id, applicationIdNumber, currentInterviewStepNumber, employeeId, req.employee!.companyId, scoreValue);
        res.status(200).json({ message: 'Candidate stage updated successfully', data: updatedCandidate });
    } catch (error: unknown) {
        if (error instanceof Error) {
            if (error.message === 'Application not found') {
                res.status(404).json({ message: 'Application not found', error: error.message });
            } else {
                res.status(400).json({ message: 'Error updating candidate stage', error: error.message });
            }
        } else {
            res.status(500).json({ message: 'Error updating candidate stage', error: 'Unknown error' });
        }
    }
};
