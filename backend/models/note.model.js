import mongoose from "mongoose";

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
        ref: "subject",
        required: true
    },
}, { timestamps: true });

noteSchema.index({ user_id: 1, subject_id: 1 })

const Note = mongoose.model("Note", noteSchema);

export default Note;