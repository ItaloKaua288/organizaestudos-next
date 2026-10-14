import express from 'express';
import { exportData, importData } from '../controllers/data.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.get('/export', verifyToken, exportData)
router.post('/import', verifyToken, importData)

export default router;
