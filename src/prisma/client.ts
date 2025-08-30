import { createCachedPrismaClient } from "@/utils/prismaCache";

const prisma = createCachedPrismaClient();

async function connectWithRetry(retries = 5, delay = 5000) {
  while (retries > 0) {
    try {
      await prisma.$connect();
      console.log("✅ Conexão com o banco de dados estabelecida com sucesso");
      return;
    } catch (error) {
      retries--;
      console.error(
        `❌ Falha na conexão com o banco de dados. Tentativas restantes: ${retries}`
      );
      console.error(error);
      if (retries === 0) {
        console.error(
          "❌ Não foi possível conectar ao banco de dados. Encerrando o processo."
        );
        process.exit(1);
      }
      console.log(
        `⏳ Aguardando ${delay / 1000} segundos antes de tentar novamente...`
      );
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

connectWithRetry();
export default prisma;
