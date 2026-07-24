import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Se as variáveis não foram carregadas, tenta buscar o .env na raiz do projeto (../../.env)
if (!process.env.NODEMAILER_EMAIL) {
    dotenv.config({ path: path.resolve(__dirname, "../../.env") });
}

const user = process.env.NODEMAILER_EMAIL;
const pass = process.env.NODEMAILER_PASSWORD;
const name = process.env.NODEMAILER_NAME;



const transport = nodemailer.createTransport({

    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: user,
        pass: pass
    }

})

export const sender = {
    email: user,
    name: name
};

export default transport;
