// Ajudas para mostrar um trecho (texto puro) de notas guardadas como HTML pelo editor rico.

export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const toPlainText = (html = "") =>
    html
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();

/** Começo da nota (sem HTML), para a prévia nas listas. */
export const buildPreview = (html, length = 140) => {
    const text = toPlainText(html);
    return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
};

/** Trecho da nota ao redor do termo buscado (ou o começo, se o termo estiver só no título/tags). */
export const buildSnippet = (html, query, radius = 70) => {
    const text = toPlainText(html);
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text.slice(0, radius * 2);

    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + query.length + radius);
    return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
};
