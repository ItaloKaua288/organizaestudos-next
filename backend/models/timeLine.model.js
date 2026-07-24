import mongoose from "mongoose";

const timeLineSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    subject_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true
    },
    day: {
        type: String,
        required: true,
        enum: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    }
}, { timestamps: true })

timeLineSchema.index({ user_id: 1 });

const TimeLine = mongoose.model("TimeLine", timeLineSchema);

export default TimeLine;
