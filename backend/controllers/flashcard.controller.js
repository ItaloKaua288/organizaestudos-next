import mongoose from "mongoose";
import Deck from "../models/deck.model.js";
import Flashcard from "../models/flashcard.model.js";
import { RATING, SRS_CONFIG, endOfDay, previewIntervals, schedule, startOfDay } from "../utils/srs.js";

const HEX_COLOR = /^#([0-9A-F]{3}){1,2}$/i;
const MAX_BULK_CARDS = 500;

const validId = (id) => mongoose.isValidObjectId(id);
const notFound = (res, what = "Baralho") => res.status(404).json({ success: false, message: `${what} não encontrado.` });
const serverError = (res, label, error) => {
    console.log(`error in ${label} `, error);
    res.status(500).json({ success: false, message: "Server error" });
};
const validationMessage = (error) =>
    error?.name === "ValidationError" ? Object.values(error.errors).map((e) => e.message)[0] : null;

const toCardDto = (card, now = new Date()) => ({
    id: String(card._id),
    deckId: String(card.deck_id),
    front: card.front,
    back: card.back,
    state: card.state,
    step: card.step,
    interval: card.interval,
    ease: card.ease,
    due: card.due,
    reps: card.reps,
    lapses: card.lapses,
    previews: previewIntervals(card, now),
    createdAt: card.createdAt,
});

const toDeckDto = (deck, counts = {}) => ({
    id: String(deck._id),
    name: deck.name,
    description: deck.description ?? "",
    color: deck.color,
    counts: { total: 0, new: 0, learning: 0, review: 0, ...counts },
    createdAt: deck.createdAt,
});

/** Contagens do que está disponível para estudar agora, por baralho (respeitando o limite diário de novos). */
async function countsByDeck(userId, deckIds, now = new Date()) {
    if (deckIds.length === 0) return new Map();

    const learnUntil = new Date(now.getTime() + SRS_CONFIG.learnAheadMinutes * 60_000);
    const today = startOfDay(now);
    const tomorrow = endOfDay(now);
    const isLearning = { $in: ["$state", ["learning", "relearning"]] };

    const rows = await Flashcard.aggregate([
        { $match: { user_id: new mongoose.Types.ObjectId(userId), deck_id: { $in: deckIds } } },
        {
            $group: {
                _id: "$deck_id",
                total: { $sum: 1 },
                newTotal: { $sum: { $cond: [{ $eq: ["$state", "new"] }, 1, 0] } },
                introducedToday: { $sum: { $cond: [{ $gte: ["$introducedAt", today] }, 1, 0] } },
                learning: { $sum: { $cond: [{ $and: [isLearning, { $lte: ["$due", learnUntil] }] }, 1, 0] } },
                review: { $sum: { $cond: [{ $and: [{ $eq: ["$state", "review"] }, { $lt: ["$due", tomorrow] }] }, 1, 0] } },
            },
        },
    ]);

    return new Map(rows.map((row) => [String(row._id), {
        total: row.total,
        new: Math.min(row.newTotal, Math.max(0, SRS_CONFIG.newPerDay - row.introducedToday)),
        learning: row.learning,
        review: Math.min(row.review, SRS_CONFIG.reviewsPerDay),
    }]));
}

// ---------------------------------------------------------------- Baralhos

export const getDecks = async (req, res) => {
    try {
        const decks = await Deck.find({ user_id: req.userId, profile_id: req.profileId }).sort({ createdAt: 1 }).lean();
        const counts = await countsByDeck(req.userId, decks.map((deck) => deck._id));

        res.status(200).json({ success: true, decks: decks.map((deck) => toDeckDto(deck, counts.get(String(deck._id)))) });
    } catch (error) {
        serverError(res, "getDecks", error);
    }
};

export const createDeck = async (req, res) => {
    const { name, description, color } = req.body;

    try {
        if (typeof name !== "string" || !name.trim())
            return res.status(400).json({ success: false, message: "O nome do baralho é obrigatório." });

        if (color !== undefined && (typeof color !== "string" || !HEX_COLOR.test(color.trim())))
            return res.status(400).json({ success: false, message: "Cor inválida." });

        const deck = await Deck.create({
            user_id: req.userId,
            profile_id: req.profileId,
            name,
            description: typeof description === "string" ? description : "",
            ...(color ? { color: color.trim() } : {}),
        });

        res.status(201).json({ success: true, message: "Baralho criado!", deck: toDeckDto(deck.toObject()) });
    } catch (error) {
        const message = validationMessage(error);
        if (message) return res.status(400).json({ success: false, message });
        serverError(res, "createDeck", error);
    }
};

