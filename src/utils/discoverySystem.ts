import { PrismaClient } from '@prisma/client';
import { advancedCache } from './advancedCache';
import { logger } from './logger';

const prisma = new PrismaClient();

// Interfaces para o sistema de descoberta
export interface TrendingManga {
  id: string;
  title: string;
  coverImage: string;
  score: number;
  views: number;
  likes: number;
  comments: number;
  trendingScore: number;
  category: string;
  author: string;
  status: string;
  lastChapter?: number;
  updatedAt: Date;
}

export interface SocialDiscovery {
  mangaId: string;
  friendsReading: number;
  friendsCompleted: number;
  friendsLiked: number;
  socialScore: number;
  recommendations: string[];
}

export interface CuratedCollection {
  id: string;
  title: string;
  description: string;
  editorId: string;
  editorName: string;
  mangas: string[];
  tags: string[];
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'reading' | 'social' | 'discovery' | 'achievement';
  requirements: BadgeRequirement[];
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
}

export interface BadgeRequirement {
  type: 'read_chapters' | 'complete_mangas' | 'likes_given' | 'comments_made' | 'friends_added' | 'collections_created';
  count: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export interface ReleaseCalendar {
  id: string;
  mangaId: string;
  mangaTitle: string;
  chapterNumber: number;
  chapterTitle: string;
  releaseDate: Date;
  type: 'chapter' | 'volume';
  confirmed: boolean;
}

// Constantes
const TRENDING_CACHE_TTL = 3600; // 1 hora
const TRENDING_CACHE_KEY = 'trending_mangas';

// Badges predefinidos
const PREDEFINED_BADGES: UserBadge[] = [
  {
    id: 'first_read',
    name: 'Primeiro Capítulo',
    description: 'Leu seu primeiro capítulo',
    icon: '📖',
    category: 'reading',
    requirements: [{ type: 'read_chapters', count: 1 }],
    rarity: 'common',
    points: 10
  },
  {
    id: 'speed_reader',
    name: 'Leitor Veloz',
    description: 'Leu 10 capítulos em um dia',
    icon: '⚡',
    category: 'reading',
    requirements: [{ type: 'read_chapters', count: 10, timeframe: 'daily' }],
    rarity: 'rare',
    points: 50
  },
  {
    id: 'manga_master',
    name: 'Mestre dos Mangás',
    description: 'Completou 100 mangás',
    icon: '👑',
    category: 'achievement',
    requirements: [{ type: 'complete_mangas', count: 100 }],
    rarity: 'legendary',
    points: 500
  },
  {
    id: 'social_butterfly',
    name: 'Borboleta Social',
    description: 'Fez 50 amigos',
    icon: '🦋',
    category: 'social',
    requirements: [{ type: 'friends_added', count: 50 }],
    rarity: 'epic',
    points: 200
  },
  {
    id: 'curator',
    name: 'Curador',
    description: 'Criou 5 coleções públicas',
    icon: '🎨',
    category: 'discovery',
    requirements: [{ type: 'collections_created', count: 5 }],
    rarity: 'rare',
    points: 100
  }
];

// ===== FUNÇÕES DE TRENDING =====

// Funções auxiliares para métricas
async function getRecentViews(mangaId: string, since: Date): Promise<number> {
  // Implementar busca de views recentes (pode usar analytics)
  return 0; // Placeholder
}

async function getRecentLikes(mangaId: string, since: Date): Promise<number> {
  const count = await prisma.like.count({
    where: {
      mangaId,
      createdAt: { gte: since }
    }
  });
  return count;
}

async function getRecentComments(mangaId: string, since: Date): Promise<number> {
  const count = await prisma.comment.count({
    where: {
      mangaId,
      createdAt: { gte: since }
    }
  });
  return count;
}

async function getRecentLibraryAdditions(mangaId: string, since: Date): Promise<number> {
  const count = await prisma.library.count({
    where: {
      mangaId,
      createdAt: { gte: since }
    }
  });
  return count;
}

async function calculateGrowthRate(mangaId: string, since: Date): Promise<number> {
  // Implementar cálculo de taxa de crescimento
  return 0; // Placeholder
}

// Função principal para calcular trending score
export async function calculateTrendingScore(mangaId: string): Promise<number> {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Buscar métricas do manga
    const manga = await prisma.manga.findUnique({
      where: { id: mangaId },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
            libraryEntries: true
          }
        }
      }
    });

    if (!manga) return 0;

    // Métricas recentes (últimas 24h)
    const recentViews = await getRecentViews(mangaId, last24h);
    const recentLikes = await getRecentLikes(mangaId, last24h);
    const recentComments = await getRecentComments(mangaId, last24h);
    const recentAdditions = await getRecentLibraryAdditions(mangaId, last24h);

    // Métricas semanais
    const weeklyViews = await getRecentViews(mangaId, last7d);
    const weeklyGrowth = await calculateGrowthRate(mangaId, last7d);

    // Algoritmo de trending score
    const viewsWeight = 0.3;
    const likesWeight = 0.25;
    const commentsWeight = 0.2;
    const additionsWeight = 0.15;
    const growthWeight = 0.1;

    const trendingScore = (
      (recentViews * viewsWeight) +
      (recentLikes * likesWeight * 10) +
      (recentComments * commentsWeight * 15) +
      (recentAdditions * additionsWeight * 20) +
      (weeklyGrowth * growthWeight * 100)
    );

    return Math.round(trendingScore * 100) / 100;
  } catch (error) {
    logger.error('Erro ao calcular trending score:', error);
    return 0;
  }
}

