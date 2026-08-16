import Note from "../models/note.model.js";
import Subject from "../models/subject.model.js";

export const createNote = async (req, res) => {
    const { title, content, subject_id } = req.body;
    const user_id = req.userId;

    try {
        if (!title || !content || !subject_id) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        if (title !== undefined) {
            title = title.trim();
            if (!title) return res.status(400).json({ success: false, message: "Title cannot be empty" });
        }

        const subject = await Subject.findOne({ _id: subject_id, user_id: req.userId });

        if (!subject)
            return res.status(404).json({ success: false, message: "Subject not found" });

        const note = new Note({
            title: title.trim(),
            content,
            user_id: req.userId,
            subject_id: subject._id
        });

        await note.save();

        res.status(201).json({ success: true, message: "Note created successfully", note });
    } catch (error) {
        console.log("Erro no createNote: ", error);

        if (error.name === 'ValidationError') {
            const message = Object.values(error.errors).map(val => val.message)[0];
            return res.status(400).json({ success: false, message });
        }

        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const getNotes = async (req, res) => {
    const user_id = req.userId;
    const { subjectId } = req.params;

    try {
        const notes = await Note.find({ user_id, subject_id: subjectId }).populate("subject_id").sort({ createdAt: -1 }).lean();
        res.status(200).json({ success: true, notes });
    } catch (error) {
        console.log("error in getNotes ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const updateNote = async (req, res) => {
    const { id } = req.params;
    let { title, content, subject_id, isPinned } = req.body;
    const user_id = req.userId;

    try {
        if (title !== undefined) {
            title = title.trim();
            if (!title) return res.status(400).json({ success: false, message: "Title cannot be empty" });
        }

        if (subject_id) {
            const subject = await Subject.findOne({ _id: subject_id, user_id });
            if (!subject)
                return res.status(404).json({ success: false, message: "Subject not found" });
        }

        const note = await Note.findOneAndUpdate(
            { _id: id, user_id },
            { title, content, subject_id, isPinned },
            { returnDocument: "after" }
        );

        if (!note) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        res.status(200).json({ success: true, message: "Note updated successfully", note });
    } catch (error) {
        console.log("error in updateNote ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const deleteNote = async (req, res) => {
    const { id } = req.params;
    const user_id = req.userId;

    try {
        const note = await Note.findOneAndDelete({ _id: id, user_id });

        if (!note) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        res.status(200).json({ success: true, message: "Note deleted successfully" });
    } catch (error) {
        console.log("error in deleteNote ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}
