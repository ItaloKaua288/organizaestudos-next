import mongoose from "mongoose";
import { DEFAULT_DECK_SETTINGS } from "../utils/srs.js";

// Baralho de flashcards. Pertence ao perfil de estudo ativo (como as matérias).
const deckSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    profile_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
        default: null
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [80, "O nome do baralho não pode exceder 80 caracteres"]
    },
    description: {
        type: String,
        default: "",
        trim: true,
        maxlength: [300, "A descrição não pode exceder 300 caracteres"]
    },
    color: {
        type: String,
        default: "#3b82f6"
    },
    // Limites diários e passos de aprendizado deste baralho (validados em utils/srs.js).
    settings: {
        newPerDay: { type: Number, default: DEFAULT_DECK_SETTINGS.newPerDay },
        reviewsPerDay: { type: Number, default: DEFAULT_DECK_SETTINGS.reviewsPerDay },
        learningSteps: { type: [Number], default: () => [...DEFAULT_DECK_SETTINGS.learningSteps] },
        relearningSteps: { type: [Number], default: () => [...DEFAULT_DECK_SETTINGS.relearningSteps] },
        graduatingInterval: { type: Number, default: DEFAULT_DECK_SETTINGS.graduatingInterval },
        easyInterval: { type: Number, default: DEFAULT_DECK_SETTINGS.easyInterval },
    }
}, { timestamps: true });

deckSchema.index({ user_id: 1, profile_id: 1 });

const Deck = mongoose.model("Deck", deckSchema);

export default Deck;
