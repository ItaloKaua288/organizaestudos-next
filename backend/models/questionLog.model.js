import mongoose from "mongoose";

// Registro de questões resolvidas em uma sessão de estudo, ligado a um assunto.
// O % de acerto por assunto e por matéria é calculado somando estes registros.
const questionLogSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    subject_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true
    },
    topic_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic",
        required: true
    },
    // Quantas questões foram feitas e quantas foram acertadas (correct <= total).
    total: {
        type: Number,
        required: true,
        min: 1,
        max: 10000
    },
    correct: {
        type: Number,
        required: true,
        min: 0,
        max: 10000
    },
    // Preenchidos quando o registro nasce ao concluir uma sessão do ciclo de estudos.
    cycle_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    session_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    lap: { type: Number, default: null },
    answeredAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

questionLogSchema.index({ user_id: 1, answeredAt: -1 });
questionLogSchema.index({ user_id: 1, subject_id: 1 });
questionLogSchema.index({ topic_id: 1 });

const QuestionLog = mongoose.model("QuestionLog", questionLogSchema);

export default QuestionLog;
