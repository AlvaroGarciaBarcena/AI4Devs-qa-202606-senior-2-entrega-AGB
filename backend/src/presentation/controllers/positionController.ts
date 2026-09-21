import { Request, Response } from 'express';
import { getAllPositionsService, getCandidatesByPositionService, getInterviewFlowByPositionService, addInterviewStepService } from '../../application/services/positionService';

const MAX_STEP_NAME_LENGTH = 100;

// `getCandidatesByPosition`/`getInterviewFlowByPosition` devuelven la clave
// `message`; `addInterviewStep` devuelve `error` -- diferencia real y
// deliberada de este código (así lo esperan sus tests), no algo a unificar
// aquí de paso.
const parsePositionId = (req: Request, res: Response, errorKey: 'message' | 'error'): number | null => {
    const positionId = parseInt(req.params.id);
    if (isNaN(positionId)) {
        res.status(400).json({ [errorKey]: 'Invalid position ID format' });
        return null;
    }
    return positionId;
};

// Patrón compartido por getCandidatesByPosition y addInterviewStep: el
// mensaje "Position not found" del servicio (empresa distinta o posición
// inexistente, ver positionService.ts) se traduce a 404; cualquier otro
// error, a 500 con un mensaje propio de cada endpoint.
// getInterviewFlowByPosition NO sigue este mismo patrón (cualquier error
// ahí se traduce a 404) -- comportamiento ya existente, no tocado aquí.
const handleNotFoundOrServerError = (res: Response, error: unknown, fallbackMessage: string) => {
    if (error instanceof Error && error.message === 'Position not found') {
        res.status(404).json({ message: 'Position not found', error: error.message });
    } else if (error instanceof Error) {
        res.status(500).json({ message: fallbackMessage, error: error.message });
    } else {
        res.status(500).json({ message: fallbackMessage, error: String(error) });
    }
};

export const getAllPositions = async (req: Request, res: Response) => {
    try {
        const positions = await getAllPositionsService(req.employee!.companyId);
        res.status(200).json(positions);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: 'Error retrieving positions', error: error.message });
        } else {
            res.status(500).json({ message: 'Error retrieving positions', error: String(error) });
        }
    }
};

export const getCandidatesByPosition = async (req: Request, res: Response) => {
    try {
        const positionId = parsePositionId(req, res, 'message');
        if (positionId === null) return;
        const candidates = await getCandidatesByPositionService(positionId, req.employee!.companyId);
        res.status(200).json(candidates);
    } catch (error) {
        handleNotFoundOrServerError(res, error, 'Error retrieving candidates');
    }
};

export const getInterviewFlowByPosition = async (req: Request, res: Response) => {
    try {
        const positionId = parsePositionId(req, res, 'message');
        if (positionId === null) return;
        const interviewFlow = await getInterviewFlowByPositionService(positionId, req.employee!.companyId);
        res.status(200).json({ interviewFlow });
    } catch (error) {
        if (error instanceof Error) {
            res.status(404).json({ message: 'Position not found', error: error.message });
        } else {
            res.status(500).json({ message: 'Server error', error: String(error) });
        }
    }
};

export const addInterviewStep = async (req: Request, res: Response) => {
    try {
        const positionId = parsePositionId(req, res, 'error');
        if (positionId === null) return;

        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
        if (!name) {
            return res.status(400).json({ error: 'Phase name is required' });
        }
        if (name.length > MAX_STEP_NAME_LENGTH) {
            return res.status(400).json({ error: `Phase name must be ${MAX_STEP_NAME_LENGTH} characters or fewer` });
        }

        const interviewStep = await addInterviewStepService(positionId, name, req.employee!.companyId);
        res.status(201).json({ message: 'Interview step added successfully', data: interviewStep });
    } catch (error) {
        handleNotFoundOrServerError(res, error, 'Error adding interview step');
    }
};