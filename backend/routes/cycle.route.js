import express from 'express';
import {
    getCycle,
    saveCycle,
    deleteCycle,
    startSession,
    completeSession,
    skipSession,
    cancelSession,
    restartLap,
} from '../controllers/cycle.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.get('/', verifyToken, getCycle)
router.put('/', verifyToken, saveCycle)
router.delete('/', verifyToken, deleteCycle)
router.post('/sessions/start', verifyToken, startSession)
router.post('/sessions/complete', verifyToken, completeSession)
router.post('/sessions/skip', verifyToken, skipSession)
router.post('/sessions/cancel', verifyToken, cancelSession)
router.post('/restart-lap', verifyToken, restartLap)

export default router;
