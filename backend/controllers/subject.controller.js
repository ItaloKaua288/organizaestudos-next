import Note from "../models/note.model.js";
import Subject from "../models/subject.model.js";
import Topic from "../models/topic.model.js";
import cloudinary from '../utils/cloudinary.js';

export const createSubject = async (req, res) => {
    const { title, color, user_id } = req.body;

    try {
        if (!title) {
            return res.status(400).json({ success: false, message: "Title is required" });
        }

        const subject = new Subject({
            title,
            user_id: user_id || req.userId,
            color: color || "#000000"
        });

        await subject.save();

        res.status(201).json({ success: true, message: "Subject created successfully", subject: subject });
    } catch (error) {
        console.log("error in createSubject ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find({ user_id: req.userId });
        res.status(200).json({ success: true, subjects: subjects });
    } catch (error) {
        console.log("error in getSubjecs ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const deleteSubject = async (req, res) => {
    const { id } = req.params;

    try {
        const subject = await Subject.findOne({ _id: id, user_id: req.userId });

        if (!subject) {
            return res.status(404).json({ success: false, message: "Subject not found" });
        }

        // 1. Buscar todos os assuntos dessa matéria
        const topics = await Topic.find({ subject_id: id });

        // 2. Deletar arquivos do Cloudinary de todos os assuntos encontrados
        for (const topic of topics) {
            if (topic.attachments && topic.attachments.length > 0) {
                const deletePromises = topic.attachments.map(file => cloudinary.uploader.destroy(file.public_id));
                await Promise.all(deletePromises);
            }
        }

        // 3. Deletar os assuntos e a matéria do banco de dados
        await Topic.deleteMany({ subject_id: id });
        await Subject.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "Subject deleted successfully" });
    } catch (error) {
        console.log("error in deleteSubject ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const updateSubject = async (req, res) => {
    const { id } = req.params;
    const { title, color } = req.body;

    try {
        const subject = await Subject.findOne({ _id: id, user_id: req.userId });

        if (!subject) {
            return res.status(404).json({ success: false, message: "Subject not found" });
        }

        if (title) subject.title = title;
        if (color) subject.color = color;

        await subject.save();

        res.status(200).json({ success: true, message: "Subject updated successfully", subject: subject });

    } catch (error) {

    }
}

export const getDetailSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await Subject.findOne({ user_id: req.userId, _id: id });

        if (!subject)
            return res.status(404).json({ success: false, message: "Subject not found" });

        const topics = await Topic.find({ subject_id: id })
        const notes = await Note.find({ subject_id: id })

        res.status(200).json({ success: true, subject, topics, notes });
    } catch (error) {
        console.log("error in getDetailSubject", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}
