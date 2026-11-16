import express from 'express';
import { createSubject, deleteSubject, getDetailSubject, getSubjects, reorderSubjects, toggleSubjectActive, updateSubject } from '../controllers/subject.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';


const router = express.Router();

router.post("/", verifyToken, createSubject);
router.get("/", verifyToken, getSubjects);
// Precisa vir antes das rotas com "/:id", senão "reorder" seria lido como um id.
router.put("/reorder", verifyToken, reorderSubjects);
router.get("/:id", verifyToken, getDetailSubject)
router.delete("/:id", verifyToken, deleteSubject);
router.put("/:id", verifyToken, updateSubject);
router.patch("/:id/active", verifyToken, toggleSubjectActive);

export default router;