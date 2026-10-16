import { Mark, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        noteLink: {
            /** Aplica um link para outra nota ao texto selecionado. */
            setNoteLink: (attributes: { noteId: string; subjectId: string }) => ReturnType;
            /** Remove o link para nota do texto selecionado. */
            unsetNoteLink: () => ReturnType;
        };
    }
}

/** Endereço de uma nota: a página da matéria destaca o cartão da nota pedida. */
export const noteHref = (subjectId: string, noteId: string) => `/notas/${subjectId}?nota=${noteId}`;

/**
 * Marca "link para nota". Fica no HTML como
 * <a data-note-id="..." data-subject-id="..." href="/notas/<matéria>?nota=<id>" class="note-link">.
 * O backend lê o data-note-id para montar os backlinks, então esse atributo não pode mudar de nome.
 */
export const NoteLink = Mark.create({
    name: "noteLink",
    // Acima do Link padrão do StarterKit (1000), para o <a data-note-id> ser lido por esta marca.
    priority: 1100,
    inclusive: false,

    addAttributes() {
        return {
            noteId: {
                default: null,
                parseHTML: (element) => element.getAttribute("data-note-id"),
                renderHTML: (attributes) => (attributes.noteId ? { "data-note-id": attributes.noteId } : {}),
            },
            subjectId: {
                default: null,
                parseHTML: (element) => element.getAttribute("data-subject-id"),
                renderHTML: (attributes) => (attributes.subjectId ? { "data-subject-id": attributes.subjectId } : {}),
            },
        };
    },

    parseHTML() {
        return [{ tag: "a[data-note-id]" }];
    },

    renderHTML({ HTMLAttributes, mark }) {
        const { noteId, subjectId } = mark.attrs as { noteId: string | null; subjectId: string | null };

        return [
            "a",
            mergeAttributes(HTMLAttributes, {
                href: noteId && subjectId ? noteHref(subjectId, noteId) : "#",
                class: "note-link",
            }),
            0,
        ];
    },

    addCommands() {
        return {
            setNoteLink:
                (attributes) =>
                ({ commands }) =>
                    commands.setMark(this.name, attributes),
            unsetNoteLink:
                () =>
                ({ commands }) =>
                    commands.unsetMark(this.name),
        };
    },
});
