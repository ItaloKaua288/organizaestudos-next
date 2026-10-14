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
