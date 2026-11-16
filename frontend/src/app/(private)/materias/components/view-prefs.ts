import { Subject } from "@/types/subject";
import { Topic } from "@/types/topic";
import { getSubjectStats } from "@/lib/subject-stats";

/** Como a lista de matérias é ordenada e filtrada (salvo em cookie, como o layout). */
export const VIEW_COOKIE = "materias_view";

export type SubjectSort = "manual" | "nome" | "progresso";

export type MateriasViewPrefs = {
    sort: SubjectSort;
    hideDone: boolean;
    hideInactive: boolean;
};

export const DEFAULT_VIEW_PREFS: MateriasViewPrefs = { sort: "manual", hideDone: false, hideInactive: false };

/** A busca só aparece a partir dessa quantidade de matérias ("quando a lista crescer"). */
export const SEARCH_MIN_SUBJECTS = 6;

/** Formato do cookie: "sort:hideDone:hideInactive", por exemplo "progresso:1:0". */
export function parseViewPrefs(value: string | undefined | null): MateriasViewPrefs {
    if (!value) return DEFAULT_VIEW_PREFS;

    const [sort, hideDone, hideInactive] = value.split(":");

    return {
        sort: sort === "nome" || sort === "progresso" ? sort : "manual",
        hideDone: hideDone === "1",
        hideInactive: hideInactive === "1",
    };
}

export function serializeViewPrefs(prefs: MateriasViewPrefs): string {
    return `${prefs.sort}:${prefs.hideDone ? 1 : 0}:${prefs.hideInactive ? 1 : 0}`;
}

type SubjectWithTopics = Subject & { topics: Topic[] };

/** Minúsculas e sem acentos, para a busca achar "informatica" ao digitar "Informática". */
export function normalizeText(text: string): string {
    return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Matéria ativa, com assuntos e todos concluídos. */
export function isSubjectComplete(subject: SubjectWithTopics): boolean {
    if (subject.active === false) return false;
    const { total, pending } = getSubjectStats(subject.topics);
    return total > 0 && pending === 0;
}

/**
 * Aplica busca, filtros e ordenação. `subjects` deve vir na ordem manual:
 * ela é a ordem usada no modo "manual" e no desempate dos outros modos.
 */
export function applyView(subjects: SubjectWithTopics[], prefs: MateriasViewPrefs, query: string): SubjectWithTopics[] {
    const needle = normalizeText(query);

    let result = subjects.filter((subject) => {
        if (needle && !normalizeText(subject.title).includes(needle)) return false;
        if (prefs.hideInactive && subject.active === false) return false;
        if (prefs.hideDone && isSubjectComplete(subject)) return false;
        return true;
    });

    if (prefs.sort === "nome") {
        result = [...result].sort((a, b) =>
            a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base", numeric: true })
        );
    } else if (prefs.sort === "progresso") {
        // Menos concluída primeiro. Matérias sem assuntos e desativadas não têm progresso:
        // vão para o fim (nessa ordem). O desempate segue a ordem manual (sort é estável).
        const rank = (subject: SubjectWithTopics) => {
            if (subject.active === false) return { group: 2, percent: 0 };
            const { total, percent } = getSubjectStats(subject.topics);
            return total === 0 ? { group: 1, percent: 0 } : { group: 0, percent };
        };

        result = [...result].sort((a, b) => {
            const ra = rank(a);
            const rb = rank(b);
            return ra.group - rb.group || ra.percent - rb.percent;
        });
    }

    return result;
}