export const updateDeck = async (req, res) => {
    const { id } = req.params;
    const { name, description, color } = req.body;

    try {
        if (!validId(id)) return notFound(res);

        const deck = await Deck.findOne({ _id: id, user_id: req.userId });
        if (!deck) return notFound(res);

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim())
                return res.status(400).json({ success: false, message: "O nome do baralho é obrigatório." });
            deck.name = name;
        }
        if (description !== undefined) deck.description = typeof description === "string" ? description : "";
        if (color !== undefined) {
            if (typeof color !== "string" || !HEX_COLOR.test(color.trim()))
                return res.status(400).json({ success: false, message: "Cor inválida." });
            deck.color = color.trim();
        }

        await deck.save();

        res.status(200).json({ success: true, message: "Baralho atualizado!", deck: toDeckDto(deck.toObject()) });
    } catch (error) {
        const message = validationMessage(error);
        if (message) return res.status(400).json({ success: false, message });
        serverError(res, "updateDeck", error);
    }
};

export const deleteDeck = async (req, res) => {
    const { id } = req.params;

    try {
        if (!validId(id)) return notFound(res);

        const deck = await Deck.findOne({ _id: id, user_id: req.userId });
        if (!deck) return notFound(res);

        await Flashcard.deleteMany({ deck_id: deck._id, user_id: req.userId });
        await deck.deleteOne();

        res.status(200).json({ success: true, message: "Baralho excluído." });
    } catch (error) {
        serverError(res, "deleteDeck", error);
    }
};

/** Baralho + todos os cartões (para a tela de gerenciamento). */
export const getDeck = async (req, res) => {
    const { id } = req.params;

    try {
        if (!validId(id)) return notFound(res);

        const deck = await Deck.findOne({ _id: id, user_id: req.userId }).lean();
        if (!deck) return notFound(res);

        const now = new Date();
        const [cards, counts] = await Promise.all([
            Flashcard.find({ deck_id: deck._id, user_id: req.userId }).sort({ createdAt: -1 }).lean(),
            countsByDeck(req.userId, [deck._id], now),
        ]);

        res.status(200).json({
            success: true,
            deck: toDeckDto(deck, counts.get(String(deck._id))),
            cards: cards.map((card) => toCardDto(card, now)),
        });
    } catch (error) {
        serverError(res, "getDeck", error);
    }
};

// ---------------------------------------------------------------- Cartões

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

/** Cria um cartão ({front, back}) ou vários de uma vez ({cards: [{front, back}]}). */
export const createCards = async (req, res) => {
    const { id } = req.params;

    try {
        if (!validId(id)) return notFound(res);

        const deck = await Deck.findOne({ _id: id, user_id: req.userId }).select("_id").lean();
        if (!deck) return notFound(res);

        const input = Array.isArray(req.body.cards) ? req.body.cards : [req.body];

        if (input.length === 0 || input.length > MAX_BULK_CARDS)
            return res.status(400).json({ success: false, message: `Envie de 1 a ${MAX_BULK_CARDS} cartões por vez.` });

        const docs = [];
        for (const item of input) {
            const front = cleanText(item?.front);
            const back = cleanText(item?.back);
            if (!front || !back)
                return res.status(400).json({ success: false, message: "Preencha a frente e o verso do cartão." });

            docs.push({ user_id: req.userId, deck_id: deck._id, front, back });
        }

        const created = await Flashcard.insertMany(docs);
        const now = new Date();

        res.status(201).json({
            success: true,
            message: created.length === 1 ? "Cartão criado!" : `${created.length} cartões criados!`,
            cards: created.map((card) => toCardDto(card.toObject(), now)),
        });
    } catch (error) {
        const message = validationMessage(error);
        if (message) return res.status(400).json({ success: false, message });
        serverError(res, "createCards", error);
    }
};

export const updateCard = async (req, res) => {
    const { id } = req.params;

    try {
        if (!validId(id)) return notFound(res, "Cartão");

        const front = cleanText(req.body.front);
        const back = cleanText(req.body.back);
        if (!front || !back)
            return res.status(400).json({ success: false, message: "Preencha a frente e o verso do cartão." });

        const card = await Flashcard.findOne({ _id: id, user_id: req.userId });
        if (!card) return notFound(res, "Cartão");

        card.front = front;
        card.back = back;
        await card.save();

        res.status(200).json({ success: true, message: "Cartão atualizado!", card: toCardDto(card.toObject()) });
    } catch (error) {
        const message = validationMessage(error);
        if (message) return res.status(400).json({ success: false, message });
        serverError(res, "updateCard", error);
    }
};

