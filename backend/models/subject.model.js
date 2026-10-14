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
    // Perfil de estudo ao qual a matéria pertence. Documentos antigos sem o campo
    // são levados para o perfil padrão na primeira requisição (ver middleware/profile.js).
    profile_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
        default: null
    },
    // Matéria desativada some de revisões, cronograma, dashboard e anotações,
    // mas nenhum dado é apagado. Documentos antigos sem o campo contam como ativos.
    active: {
        type: Boolean,
        default: true
    }

}, { timestamps: true })

subjectSchema.index({ user_id: 1 });
subjectSchema.index({ user_id: 1, profile_id: 1 });

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;
