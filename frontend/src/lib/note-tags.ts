export const MAX_NOTE_TAGS = 8;
export const MAX_TAG_LENGTH = 30;

/** Mesma regra do backend: minúsculas, sem "#", espaços viram "-". Devolve "" se não sobrar nada. */
export function normalizeTag(raw: string): string {
    return raw
        .trim()
        .replace(/^#+/, "")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .slice(0, MAX_TAG_LENGTH);
}