export const deleteCard = async (req, res) => {
    const { id } = req.params;

    try {
        if (!validId(id)) return notFound(res, "Cartão");

        const card = await Flashcard.findOneAndDelete({ _id: id, user_id: req.userId });
        if (!card) return notFound(res, "Cartão");

        res.status(200).json({ success: true, message: "Cartão excluído." });
    } catch (error) {
        serverError(res, "deleteCard", error);
    }
};

/** Zera o agendamento do cartão (volta a ser "novo"). */
export const resetCard = async (req, res) => {
    const { id } = req.params;

    try {
        if (!validId(id)) return notFound(res, "Cartão");

        const card = await Flashcard.findOne({ _id: id, user_id: req.userId });
        if (!card) return notFound(res, "Cartão");

        Object.assign(card, {
            state: "new", step: 0, interval: 0, ease: SRS_CONFIG.startingEase,
            due: new Date(), reps: 0, lapses: 0, introducedAt: null, lastReviewAt: null,
        });
        await card.save();

        res.status(200).json({ success: true, message: "Cartão reiniciado.", card: toCardDto(card.toObject()) });
    } catch (error) {
        serverError(res, "resetCard", error);
    }
};

// ---------------------------------------------------------------- Estudo

/**
 * Fila de estudo do baralho: cartões em aprendizado vencidos, revisões do dia e cartões novos
 * (até o limite diário). Ordem: aprendizado -> revisões -> novos.
 */
export const getStudyQueue = async (req, res) => {
    const { id } = req.params;

    try {
        if (!validId(id)) return notFound(res);

        const deck = await Deck.findOne({ _id: id, user_id: req.userId }).lean();
        if (!deck) return notFound(res);

        const now = new Date();
        const learnUntil = new Date(now.getTime() + SRS_CONFIG.learnAheadMinutes * 60_000);
        const base = { user_id: req.userId, deck_id: deck._id };

        const introducedToday = await Flashcard.countDocuments({ ...base, introducedAt: { $gte: startOfDay(now) } });
        const newLimit = Math.max(0, SRS_CONFIG.newPerDay - introducedToday);

        const [learning, review, fresh] = await Promise.all([
            Flashcard.find({ ...base, state: { $in: ["learning", "relearning"] }, due: { $lte: learnUntil } }).sort({ due: 1 }).lean(),
            Flashcard.find({ ...base, state: "review", due: { $lt: endOfDay(now) } }).sort({ due: 1 }).limit(SRS_CONFIG.reviewsPerDay).lean(),
            newLimit > 0 ? Flashcard.find({ ...base, state: "new" }).sort({ createdAt: 1 }).limit(newLimit).lean() : [],
        ]);

        res.status(200).json({
            success: true,
            deck: { id: String(deck._id), name: deck.name, color: deck.color },
            cards: [...learning, ...review, ...fresh].map((card) => toCardDto(card, now)),
            learnAheadMinutes: SRS_CONFIG.learnAheadMinutes,
        });
    } catch (error) {
        serverError(res, "getStudyQueue", error);
    }
};

/** Registra a avaliação (1 = Errei, 2 = Difícil, 3 = Bom, 4 = Fácil) e devolve o cartão reagendado. */
export const reviewCard = async (req, res) => {
    const { id } = req.params;
    const rating = Number(req.body.rating);

    try {
        if (!validId(id)) return notFound(res, "Cartão");

        if (!Object.values(RATING).includes(rating))
            return res.status(400).json({ success: false, message: "Avaliação inválida." });

        const card = await Flashcard.findOne({ _id: id, user_id: req.userId });
        if (!card) return notFound(res, "Cartão");

        const now = new Date();
        const wasNew = card.state === "new";
        const next = schedule(card.toObject(), rating, now);

        card.state = next.state;
        card.step = next.step;
        card.interval = next.interval;
        card.ease = next.ease;
        card.due = next.due;
        card.reps = next.reps;
        card.lapses = next.lapses;
        card.lastReviewAt = now;
        if (wasNew && !card.introducedAt) card.introducedAt = now;

        await card.save();

        res.status(200).json({ success: true, card: toCardDto(card.toObject(), now) });
    } catch (error) {
        serverError(res, "reviewCard", error);
    }
};

// ---------------------------------------------------------------- Exportar / importar

