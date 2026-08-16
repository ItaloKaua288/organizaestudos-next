import https from 'https';
import Subject from "../models/subject.model.js";
import Topic from "../models/topic.model.js";
import cloudinary from '../utils/cloudinary.js';
import { getTodayBR } from '../utils/date.js';


export const createTopic = async (req, res) => {
    const { title, subject_id } = req.body;

    try {
        const cleanTitle = title?.trim();

        if (!cleanTitle || !subject_id) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const subject = await Subject.findOne({ _id: subject_id, user_id: req.userId });

        if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });

        const lastTopic = await Topic.findOne({ subject_id }).sort("-order");
        const newOrder = lastTopic ? lastTopic.order + 1 : 0;

        const topic = new Topic({
            title: cleanTitle,
            subject_id,
            order: newOrder
        });

        await topic.save();

        res.status(201).json({ success: true, message: "Topic created successfully", topic: topic });
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
        const subjects = await Subject.find({ user_id: req.userId });
        const subjectIds = subjects.map(subject => subject._id);

        const topics = await Topic.find({ subject_id: { $in: subjectIds } }).populate('subject_id').lean();
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
            } else {
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

        if (!Array.isArray(updates))
            return res.status(400).json({ success: false, message: "Invalid updates" });

        const topicIds = updates.map(u => u._id);

        const topics = await Topic.find({ _id: { $in: topicIds } }).populate("subject_id");

        if (topics.length !== updates.length)
            return res.status(404).json({ success: false, message: "Um ou mais tópicos não encontrados" });

        for (const topic of topics)
            if (topic.subject_id.user_id.toString() !== req.userId.toString())
                return res.status(403).json({ success: false, message: "Forbidden" });

        const bulkOps = updates.map(update => ({
            updateOne: {
                filter: { _id: update._id },
                update: { $set: { order: update.order } }
            }
        }));

        await Topic.bulkWrite(bulkOps);

        res.status(200).json({ success: true, message: "Ordem atualizada" });
    } catch (error) {
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

        if (topic.attachments && topic.attachments.length > 0) {
            const deletePromises = topic.attachments.map(file => cloudinary.uploader.destroy(file.public_id));
            await Promise.all(deletePromises);
        }

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

        if (review === "review3") {
            const nextReviewDate = getTodayBR();
            nextReviewDate.setDate(nextReviewDate.getDate() + 30);

            topic.review3 = nextReviewDate;
            topic.review3_concluded = false;
        } else {
            topic[`${review}_concluded`] = true;
        }

        await topic.save();
        res.status(200).json({ success: true, topic });
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

        if (review === "review3") {
            const prevReviewDate = new Date(topic.review3);
            prevReviewDate.setDate(prevReviewDate.getDate() - 30);

            topic.review3 = prevReviewDate;
            topic.review3_concluded = false;
        } else {
            topic[`${review}_concluded`] = false;
        }

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
