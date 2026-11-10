import mongoose from "mongoose";

// Perfil de estudo (ex.: "PMPE", "AGENTE CENSITÁRIO DE INFORMÁTICA").
// Cada perfil tem as próprias matérias e, por consequência, os próprios assuntos,
// revisões, notas, cronograma, ciclo de estudos e desempenho.
const profileSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [60, "O nome do perfil não pode exceder 60 caracteres"]
    },
    // Nome normalizado (minúsculo, sem acentos) só para impedir dois perfis com o mesmo nome.
    nameKey: {
        type: String,
        required: true
    },
    // Data da prova do concurso deste perfil (só o dia, guardada às 12:00 UTC para não "voltar" um dia
    // por causa de fuso horário). null = ainda não informada.
    examDate: {
        type: Date,
        default: null
    }
}, { timestamps: true });

export const normalizeProfileName = (name = "") =>
    String(name).trim().replace(/\s+/g, " ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

profileSchema.pre("validate", function () {
    this.nameKey = normalizeProfileName(this.name);
});

profileSchema.index({ user_id: 1, nameKey: 1 }, { unique: true });

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;
