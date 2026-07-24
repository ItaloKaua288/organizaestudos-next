import express from 'express';
import { createSubject, deleteSubject, getSubjects, updateSubject } from '../controllers/subject.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';


const router = express.Router();

router.post("/", verifyToken, createSubject);
router.get("/", verifyToken, getSubjects);
router.delete("/:id", verifyToken, deleteSubject);
router.put("/:id", verifyToken, updateSubject);

export default router;