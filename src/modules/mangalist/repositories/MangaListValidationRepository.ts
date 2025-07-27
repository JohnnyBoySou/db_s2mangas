import prisma from "@/prisma/client";
import { IMangaListValidationRepository } from "../interfaces/repository";

export class MangaListValidationRepository implements IMangaListValidationRepository {
  
  async mangaExists(mangaId: string): Promise<boolean> {
    const count = await prisma.manga.count({
      where: { id: mangaId }
    });
    return count > 0;
  }

  async mangasExist(mangaIds: string[]): Promise<string[]> {
    const existingMangas = await prisma.manga.findMany({
      where: { id: { in: mangaIds } },
      select: { id: true }
    });

    return existingMangas.map(manga => manga.id);
  }

  async listExists(listId: string): Promise<boolean> {
    const count = await prisma.mangaList.count({
      where: { id: listId }
    });
    return count > 0;
  }

  async getNextOrder(listId: string): Promise<number> {
    const lastItem = await prisma.mangaListItem.findFirst({
      where: { listId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    return lastItem ? lastItem.order + 1 : 0;
  }

  // Métodos adicionais específicos para validações
  async itemExists(listId: string, itemId: string): Promise<boolean> {
    const count = await prisma.mangaListItem.count({
      where: {
        id: itemId,
        listId: listId
      }
    });
    return count > 0;
  }

  async mangaInList(listId: string, mangaId: string): Promise<boolean> {
    const count = await prisma.mangaListItem.count({
      where: {
        listId,
        mangaId
      }
    });
    return count > 0;
  }

  async getListOwner(listId: string): Promise<string | null> {
    // Como MangaList não tem userId, retornamos null
    return null;
  }

  async isListPublic(listId: string): Promise<boolean> {
    const list = await prisma.mangaList.findUnique({
      where: { id: listId },
      select: { status: true }
    });

    return list?.status === 'PUBLIC';
  }

  async countItemsInList(listId: string): Promise<number> {
    return await prisma.mangaListItem.count({
      where: { listId }
    });
  }

  async getListStatus(listId: string): Promise<'PRIVATE' | 'PUBLIC' | 'UNLISTED' | null> {
    const list = await prisma.mangaList.findUnique({
      where: { id: listId },
      select: { status: true }
    });

    return list?.status || null;
  }

  async userHasPermission(userId: string, listId: string): Promise<boolean> {
    const list = await prisma.mangaList.findUnique({
      where: { id: listId },
      select: { status: true }
    });

    if (!list) return false;

    // Como MangaList não tem userId, apenas verificamos se a lista é pública
    if (list.status === 'PUBLIC') return true;

    return false;
  }

  async validateBulkOperation(listId: string, mangaIds: string[]): Promise<{
    validMangaIds: string[];
    invalidMangaIds: string[];
    alreadyInList: string[];
  }> {
    // Verificar quais mangás existem
    const existingMangas = await this.mangasExist(mangaIds);
    const invalidMangaIds = mangaIds.filter(id => !existingMangas.includes(id));

    // Verificar quais já estão na lista
    const existingItems = await prisma.mangaListItem.findMany({
      where: {
        listId,
        mangaId: { in: existingMangas }
      },
      select: { mangaId: true }
    });

    const alreadyInList = existingItems.map(item => item.mangaId);
    const validMangaIds = existingMangas.filter(id => !alreadyInList.includes(id));

    return {
      validMangaIds,
      invalidMangaIds,
      alreadyInList
    };
  }

  async canReorderItems(listId: string, itemIds: string[]): Promise<boolean> {
    const count = await prisma.mangaListItem.count({
      where: {
        listId,
        id: { in: itemIds }
      }
    });

    return count === itemIds.length;
  }

  async getItemPosition(listId: string, itemId: string): Promise<number | null> {
    const item = await prisma.mangaListItem.findUnique({
      where: { id: itemId },
      select: { order: true, listId: true }
    });

    if (!item || item.listId !== listId) return null;

    return item.order;
  }
} 