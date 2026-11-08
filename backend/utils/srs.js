// Algoritmo de repetição espaçada no estilo do Anki (baseado no SM-2).
//
// Cada cartão guarda: state, step, interval (dias), ease (fator de facilidade) e due (próxima revisão).
//   new         -> nunca estudado
//   learning    -> passando pelos "passos de aprendizado" (minutos)
//   review      -> graduado: o intervalo cresce em dias (intervalo * ease)
//   relearning  -> errou um cartão de revisão: volta aos passos de reaprendizado
//
// Avaliações: 1 = Errei (again), 2 = Difícil (hard), 3 = Bom (good), 4 = Fácil (easy).
// Funções puras (sem banco), para serem fáceis de testar.

export const RATING = { AGAIN: 1, HARD: 2, GOOD: 3, EASY: 4 };

export const SRS_CONFIG = {
    learningSteps: [1, 10],      // minutos
    relearningSteps: [10],       // minutos
    graduatingInterval: 1,       // dias, ao graduar com "Bom"
    easyInterval: 4,             // dias, ao graduar com "Fácil"
    startingEase: 2.5,
    minEase: 1.3,
    hardFactor: 1.2,
    easyBonus: 1.3,
    intervalModifier: 1.0,
    lapseNewInterval: 0,         // multiplicador do intervalo após errar (0 => volta para 1 dia)
    maxInterval: 36500,          // dias
    newPerDay: 20,
    reviewsPerDay: 200,
    learnAheadMinutes: 20,
};

const MINUTE = 60_000;
const DAY = 86_400_000;
// O app trabalha no horário de Brasília (sem horário de verão desde 2019): UTC-3.
const TZ_OFFSET_MS = -3 * 60 * MINUTE;

/** Início (00:00 de Brasília) do dia de `date`, como instante UTC. */
export const startOfDay = (date = new Date()) =>
    new Date(Math.floor((date.getTime() + TZ_OFFSET_MS) / DAY) * DAY - TZ_OFFSET_MS);

/** Fim do dia (exclusivo) = início do dia seguinte. */
export const endOfDay = (date = new Date()) => new Date(startOfDay(date).getTime() + DAY);

const clampEase = (ease) => Math.max(SRS_CONFIG.minEase, Math.round(ease * 100) / 100);
const capInterval = (days) => Math.min(SRS_CONFIG.maxInterval, Math.max(1, Math.round(days)));

/** Intervalos de revisão vencem no início do dia (como no Anki), não "daqui a 24h exatas". */
const dueInDays = (days, now) => new Date(startOfDay(now).getTime() + days * DAY);
const dueInMinutes = (minutes, now) => new Date(now.getTime() + minutes * MINUTE);

/** Atraso (em dias inteiros) de um cartão de revisão vencido. */
const daysOverdue = (card, now) => {
    if (!card.due) return 0;
    return Math.max(0, Math.floor((startOfDay(now).getTime() - startOfDay(new Date(card.due)).getTime()) / DAY));
};

/** Atraso (min) ao apertar "Difícil" em um passo de aprendizado. */
function hardDelay(steps, step) {
    if (steps.length === 1) return Math.round(steps[0] * 1.5);
    if (step === 0) return Math.round((steps[0] + steps[1]) / 2);
    return steps[Math.min(step, steps.length - 1)];
}

/** Estado inicial de um cartão novo (usado pelo model). */
export const newCardState = () => ({
    state: "new",
    step: 0,
    interval: 0,
    ease: SRS_CONFIG.startingEase,
    reps: 0,
    lapses: 0,
});

function scheduleLearning(card, rating, now, steps, kind) {
    const base = { ...card, reps: (card.reps ?? 0) + 1 };
    const learningState = kind === "relearning" ? "relearning" : "learning";

    const graduate = (interval) => ({
        ...base,
        state: "review",
        step: 0,
        interval,
        due: dueInDays(interval, now),
    });

    if (rating === RATING.AGAIN) {
        return { ...base, state: learningState, step: 0, due: dueInMinutes(steps[0], now) };
    }

    if (rating === RATING.HARD) {
        const step = Math.min(card.step ?? 0, steps.length - 1);
        return { ...base, state: learningState, step, due: dueInMinutes(hardDelay(steps, step), now) };
    }

    if (rating === RATING.GOOD) {
        const next = (card.step ?? 0) + 1;
        if (next >= steps.length) {
            // Reaprendizado volta ao intervalo guardado; aprendizado novo usa o intervalo de graduação.
            return graduate(kind === "relearning" ? capInterval(card.interval || 1) : SRS_CONFIG.graduatingInterval);
        }
        return { ...base, state: learningState, step: next, due: dueInMinutes(steps[next], now) };
    }

    // EASY
    return graduate(kind === "relearning" ? capInterval((card.interval || 1) + 1) : SRS_CONFIG.easyInterval);
}

