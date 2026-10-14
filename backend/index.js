import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { connectDB } from './db/conectDB.js';

import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import subjectRoutes from './routes/subject.route.js';
import topicRoutes from './routes/topic.route.js';
import timeLineRoutes from './routes/timeLine.route.js';
import noteRoutes from './routes/note.route.js';
import cycleRoutes from './routes/cycle.route.js';
import questionLogRoutes from './routes/questionLog.route.js';
import searchRoutes from './routes/search.route.js';
import dataRoutes from './routes/data.route.js';


dotenv.config();

const app = express();
app.set('trust proxy', 1)
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || '';

app.use(cors({
    origin: CLIENT_URL || "http://localhost:3000",
    credentials: true,
}));

// 500kb: o padrão (100kb) não comporta a importação de um edital grande.
app.use(express.json({ limit: "500kb" }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('API is running');
});

//ROTAS
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/subjects", subjectRoutes)
app.use("/api/topics", topicRoutes)
app.use("/api/timelines", timeLineRoutes)
app.use("/api/notes", noteRoutes)
app.use("/api/cycle", cycleRoutes)
app.use("/api/questions", questionLogRoutes)
app.use("/api/search", searchRoutes)
app.use("/api/data", dataRoutes)

if (process.env.VERCEL) {
    await connectDB();
} else {
    app.listen(PORT, async () => {
        await connectDB();
        console.log('Server is running on port:', PORT);
    });
}

export default app;
