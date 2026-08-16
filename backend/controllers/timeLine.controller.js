import TimeLine from '../models/timeLine.model.js';
import Subject from "../models/subject.model.js";

const allowedDays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

export const addSubjectTimeLine = async (req, res) => {

    const { day, startTime, endTime, subject_id } = req.body;

    try {
        if (!allowedDays.includes(day)) return res.status(400).json({ success: false, message: "Invalid day" });

        if (!subject_id || !day || !startTime || !endTime) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const subject = await Subject.findOne({ _id: subject_id, user_id: req.userId });

        if (!subject)
            return res.status(404).json({ success: false, message: "Subject not found" });

        const conflict = await TimeLine.findOne({
            user_id: req.userId,
            day,
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
        });

        if (conflict) {
            return res.status(400).json({ success: false, message: "Conflito de horário! Já existe uma matéria neste período." });
        }

        const timeLine = new TimeLine({
            user_id: req.userId,
            subject_id: subject._id,
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
        const timeline = await TimeLine.find({ user_id: req.userId }).populate("subject_id").sort({ startTime: 1 }).lean();
        res.status(200).json({ success: true, timeline });
    } catch (error) {
        console.log("error in getTimeline ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const deleteTimeLine = async (req, res) => {
    try {
        const { id } = req.params;

        const timeLine = await TimeLine.findOneAndDelete({ _id: id, user_id: req.userId });

        if (!timeLine)
            return res.status(404).json({ success: false, message: "Timeline item not found" });

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
        if (!allowedDays.includes(day)) return res.status(400).json({ success: false, message: "Invalid day" });

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

        const timeLine = await TimeLine.findByIdAndUpdate({ _id: id, user_id: req.userId }, { day, startTime, endTime, subject_id: subject.id }, { returnDocument: "after" }).populate("subject_id");

        res.status(200).json({ success: true, message: "Timeline updated successfully", timeLine });

    } catch (error) {
        console.log("error in updateTimeLine ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}