export async function getTrendingMangas(limit: number = 20): Promise<TrendingManga[]> {
  const cacheKey = `${TRENDING_CACHE_KEY}_${limit}`;
  
  try {
    // Verificar cache
    const cached = await advancedCache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Buscar todos os mangás ativos
    const mangas = await prisma.manga.findMany({
      where: { status: { not: 'DELETED' } },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
            libraryEntries: true
          }
        }
      }
    });

    // Calcular trending score para cada manga
    const trendingMangas: TrendingManga[] = [];
    
    for (const manga of mangas) {
      const trendingScore = await calculateTrendingScore(manga.id);
      
      trendingMangas.push({
        id: manga.id,
        title: manga.title,
        coverImage: manga.coverImage || '',
        score: manga.score || 0,
        views: manga.views || 0,
        likes: manga._count.likes,
        comments: manga._count.comments,
        trendingScore,
        category: manga.category || 'Geral',
        author: manga.author || 'Desconhecido',
        status: manga.status,
        lastChapter: manga.lastChapter,
        updatedAt: manga.updatedAt
      });
    }

    // Ordenar por trending score
    const sortedTrending = trendingMangas
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);

    // Cache por 1 hora
    await advancedCache.set(cacheKey, JSON.stringify(sortedTrending), {
      ttl: TRENDING_CACHE_TTL,
      tags: ['trending', 'discovery']
    });

    return sortedTrending;
  } catch (error) {
    logger.error('Erro ao buscar mangás trending:', error);
    return [];
  }
}

// ===== FUNÇÕES DE DESCOBERTA SOCIAL =====

export async function getPersonalizedRecommendations(userId: string, limit: number = 10): Promise<TrendingManga[]> {
  const cacheKey = `social_recommendations_${userId}_${limit}`;
  
  try {
    const cached = await advancedCache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Buscar amigos do usuário
    const userFriends = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });

    const friendIds = userFriends.map(f => f.followingId);

    if (friendIds.length === 0) {
      // Se não tem amigos, retornar trending geral
      return await getTrendingMangas(limit);
    }

    // Buscar mangás que os amigos estão lendo/gostaram
    const friendsActivity = await prisma.library.findMany({
      where: {
        userId: { in: friendIds },
        status: { in: ['READING', 'COMPLETED'] }
      },
      include: {
        manga: {
          include: {
            _count: {
              select: {
                likes: true,
                comments: true,
                libraryEntries: true
              }
            }
          }
        }
      },
      distinct: ['mangaId']
    });

    // Filtrar mangás que o usuário já tem na biblioteca
    const userLibrary = await prisma.library.findMany({
      where: { userId },
      select: { mangaId: true }
    });

    const userMangaIds = new Set(userLibrary.map(l => l.mangaId));
    
    const recommendations = friendsActivity
      .filter(activity => !userMangaIds.has(activity.mangaId))
      .map(activity => ({
        id: activity.manga.id,
        title: activity.manga.title,
        coverImage: activity.manga.coverImage || '',
        score: activity.manga.score || 0,
        views: activity.manga.views || 0,
        likes: activity.manga._count.likes,
        comments: activity.manga._count.comments,
        trendingScore: 0, // Será calculado
        category: activity.manga.category || 'Geral',
        author: activity.manga.author || 'Desconhecido',
        status: activity.manga.status,
        lastChapter: activity.manga.lastChapter,
        updatedAt: activity.manga.updatedAt
      }))
      .slice(0, limit);

    // Cache por 30 minutos
    await advancedCache.set(cacheKey, JSON.stringify(recommendations), {
      ttl: 1800,
      tags: ['social', 'recommendations', `user_${userId}`]
    });

    return recommendations;
  } catch (error) {
    logger.error('Erro ao buscar recomendações sociais:', error);
    return [];
  }
}

