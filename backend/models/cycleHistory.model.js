import mongoose from "mongoose";

// Histórico de sessões finalizadas. É separado da posição atual do ciclo:
// editar/reiniciar o ciclo nunca apaga o que o estudante já estudou.
const cycleHistorySchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    cycle_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StudyCycle",
        required: true
    },
    session_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    subject_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject"
    },
    // Snapshot para o histórico continuar legível se a matéria for removida.
    subject_title: { type: String, default: "" },
    subject_color: { type: String, default: "#000000" },
    lap: {
        type: Number,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["CONCLUIDA", "PULADA"],
        required: true
    },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Garante que a mesma sessão não seja contabilizada duas vezes na mesma volta.
cycleHistorySchema.index({ cycle_id: 1, lap: 1, session_id: 1 }, { unique: true });
cycleHistorySchema.index({ user_id: 1, finishedAt: -1 });

const CycleHistory = mongoose.model("CycleHistory", cycleHistorySchema);

export default CycleHistory;
