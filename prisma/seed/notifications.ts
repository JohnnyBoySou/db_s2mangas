import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedNotifications() {
  try {
    // Busca um usuário e alguns mangás para usar nas notificações
    const user = await prisma.user.findFirst();
    const mangas = await prisma.manga.findMany({ take: 5 });
    const chapters = await prisma.chapter.findMany({ take: 5 });

    if (!user || mangas.length === 0 || chapters.length === 0) {
      console.log("❌ Dados necessários não encontrados para criar notificações");
      return;
    }

    const notifications = [
      // Notificações sobre novos capítulos
      ...chapters.map((chapter, index) => ({
        userId: user.id,
        mangaId: chapter.mangaId,
        chapterId: chapter.id,
        message: `Novo capítulo ${chapter.chapter_number} disponível!`,
        isRead: index % 2 === 0, // Algumas lidas, outras não
        createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000) // Uma por dia
      })),

      // Notificações sobre mangás
      ...mangas.map((manga, index) => ({
        userId: user.id,
        mangaId: manga.id,
        message: `Mangá "${manga.translations[0]?.name || 'Sem título'}" atualizado!`,
        isRead: index % 2 === 0,
        createdAt: new Date(Date.now() - (index + 5) * 24 * 60 * 60 * 1000)
      })),

      // Notificações gerais
      ...Array(10).fill(null).map((_, index) => ({
        userId: user.id,
        message: `Notificação geral #${index + 1}`,
        isRead: index % 2 === 0,
        createdAt: new Date(Date.now() - (index + 10) * 24 * 60 * 60 * 1000)
      }))
    ];

    // Cria as notificações
    await prisma.notification.createMany({
      data: notifications
    });

    console.log("✅ Notificações criadas com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao criar notificações:", error);
  }
} 