export async function getFriendsActivity(userId: string): Promise<SocialDiscovery[]> {
  try {
    const userFriends = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });

    const friendIds = userFriends.map(f => f.followingId);

    if (friendIds.length === 0) return [];

    // Agrupar atividades por manga
    const activities = await prisma.library.groupBy({
      by: ['mangaId'],
      where: {
        userId: { in: friendIds }
      },
      _count: {
        userId: true
      }
    });

    const socialDiscoveries: SocialDiscovery[] = [];

    for (const activity of activities) {
      const friendsReading = await prisma.library.count({
        where: {
          mangaId: activity.mangaId,
          userId: { in: friendIds },
          status: 'READING'
        }
      });

      const friendsCompleted = await prisma.library.count({
        where: {
          mangaId: activity.mangaId,
          userId: { in: friendIds },
          status: 'COMPLETED'
        }
      });

      const friendsLiked = await prisma.like.count({
        where: {
          mangaId: activity.mangaId,
          userId: { in: friendIds }
        }
      });

      const socialScore = (friendsReading * 2) + (friendsCompleted * 3) + (friendsLiked * 1.5);

      socialDiscoveries.push({
        mangaId: activity.mangaId,
        friendsReading,
        friendsCompleted,
        friendsLiked,
        socialScore,
        recommendations: [] // Implementar lógica de recomendações
      });
    }

    return socialDiscoveries.sort((a, b) => b.socialScore - a.socialScore);
  } catch (error) {
    logger.error('Erro ao buscar atividade dos amigos:', error);
    return [];
  }
}

// ===== FUNÇÕES DE COLEÇÕES CURADAS =====

export async function createCuratedCollection(data: {
  title: string;
  description: string;
  editorId: string;
  mangaIds: string[];
  tags: string[];
  featured?: boolean;
}): Promise<CuratedCollection | null> {
  try {
    // Verificar se o usuário é editor/admin
    const user = await prisma.user.findUnique({
      where: { id: data.editorId }
    });

    if (!user || !user.isAdmin) {
      throw new Error('Usuário não autorizado para criar coleções');
    }

    const collection = await prisma.collection.create({
      data: {
        title: data.title,
        description: data.description,
        userId: data.editorId,
        isPublic: true,
        mangas: {
          connect: data.mangaIds.map(id => ({ id }))
        }
      },
      include: {
        user: true,
        mangas: true
      }
    });

    const curatedCollection: CuratedCollection = {
      id: collection.id,
      title: collection.title,
      description: collection.description || '',
      editorId: collection.userId,
      editorName: collection.user.username,
      mangas: collection.mangas.map(m => m.id),
      tags: data.tags,
      featured: data.featured || false,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt
    };

    // Invalidar cache de coleções
    await advancedCache.invalidateByTags(['collections', 'curated']);

    return curatedCollection;
  } catch (error) {
    logger.error('Erro ao criar coleção curada:', error);
    return null;
  }
}

