import express from "express";
import { createNote, getNotes, deleteNote, updateNote } from "../controllers/note.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/", verifyToken, createNote);
router.get("/:subjectId", verifyToken, getNotes);
router.put("/:id", verifyToken, updateNote);
router.delete("/:id", verifyToken, deleteNote);

export default router;