import prisma from "@/prisma/client";
import { MangaListFilters } from "@/interfaces/mangaList";
import { 
  IMangaListRepository, 
  CreateMangaListData, 
  UpdateMangaListData, 
  MangaListEntity, 
  PaginatedMangaListResult 
} from "../interfaces/repository";

export class MangaListRepository implements IMangaListRepository {
  
  async create(data: CreateMangaListData): Promise<MangaListEntity> {
    const mangaList = await prisma.mangaList.create({
      data: {
        name: data.name,
        cover: data.cover,
        mood: data.mood,
        description: data.description,
        status: data.status,
        isDefault: data.isDefault || false
      },
      include: {
        _count: {
          select: {
            items: true,
            likes: true
          }
        }
      }
    });

    return this.mapToEntity(mangaList);
  }

  async findById(id: string): Promise<MangaListEntity | null> {
    const mangaList = await prisma.mangaList.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            manga: {
              select: {
                id: true,
                cover: true,
                manga_uuid: true,
                translations: {
                  select: {
                    language: true,
                    name: true,
                    description: true
                  }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            items: true,
            likes: true
          }
        }
      }
    });

    return mangaList ? this.mapToEntityWithItems(mangaList) : null;
  }

  async findMany(filters: MangaListFilters): Promise<PaginatedMangaListResult> {
    const {
      userId,
      status,
      mood,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (mood) {
      where.mood = {
        contains: mood,
        mode: 'insensitive'
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const orderBy: any = {};
    if (sortBy === 'likesCount') {
      orderBy.likes = { _count: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [lists, total] = await Promise.all([
      prisma.mangaList.findMany({
        where,
        include: {
          _count: {
            select: {
              items: true,
              likes: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.mangaList.count({ where })
    ]);

    return {
      data: lists.map(list => this.mapToEntity(list)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async update(id: string, data: UpdateMangaListData): Promise<MangaListEntity | null> {
    try {
      const mangaList = await prisma.mangaList.update({
        where: { id },
        data: {
          name: data.name,
          cover: data.cover,
          mood: data.mood,
          description: data.description,
          status: data.status,
          isDefault: data.isDefault
        },
        include: {
          _count: {
            select: {
              items: true,
              likes: true
            }
          }
        }
      });

      return this.mapToEntity(mangaList);
    } catch (error) {
      // Se o registro não existir, retornar null
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.mangaList.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.mangaList.count({
      where: { id }
    });
    return count > 0;
  }

  // Métodos privados para mapeamento
  private mapToEntity(mangaList: any): MangaListEntity {
    return {
      id: mangaList.id,
      name: mangaList.name,
      cover: mangaList.cover,
      mood: mangaList.mood,
      description: mangaList.description,
      status: mangaList.status,
      isDefault: mangaList.isDefault,
      createdAt: mangaList.createdAt,
      updatedAt: mangaList.updatedAt,
      itemCount: mangaList._count?.items || 0,
      likesCount: mangaList._count?.likes || 0
    };
  }

  private mapToEntityWithItems(mangaList: any): MangaListEntity {
    return {
      id: mangaList.id,
      name: mangaList.name,
      cover: mangaList.cover,
      mood: mangaList.mood,
      description: mangaList.description,
      status: mangaList.status,
      isDefault: mangaList.isDefault,
      createdAt: mangaList.createdAt,
      updatedAt: mangaList.updatedAt,
      itemCount: mangaList._count?.items || 0,
      likesCount: mangaList._count?.likes || 0,
      items: mangaList.items?.map((item: any) => ({
        id: item.id,
        listId: item.listId,
        mangaId: item.mangaId,
        order: item.order,
        note: item.note,
        addedAt: item.addedAt,
        manga: item.manga
      }))
    };
  }
} 