function scheduleReview(card, rating, now) {
    const { hardFactor, easyBonus, intervalModifier, lapseNewInterval } = SRS_CONFIG;
    const interval = Math.max(1, card.interval || 1);
    const ease = card.ease || SRS_CONFIG.startingEase;
    const overdue = daysOverdue(card, now);
    const base = { ...card, reps: (card.reps ?? 0) + 1 };

    if (rating === RATING.AGAIN) {
        const steps = SRS_CONFIG.relearningSteps;
        return {
            ...base,
            state: "relearning",
            step: 0,
            lapses: (card.lapses ?? 0) + 1,
            ease: clampEase(ease - 0.2),
            interval: capInterval(interval * lapseNewInterval),
            due: dueInMinutes(steps[0], now),
        };
    }

    // Cada botão sempre rende pelo menos 1 dia a mais que o anterior (Difícil < Bom < Fácil).
    const hardInterval = capInterval(Math.max(interval * hardFactor * intervalModifier, interval + 1));
    const goodInterval = capInterval(Math.max((interval + overdue / 2) * ease * intervalModifier, hardInterval + 1));
    const easyInterval = capInterval(Math.max((interval + overdue) * ease * easyBonus * intervalModifier, goodInterval + 1));

    if (rating === RATING.HARD) {
        return { ...base, state: "review", ease: clampEase(ease - 0.15), interval: hardInterval, due: dueInDays(hardInterval, now) };
    }
    if (rating === RATING.GOOD) {
        return { ...base, state: "review", ease, interval: goodInterval, due: dueInDays(goodInterval, now) };
    }
    return { ...base, state: "review", ease: clampEase(ease + 0.15), interval: easyInterval, due: dueInDays(easyInterval, now) };
}

/** Calcula o novo estado do cartão para uma avaliação (1 a 4). Não altera o cartão original. */
export function schedule(card, rating, now = new Date()) {
    const current = { ...newCardState(), ...card };
    const state = current.state ?? "new";

    if (state === "review") return scheduleReview(current, rating, now);
    if (state === "relearning") return scheduleLearning(current, rating, now, SRS_CONFIG.relearningSteps, "relearning");
    // "new" e "learning" usam os mesmos passos de aprendizado.
    return scheduleLearning(current, rating, now, SRS_CONFIG.learningSteps, "learning");
}

const DECIMAL = (n) => String(Math.round(n * 10) / 10).replace(".", ",");

/** Intervalo em dias para texto: "1 d", "2,5 meses", "1,2 anos". */
export function formatDays(days) {
    if (days < 30) return `${days} d`;
    if (days < 365) return `${DECIMAL(days / 30)} ${days < 45 ? "mês" : "meses"}`;
    return `${DECIMAL(days / 365)} ${days < 548 ? "ano" : "anos"}`;
}

/** "<1 min", "10 min", "3 h" (só para passos de aprendizado, em minutos/horas). */
export function formatDelay(from, to) {
    const minutes = Math.round(Math.max(0, to.getTime() - from.getTime()) / MINUTE);

    if (minutes < 1) return "<1 min";
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 60 * 24) return `${Math.round(minutes / 60)} h`;
    return formatDays(Math.max(1, Math.round(minutes / (60 * 24))));
}

/** Texto de cada botão (quanto tempo até a próxima revisão) sem alterar o cartão. */
export function previewIntervals(card, now = new Date()) {
    const label = (rating) => {
        const next = schedule(card, rating, now);
        // Cartões graduados vencem por dia; os demais por minutos.
        return next.state === "review" ? formatDays(next.interval) : formatDelay(now, next.due);
    };
    return { again: label(1), hard: label(2), good: label(3), easy: label(4) };
}
