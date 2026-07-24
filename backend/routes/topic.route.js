import express from 'express';
import multer from 'multer';
import { createTopic, deleteTopic, getTopics, getAllTopics, reorderTopics, updateTopic, uploadAttachment, removeAttachment, concludedReview, streamPdf, UndoCompletedReview } from '../controllers/topic.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Configurando o multer para salvar temporariamente em memória
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", verifyToken, createTopic);
router.get("/", verifyToken, getAllTopics);
router.get("/:subject_id", verifyToken, getTopics);
router.put("/:id", verifyToken, updateTopic);
router.delete("/:id", verifyToken, deleteTopic);
router.put('/reorder-topics', verifyToken, reorderTopics);
router.put('/concluded-review/:id/:review', verifyToken, concludedReview);
router.put('/undo-review/:id/:review', verifyToken, UndoCompletedReview);


// NOVAS ROTAS DE ARQUIVO
router.post("/attachment/:id", verifyToken, upload.single('file'), uploadAttachment);
router.delete("/attachment/:id", verifyToken, removeAttachment);

router.get("/stream-pdf/:topicId/:publicId", verifyToken, streamPdf);

export default router;
