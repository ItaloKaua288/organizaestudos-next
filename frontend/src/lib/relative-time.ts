/**
 * Tempo decorrido em português: "agora há pouco", "há 5 min", "há 3 h", "ontem", "há 2 dias",
 * "há 3 meses", "há 1 ano". Devolve "" para datas ausentes ou inválidas.
 */
export function formatRelativeTime(value: string | Date | null | undefined, now: Date = new Date()): string {
    if (!value) return "";

    const date = new Date(value);
    if (isNaN(date.getTime())) return "";

    const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);

    if (minutes < 1) return "agora há pouco";
    if (minutes < 60) return `há ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours} h`;

    const days = Math.floor(hours / 24);
    if (days === 1) return "ontem";
    if (days < 30) return `há ${days} dias`;

    const months = Math.floor(days / 30);
    if (months < 12) return `há ${months} ${months === 1 ? "mês" : "meses"}`;

    const years = Math.floor(days / 365);
    return `há ${years} ${years === 1 ? "ano" : "anos"}`;
}
