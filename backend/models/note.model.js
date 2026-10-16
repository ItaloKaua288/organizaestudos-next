import mongoose from "mongoose";

export const MAX_NOTE_TAGS = 8;
export const MAX_TAG_LENGTH = 30;
export const MAX_NOTE_ATTACHMENTS = 5;

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: [50000, 'O conteúdo da nota não pode exceder 50000 caracteres']
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    subject_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true
    },
    // Etiquetas livres, sempre em minúsculas e sem "#" (veja normalizeTags no controller).
    tags: {
        type: [String],
        default: []
    },
    // Notas que esta nota menciona. É calculado a partir do conteúdo (links data-note-id)
    // sempre que o conteúdo é salvo, e serve para montar os "backlinks" da nota de destino.
    links: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Note"
    }],
    // Arquivos anexados (PDF e imagens), guardados no Cloudinary.
    attachments: [{
        name: String,
        url: String,
        public_id: String,
        mimeType: String,
        size: Number
    }],
}, { timestamps: true });

noteSchema.index({ user_id: 1, subject_id: 1 })
noteSchema.index({ user_id: 1, links: 1 })

const Note = mongoose.model("Note", noteSchema);

export default Note;
