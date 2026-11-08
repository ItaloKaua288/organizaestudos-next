import mongoose from "mongoose";
import { SRS_CONFIG } from "../utils/srs.js";

export const MAX_CARD_TEXT = 5000;

const flashcardSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    deck_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Deck",
        required: true
    },
    // Frente (pergunta/termo) e verso (resposta/definição), em texto simples.
    front: {
        type: String,
        required: true,
        trim: true,
        maxlength: [MAX_CARD_TEXT, `A frente não pode exceder ${MAX_CARD_TEXT} caracteres`]
    },
    back: {
        type: String,
        required: true,
        trim: true,
        maxlength: [MAX_CARD_TEXT, `O verso não pode exceder ${MAX_CARD_TEXT} caracteres`]
    },

    // ----- Agendamento (algoritmo SM-2 / estilo Anki, veja utils/srs.js) -----
    state: {
        type: String,
        enum: ["new", "learning", "review", "relearning"],
        default: "new"
    },
    // Posição nos passos de aprendizado (minutos) enquanto learning/relearning.
    step: { type: Number, default: 0 },
    // Intervalo atual, em dias.
    interval: { type: Number, default: 0 },
    // Fator de facilidade (multiplicador do intervalo). Começa em 2,5 (250%).
    ease: { type: Number, default: SRS_CONFIG.startingEase },
    // Data da próxima revisão.
    due: { type: Date, default: () => new Date() },
    reps: { type: Number, default: 0 },
    lapses: { type: Number, default: 0 },
    // Quando o cartão foi estudado pela primeira vez (controla o limite de cartões novos por dia).
    introducedAt: { type: Date, default: null },
    lastReviewAt: { type: Date, default: null },
}, { timestamps: true });

flashcardSchema.index({ user_id: 1, deck_id: 1, state: 1, due: 1 });

const Flashcard = mongoose.model("Flashcard", flashcardSchema);

export default Flashcard;