export async function getFeaturedCollections(limit: number = 5): Promise<CuratedCollection[]> {
  const cacheKey = `featured_collections_${limit}`;
  
  try {
    const cached = await advancedCache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const collections = await prisma.collection.findMany({
      where: {
        isPublic: true,
        user: { isAdmin: true }
      },
      include: {
        user: true,
        mangas: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    const curatedCollections: CuratedCollection[] = collections.map(collection => ({
      id: collection.id,
      title: collection.title,
      description: collection.description || '',
      editorId: collection.userId,
      editorName: collection.user.username,
      mangas: collection.mangas.map(m => m.id),
      tags: [], // Implementar sistema de tags
      featured: true,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt
    }));

    await advancedCache.set(cacheKey, JSON.stringify(curatedCollections), {
      ttl: 3600,
      tags: ['collections', 'curated', 'featured']
    });

    return curatedCollections;
  } catch (error) {
    logger.error('Erro ao buscar coleções em destaque:', error);
    return [];
  }
}

// ===== FUNÇÕES DE BADGES =====

export async function checkAndAwardBadges(userId: string): Promise<UserBadge[]> {
  try {
    const newBadges: UserBadge[] = [];
    
    // Buscar badges já conquistados pelo usuário
    const userBadges = await prisma.userBadge?.findMany({
      where: { userId }
    }) || [];
    
    const earnedBadgeIds = new Set(userBadges.map(b => b.badgeId));

    for (const badge of PREDEFINED_BADGES) {
      if (earnedBadgeIds.has(badge.id)) continue;

      const meetsRequirements = await checkBadgeRequirements(userId, badge.requirements);
      
      if (meetsRequirements) {
        // Conceder badge
        await prisma.userBadge?.create({
          data: {
            userId,
            badgeId: badge.id,
            earnedAt: new Date()
          }
        });

        newBadges.push(badge);
        
        // Criar notificação
        await prisma.notification.create({
          data: {
            userId,
            type: 'BADGE_EARNED',
            title: 'Nova Conquista!',
            message: `Você conquistou o badge "${badge.name}"!`,
            data: JSON.stringify({ badgeId: badge.id })
          }
        });
      }
    }

    return newBadges;
  } catch (error) {
    logger.error('Erro ao verificar badges:', error);
    return [];
  }
}

export async function checkBadgeRequirements(userId: string, requirements: BadgeRequirement[]): Promise<boolean> {
  for (const req of requirements) {
    const meets = await checkSingleRequirement(userId, req);
    if (!meets) return false;
  }
  return true;
}

export async function checkSingleRequirement(userId: string, req: BadgeRequirement): Promise<boolean> {
  const timeFilter = getTimeFilter(req.timeframe);
  
  switch (req.type) {
    case 'read_chapters':
      // Implementar contagem de capítulos lidos
      return true; // Placeholder
    
    case 'complete_mangas':
      const completedCount = await prisma.library.count({
        where: {
          userId,
          status: 'COMPLETED',
          ...timeFilter
        }
      });
      return completedCount >= req.count;
    
    case 'friends_added':
      const friendsCount = await prisma.follow.count({
        where: {
          followerId: userId,
          ...timeFilter
        }
      });
      return friendsCount >= req.count;
    
    case 'collections_created':
      const collectionsCount = await prisma.collection.count({
        where: {
          userId,
          isPublic: true,
          ...timeFilter
        }
      });
      return collectionsCount >= req.count;
    
    default:
      return false;
  }
}

export function getTimeFilter(timeframe?: string) {
  if (!timeframe || timeframe === 'all_time') return {};
  
  const now = new Date();
  let since: Date;
  
  switch (timeframe) {
    case 'daily':
      since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'weekly':
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      return {};
  }
  
  return { createdAt: { gte: since } };
}

export function getAllBadges(): UserBadge[] {
  return PREDEFINED_BADGES;
}

// ===== FUNÇÕES AUXILIARES =====

export function getBadgeById(badgeId: string): UserBadge | undefined {
  return PREDEFINED_BADGES.find(badge => badge.id === badgeId);
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  try {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId }
    });

    return userBadges.map(ub => {
      const badge = PREDEFINED_BADGES.find(b => b.type === ub.badgeType);
      return badge || {
        type: ub.badgeType,
        name: 'Badge Desconhecido',
        description: '',
        icon: '🏆',
        rarity: 'common' as const,
        requirement: { type: 'chapters_read', value: 0 }
      };
    });
  } catch (error) {
    logger.error('Erro ao buscar badges do usuário:', error);
    return [];
  }
}

export async function getDiscoveryStats(): Promise<{
  totalTrendingMangas: number;
  totalCollections: number;
  totalBadges: number;
  activeUsers: number;
}> {
  try {
    const [trendingCount, collectionsCount, badgesCount, usersCount] = await Promise.all([
      prisma.manga.count({ where: { status: 'ONGOING' } }),
      prisma.collection.count({ where: { isPublic: true } }),
      prisma.userBadge.count(),
      prisma.user.count({ where: { isActive: true } })
    ]);

    return {
      totalTrendingMangas: trendingCount,
      totalCollections: collectionsCount,
      totalBadges: badgesCount,
      activeUsers: usersCount
    };
  } catch (error) {
    logger.error('Erro ao buscar estatísticas de descoberta:', error);
    return {
      totalTrendingMangas: 0,
      totalCollections: 0,
      totalBadges: 0,
      activeUsers: 0
    };
  }
}

