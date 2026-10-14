import express from 'express';
import { globalSearch } from '../controllers/search.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.get('/', verifyToken, globalSearch)

export default router;
