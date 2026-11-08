import express from "express";
import {
    createCards,
    createDeck,
    deleteCard,
    deleteDeck,
    exportDecks,
    getDeck,
    getDecks,
    getStudyQueue,
    importDecks,
    resetCard,
    reviewCard,
    updateCard,
    updateDeck
} from "../controllers/flashcard.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Backup: exportar / importar baralhos com cartões e progresso
router.get("/export", verifyToken, exportDecks);
router.post("/import", verifyToken, importDecks);

// Baralhos
router.get("/decks", verifyToken, getDecks);
router.post("/decks", verifyToken, createDeck);
router.get("/decks/:id", verifyToken, getDeck);
router.put("/decks/:id", verifyToken, updateDeck);
router.delete("/decks/:id", verifyToken, deleteDeck);

// Cartões de um baralho e sessão de estudo
router.post("/decks/:id/cards", verifyToken, createCards);
router.get("/decks/:id/study", verifyToken, getStudyQueue);

// Cartões
router.put("/cards/:id", verifyToken, updateCard);
router.delete("/cards/:id", verifyToken, deleteCard);
router.post("/cards/:id/review", verifyToken, reviewCard);
router.post("/cards/:id/reset", verifyToken, resetCard);

export default router;
