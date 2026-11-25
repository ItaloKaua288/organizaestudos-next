import Profile from "../models/profile.model.js";
import Subject from "../models/subject.model.js";
import Topic from "../models/topic.model.js";

/*
 * LIMITE DIÁRIO DE REVISÕES
 * Cada perfil pode definir um máximo de revisões por dia (Profile.reviewDailyLimit; null = sem limite).
 * Ao agendar uma revisão, se o dia ideal já está cheio, ela vai para o dia mais próximo DEPOIS dele
 * que ainda tem vaga (nunca antes, para não encurtar o intervalo de memorização).
 * Só as revisões novas são afetadas: as que já estavam agendadas não são movidas.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
// Trava de segurança para o laço de busca (um ano para frente é mais que suficiente).
const MAX_SHIFT_DAYS = 366;

const REVIEW_KEYS = ["review1", "review2", "review3"];

// As datas são guardadas à meia-noite do dia (de Brasília), então a parte da data em UTC identifica o dia.
const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

/** Limite diário do perfil (inteiro positivo) ou null quando não há limite. */
export const getReviewDailyLimit = async (userId, profileId) => {
    if (!profileId) return null;

    const profile = await Profile.findOne({ _id: profileId, user_id: userId }).select("reviewDailyLimit").lean();
    const limit = profile?.reviewDailyLimit;

    return Number.isInteger(limit) && limit > 0 ? limit : null;
};

// Quantas revisões pendentes (ainda não concluídas) existem em cada dia, no perfil.
// `skipTopicId` + `skipKeys`: ignora essas datas de um assunto (as que estão prestes a ser reagendadas).
const loadPendingCounts = async ({ userId, profileId, skipTopicId, skipKeys }) => {
    const subjects = await Subject.find({ user_id: userId, profile_id: profileId, active: { $ne: false } }).select("_id").lean();
    const subjectIds = subjects.map((subject) => subject._id);

    const parentIds = await Topic.distinct("parent_id", { subject_id: { $in: subjectIds }, parent_id: { $ne: null } });

    const topics = await Topic.find({
        _id: { $nin: parentIds },
        subject_id: { $in: subjectIds },
        status: "CONCLUIDO",
    }).select("review1 review2 review3 review1_concluded review2_concluded review3_concluded").lean();

    const counts = new Map();

    for (const topic of topics) {
        const isCurrent = skipTopicId && String(topic._id) === String(skipTopicId);

        for (const key of REVIEW_KEYS) {
            if (!topic[key] || topic[`${key}_concluded`]) continue;
            if (isCurrent && skipKeys.includes(key)) continue;

            const day = dayKey(topic[key]);
            counts.set(day, (counts.get(day) ?? 0) + 1);
        }
    }

    return counts;
};

/**
 * Cria o "agendador" de um assunto. Use `place(dataIdeal)` para cada revisão a agendar:
 * devolve a própria data ideal ou o dia mais próximo (para frente) com vaga.
 * Cada data devolvida já passa a contar no limite, então várias chamadas seguidas se respeitam.
 *
 * @param {object} options
 * @param {*} options.userId
 * @param {*} options.profileId
 * @param {*} options.topicId  assunto que está sendo reagendado (as datas dele em `skipKeys` não contam)
 * @param {string[]} options.skipKeys  quais datas do assunto serão substituídas (ex.: ["review1", "review2"])
 */
export const createReviewPlanner = async ({ userId, profileId, topicId, skipKeys = [] }) => {
    const limit = await getReviewDailyLimit(userId, profileId);
    const counts = limit ? await loadPendingCounts({ userId, profileId, skipTopicId: topicId, skipKeys }) : null;

    const add = (date) => {
        if (!counts) return;
        const key = dayKey(date);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    };

    return {
        limit,

        // Registra uma data que já está definida (ex.: a revisão 1 escolhida à mão) para entrar na contagem.
        reserve: (date) => {
            if (date) add(date);
        },

        // `notBefore` mantém a ordem das revisões (a 2ª nunca antes da 1ª, etc.).
        place: (idealDate, notBefore = null) => {
            const startMs = Math.max(idealDate.getTime(), notBefore ? notBefore.getTime() : 0);
            const start = new Date(startMs);

            if (!counts) return start;

            for (let offset = 0; offset <= MAX_SHIFT_DAYS; offset++) {
                const candidate = new Date(startMs + offset * DAY_MS);

                if ((counts.get(dayKey(candidate)) ?? 0) < limit) {
                    add(candidate);
                    return candidate;
                }
            }

            // Sem vaga em um ano (limite absurdamente baixo): mantém a data ideal.
            add(start);
            return start;
        },
    };
};

export const parseReviewDailyLimit = (value) => {
    if (value === null || value === "" || value === undefined) return { ok: true, limit: null };

    const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;

    if (typeof number !== "number" || !Number.isInteger(number) || number < 1 || number > 200) return { ok: false };

    return { ok: true, limit: number };
};
