import express from "express";
import multer from "multer";
import {
    createNote,
    getNotes,
    getLinkTargets,
    deleteNote,
    updateNote,
    uploadNoteAttachment,
    removeNoteAttachment,
    streamNoteAttachment
} from "../controllers/note.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB, igual aos anexos de assuntos

// Salva o arquivo só em memória antes de mandar para o Cloudinary
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE } });

// Devolve um erro legível (em vez de uma página HTML) quando o arquivo passa do limite.
const uploadSingleFile = (req, res, next) => {
    upload.single("file")(req, res, (error) => {
        if (!error) return next();

        const message = error.code === "LIMIT_FILE_SIZE"
            ? "O arquivo deve ter no máximo 5 MB."
            : "Não foi possível ler o arquivo enviado.";

        return res.status(400).json({ success: false, message });
    });
};

router.post("/", verifyToken, createNote);
// Rota fixa antes de "/:subjectId", senão o Express trataria "link-targets" como id de matéria.
router.get("/link-targets", verifyToken, getLinkTargets);
router.get("/:subjectId", verifyToken, getNotes);
router.put("/:id", verifyToken, updateNote);
router.delete("/:id", verifyToken, deleteNote);

router.post("/:id/attachments", verifyToken, uploadSingleFile, uploadNoteAttachment);
router.delete("/:id/attachments", verifyToken, removeNoteAttachment);
router.get("/:id/attachments/:publicId", verifyToken, streamNoteAttachment);

export default router;
