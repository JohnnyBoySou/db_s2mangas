import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const FIXED_USER_ID = "f1d7c141-b4bd-4b8f-bf9f-7e4da9196e12";
  const FIXED_MANGA_ID = "5354cb0d-96e6-41dc-a15b-09a969616bcb";

  // Notificações
  const notifications = [
    // Notificações sobre novos capítulos
    ...Array(5).fill(null).map((_, index) => ({
      userId: FIXED_USER_ID,
      mangaId: FIXED_MANGA_ID,
      message: `Novo capítulo ${index + 1} disponível!`,
      isRead: index % 2 === 0,
      createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000)
    })),

    // Notificações sobre mangás
    ...Array(5).fill(null).map((_, index) => ({
      userId: FIXED_USER_ID,
      mangaId: FIXED_MANGA_ID,
      message: `Mangá atualizado #${index + 1}!`,
      isRead: index % 2 === 0,
      createdAt: new Date(Date.now() - (index + 5) * 24 * 60 * 60 * 1000)
    })),

    // Notificações gerais
    ...Array(10).fill(null).map((_, index) => ({
      userId: FIXED_USER_ID,
      message: `Notificação geral #${index + 1}`,
      isRead: index % 2 === 0,
      createdAt: new Date(Date.now() - (index + 10) * 24 * 60 * 60 * 1000)
    }))
  ];

  await prisma.notification.createMany({
    data: notifications
  });

  console.log('Seed de notificações finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
