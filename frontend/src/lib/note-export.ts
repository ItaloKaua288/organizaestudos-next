import type { Note } from "@/types/note";
import { formatFileSize, isImageAttachment } from "@/lib/note-attachments";

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

/** "Equivalência Lógica" -> "equivalencia-logica" (nome de arquivo seguro). */
export function slugify(text: string): string {
    const slug = text
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);

    return slug || "nota";
}

const escapeHtml = (text: string) =>
    text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

function formatDate(value?: string) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function downloadText(fileName: string, text: string, mimeType: string) {
    const blob = new Blob([text], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/* ------------------------------------------------------------------ */
/* HTML -> Markdown                                                    */
/* ------------------------------------------------------------------ */

const escapeMarkdown = (text: string) => text.replace(/([\\`*_[\]])/g, "\\$1");

function convertInline(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return escapeMarkdown(node.textContent ?? "");
    if (!(node instanceof HTMLElement)) return "";
    return convertElement(node);
}

function convertChildren(node: Node): string {
    return Array.from(node.childNodes).map(convertInline).join("");
}

/** Marcadores de ênfase não podem encostar em espaços: "** texto**" não funciona em Markdown. */
function wrap(inner: string, mark: string) {
    const trimmed = inner.trim();
    if (!trimmed) return inner;
    const leading = inner.match(/^\s*/)?.[0] ?? "";
    const trailing = inner.match(/\s*$/)?.[0] ?? "";
    return `${leading}${mark}${trimmed}${mark}${trailing}`;
}

function convertList(list: HTMLElement, depth: number): string {
    const ordered = list.tagName === "OL";
    const indent = "  ".repeat(depth);
    let index = 1;
    let out = "";

    for (const child of Array.from(list.children)) {
        if (child.tagName !== "LI") continue;

        const marker = ordered ? `${index++}. ` : "- ";
        let text = "";
        let nested = "";

        for (const part of Array.from(child.childNodes)) {
            if (part instanceof HTMLElement && (part.tagName === "UL" || part.tagName === "OL")) {
                nested += convertList(part, depth + 1);
            } else if (part instanceof HTMLElement && part.tagName === "P") {
                text += (text ? " " : "") + convertChildren(part).trim();
            } else {
                text += convertInline(part);
            }
        }

        out += `${indent}${marker}${text.trim()}\n${nested}`;
    }

    return out;
}

function convertElement(element: HTMLElement): string {
    const tag = element.tagName.toLowerCase();

    switch (tag) {
        case "p":
            return `${convertChildren(element).trim()}\n\n`;
        case "br":
            return "  \n";
        case "strong":
        case "b":
            return wrap(convertChildren(element), "**");
        case "em":
        case "i":
            return wrap(convertChildren(element), "*");
        case "s":
        case "strike":
        case "del":
            return wrap(convertChildren(element), "~~");
        case "u":
            return `<u>${convertChildren(element)}</u>`;
        case "code":
            return `\`${element.textContent ?? ""}\``;
        case "pre": {
            const code = element.querySelector("code");
            const language = code?.className.match(/language-([\w-]+)/)?.[1] ?? "";
            const text = (code ?? element).textContent ?? "";
            return `\`\`\`${language}\n${text.replace(/\n$/, "")}\n\`\`\`\n\n`;
        }
        case "a": {
            const text = convertChildren(element);
            // Link para outra nota vira [[Título]], o formato de links do Obsidian e de outros apps de notas.
            if (element.hasAttribute("data-note-id")) {
                return `[[${(element.textContent ?? "").trim()}]]`;
            }
            const href = element.getAttribute("href");
            return href ? `[${text}](${href})` : text;
        }
        case "ul":
        case "ol":
            return `${convertList(element, 0)}\n`;
        case "blockquote": {
            const inner = Array.from(element.childNodes).map(convertInline).join("").trim();
            return `${inner.split("\n").map((line) => `> ${line}`.trimEnd()).join("\n")}\n\n`;
        }
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6": {
            const level = Number(tag[1]);
            // O título da nota já é o H1 do arquivo, então os títulos internos descem um nível.
            return `${"#".repeat(Math.min(level + 1, 6))} ${convertChildren(element).trim()}\n\n`;
        }
        case "hr":
            return "---\n\n";
        default:
            return convertChildren(element);
    }
}

export function htmlToMarkdown(html: string): string {
    const doc = new DOMParser().parseFromString(html, "text/html");

    return convertChildren(doc.body)
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

export function noteToMarkdown(note: Note): string {
    const tags = note.tags ?? [];
    const attachments = note.attachments ?? [];
    const backlinks = note.backlinks ?? [];

    const frontmatter = [
        "---",
        `title: ${JSON.stringify(note.title)}`,
        `subject: ${JSON.stringify(note.subject.title)}`,
        `tags: [${tags.map((tag) => JSON.stringify(tag)).join(", ")}]`,
        ...(note.created_at ? [`created: ${note.created_at}`] : []),
        ...(note.updated_at ? [`updated: ${note.updated_at}`] : []),
        "---",
    ].join("\n");

    const sections = [frontmatter, `# ${note.title}`, htmlToMarkdown(note.content)];

    if (attachments.length > 0) {
        sections.push(
            ["## Anexos", ...attachments.map((file) => `- [${escapeMarkdown(file.name)}](${file.url})`)].join("\n")
        );
    }

    if (backlinks.length > 0) {
        sections.push(["## Mencionada em", ...backlinks.map((link) => `- [[${link.title}]]`)].join("\n"));
    }

    return `${sections.filter(Boolean).join("\n\n")}\n`;
}

export function exportNoteAsMarkdown(note: Note) {
    downloadText(`${slugify(note.title)}.md`, noteToMarkdown(note), "text/markdown");
}

/* ------------------------------------------------------------------ */
/* PDF (pela janela de impressão do navegador)                         */
/* ------------------------------------------------------------------ */

const PRINT_STYLES = `
  @page { size: A4; margin: 20mm 18mm; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    margin: 0;
    color: #1b2333;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 11.5pt;
    line-height: 1.65;
  }
  header { margin-bottom: 18pt; padding-bottom: 12pt; border-bottom: 1.5pt solid var(--accent); }
  .subject { display: flex; align-items: center; gap: 6pt; margin: 0 0 6pt; font: 600 9.5pt "Helvetica Neue", Arial, sans-serif; color: #55607a; }
  .dot { width: 8pt; height: 8pt; border-radius: 50%; background: var(--accent); display: inline-block; }
  h1 { margin: 0; font: 700 23pt/1.2 "Helvetica Neue", Arial, sans-serif; letter-spacing: -0.01em; }
  .tags { margin: 8pt 0 0; font: 500 9.5pt "Helvetica Neue", Arial, sans-serif; color: #3d5a99; }
  .tags span { margin-right: 8pt; }
  .meta { margin: 6pt 0 0; font: 9pt "Helvetica Neue", Arial, sans-serif; color: #7a8399; }
  .content h1, .content h2, .content h3 { font-family: "Helvetica Neue", Arial, sans-serif; line-height: 1.25; break-after: avoid; }
  .content h1 { font-size: 17pt; } .content h2 { font-size: 14pt; } .content h3 { font-size: 12pt; }
  .content p { margin: 0 0 8pt; }
  .content ul, .content ol { margin: 0 0 8pt; padding-left: 18pt; }
  .content ul { list-style: disc; } .content ol { list-style: decimal; }
  .content li { margin: 2pt 0; }
  .content li > p { margin: 0; }
  .content blockquote { margin: 0 0 8pt; padding-left: 10pt; border-left: 2pt solid #c3cbdc; color: #4a5470; }
  .content code { font: 10pt Menlo, Consolas, monospace; background: #eef1f7; padding: 1pt 3pt; border-radius: 3pt; }
  .content pre { margin: 0 0 8pt; padding: 8pt 10pt; background: #f1f3f8; border: 0.5pt solid #d6dbe8; border-radius: 4pt; white-space: pre-wrap; word-break: break-word; break-inside: avoid; }
  .content pre code { background: none; padding: 0; }
  .content a { color: #2b5bd7; text-decoration: none; }
  .content a.note-link { font-weight: 600; }
  .attachments { margin-top: 20pt; padding-top: 10pt; border-top: 0.5pt solid #d6dbe8; font-family: "Helvetica Neue", Arial, sans-serif; }
  .attachments h2 { margin: 0 0 6pt; font-size: 11pt; }
  .attachments ul { margin: 0; padding-left: 14pt; font-size: 10pt; }
  .attachments figure { margin: 10pt 0 0; break-inside: avoid; }
  .attachments img { max-width: 100%; max-height: 120mm; display: block; border-radius: 3pt; }
  .attachments figcaption { margin-top: 3pt; font-size: 8.5pt; color: #7a8399; }
  footer { margin-top: 22pt; font: 8.5pt "Helvetica Neue", Arial, sans-serif; color: #98a0b3; }
`;

function buildPrintDocument(note: Note, sanitizedHtml: string): string {
    const tags = note.tags ?? [];
    const attachments = note.attachments ?? [];
    const images = attachments.filter((file) => isImageAttachment(file.mimeType));
    const accent = /^#[0-9a-f]{3,8}$/i.test(note.subject.color) ? note.subject.color : "#3b82f6";
    const created = formatDate(note.created_at);

    const attachmentsBlock = attachments.length === 0 ? "" : `
      <section class="attachments">
        <h2>Anexos</h2>
        <ul>
          ${attachments.map((file) => `<li>${escapeHtml(file.name)} <small>(${escapeHtml(file.mimeType === "application/pdf" ? "PDF" : "imagem")}${file.size ? `, ${formatFileSize(file.size)}` : ""})</small></li>`).join("")}
        </ul>
        ${images.map((file) => `<figure><img src="${escapeHtml(file.url)}" alt="${escapeHtml(file.name)}" /><figcaption>${escapeHtml(file.name)}</figcaption></figure>`).join("")}
      </section>`;

    return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(slugify(note.title))}</title>
  <style>:root { --accent: ${accent}; } ${PRINT_STYLES}</style>
</head>
<body>
  <header>
    <p class="subject"><span class="dot"></span>${escapeHtml(note.subject.title)}</p>
    <h1>${escapeHtml(note.title)}</h1>
    ${tags.length > 0 ? `<p class="tags">${tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("")}</p>` : ""}
    ${created ? `<p class="meta">Criada em ${escapeHtml(created)}</p>` : ""}
  </header>
  <main class="content">${sanitizedHtml}</main>
  ${attachmentsBlock}
  <footer>Exportado do Organiza Estudos em ${escapeHtml(formatDate(new Date().toISOString()))}</footer>
</body>
</html>`;
}

function waitForImages(doc: Document, timeoutMs = 5000): Promise<void> {
    const pending = Array.from(doc.images).filter((image) => !image.complete);
    if (pending.length === 0) return Promise.resolve();

    return new Promise((resolve) => {
        let remaining = pending.length;
        const done = () => {
            remaining -= 1;
            if (remaining <= 0) resolve();
        };

        pending.forEach((image) => {
            image.addEventListener("load", done, { once: true });
            image.addEventListener("error", done, { once: true });
        });

        setTimeout(resolve, timeoutMs);
    });
}

/**
 * Abre a janela de impressão com a nota formatada. Na janela, escolher "Salvar como PDF" gera o arquivo.
 * Funciona sem biblioteca extra e mantém o texto selecionável e pesquisável no PDF.
 */
export async function exportNoteAsPdf(note: Note, sanitizedHtml: string) {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
    Object.assign(iframe.style, {
        position: "fixed",
        right: "0",
        bottom: "0",
        width: "0",
        height: "0",
        border: "0",
        visibility: "hidden",
    });
    document.body.appendChild(iframe);

    const frameWindow = iframe.contentWindow;
    const frameDocument = iframe.contentDocument;

    if (!frameWindow || !frameDocument) {
        iframe.remove();
        throw new Error("Não foi possível preparar a impressão.");
    }

    frameDocument.open();
    frameDocument.write(buildPrintDocument(note, sanitizedHtml));
    frameDocument.close();

    await waitForImages(frameDocument);

    // O navegador sugere o título da página como nome do arquivo.
    const previousTitle = document.title;
    document.title = slugify(note.title);

    const cleanup = () => {
        document.title = previousTitle;
        iframe.remove();
    };

    frameWindow.addEventListener("afterprint", cleanup, { once: true });
    // Rede de segurança caso o navegador não dispare afterprint.
    setTimeout(cleanup, 120000);

    frameWindow.focus();
    frameWindow.print();
}