// Sistema de Badges e Conquistas
export class BadgeSystem {
  static async checkAndAwardBadges(userId: string): Promise<UserBadge[]> {
    return await checkAndAwardBadges(userId);
  }

  static getAllBadges(): UserBadge[] {
    return getAllBadges();
  }
}

// ===== FUNÇÕES DE CALENDÁRIO DE LANÇAMENTOS =====

export async function getUpcomingReleases(days: number = 7): Promise<ReleaseCalendar[]> {
  const cacheKey = `upcoming_releases_${days}`;
  
  try {
    const cached = await advancedCache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const releases = await prisma.chapter.findMany({
      where: {
        publishedAt: {
          gte: new Date(),
          lte: endDate
        }
      },
      include: {
        manga: true
      },
      orderBy: { publishedAt: 'asc' }
    });

    const calendar: ReleaseCalendar[] = releases.map(chapter => ({
      id: chapter.id,
      mangaId: chapter.mangaId,
      mangaTitle: chapter.manga.title,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title || '',
      releaseDate: chapter.publishedAt || new Date(),
      type: 'chapter' as const,
      confirmed: true
    }));

    await advancedCache.set(cacheKey, JSON.stringify(calendar), {
      ttl: 1800, // 30 minutos
      tags: ['releases', 'calendar']
    });

    return calendar;
  } catch (error) {
    logger.error('Erro ao buscar lançamentos:', error);
    return [];
  }
}

export async function scheduleRelease(data: {
  mangaId: string;
  chapterNumber: number;
  chapterTitle?: string;
  releaseDate: Date;
  type: 'chapter' | 'volume';
}): Promise<ReleaseCalendar | null> {
  try {
    const release = await prisma.scheduledRelease.create({
      data: {
        mangaId: data.mangaId,
        chapterNumber: data.chapterNumber,
        chapterTitle: data.chapterTitle,
        releaseDate: data.releaseDate,
        type: data.type
      },
      include: {
        manga: true
      }
    });

    const calendar: ReleaseCalendar = {
      id: release.id,
      mangaId: release.mangaId,
      mangaTitle: release.manga.title,
      chapterNumber: release.chapterNumber,
      chapterTitle: release.chapterTitle || '',
      releaseDate: release.releaseDate,
      type: release.type as 'chapter' | 'volume',
      confirmed: false
    };

    // Invalidar cache de lançamentos
    await advancedCache.invalidateByTags(['releases', 'calendar']);

    return calendar;
  } catch (error) {
    logger.error('Erro ao agendar lançamento:', error);
    return null;
  }
}

// Sistema de Calendário de Lançamentos
export class ReleaseCalendarSystem {
  static async getUpcomingReleases(days: number = 7): Promise<ReleaseCalendar[]> {
    return await getUpcomingReleases(days);
  }

  static async scheduleRelease(data: {
    mangaId: string;
    chapterNumber: number;
    chapterTitle?: string;
    releaseDate: Date;
    type: 'chapter' | 'volume';
  }): Promise<ReleaseCalendar | null> {
    return await scheduleRelease(data);
  }
}

// Sistemas de classe para compatibilidade
export class TrendingAlgorithm {
  static async calculateTrendingScore(mangaId: string): Promise<number> {
    return await calculateTrendingScore(mangaId);
  }

  static async getTrendingMangas(limit: number = 20): Promise<TrendingManga[]> {
    return await getTrendingMangas(limit);
  }
}

export class SocialDiscoverySystem {
  static async getPersonalizedRecommendations(userId: string, limit: number = 10): Promise<TrendingManga[]> {
    return await getPersonalizedRecommendations(userId, limit);
  }

  static async getFriendsActivity(userId: string): Promise<SocialDiscovery[]> {
    return await getFriendsActivity(userId);
  }
}

export class CuratedCollectionsSystem {
  static async createCuratedCollection(data: {
    title: string;
    description: string;
    editorId: string;
    mangaIds: string[];
    tags: string[];
    featured?: boolean;
  }): Promise<CuratedCollection | null> {
    return await createCuratedCollection(data);
  }

  static async getFeaturedCollections(limit: number = 5): Promise<CuratedCollection[]> {
    return await getFeaturedCollections(limit);
  }
}

// Exportar todas as funcionalidades
export {
  TrendingAlgorithm,
  SocialDiscoverySystem,
  CuratedCollectionsSystem,
  BadgeSystem,
  ReleaseCalendarSystem
};