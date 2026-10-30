import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Profile from "../models/profile.model.js";
import Subject from "../models/subject.model.js";
import StudyCycle from "../models/studyCycle.model.js";

export const DEFAULT_PROFILE_NAME = "Geral";

const firstProfile = (userId) => Profile.findOne({ user_id: userId }).sort({ createdAt: 1, _id: 1 });

// Cache curto (em memória, por instância) do perfil resolvido. Evita 1-2 consultas ao banco em TODA
// requisição (o dashboard, por exemplo, faz 3 chamadas em paralelo). Dura pouco e é limpo ao
// criar/excluir perfis, então nunca fica muito defasado.
const PROFILE_CACHE_TTL_MS = 30_000;
const PROFILE_CACHE_MAX = 500;
const profileCache = new Map(); // `${userId}:${requested}` -> { id, expires }

export const clearProfileCache = (userId) => {
    if (!userId) return profileCache.clear();
    const prefix = `${userId}:`;
    for (const key of profileCache.keys()) if (key.startsWith(prefix)) profileCache.delete(key);
};

// Garante que o usuário tenha ao menos um perfil. Na primeira vez, cria o perfil "Geral" e leva
// para ele as matérias e o ciclo que já existiam (dados criados antes dos perfis existirem).
// É seguro chamar em paralelo: o índice único (user_id + nome) impede perfis duplicados.
export const ensureDefaultProfile = async (userId) => {
    const existing = await firstProfile(userId);
    if (existing) return existing;

    let profile;
    try {
        profile = await Profile.create({ user_id: userId, name: DEFAULT_PROFILE_NAME });
    } catch (error) {
        if (error?.code !== 11000) throw error;
        profile = await firstProfile(userId);
    }

    await Subject.updateMany({ user_id: userId, profile_id: null }, { $set: { profile_id: profile._id } });
    await StudyCycle.updateMany({ user_id: userId, profile_id: null }, { $set: { profile_id: profile._id } });

    return profile;
};

// Descobre o perfil ativo da requisição (header `x-profile-id`) e o coloca em `req.profileId`.
// Se o header faltar, for inválido ou for de outro usuário, usa o primeiro perfil do usuário.
// Não responde 401: a autenticação continua sendo feita pelo verifyToken de cada rota.
export const attachProfile = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        if (!token) return next();

        let userId;
        try {
            userId = jwt.verify(token, process.env.JWT_SECRET)?.userId;
        } catch {
            return next();
        }
        if (!userId) return next();

        const requested = req.headers["x-profile-id"];
        const cacheKey = `${userId}:${typeof requested === "string" ? requested : ""}`;

        const cached = profileCache.get(cacheKey);
        if (cached && cached.expires > Date.now()) {
            req.profileId = cached.id;
            return next();
        }

        let profile = null;

        if (typeof requested === "string" && mongoose.isValidObjectId(requested)) {
            profile = await Profile.findOne({ _id: requested, user_id: userId }).select("_id").lean();
        }
        if (!profile) profile = await ensureDefaultProfile(userId);

        if (profileCache.size >= PROFILE_CACHE_MAX) profileCache.clear();
        profileCache.set(cacheKey, { id: profile._id, expires: Date.now() + PROFILE_CACHE_TTL_MS });

        req.profileId = profile._id;
        req.profile = profile;
        next();
    } catch (error) {
        console.log("error in attachProfile ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Filtro padrão de matérias: só as do usuário logado dentro do perfil ativo.
export const subjectScope = (req, extra = {}) => ({ user_id: req.userId, profile_id: req.profileId, ...extra });
