import TimeLine from '../models/timeLine.model.js';


export const addSubjectTimeLine = async (req, res) => {

    const { day, startTime, endTime, subject_id } = req.body;

    try {

        if (!subject_id || !day || !startTime || !endTime) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Verifica se já existe conflito de horário para este usuário neste dia
        const conflict = await TimeLine.findOne({
            user_id: req.userId,
            day,
            startTime: { $lt: endTime }, // Começa antes do novo terminar
            endTime: { $gt: startTime }  // Termina depois do novo começar
        });

        if (conflict) {
            return res.status(400).json({ success: false, message: "Conflito de horário! Já existe uma matéria neste período." });
        }

        const timeLine = new TimeLine({
            user_id: req.userId,
            subject_id,
            day,
            startTime,
            endTime
        });

        await timeLine.save();

        res.status(201).json({ success: true, message: "Timeline entry created successfully", timeLine });

    } catch (error) {
        console.log("error in addSubjectTimeLine ", error);
        res.status(500).json({ success: false, message: "Server error" })
    }

}

export const getTimeline = async (req, res) => {
    try {
        const timeline = await TimeLine.find({ user_id: req.userId }).populate("subject_id").sort({ startTime: 1 });
        res.status(200).json({ success: true, timeline });
    } catch (error) {
        console.log("error in getTimeline ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const deleteTimeLine = async (req, res) => {
    try {
        const { id } = req.params;
        await TimeLine.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Item deleted successfully" });
    } catch (error) {
        console.log("error in deleteTimeLine ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const updateTimeLine = async (req, res) => {
    const { id } = req.params;
    const { day, startTime, endTime, subject_id } = req.body;

    try {
        // Verifica conflito excluindo o próprio item atual da busca
        const conflict = await TimeLine.findOne({
            user_id: req.userId,
            day,
            startTime: { $lt: endTime },
            endTime: { $gt: startTime },
            _id: { $ne: id }
        });

        if (conflict) {
            return res.status(400).json({ success: false, message: "Conflito de horário! Já existe uma matéria neste período." });
        }

        const timeLine = await TimeLine.findByIdAndUpdate(id, { day, startTime, endTime, subject_id }, { returnDocument: "after" }).populate("subject_id");

        res.status(200).json({ success: true, message: "Timeline updated successfully", timeLine });

    } catch (error) {
        console.log("error in updateTimeLine ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}
