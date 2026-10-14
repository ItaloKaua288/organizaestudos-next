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
    // Um ciclo por perfil (e não mais um por usuário).
    profile_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
        default: null
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

studyCycleSchema.index({ user_id: 1, profile_id: 1 }, { unique: true });

const StudyCycle = mongoose.model("StudyCycle", studyCycleSchema);

export default StudyCycle;
