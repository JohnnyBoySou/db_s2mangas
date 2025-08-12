import { prismaMock } from '../../../test/mocks/prisma';
import {
  createCollection,
  listCollections,
  getCollection,
  updateCollection,
  deleteCollection,
  listPublicCollections,
  checkMangaInCollections,
  toggleMangaInCollection
} from '../index';

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
  __esModule: true,
  default: prismaMock,
}));

// Enum CollectionStatus
enum CollectionStatus {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC'
}

describe('Collection Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCollection', () => {
    it('deve criar uma coleção com sucesso', async () => {
      // Given
      const collectionData = {
        userId: 'user-123',
        name: 'Minha Coleção',
        cover: 'cover.jpg',
        description: 'Descrição da coleção',
        status: CollectionStatus.PRIVATE,
        mangaIds: ['manga-1', 'manga-2']
      };

      const mockCollection = {
        id: 'collection-123',
        ...collectionData,
        mangas: [
          { id: 'manga-1', name: 'Manga 1' },
          { id: 'manga-2', name: 'Manga 2' }
        ],
        _count: { likes: 5 },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prismaMock.collection.create.mockResolvedValue(mockCollection as any);

      // When
      const result = await createCollection(collectionData);

      // Then
      expect(prismaMock.collection.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          name: 'Minha Coleção',
          cover: 'cover.jpg',
          description: 'Descrição da coleção',
          status: CollectionStatus.PRIVATE,
          mangas: {
            connect: [{ id: 'manga-1' }, { id: 'manga-2' }]
          }
        },
        include: {
          mangas: true,
          _count: { select: { likes: true } }
        }
      });

      expect(result).toEqual(mockCollection);
    });

    it('deve criar coleção sem mangás quando mangaIds está vazio', async () => {
      // Given
      const collectionData = {
        userId: 'user-123',
        name: 'Coleção Vazia',
        status: CollectionStatus.PUBLIC,
        mangaIds: []
      };

      const mockCollection = {
        id: 'collection-123',
        ...collectionData,
        cover: '',
        mangas: [],
        _count: { likes: 0 }
      };

      prismaMock.collection.create.mockResolvedValue(mockCollection as any);

      // When
      const result = await createCollection(collectionData);

      // Then
      expect(prismaMock.collection.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          name: 'Coleção Vazia',
          cover: '',
          description: undefined,
          status: CollectionStatus.PUBLIC,
          mangas: undefined
        },
        include: {
          mangas: true,
          _count: { select: { likes: true } }
        }
      });
    });
  });

  describe('listCollections', () => {
    it('deve listar coleções do usuário com paginação', async () => {
      // Given
      const userId = 'user-123';
      const page = 1;
      const take = 10;

      const mockCollections = [
        {
          id: 'collection-1',
          name: 'Coleção 1',
          _count: { likes: 5, mangas: 3 }
        },
        {
          id: 'collection-2',
          name: 'Coleção 2',
          _count: { likes: 2, mangas: 1 }
        }
      ];

      prismaMock.collection.findMany.mockResolvedValue(mockCollections as any);
      prismaMock.collection.count.mockResolvedValue(15);

      // When
      const result = await listCollections(userId, page, take);

      // Then
      expect(prismaMock.collection.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          _count: {
            select: {
              likes: true,
              mangas: true
            }
          }
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });

      expect(result).toEqual({
        data: mockCollections,
        pagination: {
          total: 15,
          page: 1,
          limit: 10,
          totalPages: 2,
          next: true,
          prev: false
        }
      });
    });
  });

  describe('getCollection', () => {
    it('deve obter coleção com sucesso', async () => {
      // Given
      const collectionId = 'collection-123';
      const userId = 'user-123';
      const language = 'pt-BR';

      const mockCollection = {
        id: collectionId,
        userId,
        name: 'Minha Coleção',
        mangas: [
          {
            id: 'manga-1',
            cover: 'cover1.jpg',
            translations: [
              { name: 'Manga em Português', language: 'pt-BR' },
              { name: 'Manga in English', language: 'en' }
            ]
          }
        ],
        user: {
          id: userId,
          name: 'João',
          avatar: 'avatar.jpg',
          username: 'joao123'
        },
        likes: []
      };

      prismaMock.collection.findUnique.mockResolvedValue(mockCollection as any);

      // When
      const result = await getCollection(collectionId, userId, language);

      // Then
      expect(result.mangas[0].name).toBe('Manga em Português');
      expect(result.mangas[0].translations).toBeUndefined();
    });

    it('deve lançar erro quando coleção não existe', async () => {
      // Given
      prismaMock.collection.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(getCollection('invalid-id', 'user-123'))
        .rejects.toThrow('Coleção não encontrada.');
    });

    it('deve lançar erro quando usuário não tem permissão', async () => {
      // Given
      const mockCollection = {
        id: 'collection-123',
        userId: 'other-user',
        name: 'Coleção de Outro'
      };

      prismaMock.collection.findUnique.mockResolvedValue(mockCollection as any);

      // When & Then
      await expect(getCollection('collection-123', 'user-123'))
        .rejects.toThrow('Você não tem permissão para visualizar esta coleção.');
    });
  });

  describe('updateCollection', () => {
    it('deve atualizar coleção com sucesso', async () => {
      // Given
      const collectionId = 'collection-123';
      const userId = 'user-123';
      const updateData = {
        name: 'Nome Atualizado',
        description: 'Nova descrição'
      };

      const mockCollection = {
        id: collectionId,
        userId,
        name: 'Nome Original'
      };

      const updatedCollection = {
        ...mockCollection,
        ...updateData
      };

      prismaMock.collection.findUnique.mockResolvedValue(mockCollection as any);
      prismaMock.collection.update.mockResolvedValue(updatedCollection as any);

      // When
      const result = await updateCollection(collectionId, userId, updateData);

      // Then
      expect(prismaMock.collection.update).toHaveBeenCalledWith({
        where: { id: collectionId },
        data: updateData
      });

      expect(result).toEqual(updatedCollection);
    });

    it('deve lançar erro quando coleção não existe', async () => {
      // Given
      prismaMock.collection.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(updateCollection('invalid-id', 'user-123', {}))
        .rejects.toThrow('Coleção não encontrada.');
    });
  });

  describe('deleteCollection', () => {
    it('deve deletar coleção com sucesso', async () => {
      // Given
      const collectionId = 'collection-123';
      const userId = 'user-123';

      const mockCollection = {
        id: collectionId,
        userId,
        name: 'Coleção para Deletar'
      };

      prismaMock.collection.findUnique.mockResolvedValue(mockCollection as any);
      prismaMock.collection.delete.mockResolvedValue(mockCollection as any);

      // When
      await deleteCollection(collectionId, userId);

      // Then
      expect(prismaMock.collection.delete).toHaveBeenCalledWith({
        where: { id: collectionId }
      });
    });

    it('deve lançar erro quando usuário não tem permissão', async () => {
      // Given
      const mockCollection = {
        id: 'collection-123',
        userId: 'other-user'
      };

      prismaMock.collection.findUnique.mockResolvedValue(mockCollection as any);

      // When & Then
      await expect(deleteCollection('collection-123', 'user-123'))
        .rejects.toThrow('Você não tem permissão para deletar esta coleção.');
    });
  });

  describe('toggleMangaInCollection', () => {
    it('deve adicionar mangá à coleção quando não está presente', async () => {
      // Given
      const collectionId = 'collection-123';
      const mangaId = 'manga-123';
      const userId = 'user-123';

      const mockCollection = {
        id: collectionId,
        userId,
        mangas: [] // Mangá não está na coleção
      };

      const updatedCollection = {
        ...mockCollection,
        mangas: [{ id: mangaId }],
        _count: { likes: 0, mangas: 1 }
      };

      prismaMock.collection.findUnique.mockResolvedValue(mockCollection as any);
      prismaMock.collection.update.mockResolvedValue(updatedCollection as any);

      // When
      const result = await toggleMangaInCollection(collectionId, mangaId, userId);

      // Then
      expect(prismaMock.collection.update).toHaveBeenCalledWith({
        where: { id: collectionId },
        data: {
          mangas: {
            connect: { id: mangaId }
          }
        },
        include: {
          mangas: true,
          _count: {
            select: {
              likes: true,
              mangas: true
            }
          }
        }
      });

      expect(result.action).toBe('added');
    });

    it('deve remover mangá da coleção quando já está presente', async () => {
      // Given
      const collectionId = 'collection-123';
      const mangaId = 'manga-123';
      const userId = 'user-123';

      const mockCollection = {
        id: collectionId,
        userId,
        mangas: [{ id: mangaId }] // Mangá está na coleção
      };

      const updatedCollection = {
        ...mockCollection,
        mangas: [],
        _count: { likes: 0, mangas: 0 }
      };

      prismaMock.collection.findUnique.mockResolvedValue(mockCollection as any);
      prismaMock.collection.update.mockResolvedValue(updatedCollection as any);

      // When
      const result = await toggleMangaInCollection(collectionId, mangaId, userId);

      // Then
      expect(prismaMock.collection.update).toHaveBeenCalledWith({
        where: { id: collectionId },
        data: {
          mangas: {
            disconnect: { id: mangaId }
          }
        },
        include: {
          mangas: true,
          _count: {
            select: {
              likes: true,
              mangas: true
            }
          }
        }
      });

      expect(result.action).toBe('removed');
    });

    it('deve lançar erro quando coleção não existe', async () => {
      // Given
      prismaMock.collection.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(toggleMangaInCollection('invalid-id', 'manga-123', 'user-123'))
        .rejects.toThrow('Coleção não encontrada');
    });
  });
});