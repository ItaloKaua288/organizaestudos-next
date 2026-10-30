import mongoose from "mongoose";
import CycleHistory from "../models/cycleHistory.model.js";
import Note from "../models/note.model.js";
import Profile from "../models/profile.model.js";
import QuestionLog from "../models/questionLog.model.js";
import StudyCycle from "../models/studyCycle.model.js";
import Subject from "../models/subject.model.js";
import TimeLine from "../models/timeLine.model.js";
import Topic from "../models/topic.model.js";
import cloudinary from "../utils/cloudinary.js";
import { deleteNotesWithAttachments } from "../utils/noteAttachments.js";
import { clearProfileCache } from "../middleware/profile.js";

const MAX_PROFILES = 20;

const cleanName = (value) => String(value ?? "").trim().replace(/\s+/g, " ");

const present = (profile, subjectsCount = 0) => ({
    id: String(profile._id),
    name: profile.name,
    subjectsCount,
});

const countSubjects = async (userId) => {
    const rows = await Subject.aggregate([
        { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: "$profile_id", count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((row) => [String(row._id), row.count]));
};

// Lista os perfis do usuário e informa qual é o ativo (o attachProfile já resolveu isso).
export const getProfiles = async (req, res) => {
    try {
        const [profiles, counts] = await Promise.all([
            Profile.find({ user_id: req.userId }).sort({ createdAt: 1, _id: 1 }).lean(),
            countSubjects(req.userId),
        ]);

        res.status(200).json({
            success: true,
            activeProfileId: String(req.profileId),
            profiles: profiles.map((profile) => present(profile, counts.get(String(profile._id)) ?? 0)),
        });
    } catch (error) {
        console.log("error in getProfiles ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const createProfile = async (req, res) => {
    try {
        const name = cleanName(req.body?.name);

        if (!name) return res.status(400).json({ success: false, message: "O nome do perfil é obrigatório." });
        if (name.length > 60) return res.status(400).json({ success: false, message: "O nome do perfil pode ter no máximo 60 caracteres." });

        const total = await Profile.countDocuments({ user_id: req.userId });
        if (total >= MAX_PROFILES) {
            return res.status(400).json({ success: false, message: `Você pode ter no máximo ${MAX_PROFILES} perfis.` });
        }

        const profile = await Profile.create({ user_id: req.userId, name });

        res.status(201).json({ success: true, message: "Perfil criado com sucesso!", profile: present(profile) });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ success: false, message: "Já existe um perfil com esse nome." });
        }
        console.log("error in createProfile ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const name = cleanName(req.body?.name);

        if (!mongoose.isValidObjectId(id)) return res.status(404).json({ success: false, message: "Perfil não encontrado." });
        if (!name) return res.status(400).json({ success: false, message: "O nome do perfil é obrigatório." });
        if (name.length > 60) return res.status(400).json({ success: false, message: "O nome do perfil pode ter no máximo 60 caracteres." });

        const profile = await Profile.findOne({ _id: id, user_id: req.userId });
        if (!profile) return res.status(404).json({ success: false, message: "Perfil não encontrado." });

        profile.name = name;
        await profile.save();

        res.status(200).json({ success: true, message: "Perfil renomeado com sucesso!", profile: present(profile) });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ success: false, message: "Já existe um perfil com esse nome." });
        }
        console.log("error in updateProfile ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Exclui o perfil e TUDO que pertence a ele (matérias, assuntos, anexos, notas, cronograma, questões e ciclo).
export const deleteProfile = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) return res.status(404).json({ success: false, message: "Perfil não encontrado." });

        const profile = await Profile.findOne({ _id: id, user_id: req.userId });
        if (!profile) return res.status(404).json({ success: false, message: "Perfil não encontrado." });

        const total = await Profile.countDocuments({ user_id: req.userId });
        if (total <= 1) {
            return res.status(400).json({ success: false, message: "Você precisa ter pelo menos um perfil." });
        }

        const subjects = await Subject.find({ user_id: req.userId, profile_id: profile._id }).select("_id").lean();
        const subjectIds = subjects.map((subject) => subject._id);

        const topics = await Topic.find({ subject_id: { $in: subjectIds } }).select("attachments").lean();
        for (const topic of topics) {
            if (topic.attachments?.length) {
                await Promise.all(topic.attachments.map((file) => cloudinary.uploader.destroy(file.public_id)));
            }
        }

        const cycle = await StudyCycle.findOneAndDelete({ user_id: req.userId, profile_id: profile._id });
        if (cycle) await CycleHistory.deleteMany({ cycle_id: cycle._id });

        await deleteNotesWithAttachments({ subject_id: { $in: subjectIds } });
        await TimeLine.deleteMany({ subject_id: { $in: subjectIds } });
        await QuestionLog.deleteMany({ subject_id: { $in: subjectIds } });
        await Topic.deleteMany({ subject_id: { $in: subjectIds } });
        await Subject.deleteMany({ _id: { $in: subjectIds } });
        await profile.deleteOne();
        clearProfileCache(req.userId);

        res.status(200).json({ success: true, message: "Perfil excluído com sucesso." });
    } catch (error) {
        console.log("error in deleteProfile ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

