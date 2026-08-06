import cloudinary from '../utils/cloudinary.js';
import Topic from "../models/topic.model.js";
import Subject from "../models/subject.model.js";
import https from 'https';
import { getTodayBR, isToday } from '../utils/date.js';


export const createTopic = async (req, res) => {
    const { title, subject_id } = req.body;

    try {
        if (!title || !subject_id) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // NOVO: Procura o último assunto desta matéria para saber qual é a última posição (order)
        const lastTopic = await Topic.findOne({ subject_id }).sort("-order");
        const newOrder = lastTopic ? lastTopic.order + 1 : 0;

        const topic = new Topic({
            title,
            subject_id,
            order: newOrder // Adiciona o novo assunto no final da fila!
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
        const topics = await Topic.find({ subject_id });
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

        const topics = await Topic.find({ subject_id: { $in: subjectIds } }).populate('subject_id');
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
        const topic = await Topic.findById(id);

        if (!topic) {
            return res.status(404).json({ success: false, message: "Topic not found" });
        }

        if (title) topic.title = title;
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

        // Atualiza todos os assuntos em paralelo
        const promises = updates.map(update =>
            Topic.findByIdAndUpdate(update._id, { order: update.order })
        );

        await Promise.all(promises);

        res.status(200).json({ success: true, message: "Ordem atualizada" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Erro ao reordenar" });
    }
};


export const deleteTopic = async (req, res) => {
    const { id } = req.params;

    try {
        const topic = await Topic.findById(id);

        if (!topic) {
            return res.status(404).json({ success: false, message: "Topic not found" });
        }

        // Deleta os arquivos do Cloudinary associados a este assunto antes de excluir o registro
        if (topic.attachments && topic.attachments.length > 0) {
            const deletePromises = topic.attachments.map(file => cloudinary.uploader.destroy(file.public_id));
            await Promise.all(deletePromises);
        }

        await Topic.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "Topic deleted successfully" });
    } catch (error) {
        console.log("error in deleteTopic ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}


export const uploadAttachment = async (req, res) => {
    const { id } = req.params;

    try {
        const topic = await Topic.findById(id);

        if (!topic) return res.status(404).json({ success: false, message: "Topic not found" });
        if (topic.attachments.length >= 3) return res.status(400).json({ success: false, message: "Limite de 3 arquivos atingido." });
        if (!req.file) return res.status(400).json({ success: false, message: "Nenhum arquivo enviado." });

        // Converte o buffer do Multer para Base64 para enviar ao Cloudinary
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        // Faz o upload para o Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
            resource_type: "auto", // Importante para aceitar PDFs
            folder: "topics_pdfs"
        });

        // Salva a referência no MongoDB
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
    const { public_id } = req.body; // Enviamos pelo body para evitar problemas com barras na URL

    try {
        const topic = await Topic.findById(id);
        if (!topic) return res.status(404).json({ success: false, message: "Topic not found" });

        // Deleta o arquivo do Cloudinary
        await cloudinary.uploader.destroy(public_id);

        // Remove do array no MongoDB
        topic.attachments = topic.attachments.filter(att => att.public_id !== public_id);
        await topic.save();

        res.status(200).json({ success: true, message: "Arquivo removido com sucesso" });
    } catch (error) {
        console.log("error in removeAttachment ", error);
        res.status(500).json({ success: false, message: "Erro ao remover arquivo" });
    }
}


export const concludedReview = async (req, res) => {
    const { id, review } = req.params;

    try {
        const topic = await Topic.findById(id);

        if (!topic) {
            return res.status(404).json({ success: false, message: "Assunto não encontrado." });
        }

        //Se a revisão clicada for a de 30 dias (review3)
        if (review === "review3") {
            const nextReviewDate = isToday();
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
        const topic = await Topic.findById(id);

        if (!topic) {
            return res.status(404).json({ success: false, message: "Assunto não encontrado." });
        }

        if (review === "review3") {
            // Volta 30 dias no tempo se ele quiser desfazer o pulo da review3
            const prevReviewDate = new Date(topic.review3);
            prevReviewDate.setDate(prevReviewDate.getDate() - 30);

            topic.review3 = prevReviewDate;
            topic.review3_concluded = false;
        } else {
            // Desmarca a review1 ou review2
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

        //Verifica se o usuário que fez a requisição é o dono da matéria
        if (topic.subject_id.user_id.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: "Acesso negado. Você não é o dono deste arquivo." });
        }

        //Verifica se o arquivo existe dentro do assunto
        const attachment = topic.attachments.find(att => att.public_id === decodedPublicId);
        if (!attachment) {
            return res.status(404).json({ success: false, message: "Arquivo não encontrado no banco de dados." });
        }

        // Faz o download do Cloudinary e repassa (Pipe) para o Frontend
        https.get(attachment.url, (stream) => {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.name)}"`);

            // O pipe conecta o download do Cloudinary direto na resposta pro Frontend
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
