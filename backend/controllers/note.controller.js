import Note from "../models/note.model.js";

export const createNote = async (req, res) => {
    const { title, content, subject_id } = req.body;
    const user_id = req.userId;

    try {
        if (!title || !content || !subject_id) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const note = new Note({
            title,
            content,
            user_id,
            subject_id
        });

        await note.save();

        res.status(201).json({ success: true, message: "Note created successfully", note });

    } catch (error) {
        console.log("Erro no createNote: ", error);

        //erro de validação do Mongoose (maxlength)
        if (error.name === 'ValidationError') {
            const message = Object.values(error.errors).map(val => val.message)[0];
            return res.status(400).json({ success: false, message });
        }

        // Se for outro tipo de erro 
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const getNotes = async (req, res) => {
    const user_id = req.userId;
    const { subjectId } = req.params;


    try {
        const notes = await Note.find({ user_id, subject_id: subjectId }).populate("subject_id");
        res.status(200).json({ success: true, notes });
    } catch (error) {
        console.log("error in getNotes ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const updateNote = async (req, res) => {
    const { id } = req.params;
    const { title, content, subject_id, isPinned } = req.body;
    const user_id = req.userId;

    try {
        const note = await Note.findOneAndUpdate(
            { _id: id, user_id },
            { title, content, subject_id, isPinned },
            { new: true }
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
