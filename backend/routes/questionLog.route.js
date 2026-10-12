import express from 'express';
import { createQuestionLogs, deleteQuestionLog, getQuestionStats } from '../controllers/questionLog.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/', verifyToken, createQuestionLogs)
router.get('/stats', verifyToken, getQuestionStats)
router.delete('/:id', verifyToken, deleteQuestionLog)

export default router;