const MAX_IMPORT_DECKS = 50;
const MAX_IMPORT_CARDS = 5000;
const STATES = ["new", "learning", "review", "relearning"];

const toInt = (value, min, max, fallback) => {
    const n = Math.round(Number(value));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

/** Mantém só campos válidos do agendamento vindos de um arquivo (nunca confia no que chega). */
function sanitizeCard(raw, userId, deckId) {
    const front = cleanText(raw?.front);
    const back = cleanText(raw?.back);
    if (!front || !back) return null;

    const doc = { user_id: userId, deck_id: deckId, front, back };
    const state = STATES.includes(raw?.state) ? raw.state : "new";
    if (state === "new") return doc;

    const due = new Date(raw?.due);
    const ease = Number(raw?.ease);

    return {
        ...doc,
        state,
        step: toInt(raw?.step, 0, 10, 0),
        interval: toInt(raw?.interval, 0, SRS_CONFIG.maxInterval, 0),
        ease: Number.isFinite(ease) ? Math.min(5, Math.max(SRS_CONFIG.minEase, ease)) : SRS_CONFIG.startingEase,
        due: Number.isNaN(due.getTime()) ? new Date() : due,
        reps: toInt(raw?.reps, 0, 100000, 0),
        lapses: toInt(raw?.lapses, 0, 100000, 0),
    };
}

/** Todos os baralhos do perfil ativo, com cartões e progresso (backup). */
export const exportDecks = async (req, res) => {
    try {
        const decks = await Deck.find({ user_id: req.userId, profile_id: req.profileId }).sort({ createdAt: 1 }).lean();
        const cards = await Flashcard.find({ user_id: req.userId, deck_id: { $in: decks.map((deck) => deck._id) } }).sort({ createdAt: 1 }).lean();

        const byDeck = new Map();
        for (const card of cards) {
            const list = byDeck.get(String(card.deck_id)) ?? [];
            list.push({
                front: card.front, back: card.back, state: card.state, step: card.step, interval: card.interval,
                ease: card.ease, due: card.due, reps: card.reps, lapses: card.lapses,
            });
            byDeck.set(String(card.deck_id), list);
        }

        res.status(200).json({
            success: true,
            decks: decks.map((deck) => ({
                name: deck.name, description: deck.description ?? "", color: deck.color, cards: byDeck.get(String(deck._id)) ?? [],
            })),
        });
    } catch (error) {
        serverError(res, "exportDecks", error);
    }
};

/** Cria baralhos (e cartões, com progresso) a partir de um backup. Sempre cria baralhos novos. */
export const importDecks = async (req, res) => {
    try {
        const input = req.body?.decks;

        if (!Array.isArray(input) || input.length === 0)
            return res.status(400).json({ success: false, message: "O arquivo não tem nenhum baralho." });
        if (input.length > MAX_IMPORT_DECKS)
            return res.status(400).json({ success: false, message: `Importe no máximo ${MAX_IMPORT_DECKS} baralhos por vez.` });

        const total = input.reduce((sum, deck) => sum + (Array.isArray(deck?.cards) ? deck.cards.length : 0), 0);
        if (total > MAX_IMPORT_CARDS)
            return res.status(400).json({ success: false, message: `Importe no máximo ${MAX_IMPORT_CARDS} cartões por vez.` });

        for (const deck of input) {
            if (typeof deck?.name !== "string" || !deck.name.trim())
                return res.status(400).json({ success: false, message: "Há um baralho sem nome no arquivo." });
        }

        let decksCreated = 0;
        let cardsCreated = 0;

        for (const item of input) {
            const color = typeof item.color === "string" && HEX_COLOR.test(item.color.trim()) ? item.color.trim() : undefined;
            const deck = await Deck.create({
                user_id: req.userId,
                profile_id: req.profileId,
                name: item.name,
                description: typeof item.description === "string" ? item.description : "",
                ...(color ? { color } : {}),
            });
            decksCreated++;

            const docs = (Array.isArray(item.cards) ? item.cards : [])
                .map((card) => sanitizeCard(card, req.userId, deck._id))
                .filter(Boolean);

            if (docs.length > 0) {
                await Flashcard.insertMany(docs);
                cardsCreated += docs.length;
            }
        }

        res.status(201).json({
            success: true,
            message: `${decksCreated} baralho(s) e ${cardsCreated} cartão(ões) importados!`,
            decks: decksCreated,
            cards: cardsCreated,
        });
    } catch (error) {
        const message = validationMessage(error);
        if (message) return res.status(400).json({ success: false, message });
        serverError(res, "importDecks", error);
    }
};
