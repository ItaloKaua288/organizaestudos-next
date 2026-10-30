import Note from "../models/note.model.js";
import QuestionLog from "../models/questionLog.model.js";
import Subject from "../models/subject.model.js";
import TimeLine from "../models/timeLine.model.js";
import Topic from "../models/topic.model.js";
import { subjectScope } from "../middleware/profile.js";
import cloudinary from '../utils/cloudinary.js';
import { deleteNotesWithAttachments } from "../utils/noteAttachments.js";

export const createSubject = async (req, res) => {
    let { title, color } = req.body;

    try {
        if (title === undefined || title === null || !title.trim())
            return res.status(400).json({ success: false, message: "Title is required" });

        if (color === undefined || color === null || !color.trim())
            return res.status(400).json({ success: false, message: "Color is required" });
        else {
            const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;
            if (!hexRegex.test(color))
                return res.status(400).json({ success: false, message: "Invalid color format" });
        }

        title = title.trim();
        color = color.trim();

        const subject = new Subject({
            title,
            user_id: req.userId,
            profile_id: req.profileId,
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
        const subjects = await Subject.find(subjectScope(req)).sort({ createdAt: 1 }).lean();
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

        if (!subject)
            return res.status(404).json({ success: false, message: "Subject not found" });

        const topics = await Topic.find({ subject_id: id });

        for (const topic of topics) {
            if (topic.attachments && topic.attachments.length > 0) {
                const deletePromises = topic.attachments.map(file => cloudinary.uploader.destroy(file.public_id));
                await Promise.all(deletePromises);
            }
        }

        await deleteNotesWithAttachments({ subject_id: id });
        await TimeLine.deleteMany({ subject_id: id });
        await QuestionLog.deleteMany({ subject_id: id });
        await Topic.deleteMany({ subject_id: id });
        await subject.deleteOne();

        res.status(200).json({ success: true, message: "Subject deleted successfully" });
    } catch (error) {
        console.log("error in deleteSubject ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const updateSubject = async (req, res) => {
    const { id } = req.params;
    let { title, color } = req.body;

    try {
        if (title === undefined || title === null || !title.trim())
            return res.status(400).json({ success: false, message: "Title is required" });

        if (color === undefined || color === null || !color.trim())
            return res.status(400).json({ success: false, message: "Color is required" });
        else {
            const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;
            if (!hexRegex.test(color))
                return res.status(400).json({ success: false, message: "Invalid color format" });
        }

        title = title.trim();
        color = color.trim();

        const subject = await Subject.findOne({ _id: id, user_id: req.userId });

        if (!subject) {
            return res.status(404).json({ success: false, message: "Subject not found" });
        }

        if (title) subject.title = title;
        if (color) subject.color = color;

        await subject.save();

        res.status(200).json({ success: true, message: "Subject updated successfully", subject: subject });

    } catch (error) {
        console.log("error in updateSubject ", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

export const toggleSubjectActive = async (req, res) => {
    const { id } = req.params;
    const { active } = req.body;

    try {
        if (typeof active !== "boolean")
            return res.status(400).json({ success: false, message: "Active must be a boolean" });

        const subject = await Subject.findOneAndUpdate(
            { _id: id, user_id: req.userId },
            { active },
            { returnDocument: "after" }
        );

        if (!subject)
            return res.status(404).json({ success: false, message: "Subject not found" });

        res.status(200).json({
            success: true,
            message: active ? "Subject activated successfully" : "Subject deactivated successfully",
            subject
        });
    } catch (error) {
        console.log("error in toggleSubjectActive ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const getDetailSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await Subject.findOne({ user_id: req.userId, _id: id });

        if (!subject)
            return res.status(404).json({ success: false, message: "Subject not found" });

        if (subject.active === false)
            return res.status(200).json({ success: true, subject, topics: [], notes: [], timelines: [] });

        const [topics, notes, timelines] = await Promise.all([
            Topic.find({ subject_id: id }).sort({ order: -1 }).lean(),
            Note.find({ subject_id: id }).sort({ createdAt: -1 }).lean(),
            TimeLine.find({ subject_id: id }).sort({ createdAt: -1 }).lean()
        ]);

        res.status(200).json({ success: true, subject, topics, notes, timelines });
    } catch (error) {
        console.log("error in getDetailSubject", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}
