import express from 'express';
import { addSubjectTimeLine, getTimeline, deleteTimeLine, updateTimeLine } from '../controllers/timeLine.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/', verifyToken, addSubjectTimeLine)
router.get('/', verifyToken, getTimeline)
router.delete('/:id', verifyToken, deleteTimeLine)
router.put('/:id', verifyToken, updateTimeLine)

export default router;