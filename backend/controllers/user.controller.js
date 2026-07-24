import User from '../models/user.model.js';
import Subject from '../models/subject.model.js';
import Topic from '../models/topic.model.js';
import cloudinary from '../utils/cloudinary.js';

// FUNÇÔES DE USUÁRIO
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

// FUNÇOES DE TEMPO DE ESTUDO
export const addStudyTime = async (req, res) => {
    const { minutes } = req.body;

    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Soma os minutos novos aos minutos que já existiam
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
        // 1. Verifica se quem está pedindo é realmente um Admin
        const requester = await User.findById(req.userId);
        if (!requester || !requester.isAdmin) {
            return res.status(403).json({ success: false, message: "Acesso negado. Apenas administradores." });
        }

        // 2. Busca todos os usuários
        const users = await User.find().select("-password").sort({ createdAt: -1 });

        // 3. Agrega dados de matérias e assuntos para cada usuário
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
        // 1. Verifica se quem está a pedir é realmente um Admin
        const requester = await User.findById(req.userId);
        if (!requester || !requester.isAdmin) {
            return res.status(403).json({ success: false, message: "Acesso negado. Apenas administradores." });
        }

        // 2. Encontra o utilizador a ser atualizado
        const userToUpdate = await User.findById(id);
        if (!userToUpdate) {
            return res.status(404).json({ success: false, message: "Utilizador não encontrado." });
        }

        // 3. Atualiza apenas os campos enviados
        if (name) userToUpdate.name = name;
        if (email) userToUpdate.email = email;
        if (isAdmin !== undefined) userToUpdate.isAdmin = isAdmin;
        if (isVerified !== undefined) userToUpdate.isVerified = isVerified;

        await userToUpdate.save();

        // Remove a password antes de enviar a resposta para o frontend
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
        // 1. Verifica se quem está pedindo é realmente um Admin
        const requester = await User.findById(req.userId);
        if (!requester || !requester.isAdmin) {
            return res.status(403).json({ success: false, message: "Acesso negado. Apenas administradores." });
        }

        // 2. Encontra o usuário a ser deletado
        const userToDelete = await User.findById(id);
        if (!userToDelete) {
            return res.status(404).json({ success: false, message: "Usuário não encontrado." });
        }

        // 3. Buscar todas as matérias do usuário
        const subjects = await Subject.find({ user_id: id });
        const subjectIds = subjects.map(m => m._id);

        // 4. Buscar todos os assuntos dessas matérias
        const topics = await Topic.find({ subject_id: { $in: subjectIds } });

        // 5. Deletar arquivos do Cloudinary de todos os assuntos encontrados
        for (const topic of topics) {
            if (topic.attachments && topic.attachments.length > 0) {
                const deletePromises = topic.attachments.map(file => cloudinary.uploader.destroy(file.public_id));
                await Promise.all(deletePromises);
            }
        }

        // 6. Deletar registros do banco de dados em cascata
        await Topic.deleteMany({ subject_id: { $in: subjectIds } });
        await Subject.deleteMany({ user_id: id });
        await User.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "Usuário e todos os seus dados foram excluídos com sucesso." });

    } catch (error) {
        console.log("error in deleteUserAdmin ", error);
        res.status(500).json({ success: false, message: "Erro no servidor ao excluir usuário" });
    }
}
