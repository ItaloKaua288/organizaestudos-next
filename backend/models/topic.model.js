import mongoose from "mongoose";

const topicSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        default: "PENDENTE"
    },
    subject_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true
    },
    order: {
        type: Number,
        default: 0
    },
    // Subassunto: aponta para o assunto "pai" (apenas 1 nível). null/ausente = assunto principal.
    // O subassunto é um Topic completo (status, revisões, anexos, questões) e a ordem (order)
    // é relativa aos irmãos, ou seja, aos assuntos que têm o mesmo parent_id.
    parent_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic",
        default: null
    },
    // NOVO: Array para guardar os arquivos anexados
    attachments: [{
        name: String,
        url: String,
        public_id: String
    }],
    review1: {
        type: Date,
        default: null
    },
    review2: {
        type: Date,
        default: null
    },
    review3: {
        type: Date,
        default: null
    },
    review1_concluded: {
        type: Boolean,
        default: false
    },
    review2_concluded: {
        type: Boolean,
        default: false
    },
    review3_concluded: {
        type: Boolean,
        default: false
    },
    // Intervalo (em dias) da revisão recorrente de 30 dias. Cresce quando o estudante
    // acerta e encolhe quando erra (revisões inteligentes). Padrão = 30 (comportamento antigo).
    review3_interval: {
        type: Number,
        default: 30
    },
    // Registro das últimas revisões concluídas. Serve para desfazer uma revisão restaurando
    // exatamente a data que ela havia alterado.
    reviewLog: [{
        _id: false,
        review: String, // review1 | review2 | review3
        performance: { type: String, default: null }, // ERROU | DIFICIL | BOM | FACIL
        at: { type: Date, default: Date.now },
        target: { type: String, default: null }, // qual data foi reagendada (review2 | review3)
        prevDate: { type: Date, default: null }, // data que ela tinha antes
        prevInterval: { type: Number, default: null }, // intervalo recorrente antes (só review3)
        nextDate: { type: Date, default: null } // nova data
    }],
    link: {
        type: String,
        default: null
    }
}, { timestamps: true })

topicSchema.index({ subject_id: 1 });
topicSchema.index({ parent_id: 1 });

const Topic = mongoose.model("Topic", topicSchema);

export default Topic;
