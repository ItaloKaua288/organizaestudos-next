import https from 'https';
import mongoose from 'mongoose';
import Subject from "../models/subject.model.js";
import { subjectScope } from "../middleware/profile.js";
import Topic from "../models/topic.model.js";
import cloudinary from '../utils/cloudinary.js';
import { getTodayBR } from '../utils/date.js';

// Documentos antigos não têm o campo "active": só conta como inativa quando é explicitamente false.
const isInactive = (subject) => subject?.active === false;
const inactiveResponse = (res) =>
    res.status(403).json({ success: false, message: "Matéria desativada. Reative-a para continuar." });

// Assunto que tem subassuntos vira apenas um "organizador": não tem status, revisões, anexos,
// link nem questões próprias (o progresso vem dos subassuntos).
const isContainerTopic = async (topicId) => !!(await Topic.exists({ parent_id: topicId }));
const containerResponse = (res, message = "Este assunto possui subassuntos e serve apenas para organização.") =>
    res.status(400).json({ success: false, message });

export const createTopic = async (req, res) => {
    const { title, subject_id, parent_id } = req.body;

    try {
        const cleanTitle = title?.trim();

        if (!cleanTitle || !subject_id) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const subject = await Subject.findOne({ _id: subject_id, user_id: req.userId });

        if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });

        if (isInactive(subject)) return inactiveResponse(res);

        // Subassunto: o pai precisa existir, ser da mesma matéria e ser um assunto principal (1 nível).
        let parentId = null;

        if (parent_id) {
            if (!mongoose.isValidObjectId(parent_id))
                return res.status(400).json({ success: false, message: "Invalid parent topic" });

            const parent = await Topic.findOne({ _id: parent_id, subject_id: subject._id });

            if (!parent) return res.status(404).json({ success: false, message: "Parent topic not found" });

            if (parent.parent_id)
                return res.status(400).json({ success: false, message: "Um subassunto não pode ter subassuntos." });

            parentId = parent._id;
        }

        // A ordem é calculada entre os irmãos (mesmo pai). parent_id: null também casa com documentos antigos.
        const lastTopic = await Topic.findOne({ subject_id, parent_id: parentId }).sort("-order");
        const newOrder = lastTopic ? lastTopic.order + 1 : 0;

        const topic = new Topic({
            title: cleanTitle,
            subject_id,
            parent_id: parentId,
            order: newOrder
        });

        await topic.save();

        // O pai passa a ser só um organizador: zera status e revisões para que ele não apareça mais
        // em revisões, cronograma, dashboard nem no progresso. (Anexos e link ficam guardados.)
        if (parentId) {
            await Topic.updateOne(
                { _id: parentId },
                {
                    $set: {
                        status: "PENDENTE",
                        review1: null,
                        review2: null,
                        review3: null,
                        review1_concluded: false,
                        review2_concluded: false,
                        review3_concluded: false,
                        review3_interval: 30,
                        reviewLog: []
                    }
                }
            );
        }

        res.status(201).json({ success: true, message: parentId ? "Subtopic created successfully" : "Topic created successfully", topic: topic });
    } catch (error) {
        console.log("error in createTopic ", error);
        res.status(500).json({ success: false, message: "Error creating topic" });
    }
}


