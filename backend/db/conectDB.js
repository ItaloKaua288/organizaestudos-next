import mongoose from "mongoose";

// Reaproveita a conexão entre invocações "quentes" da função serverless (Vercel) e
// evita abrir várias conexões se connectDB for chamado mais de uma vez.
let connectionPromise = null;

const dropLegacyIndex = async () => {
    // O ciclo de estudos era único por usuário (índice user_id_1). Agora é único por perfil
    // (user_id + profile_id), então o índice antigo precisa sair. Se já foi removido, ignora.
    try {
        await mongoose.connection.collection("studycycles").dropIndex("user_id_1");
    } catch {
        // índice inexistente: nada a fazer
    }
};

export const connectDB = async () => {
    if (mongoose.connection.readyState === 1) return mongoose.connection;

    if (!connectionPromise) {
        connectionPromise = mongoose
            .connect(process.env.MONGO_URL, {
                // Serverless: poucas conexões por instância; mantém algumas abertas para evitar handshake.
                maxPoolSize: 10,
                minPoolSize: 1,
            })
            .then((conn) => {
                // Não bloqueia a primeira requisição: roda em segundo plano.
                dropLegacyIndex();
                return conn;
            })
            .catch((error) => {
                connectionPromise = null; // permite tentar de novo na próxima invocação
                console.error(`Error: ${error.message}`);
                // Em serverless, derrubar o processo só piora; localmente mantém o comportamento antigo.
                if (!process.env.VERCEL) process.exit(1);
                throw error;
            });
    }

    return connectionPromise;
};
