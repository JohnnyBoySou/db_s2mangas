import prisma from "@/prisma/client";
import { logger } from "./logger";
import fs from "fs";
import path from "path";

interface AnalyticsReport {
  timestamp: string;
  users: {
    total: number;
    active: number;
    admins: number;
  };
  mangas: {
    total: number;
    mostViewed: Array<{ id: string; title: string; views: number }>;
    recentlyAdded: number;
  };
  content: {
    totalChapters: number;
    totalComments: number;
    totalReviews: number;
    totalNotifications: number;
  };
  files: {
    totalFiles: number;
    totalSize: string;
  };
  engagement: {
    totalLikes: number;
    totalFollows: number;
    totalCollections: number;
  };
}

/**
 * Gera relatório completo de analytics do sistema
 */
export async function generateAnalytics(): Promise<AnalyticsReport> {
  try {
    logger.info("Iniciando geração de relatório de analytics...");

    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Dados de usuários
    const [totalUsers, activeUsers, adminUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          updatedAt: {
            gte: lastWeek,
          },
        },
      }),
      prisma.user.count({
        where: {
          isAdmin: true,
        },
      }),
    ]);

    // Dados de mangás
    const [totalMangas, recentMangas] = await Promise.all([
      prisma.manga.count(),
      prisma.manga.count({
        where: {
          createdAt: {
            gte: lastWeek,
          },
        },
      }),
    ]);

    // Mangás mais visualizados (simulado - você pode implementar um sistema de views)

    const mostViewedMangas = await prisma.manga.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        translations: {
          where: {
            language: {
              //  code: 'pt-br'
            },
          },
          take: 1,
        },
      },
    });

    // Dados de conteúdo
    const [totalChapters, totalComments, totalReviews, totalNotifications] =
      await Promise.all([
        prisma.chapter.count(),
        prisma.comment.count(),
        prisma.review.count(),
        prisma.notification.count(),
      ]);

    // Dados de arquivos
    const totalFiles = await prisma.file.count();
    const uploadsDir = path.join(process.cwd(), "uploads");
    let totalSize = "0 MB";

    try {
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        let sizeInBytes = 0;

        for (const file of files) {
          const filePath = path.join(uploadsDir, file);
          const stats = fs.statSync(filePath);
          sizeInBytes += stats.size;
        }

        totalSize = `${(sizeInBytes / 1024 / 1024).toFixed(2)} MB`;
      }
    } catch (error) {
      logger.warn("Erro ao calcular tamanho dos arquivos:", error);
    }

    // Dados de engajamento
    const [totalLikes, totalFollows, totalCollections] = await Promise.all([
      prisma.like.count(),
  //    prisma.follow.count(),
      prisma.collection.count(),
    ]);

    const report: AnalyticsReport = {
      timestamp: now.toISOString(),
      users: {
        total: totalUsers,
        active: activeUsers,
        admins: adminUsers,
      },
      mangas: {
        total: totalMangas,
        mostViewed: mostViewedMangas.map((manga) => ({
          id: manga.id,
          title: manga.translations[0]?.title || "Sem título",
          views: Math.floor(Math.random() * 1000) + 100, // Simulado
        })),
        recentlyAdded: recentMangas,
      },
      content: {
        totalChapters,
        totalComments,
        totalReviews,
        totalNotifications,
      },
      files: {
        totalFiles,
        totalSize,
      },
      engagement: {
        totalLikes,
        totalFollows,
        totalCollections,
      },
    };

    // Salva o relatório
    await saveAnalyticsReport(report);

    logger.info("Relatório de analytics gerado com sucesso.");
    return report;
  } catch (error) {
    logger.error("Erro ao gerar analytics:", error);
    throw error;
  }
}

/**
 * Salva o relatório de analytics em arquivo
 */
export async function saveAnalyticsReport(report: AnalyticsReport) {
  try {
    const reportsDir = path.join(process.cwd(), "reports");

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const reportFile = path.join(reportsDir, `analytics-${timestamp}.json`);

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    logger.info(`Relatório salvo em: ${reportFile}`);

    // Limpa relatórios antigos (mantém apenas os últimos 30)
    await cleanOldReports(reportsDir);
  } catch (error) {
    logger.error("Erro ao salvar relatório:", error);
  }
}

/**
 * Remove relatórios antigos
 */
export async function cleanOldReports(
  reportsDir: string,
  keepCount: number = 30
) {
  try {
    const files = fs
      .readdirSync(reportsDir)
      .filter((file) => file.startsWith("analytics-") && file.endsWith(".json"))
      .map((file) => ({
        name: file,
        path: path.join(reportsDir, file),
        mtime: fs.statSync(path.join(reportsDir, file)).mtime,
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    const filesToDelete = files.slice(keepCount);

    for (const file of filesToDelete) {
      fs.unlinkSync(file.path);
    }

    if (filesToDelete.length > 0) {
      logger.info(`${filesToDelete.length} relatórios antigos removidos.`);
    }
  } catch (error) {
    logger.error("Erro ao limpar relatórios antigos:", error);
  }
}

/**
 * Gera métricas rápidas para dashboard
 */
export async function getQuickMetrics() {
  try {
    const [users, mangas, chapters, comments] = await Promise.all([
      prisma.user.count(),
      prisma.manga.count(),
      prisma.chapter.count(),
      prisma.comment.count(),
    ]);

    return {
      users,
      mangas,
      chapters,
      comments,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Erro ao obter métricas rápidas:", error);
    throw error;
  }
}
