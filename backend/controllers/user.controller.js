import bcryptjs from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Subject from '../models/subject.model.js';
import Profile from '../models/profile.model.js';
import Topic from '../models/topic.model.js';
import Note from '../models/note.model.js';
import QuestionLog from '../models/questionLog.model.js';
import cloudinary from '../utils/cloudinary.js';

const MAX_NAME_LENGTH = 60;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72; // limite do bcrypt

export const updateUser = async (req, res) => {
    const { name, quickLinks } = req.body;

    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (name !== undefined) {
            const cleanName = String(name).trim().replace(/\s+/g, " ");
            if (!cleanName) {
                return res.status(400).json({ success: false, message: "O nome é obrigatório." });
            }
            if (cleanName.length > MAX_NAME_LENGTH) {
                return res.status(400).json({ success: false, message: `O nome pode ter no máximo ${MAX_NAME_LENGTH} caracteres.` });
            }
            user.name = cleanName;
        }
        if (quickLinks) user.quickLinks = quickLinks;

        await user.save();

        // Nunca devolve o hash da senha nem tokens internos.
        const { password, resetPasswordtoken, resetPasswordexpiresAt, verificationToken, verificationExpiresAt, ...safeUser } = user.toObject();

        res.status(200).json({ success: true, message: "User updated successfully", user: safeUser });

    } catch (error) {
        console.log("error in updateUser ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// Dados da conta para a página de perfil: nome, datas e um resumo de tudo que o usuário já estudou
// (somando todos os perfis de estudo).
export const getAccount = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("name createdAt lastLogin");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const userId = new mongoose.Types.ObjectId(req.userId);

        const [profilesCount, subjects] = await Promise.all([
            Profile.countDocuments({ user_id: userId }),
            Subject.find({ user_id: userId }).select("_id active").lean(),
        ]);

        const subjectIds = subjects.map((subject) => subject._id);

        const [topicsCount, concludedTopicsCount, notesCount, questionRows] = await Promise.all([
            Topic.countDocuments({ subject_id: { $in: subjectIds } }),
            Topic.countDocuments({ subject_id: { $in: subjectIds }, status: "CONCLUIDO" }),
            Note.countDocuments({ user_id: userId }),
            QuestionLog.aggregate([
                { $match: { user_id: userId } },
                { $group: { _id: null, total: { $sum: "$total" }, correct: { $sum: "$correct" } } },
            ]),
        ]);

        const questionsTotal = questionRows[0]?.total ?? 0;
        const questionsCorrect = questionRows[0]?.correct ?? 0;

        res.status(200).json({
            success: true,
            account: {
                name: user.name,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
                stats: {
                    profiles: profilesCount,
                    subjects: subjects.length,
                    activeSubjects: subjects.filter((subject) => subject.active !== false).length,
                    topics: topicsCount,
                    concludedTopics: concludedTopicsCount,
                    notes: notesCount,
                    questionsTotal,
                    questionsCorrect,
                },
            },
        });
    } catch (error) {
        console.log("error in getAccount ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body ?? {};

    try {
        if (typeof currentPassword !== "string" || typeof newPassword !== "string" || !currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Informe a senha atual e a nova senha." });
        }
        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({ success: false, message: `A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` });
        }
        if (newPassword.length > MAX_PASSWORD_LENGTH) {
            return res.status(400).json({ success: false, message: `A nova senha pode ter no máximo ${MAX_PASSWORD_LENGTH} caracteres.` });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isCurrentValid = await bcryptjs.compare(currentPassword, user.password);
        if (!isCurrentValid) {
            return res.status(400).json({ success: false, message: "A senha atual está incorreta." });
        }

        const isSamePassword = await bcryptjs.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ success: false, message: "A nova senha deve ser diferente da atual." });
        }

        user.password = await bcryptjs.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ success: true, message: "Senha alterada com sucesso!" });
    } catch (error) {
        console.log("error in changePassword ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const addStudyTime = async (req, res) => {
    const { minutes } = req.body;

    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.totalStudyTime = (user.totalStudyTime || 0) + minutes;
        await user.save();

        res.status(200).json({ success: true, totalStudyTime: user.totalStudyTime });
    } catch (error) {
        console.log("error in addStudyTime ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const getStudyTime = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, totalStudyTime: user.totalStudyTime || 0 });
    } catch (error) {
        console.log("error in getStudyTime ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// FUNÇOES ADMIN
export const getAllUsersAdmin = async (req, res) => {
    try {
        const requester = await User.findById(req.userId);
        if (!requester || !requester.isAdmin) {
            return res.status(403).json({ success: false, message: "Acesso negado. Apenas administradores." });
        }

        const users = await User.find().select("-password").sort({ createdAt: -1 });

        const usersWithStats = await Promise.all(users.map(async (user) => {
            const subjects = await Subject.find({ user_id: user._id });
            const subjectIds = subjects.map(m => m._id);

            const topics = await Topic.find({ subject_id: { $in: subjectIds } }).populate('subject_id', 'title color');
            const attachmentsCount = topics.reduce((acc, sub) => acc + (sub.attachments?.length || 0), 0);

            return { ...user.toObject(), subjectsCount: subjects.length, topicsCount: topics.length, attachmentsCount, topics, subjects };
        }));

        res.status(200).json({ success: true, users: usersWithStats });
    } catch (error) {
        console.log("error in getAllUsersAdmin ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const updateUserAdmin = async (req, res) => {
    const { id } = req.params;
    const { name, email, isAdmin, isVerified } = req.body;

    try {
        const requester = await User.findById(req.userId);
        if (!requester || !requester.isAdmin) {
            return res.status(403).json({ success: false, message: "Acesso negado. Apenas administradores." });
        }

        const userToUpdate = await User.findById(id);
        if (!userToUpdate) {
            return res.status(404).json({ success: false, message: "Utilizador não encontrado." });
        }

        if (name) userToUpdate.name = name;
        if (email) userToUpdate.email = email;
        if (isAdmin !== undefined) userToUpdate.isAdmin = isAdmin;
        if (isVerified !== undefined) userToUpdate.isVerified = isVerified;

        await userToUpdate.save();

        const userResponse = userToUpdate.toObject();
        delete userResponse.password;

        res.status(200).json({ success: true, message: "Utilizador atualizado com sucesso", user: userResponse });
    } catch (error) {
        console.log("error in updateUserAdmin ", error);
        res.status(500).json({ success: false, message: "Erro no servidor" });
    }
}

export const deleteUserAdmin = async (req, res) => {
    const { id } = req.params;

    try {
        const requester = await User.findById(req.userId);
        if (!requester || !requester.isAdmin) {
            return res.status(403).json({ success: false, message: "Acesso negado. Apenas administradores." });
        }

        const userToDelete = await User.findById(id);
        if (!userToDelete) {
            return res.status(404).json({ success: false, message: "Usuário não encontrado." });
        }

        const subjects = await Subject.find({ user_id: id });
        const subjectIds = subjects.map(m => m._id);

        const topics = await Topic.find({ subject_id: { $in: subjectIds } });

        for (const topic of topics) {
            if (topic.attachments && topic.attachments.length > 0) {
                const deletePromises = topic.attachments.map(file => cloudinary.uploader.destroy(file.public_id));
                await Promise.all(deletePromises);
            }
        }

        await Topic.deleteMany({ subject_id: { $in: subjectIds } });
        await Subject.deleteMany({ user_id: id });
        await Profile.deleteMany({ user_id: id });
        await User.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "Usuário e todos os seus dados foram excluídos com sucesso." });

    } catch (error) {
        console.log("error in deleteUserAdmin ", error);
        res.status(500).json({ success: false, message: "Erro no servidor ao excluir usuário" });
    }
}