export const getTopics = async (req, res) => {
    const { subject_id } = req.params;

    try {
        const subject = await Subject.findOne({ _id: subject_id, user_id: req.userId });

        if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });

        const topics = await Topic.find({ subject_id: subject._id }).sort({ order: -1 }).lean();

        res.status(200).json({ success: true, topics });
    } catch (error) {
        console.log("error in getTopics ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}


export const getAllTopics = async (req, res) => {
    try {
        const subjects = await Subject.find(subjectScope(req, { active: { $ne: false } }));
        const subjectIds = subjects.map(subject => subject._id);

        const topics = await Topic.find({ subject_id: { $in: subjectIds } }).populate('subject_id').sort({ order: 1 }).lean();
        res.status(200).json({ success: true, topics });
    } catch (error) {
        console.log("error in getAllTopics ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}


export const updateTopic = async (req, res) => {
    const { id } = req.params;
    const { title, status, review1, review2, review3, link } = req.body;

    try {
        const topic = await Topic.findById(id).populate("subject_id");

        if (!topic) {
            return res.status(404).json({ success: false, message: "Topic not found" });
        }

        if (topic.subject_id.user_id.toString() !== req.userId.toString())
            return res.status(403).json({ success: false, message: "Forbidden" });

        if (isInactive(topic.subject_id)) return inactiveResponse(res);

        if ((status || review1) && (await isContainerTopic(topic._id)))
            return containerResponse(res, "Este assunto possui subassuntos: o status e as revisões são dos subassuntos.");

        if (title !== undefined) {
            const cleanTitle = title.trim();
            if (!cleanTitle) return res.status(400).json({ success: false, message: "Title cannot be empty" });
            topic.title = cleanTitle;
        }
        if (link !== undefined) topic.link = link;

        if (status) {
            topic.status = status

            if (status === "CONCLUIDO") {
                const today = getTodayBR()

                topic.review1 = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000);
                topic.review2 = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                topic.review3 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
                topic.review3_interval = 30;
                topic.reviewLog = [];
            } else {
                topic.review3_interval = 30;
                topic.reviewLog = [];
                topic.review1 = null;
                topic.review2 = null;
                topic.review3 = null;
                topic.review1_concluded = false;
                topic.review2_concluded = false;
                topic.review3_concluded = false;
            }
        } else {
            if (review1) {
                const baseDate = new Date(review1);

                topic.review1 = baseDate;
                topic.review2 = new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                topic.review3 = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
            }
        }

        await topic.save();

        res.status(200).json({ success: true, message: "Topic updated successfully", topic });
    } catch (error) {
        console.log("error in updateTopic ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}


export const reorderTopics = async (req, res) => {
    try {
        const { updates } = req.body; // Array de { _id, order }

        if (!Array.isArray(updates) || updates.length === 0)
            return res.status(400).json({ success: false, message: "Invalid updates" });

        const isValidUpdate = (u) => u && u._id && Number.isInteger(u.order) && u.order >= 0;

        if (!updates.every(isValidUpdate))
            return res.status(400).json({ success: false, message: "Invalid updates" });

        const topicIds = updates.map(u => u._id);

        const topics = await Topic.find({ _id: { $in: topicIds } }).populate("subject_id");

        if (topics.length !== updates.length)
            return res.status(404).json({ success: false, message: "Um ou mais tópicos não encontrados" });

        for (const topic of topics) {
            if (topic.subject_id.user_id.toString() !== req.userId.toString())
                return res.status(403).json({ success: false, message: "Forbidden" });

            if (isInactive(topic.subject_id)) return inactiveResponse(res);
        }

        const bulkOps = updates.map(update => ({
            updateOne: {
                filter: { _id: update._id },
                update: { $set: { order: update.order } }
            }
        }));

        await Topic.bulkWrite(bulkOps);

        res.status(200).json({ success: true, message: "Ordem atualizada" });
    } catch (error) {
        console.log("error in reorderTopics ", error);
        res.status(500).json({ success: false, message: "Erro ao reordenar" });
    }
};

export const deleteTopic = async (req, res) => {
    const { id } = req.params;

    try {
        const topic = await Topic.findById(id).populate("subject_id");

        if (!topic) {
            return res.status(404).json({ success: false, message: "Topic not found" });
        }

        if (topic.subject_id.user_id.toString() !== req.userId.toString())
            return res.status(403).json({ success: false, message: "Forbidden" });

        // Excluir um assunto também exclui os subassuntos dele (e os anexos de todos).
        const subtopics = await Topic.find({ parent_id: topic._id });
        const attachments = [...(topic.attachments ?? []), ...subtopics.flatMap(sub => sub.attachments ?? [])];

        if (attachments.length > 0) {
            const deletePromises = attachments.map(file => cloudinary.uploader.destroy(file.public_id));
            await Promise.all(deletePromises);
        }

        if (subtopics.length > 0) await Topic.deleteMany({ parent_id: topic._id });

        await topic.deleteOne();

        res.status(200).json({ success: true, message: "Topic deleted successfully" });
    } catch (error) {
        console.log("error in deleteTopic ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}


export const uploadAttachment = async (req, res) => {
    const { id } = req.params;

    try {
        const topic = await Topic.findById(id).populate("subject_id");

        if (!topic) return res.status(404).json({ success: false, message: "Topic not found" });

        if (topic.subject_id.user_id.toString() !== req.userId.toString())
            return res.status(403).json({ success: false, message: "Forbidden" });

        if (isInactive(topic.subject_id)) return inactiveResponse(res);

        if (await isContainerTopic(topic._id))
            return containerResponse(res, "Este assunto possui subassuntos: anexe os arquivos em um subassunto.");

        if (topic.attachments.length >= 3) return res.status(400).json({ success: false, message: "Limite de 3 arquivos atingido." });
        if (!req.file) return res.status(400).json({ success: false, message: "Nenhum arquivo enviado." });

        const b64 = Buffer.from(req.file.buffer).toString("base64");
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        const result = await cloudinary.uploader.upload(dataURI, {
            resource_type: "auto", 
            folder: "topics_pdfs"
        });

        topic.attachments.push({
            name: req.file.originalname,
            url: result.secure_url,
            public_id: result.public_id
        });

        await topic.save();

        res.status(200).json({ success: true, message: "Arquivo anexado com sucesso", topic });
    } catch (error) {
        console.log("error in uploadAttachment ", error);
        res.status(500).json({ success: false, message: "Erro ao fazer upload do arquivo" });
    }
}

export const removeAttachment = async (req, res) => {
    const { id } = req.params;
    const { public_id } = req.body;

    try {
        const topic = await Topic.findById(id).populate("subject_id");

        if (!topic) return res.status(404).json({ success: false, message: "Topic not found" });

        if (topic.subject_id.user_id.toString() !== req.userId.toString())
            return res.status(403).json({ success: false, message: "Forbidden" });

        const attachment = topic.attachments.find(att => att.public_id === public_id);

        if (!attachment)
            return res.status(404).json({ success: false, message: "Attachment not found" });

        await cloudinary.uploader.destroy(attachment.public_id);

        topic.attachments = topic.attachments.filter(att => att.public_id !== public_id);
        await topic.save();

        res.status(200).json({ success: true, message: "Arquivo removido com sucesso" });
    } catch (error) {
        console.log("error in removeAttachment ", error);
        res.status(500).json({ success: false, message: "Erro ao remover arquivo" });
    }
}

const allowedReviews = ["review1", "review2", "review3"];

/*
 * REVISÕES INTELIGENTES
 * Ao concluir uma revisão o estudante pode avaliar como foi (ERROU, DIFICIL, BOM, FACIL) e a
 * próxima revisão é reagendada a partir de HOJE:
 *  - review1 (24h)  -> agenda a review2
 *  - review2 (7d)   -> agenda a review3
 *  - review3 (30d)  -> repete a própria review3, com intervalo que cresce/encolhe
 * "BOM" reproduz o calendário antigo (7 dias e 30 dias). Sem avaliação, nada muda no calendário.
 */
const REVIEW_PERFORMANCES = ["ERROU", "DIFICIL", "BOM", "FACIL"];
const NEXT_REVIEW_DAYS = {
    review1: { ERROU: 2, DIFICIL: 4, BOM: 7, FACIL: 12 },
    review2: { ERROU: 7, DIFICIL: 15, BOM: 30, FACIL: 45 },
};
const RECURRING_FACTOR = { ERROU: 0.3, DIFICIL: 0.6, BOM: 1.5, FACIL: 2.5 };
const RECURRING_MIN_DAYS = 7;
const RECURRING_MAX_DAYS = 180;
const DEFAULT_RECURRING_DAYS = 30;
const REVIEW_LOG_LIMIT = 20;
const REVIEW_DAY_MS = 24 * 60 * 60 * 1000;

const addDaysFromToday = (days) => new Date(getTodayBR().getTime() + days * REVIEW_DAY_MS);
const nextReviewKey = { review1: "review2", review2: "review3" };

export const concludedReview = async (req, res) => {
    const { id, review } = req.params;

    try {
        if (!allowedReviews.includes(review))
            return res.status(400).json({ success: false, message: "Invalid review" });

        const topic = await Topic.findById(id).populate("subject_id");

        if (!topic) {
            return res.status(404).json({ success: false, message: "Assunto não encontrado." });
        }

        if (topic.subject_id.user_id.toString() !== req.userId.toString())
            return res.status(403).json({ success: false, message: "Forbidden" });

        if (isInactive(topic.subject_id)) return inactiveResponse(res);

        if (await isContainerTopic(topic._id)) return containerResponse(res);

        const { performance } = req.body ?? {};
        if (performance !== undefined && performance !== null && !REVIEW_PERFORMANCES.includes(performance))
            return res.status(400).json({ success: false, message: "Invalid performance" });

        const rating = performance || null;
        const entry = { review, performance: rating, at: new Date(), target: null, prevDate: null, prevInterval: null, nextDate: null };
        let nextReview = null;

        if (review === "review3") {
            const currentInterval = topic.review3_interval || DEFAULT_RECURRING_DAYS;
            let nextInterval = currentInterval;

            if (rating) {
                nextInterval = Math.round(currentInterval * RECURRING_FACTOR[rating]);
                nextInterval = Math.min(RECURRING_MAX_DAYS, Math.max(RECURRING_MIN_DAYS, nextInterval));
            }

            entry.target = "review3";
            entry.prevDate = topic.review3;
            entry.prevInterval = currentInterval;

            topic.review3 = addDaysFromToday(nextInterval);
            topic.review3_concluded = false;
            topic.review3_interval = nextInterval;

            entry.nextDate = topic.review3;
            nextReview = { key: "review3", date: topic.review3, days: nextInterval };
        } else {
            topic[`${review}_concluded`] = true;

            // Só reagenda a próxima revisão quando houve avaliação e ela ainda não foi concluída.
            const target = nextReviewKey[review];
            if (rating && !topic[`${target}_concluded`]) {
                const days = NEXT_REVIEW_DAYS[review][rating];

                entry.target = target;
                entry.prevDate = topic[target];
                topic[target] = addDaysFromToday(days);
                entry.nextDate = topic[target];
                nextReview = { key: target, date: topic[target], days };
            }
        }

        topic.reviewLog.push(entry);
        if (topic.reviewLog.length > REVIEW_LOG_LIMIT) topic.reviewLog.splice(0, topic.reviewLog.length - REVIEW_LOG_LIMIT);

        await topic.save();
        res.status(200).json({ success: true, topic, nextReview });
    } catch (error) {
        console.error("Erro interno em concludedReview:", error);
        res.status(500).json({ success: false, message: "Erro interno ao concluir revisão." });
    }
};

export const UndoCompletedReview = async (req, res) => {
    const { id, review } = req.params;

    try {
        if (!allowedReviews.includes(review))
            return res.status(400).json({ success: false, message: "Invalid review" });

        const topic = await Topic.findById(id).populate("subject_id");

        if (!topic)
            return res.status(404).json({ success: false, message: "Assunto não encontrado." });

        if (topic.subject_id.user_id.toString() !== req.userId.toString())
            return res.status(403).json({ success: false, message: "Forbidden" });

        if (isInactive(topic.subject_id)) return inactiveResponse(res);

        if (await isContainerTopic(topic._id)) return containerResponse(res);

        // Desfaz a conclusão restaurando a data que ela alterou (quando é a última do registro).
        const lastEntry = topic.reviewLog[topic.reviewLog.length - 1];
        const entry = lastEntry && lastEntry.review === review ? lastEntry : null;

        if (review === "review3") {
            if (entry && entry.prevDate) {
                topic.review3 = entry.prevDate;
                topic.review3_interval = entry.prevInterval || DEFAULT_RECURRING_DAYS;
            } else {
                const prevReviewDate = new Date(topic.review3);
                prevReviewDate.setDate(prevReviewDate.getDate() - (topic.review3_interval || DEFAULT_RECURRING_DAYS));
                topic.review3 = prevReviewDate;
            }
            topic.review3_concluded = false;
        } else {
            topic[`${review}_concluded`] = false;
            if (entry && entry.target && entry.prevDate) topic[entry.target] = entry.prevDate;
        }

        if (entry) topic.reviewLog.pop();

        await topic.save();
        res.status(200).json({ success: true, topic });
    } catch (error) {
        console.error("Erro interno em undoReview:", error);
        res.status(500).json({ success: false, message: "Erro ao desmarcar revisão" });
    }
}

export const streamPdf = async (req, res) => {
    try {
        const { topicId, publicId } = req.params;
        const decodedPublicId = decodeURIComponent(publicId);

        const topic = await Topic.findById(topicId).populate('subject_id');

        if (!topic) {
            return res.status(404).json({ success: false, message: "Assunto não encontrado" });
        }

        if (topic.subject_id.user_id.toString() !== req.userId.toString()) {
            return res.status(403).json({ success: false, message: "Acesso negado. Você não é o dono deste arquivo." });
        }

        const attachment = topic.attachments.find(att => att.public_id === decodedPublicId);
        if (!attachment)
            return res.status(404).json({ success: false, message: "Arquivo não encontrado no banco de dados." });

        https.get(attachment.url, (stream) => {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.name)}"`);

            stream.pipe(res);
        }).on('error', (e) => {
            console.log("Erro no stream do Cloudinary: ", e);
            res.status(500).json({ success: false, message: "Erro ao ler o arquivo na nuvem." });
        });

    } catch (error) {
        console.log("error in streamPdf ", error);
        res.status(500).json({ success: false, message: "Erro interno no servidor" });
    }
}

// Redistribui as revisões de 30 dias (review3) de forma uniforme entre hoje e hoje + 30 dias,
// mantendo a ordem atual (a revisão mais próxima continua sendo a mais próxima).
const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_SPAN_DAYS = 31; // hoje + 30 dias (ex.: 10/10 até 09/11)

export const redistributeMonthlyReviews = async (req, res) => {
    try {
        const subjects = await Subject.find(subjectScope(req, { active: { $ne: false } })).select("_id");
        const subjectIds = subjects.map(subject => subject._id);

        const parentIds = await Topic.distinct("parent_id", { subject_id: { $in: subjectIds }, parent_id: { $ne: null } });

        const topics = await Topic.find({
            _id: { $nin: parentIds },
            subject_id: { $in: subjectIds },
            status: "CONCLUIDO",
            review3: { $ne: null },
            review3_concluded: { $ne: true }
        }).sort({ review3: 1, order: 1, _id: 1 }).select("_id");

        const total = topics.length;

        if (total === 0)
            return res.status(200).json({ success: true, message: "Nenhuma revisão de 30 dias para organizar.", updated: 0 });

        const today = getTodayBR();

        // Índice i (0..total-1) -> dia floor(i * 31 / total): espalha por todos os dias
        // e nenhum dia fica com mais de 1 revisão a mais que outro.
        const bulkOps = topics.map((topic, index) => {
            const dayOffset = Math.floor((index * MONTH_SPAN_DAYS) / total);

            return {
                updateOne: {
                    filter: { _id: topic._id },
                    update: { $set: { review3: new Date(today.getTime() + dayOffset * DAY_MS) } }
                }
            };
        });

        await Topic.bulkWrite(bulkOps);

        res.status(200).json({ success: true, message: "Revisões organizadas com sucesso.", updated: total });
    } catch (error) {
        console.log("error in redistributeMonthlyReviews ", error);
        res.status(500).json({ success: false, message: "Erro ao organizar revisões" });
    }
};
