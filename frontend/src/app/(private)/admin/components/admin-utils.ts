import { AdminUser } from "@/types/admin";

export const TIMEZONE = "America/Sao_Paulo";

export type FilterKey = "all" | "admins" | "unverified" | "idle";
export type SortKey = "joined" | "access" | "topics" | "name";
/** Faixa de recência do último acesso: até 7 dias, de 8 a 30 dias, ou mais que isso (ou nunca). */
export type ActivityTier = "recent" | "mid" | "idle";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: "joined", label: "Cadastro mais recente" },
    { value: "access", label: "Acesso mais recente" },
    { value: "topics", label: "Mais assuntos" },
    { value: "name", label: "Nome (A a Z)" },
];

const DAY_MS = 86_400_000;

// "2026-10-14": o dia no fuso de São Paulo, para "hoje" e "ontem" baterem com o calendário do usuário.
const dayKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(date);

/** Quantos dias de calendário se passaram desde a data. null quando a data não existe ou é inválida. */
export function daysSince(value: string | null | undefined, now: number): number | null {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    const diff = Math.round((Date.parse(dayKey(new Date(now))) - Date.parse(dayKey(date))) / DAY_MS);
    return Math.max(0, diff);
}

export function activityTier(lastLogin: string | null | undefined, now: number): ActivityTier {
    const days = daysSince(lastLogin, now);
    if (days === null || days > 30) return "idle";
    return days <= 7 ? "recent" : "mid";
}

export function relativeDays(days: number): string {
    if (days === 0) return "hoje";
    if (days === 1) return "ontem";
    if (days < 30) return `há ${days} dias`;
    if (days < 365) {
        const months = Math.floor(days / 30);
        return months === 1 ? "há 1 mês" : `há ${months} meses`;
    }
    const years = Math.floor(days / 365);
    return years === 1 ? "há 1 ano" : `há ${years} anos`;
}

export function accessText(lastLogin: string | null | undefined, now: number): string {
    const days = daysSince(lastLogin, now);
    return days === null ? "Nunca acessou" : `Acessou ${relativeDays(days)}`;
}

export function formatDate(value: string | null | undefined, withTime = false): string {
    if (!value) return "—";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        ...(withTime ? { timeStyle: "short" } : {}),
        timeZone: TIMEZONE,
    }).format(date);
}

/** Minutos em texto curto: "2 h 30 min". */
export function formatStudyTime(minutes: number): string {
    const total = Math.max(0, Math.round(minutes || 0));
    const hours = Math.floor(total / 60);
    const rest = total % 60;
    if (hours === 0) return `${rest} min`;
    if (rest === 0) return `${hours} h`;
    return `${hours} h ${rest} min`;
}

export function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    const first = parts[0][0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
}

export function count(value: number, one: string, many: string): string {
    return `${value.toLocaleString("pt-BR")} ${value === 1 ? one : many}`;
}

const normalize = (text: string) =>
    text
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();

export function matchesQuery(user: AdminUser, query: string): boolean {
    const needle = normalize(query.trim());
    if (!needle) return true;
    return normalize(user.name).includes(needle) || normalize(user.email).includes(needle);
}

export function matchesFilter(user: AdminUser, filter: FilterKey, now: number): boolean {
    switch (filter) {
        case "admins":
            return user.isAdmin;
        case "unverified":
            return !user.isVerified;
        case "idle":
            return activityTier(user.lastLogin, now) === "idle";
        default:
            return true;
    }
}

const time = (value: string | null | undefined) => {
    const parsed = value ? Date.parse(value) : NaN;
    return isNaN(parsed) ? 0 : parsed;
};

export function sortUsers(users: AdminUser[], sort: SortKey): AdminUser[] {
    const list = [...users];
    switch (sort) {
        case "access":
            return list.sort((a, b) => time(b.lastLogin) - time(a.lastLogin));
        case "topics":
            return list.sort((a, b) => b.topicsCount - a.topicsCount || a.name.localeCompare(b.name, "pt-BR"));
        case "name":
            return list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
        default:
            return list.sort((a, b) => time(b.createdAt) - time(a.createdAt));
    }
}
