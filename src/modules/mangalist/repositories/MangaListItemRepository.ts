import prisma from "@/prisma/client";
import { 
  IMangaListItemRepository, 
  AddMangaListItemData, 
  UpdateMangaListItemData, 
  ReorderItemData, 
  BulkAddItemsData, 
  BulkAddResult, 
  MangaListItemEntity 
} from "../interfaces/repository";

export class MangaListItemRepository implements IMangaListItemRepository {
  
  async addItem(listId: string, data: AddMangaListItemData): Promise<MangaListItemEntity> {
    // Se order não foi fornecido, usar o próximo disponível
    let order = data.order;
    if (order === undefined) {
      order = await this.getNextOrder(listId);
    }

    const item = await prisma.mangaListItem.create({
      data: {
        listId,
        mangaId: data.mangaId,
        order,
        note: data.note
      },
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
      }
    });

    return this.mapToEntity(item);
  }

  async removeItem(listId: string, itemId: string): Promise<boolean> {
    try {
      await prisma.mangaListItem.delete({
        where: { 
          id: itemId,
          listId: listId
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async updateItem(listId: string, itemId: string, data: UpdateMangaListItemData): Promise<MangaListItemEntity | null> {
    try {
      const item = await prisma.mangaListItem.update({
        where: { 
          id: itemId,
          listId: listId
        },
        data: {
          order: data.order,
          note: data.note
        },
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
        }
      });

      return this.mapToEntity(item);
    } catch (error) {
      return null;
    }
  }

  async reorderItems(listId: string, items: ReorderItemData[]): Promise<boolean> {
    try {
      await prisma.$transaction(async (tx) => {
        for (const item of items) {
          await tx.mangaListItem.updateMany({
            where: { 
              id: item.id, 
              listId: listId
            },
            data: { order: item.order }
          });
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async bulkAddItems(listId: string, data: BulkAddItemsData): Promise<BulkAddResult> {
    // Verificar quais mangás existem
    const existingMangas = await prisma.manga.findMany({
      where: { id: { in: data.mangaIds } },
      select: { id: true }
    });

    const existingMangaIds = existingMangas.map(m => m.id);

    // Verificar quais já estão na lista
    const existingItems = await prisma.mangaListItem.findMany({
      where: {
        listId,
        mangaId: { in: existingMangaIds }
      },
      select: { mangaId: true }
    });

    const existingItemMangaIds = existingItems.map(item => item.mangaId);
    const mangasToAdd = existingMangaIds.filter(id => !existingItemMangaIds.includes(id));

    if (mangasToAdd.length === 0) {
      return { added: 0, skipped: data.mangaIds.length };
    }

    // Obter o próximo order disponível
    const startOrder = await this.getNextOrder(listId);

    const itemsToCreate = mangasToAdd.map((mangaId, index) => ({
      listId,
      mangaId,
      order: startOrder + index,
      note: data.notes?.[mangaId]
    }));

    await prisma.mangaListItem.createMany({
      data: itemsToCreate
    });

    return {
      added: mangasToAdd.length,
      skipped: data.mangaIds.length - mangasToAdd.length
    };
  }

  async getItemsByListId(listId: string): Promise<MangaListItemEntity[]> {
    const items = await prisma.mangaListItem.findMany({
      where: { listId },
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
    });

    return items.map(item => this.mapToEntity(item));
  }

  async itemExists(listId: string, mangaId: string): Promise<boolean> {
    const count = await prisma.mangaListItem.count({
      where: {
        listId,
        mangaId
      }
    });
    return count > 0;
  }

  // Métodos privados
  private async getNextOrder(listId: string): Promise<number> {
    const lastItem = await prisma.mangaListItem.findFirst({
      where: { listId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    return lastItem ? lastItem.order + 1 : 0;
  }

  private mapToEntity(item: any): MangaListItemEntity {
    return {
      id: item.id,
      listId: item.listId,
      mangaId: item.mangaId,
      order: item.order,
      note: item.note,
      addedAt: item.addedAt,
      manga: item.manga
    };
  }
} 