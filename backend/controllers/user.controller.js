import User from '../models/user.model.js';
import Subject from '../models/subject.model.js';
import Topic from '../models/topic.model.js';
import cloudinary from '../utils/cloudinary.js';

export const updateUser = async (req, res) => {
    const { name, quickLinks } = req.body;

    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (name) user.name = name;
        if (quickLinks) user.quickLinks = quickLinks;

        await user.save();

        res.status(200).json({ success: true, message: "User updated successfully", user });

    } catch (error) {
        console.log("error in updateUser ", error);
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
        await User.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "Usuário e todos os seus dados foram excluídos com sucesso." });

    } catch (error) {
        console.log("error in deleteUserAdmin ", error);
        res.status(500).json({ success: false, message: "Erro no servidor ao excluir usuário" });
    }
}
