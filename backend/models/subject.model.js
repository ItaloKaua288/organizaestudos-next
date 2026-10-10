import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    color: {
        type: String,
        required: true,
        default: "#000000"
    },
    // Matéria desativada some de revisões, cronograma, dashboard e anotações,
    // mas nenhum dado é apagado. Documentos antigos sem o campo contam como ativos.
    active: {
        type: Boolean,
        default: true
    }

}, { timestamps: true })

subjectSchema.index({ user_id: 1 });

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;
