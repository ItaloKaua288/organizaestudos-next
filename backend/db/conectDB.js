import mongoose from "mongoose"

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL);

        // O ciclo de estudos era único por usuário (índice user_id_1). Agora é único por perfil
        // (user_id + profile_id), então o índice antigo precisa sair. Se já foi removido, ignora.
        try {
            await mongoose.connection.collection("studycycles").dropIndex("user_id_1");
        } catch {
            // índice inexistente: nada a fazer
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}
