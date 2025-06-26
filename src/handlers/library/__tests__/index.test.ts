import {
  upsertLibraryEntry,
  updateLibraryEntry,
  removeLibraryEntry,
  listLibrary,
  toggleLibraryEntry,
  checkMangaStatus,
} from '../index';
import { prismaMock } from '../../../test/mocks/prisma';

const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

describe('Handler da Biblioteca', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  describe('upsertLibraryEntry', () => {
    const mockData = {
      userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      mangaId: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
      isRead: true,
      isLiked: false,
      isFollowed: true,
      isComplete: false,
    };

    it('deve fazer upsert da entrada da biblioteca com sucesso', async () => {
      // Dado
      const expectedEntry = {
        id: 'c3d4e5f6-g7h8-9012-cdef-345678901234',
        userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        mangaId: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
        isRead: true,
        isLiked: false,
        isFollowed: true,
        isComplete: false,
      };
      
      prismaMock.libraryEntry.upsert.mockResolvedValue(expectedEntry as any);

      // Quando
      const result = await upsertLibraryEntry(mockData);

      // Então
      expect(result).toEqual(expectedEntry);
      expect(prismaMock.libraryEntry.upsert).toHaveBeenCalledWith({
        where: {
          userId_mangaId: {
            userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            mangaId: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
          },
        },
        update: {
          isRead: true,
          isLiked: false,
          isFollowed: true,
          isComplete: false,
        },
        create: {
          userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          mangaId: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
          isRead: true,
          isLiked: false,
          isFollowed: true,
          isComplete: false,
        },
      });
    });

    it('deve usar valores padrão quando campos booleanos não são fornecidos', async () => {
      // Dado
      const minimalData = {
        userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        mangaId: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
      };
      
      prismaMock.libraryEntry.upsert.mockResolvedValue({} as any);

      // Quando
      await upsertLibraryEntry(minimalData);

      // Então
      expect(prismaMock.libraryEntry.upsert).toHaveBeenCalledWith({
        where: {
          userId_mangaId: {
            userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            mangaId: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
          },
        },
        update: {
          isRead: undefined,
          isLiked: undefined,
          isFollowed: undefined,
          isComplete: undefined,
        },
        create: {
          userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          mangaId: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
          isRead: false,
          isLiked: false,
          isFollowed: false,
          isComplete: false,
        },
      });
    });
  });

  describe('updateLibraryEntry', () => {
    it('deve atualizar entrada da biblioteca com sucesso', async () => {
      // Dado
      const updateData = {
        userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        mangaId: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
        isRead: true,
        isLiked: true,
      };
      
      const updatedEntry = {
        id: 'c3d4e5f6-g7h8-9012-cdef-345678901234',
        userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        mangaId: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
        isRead: true,
        isLiked: true,
      };
      
      prismaMock.libraryEntry.update.mockResolvedValue(updatedEntry as any);

      // Quando
      const result = await updateLibraryEntry(updateData);

      // Então
      expect(result).toEqual(updatedEntry);
      expect(prismaMock.libraryEntry.update).toHaveBeenCalledWith({
        where: {
          userId_mangaId: {
            userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            mangaId: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
          },
        },
        data: {
          isRead: true,
          isLiked: true,
        },
      });
    });
  });

  describe('removeLibraryEntry', () => {
    it('deve remover entrada da biblioteca com sucesso', async () => {
      // Dado
      const userId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const mangaId = 'b2c3d4e5-f6g7-8901-bcde-f23456789012';
      
      prismaMock.libraryEntry.delete.mockResolvedValue({} as any);

      // Quando
      await removeLibraryEntry(userId, mangaId);

      // Então
      expect(prismaMock.libraryEntry.delete).toHaveBeenCalledWith({
        where: {
          userId_mangaId: {
            userId,
            mangaId,
          },
        },
      });
    });
  });

  describe('listLibrary', () => {
    const userId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const page = 1;
    const take = 10;

    const mockEntries = [
      {
        id: 'd4e5f6g7-h8i9-0123-defg-456789012345',
        userId,
        mangaId: 'e5f6g7h8-i9j0-1234-efgh-567890123456',
        isRead: true,
        manga: {
          id: 'e5f6g7h8-i9j0-1234-efgh-567890123456',
          manga_uuid: 'f6g7h8i9-j0k1-2345-fghi-678901234567',
          cover: 'cover-url',
          translations: [{ name: 'Manga Title 1', language: 'pt' }],
          _count: { views: 100 },
        },
      },
      {
        id: 'g7h8i9j0-k1l2-3456-ghij-789012345678',
        userId,
        mangaId: 'h8i9j0k1-l2m3-4567-hijk-890123456789',
        isRead: true,
        manga: {
          id: 'h8i9j0k1-l2m3-4567-hijk-890123456789',
          manga_uuid: 'i9j0k1l2-m3n4-5678-ijkl-901234567890',
          cover: 'cover-url-2',
          translations: [{ name: 'Manga Title 2', language: 'pt' }],
          _count: { views: 200 },
        },
      },
    ];

    it('deve listar entradas da biblioteca para tipo progress', async () => {
      // Dado
      prismaMock.libraryEntry.findMany.mockResolvedValue(mockEntries as any);
      prismaMock.libraryEntry.count.mockResolvedValue(2);

      // Quando
      const result = await listLibrary(userId, 'progress', page, take);

      // Então
      expect(result).toEqual({
        data: [
          {
            ...mockEntries[0],
            manga: {
              id: 'e5f6g7h8-i9j0-1234-efgh-567890123456',
            manga_uuid: 'f6g7h8i9-j0k1-2345-fghi-678901234567',
              title: 'Manga Title 1',
              cover: 'cover-url',
              views_count: 100,
            },
          },
          {
            ...mockEntries[1],
            manga: {
              id: 'h8i9j0k1-l2m3-4567-hijk-890123456789',
            manga_uuid: 'i9j0k1l2-m3n4-5678-ijkl-901234567890',
              title: 'Manga Title 2',
              cover: 'cover-url-2',
              views_count: 200,
            },
          },
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
          next: null,
          prev: null,
        },
      });

      expect(prismaMock.libraryEntry.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          isRead: true,
        },
        skip: 0,
        take: 10,
        orderBy: {
          updatedAt: 'desc',
        },
        include: expect.any(Object),
      });
    });

    it('deve listar entradas da biblioteca para tipo complete', async () => {
      // Dado
      prismaMock.libraryEntry.findMany.mockResolvedValue([]);
      prismaMock.libraryEntry.count.mockResolvedValue(0);

      // Quando
      await listLibrary(userId, 'complete', page, take);

      // Então
      expect(prismaMock.libraryEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId,
            isComplete: true,
          },
        })
      );
    });

    it('deve listar entradas da biblioteca para tipo favorite', async () => {
      // Dado
      prismaMock.libraryEntry.findMany.mockResolvedValue([]);
      prismaMock.libraryEntry.count.mockResolvedValue(0);

      // Quando
      await listLibrary(userId, 'favorite', page, take);

      // Então
      expect(prismaMock.libraryEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId,
            isLiked: true,
          },
        })
      );
    });

    it('deve listar entradas da biblioteca para tipo following', async () => {
      // Dado
      prismaMock.libraryEntry.findMany.mockResolvedValue([]);
      prismaMock.libraryEntry.count.mockResolvedValue(0);

      // Quando
      await listLibrary(userId, 'following', page, take);

      // Então
      expect(prismaMock.libraryEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId,
            isFollowed: true,
          },
        })
      );
    });

    it('deve lançar erro para tipo de biblioteca inválido', async () => {
      // Quando & Então
      await expect(listLibrary(userId, 'invalid', page, take)).rejects.toThrow('Tipo de biblioteca inválido');
    });

    it('deve lidar com paginação corretamente', async () => {
      // Dado
      prismaMock.libraryEntry.findMany.mockResolvedValue([]);
      prismaMock.libraryEntry.count.mockResolvedValue(25);

      // Quando
      const result = await listLibrary(userId, 'progress', 3, 10);

      // Então
      expect(prismaMock.libraryEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (3-1) * 10
          take: 10,
        })
      );
      expect(result.pagination).toEqual({
        total: 25,
        page: 3,
        limit: 10,
        totalPages: 3,
        next: null,
        prev: 2,
      });
    });

    it('deve lidar com mangá sem traduções', async () => {
      // Dado
      const entryWithoutTranslations = {
        id: 'd4e5f6g7-h8i9-0123-defg-456789012345',
        userId,
        mangaId: 'e5f6g7h8-i9j0-1234-efgh-567890123456',
        manga: {
          id: 'e5f6g7h8-i9j0-1234-efgh-567890123456',
          manga_uuid: 'f6g7h8i9-j0k1-2345-fghi-678901234567',
          cover: 'cover-url',
          translations: [],
          _count: { views: 0 },
        },
      };
      
      prismaMock.libraryEntry.findMany.mockResolvedValue([entryWithoutTranslations] as any);
      prismaMock.libraryEntry.count.mockResolvedValue(1);

      // Quando
      const result = await listLibrary(userId, 'progress', page, take);

      // Então
      expect(result.data[0].manga.title).toBe('Sem título');
    });
  });

  describe('toggleLibraryEntry', () => {
    const userId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const mangaId = 'b2c3d4e5-f6g7-8901-bcde-f23456789012';

    beforeEach(() => {
      // Mock manga exists
      prismaMock.manga.findUnique.mockResolvedValue({ id: mangaId } as any);
    });

    it('deve alternar status de progresso quando entrada existe', async () => {
      // Dado
      const existingEntry = {
        id: 'c3d4e5f6-g7h8-9012-cdef-345678901234',
        userId,
        mangaId,
        isRead: false,
        isLiked: false,
        isFollowed: false,
        isComplete: false,
      };
      
      const updatedEntry = { ...existingEntry, isRead: true };
      
      prismaMock.libraryEntry.findUnique.mockResolvedValue(existingEntry as any);
      prismaMock.libraryEntry.update.mockResolvedValue(updatedEntry as any);

      // Quando
      const result = await toggleLibraryEntry({ userId, mangaId, type: 'progress' });

      // Então
      expect(result).toEqual(updatedEntry);
      expect(prismaMock.libraryEntry.update).toHaveBeenCalledWith({
        where: {
          userId_mangaId: { userId, mangaId },
        },
        data: {
          isRead: true,
        },
      });
    });

    it('deve criar nova entrada quando entrada não existe', async () => {
      // Dado
      const newEntry = {
        id: 'j0k1l2m3-n4o5-6789-jklm-012345678901',
        userId,
        mangaId,
        isRead: false,
        isLiked: false,
        isFollowed: true,
        isComplete: false,
      };
      
      prismaMock.libraryEntry.findUnique.mockResolvedValue(null);
      prismaMock.libraryEntry.create.mockResolvedValue(newEntry as any);

      // Quando
      const result = await toggleLibraryEntry({ userId, mangaId, type: 'following' });

      // Então
      expect(result).toEqual(newEntry);
      expect(prismaMock.libraryEntry.create).toHaveBeenCalledWith({
        data: {
          userId,
          mangaId,
          isFollowed: true,
        },
      });
    });

    it('deve alternar status de completo corretamente', async () => {
      // Dado
      const existingEntry = {
        userId,
        mangaId,
        isComplete: true,
      };
      
      prismaMock.libraryEntry.findUnique.mockResolvedValue(existingEntry as any);
      prismaMock.libraryEntry.update.mockResolvedValue({} as any);

      // Quando
      await toggleLibraryEntry({ userId, mangaId, type: 'complete' });

      // Então
      expect(prismaMock.libraryEntry.update).toHaveBeenCalledWith({
        where: {
          userId_mangaId: { userId, mangaId },
        },
        data: {
          isComplete: false,
        },
      });
    });

    it('deve alternar status de favorito corretamente', async () => {
      // Dado
      const existingEntry = {
        userId,
        mangaId,
        isLiked: false,
      };
      
      prismaMock.libraryEntry.findUnique.mockResolvedValue(existingEntry as any);
      prismaMock.libraryEntry.update.mockResolvedValue({} as any);

      // Quando
      await toggleLibraryEntry({ userId, mangaId, type: 'favorite' });

      // Então
      expect(prismaMock.libraryEntry.update).toHaveBeenCalledWith({
        where: {
          userId_mangaId: { userId, mangaId },
        },
        data: {
          isLiked: true,
        },
      });
    });

    it('deve lançar erro se mangá não existe', async () => {
      // Dado
      prismaMock.manga.findUnique.mockResolvedValue(null);

      // Quando & Então
      await expect(
        toggleLibraryEntry({ userId, mangaId, type: 'progress' })
      ).rejects.toThrow('Mangá não encontrado');
    });
  });

  describe('checkMangaStatus', () => {
    const userId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const mangaId = 'b2c3d4e5-f6g7-8901-bcde-f23456789012';

    it('deve retornar status do mangá quando entrada existe', async () => {
      // Dado
      const libraryEntry = {
        isRead: true,
        isLiked: false,
        isFollowed: true,
        isComplete: false,
      };
      
      prismaMock.libraryEntry.findUnique.mockResolvedValue(libraryEntry as any);

      // Quando
      const result = await checkMangaStatus(userId, mangaId);

      // Então
      expect(result).toEqual({
        isRead: true,
        isLiked: false,
        isFollowed: true,
        isComplete: false,
      });
      expect(prismaMock.libraryEntry.findUnique).toHaveBeenCalledWith({
        where: {
          userId_mangaId: { userId, mangaId },
        },
        select: {
          isRead: true,
          isLiked: true,
          isFollowed: true,
          isComplete: true,
        },
      });
    });

    it('deve retornar valores padrão false quando entrada não existe', async () => {
      // Dado
      prismaMock.libraryEntry.findUnique.mockResolvedValue(null);

      // Quando
      const result = await checkMangaStatus(userId, mangaId);

      // Então
      expect(result).toEqual({
        isRead: false,
        isLiked: false,
        isFollowed: false,
        isComplete: false,
      });
    });
  });
});