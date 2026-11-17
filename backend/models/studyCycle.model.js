import mongoose from "mongoose";

// Estados possíveis de uma sessão dentro da volta atual do ciclo.
export const SESSION_STATUS = ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "PULADA"];

const cycleSessionSchema = new mongoose.Schema({
    subject_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true
    },
    // Duração planejada em minutos.
    duration: {
        type: Number,
        required: true,
        min: 1,
        max: 720
    },
    // Estado da sessão na volta atual (volta nova => tudo volta para PENDENTE).
    status: {
        type: String,
        enum: SESSION_STATUS,
        default: "PENDENTE"
    },
    startedAt: {
        type: Date,
        default: null
    }
});

const studyCycleSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    // Cada perfil de estudo pode ter vários ciclos (ex.: "Ciclo pré-edital", "Ciclo reta final").
    profile_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
        default: null
    },
    // Nome do ciclo. Ciclos criados antes deste recurso ficam com o nome padrão "Ciclo".
    name: {
        type: String,
        trim: true,
        default: "Ciclo",
        maxlength: [60, "O nome do ciclo não pode exceder 60 caracteres"]
    },
    // Nome normalizado (minúsculo, sem acentos) só para impedir dois ciclos com o mesmo nome no perfil.
    nameKey: {
        type: String
    },
    // A ordem do array é a ordem oficial do ciclo.
    sessions: [cycleSessionSchema],
    // Posição atual do estudante no ciclo (não depende de dia/semana).
    currentSessionId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    // Quantas sessões formam um "dia" na visualização (0 = sem divisão por dia).
    // É só organização visual: não altera a ordem nem o avanço do ciclo.
    sessionsPerDay: {
        type: Number,
        default: 0,
        min: 0,
        max: 50
    },
    // Número da volta atual (começa em 1).
    lap: {
        type: Number,
        default: 1
    },
    // Total de sessões concluídas desde a criação do ciclo.
    totalCompleted: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    // Protege contra cliques duplicados / abas simultâneas: um save com documento
    // desatualizado lança VersionError em vez de sobrescrever o progresso.
    optimisticConcurrency: true
});

export const normalizeCycleName = (name = "") =>
    String(name).trim().replace(/\s+/g, " ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

studyCycleSchema.pre("validate", function () {
    this.nameKey = normalizeCycleName(this.name);
});

// Nome único por perfil (o antigo índice único user_id + profile_id é removido em conectDB.js).
studyCycleSchema.index({ user_id: 1, profile_id: 1, nameKey: 1 }, { unique: true });

const StudyCycle = mongoose.model("StudyCycle", studyCycleSchema);

export default StudyCycle;
