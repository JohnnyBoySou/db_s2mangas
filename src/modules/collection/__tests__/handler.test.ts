import { CollectionStatus } from '@prisma/client';
import { prismaMock } from '../../../test/mocks/prisma';

// Mock do prisma client
jest.mock('@/prisma/client', () => ({
  __esModule: true,
  default: prismaMock
}));

import {
  createCollection,
  listCollections,
  getCollection,
  updateCollection,
  deleteCollection,
  toggleMangaInCollection
} from '../handlers/CollectionHandler';

describe('Collection Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCollection', () => {
    it('deve criar uma nova coleção com sucesso', async () => {
      // Given
      const collectionData = {
        userId: 'user-123',
        name: 'Minha Coleção',
        cover: 'cover.jpg',
        description: 'Descrição da coleção',
        status: CollectionStatus.PUBLIC,
        mangaIds: ['manga-1', 'manga-2']
      };

      const mockCollection = {
        id: 'collection-123',
        name: 'Minha Coleção',
        cover: 'cover.jpg',
        description: 'Descrição da coleção',
        status: CollectionStatus.PUBLIC,
        userId: 'user-123',
        mangas: [
          { id: 'manga-1', name: 'Mangá 1' },
          { id: 'manga-2', name: 'Mangá 2' }
        ],
        _count: { likes: 0 },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prismaMock.collection.create as jest.Mock).mockResolvedValue(mockCollection);

      // When
      const result = await createCollection(collectionData);

      // Then
      expect(prismaMock.collection.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          name: 'Minha Coleção',
          cover: 'cover.jpg',
          description: 'Descrição da coleção',
          status: CollectionStatus.PUBLIC,
          mangas: {
            connect: [
              { id: 'manga-1' },
              { id: 'manga-2' }
            ]
          }
        },
        include: {
          mangas: true,
          _count: { select: { likes: true } }
        }
      });
      expect(result).toEqual(mockCollection);
    });

    it('deve criar uma coleção sem mangás', async () => {
      // Given
      const collectionData = {
        userId: 'user-123',
        name: 'Coleção Vazia',
        cover: 'cover.jpg',
        description: 'Descrição',
        status: CollectionStatus.PRIVATE,
        mangaIds: []
      };

      const mockCollection = {
        id: 'collection-123',
        name: 'Coleção Vazia',
        cover: 'cover.jpg',
        description: 'Descrição',
        status: CollectionStatus.PRIVATE,
        userId: 'user-123',
        mangas: [],
        _count: { likes: 0 },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prismaMock.collection.create as jest.Mock).mockResolvedValue(mockCollection);

      // When
      const result = await createCollection(collectionData);

      // Then
      expect(prismaMock.collection.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          name: 'Coleção Vazia',
          cover: 'cover.jpg',
          description: 'Descrição',
          status: CollectionStatus.PRIVATE,
          mangas: undefined
        },
        include: {
          mangas: true,
          _count: { select: { likes: true } }
        }
      });
      expect(result).toEqual(mockCollection);
    });
  });

  describe('listCollections', () => {
    it('deve listar coleções do usuário com paginação', async () => {
      // Given
      const userId = 'user-123';
      const page = 1;
      const limit = 10;
      const mockCollections = [
        {
          id: 'collection-1',
          name: 'Minha Coleção 1',
          userId: 'user-123',
          mangas: [],
          _count: { likes: 5, mangas: 10 },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'collection-2',
          name: 'Minha Coleção 2',
          userId: 'user-123',
          mangas: [],
          _count: { likes: 3, mangas: 5 },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      (prismaMock.collection.findMany as jest.Mock).mockResolvedValue(mockCollections);
      (prismaMock.collection.count as jest.Mock).mockResolvedValue(15);

      // When
      const result = await listCollections(userId, page, limit);

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
      expect(prismaMock.collection.count).toHaveBeenCalledWith({ where: { userId } });
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
    it('deve retornar uma coleção por ID', async () => {
      // Given
      const collectionId = 'collection-123';
      const userId = 'user-123';
      const mockCollection = {
        id: collectionId,
        name: 'Minha Coleção',
        cover: 'cover.jpg',
        description: 'Descrição',
        status: 'PRIVATE',
        userId: 'user-123',
        mangas: [
          {
            id: 'manga-1',
            cover: 'manga-cover.jpg',
            translations: [
              { name: 'Mangá 1', language: 'pt-BR' }
            ]
          }
        ],
        user: {
          id: 'user-123',
          name: 'Usuário Teste',
          avatar: 'avatar.jpg',
          username: 'testuser'
        },
        likes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prismaMock.collection.findUnique as jest.Mock).mockResolvedValue(mockCollection);

      // When
      const result = await getCollection(collectionId, userId);

      // Then
      expect(prismaMock.collection.findUnique).toHaveBeenCalledWith({
        where: { id: collectionId },
        include: {
          mangas: {
            select: {
              id: true,
              cover: true,
              translations: {
                select: {
                  name: true,
                  language: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              username: true
            }
          },
          likes: true
        }
      });
      expect(result).toEqual({
        ...mockCollection,
        mangas: [
          {
            id: 'manga-1',
            cover: 'manga-cover.jpg',
            name: 'Mangá 1',
            translations: undefined
          }
        ]
      });
    });

    it('deve lançar erro se coleção não encontrada', async () => {
      // Given
      const collectionId = 'non-existent';
      const userId = 'user-123';
      (prismaMock.collection.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(getCollection(collectionId, userId)).rejects.toThrow('Coleção não encontrada.');
    });

    it('deve lançar erro se usuário não tem permissão', async () => {
      // Given
      const collectionId = 'collection-123';
      const userId = 'user-123';
      const mockCollection = {
        id: collectionId,
        userId: 'other-user',
        mangas: [],
        user: { id: 'other-user' },
        likes: []
      };
      (prismaMock.collection.findUnique as jest.Mock).mockResolvedValue(mockCollection);

      // When & Then
      await expect(getCollection(collectionId, userId)).rejects.toThrow('Você não tem permissão para visualizar esta coleção.');
    });
  });

  describe('updateCollection', () => {
    it('deve atualizar uma coleção existente', async () => {
      // Given
      const collectionId = 'collection-123';
      const userId = 'user-123';
      const updateData = {
        name: 'Nome Atualizado',
        description: 'Descrição Atualizada'
      };
      const mockCollection = {
        id: collectionId,
        name: 'Nome Original',
        cover: 'cover.jpg',
        description: 'Descrição Original',
        status: 'PRIVATE',
        userId: 'user-123',
        mangas: [],
        _count: { likes: 5 },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const updatedCollection = {
        ...mockCollection,
        ...updateData
      };

      (prismaMock.collection.findUnique as jest.Mock).mockResolvedValue(mockCollection);
      (prismaMock.collection.update as jest.Mock).mockResolvedValue(updatedCollection);

      // When
      const result = await updateCollection(collectionId, userId, updateData);

      // Then
      expect(prismaMock.collection.findUnique).toHaveBeenCalledWith({
        where: { id: collectionId }
      });
      expect(prismaMock.collection.update).toHaveBeenCalledWith({
        where: { id: collectionId },
        data: updateData
      });
      expect(result).toEqual(updatedCollection);
    });

    it('deve lançar erro se coleção não encontrada', async () => {
      // Given
      const collectionId = 'non-existent';
      const userId = 'user-123';
      const updateData = { name: 'Novo Nome' };
      (prismaMock.collection.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(updateCollection(collectionId, userId, updateData)).rejects.toThrow('Coleção não encontrada.');
    });

    it('deve lançar erro se usuário não tem permissão', async () => {
      // Given
      const collectionId = 'collection-123';
      const userId = 'user-123';
      const updateData = { name: 'Novo Nome' };
      const mockCollection = {
        id: collectionId,
        userId: 'other-user'
      };
      (prismaMock.collection.findUnique as jest.Mock).mockResolvedValue(mockCollection);

      // When & Then
      await expect(updateCollection(collectionId, userId, updateData)).rejects.toThrow('Você não tem permissão para editar esta coleção.');
    });
  });

  describe('deleteCollection', () => {
    it('deve deletar uma coleção existente', async () => {
      // Given
      const collectionId = 'collection-123';
      const userId = 'user-123';
      const mockCollection = {
        id: collectionId,
        name: 'Minha Coleção',
        cover: 'cover.jpg',
        description: 'Descrição',
        status: 'PRIVATE',
        userId: 'user-123',
        mangas: [],
        _count: { likes: 5 },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prismaMock.collection.findUnique as jest.Mock).mockResolvedValue(mockCollection);
      (prismaMock.collection.delete as jest.Mock).mockResolvedValue(undefined);

      // When
      const result = await deleteCollection(collectionId, userId);

      // Then
      expect(prismaMock.collection.findUnique).toHaveBeenCalledWith({
        where: { id: collectionId }
      });
      expect(prismaMock.collection.delete).toHaveBeenCalledWith({
        where: { id: collectionId }
      });
      expect(result).toBeUndefined();
    });

    it('deve lançar erro se coleção não encontrada', async () => {
      // Given
      const collectionId = 'non-existent';
      const userId = 'user-123';
      (prismaMock.collection.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(deleteCollection(collectionId, userId)).rejects.toThrow('Coleção não encontrada.');
    });

    it('deve lançar erro se usuário não tem permissão', async () => {
      // Given
      const collectionId = 'collection-123';
      const userId = 'user-123';
      const mockCollection = {
        id: collectionId,
        userId: 'other-user'
      };
      (prismaMock.collection.findUnique as jest.Mock).mockResolvedValue(mockCollection);

      // When & Then
      await expect(deleteCollection(collectionId, userId)).rejects.toThrow('Você não tem permissão para deletar esta coleção.');
    });
  });

  describe('toggleMangaInCollection', () => {
    it('deve adicionar mangá à coleção quando não presente', async () => {
      // Given
      const collectionId = 'collection-123';
      const mangaId = 'manga-123';
      const userId = 'user-123';
      const mockCollection = {
        id: collectionId,
        name: 'Minha Coleção',
        userId: 'user-123',
        mangas: [],
        _count: { likes: 5 },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const updatedCollection = {
        ...mockCollection,
        mangas: [{ id: mangaId, name: 'Mangá Teste' }],
        _count: { likes: 5, mangas: 1 }
      };

      (prismaMock.collection.findUnique as jest.Mock).mockResolvedValue(mockCollection);
      (prismaMock.collection.update as jest.Mock).mockResolvedValue(updatedCollection);

      // When
      const result = await toggleMangaInCollection(collectionId, mangaId, userId);

      // Then
      expect(prismaMock.collection.findUnique).toHaveBeenCalledWith({
        where: { id: collectionId },
        include: {
          mangas: {
            where: {
              id: mangaId
            }
          }
        }
      });
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
      expect(result).toEqual({
        ...updatedCollection,
        action: 'added'
      });
    });

    it('deve remover mangá da coleção quando presente', async () => {
      // Given
      const collectionId = 'collection-123';
      const mangaId = 'manga-123';
      const userId = 'user-123';
      const mockCollection = {
        id: collectionId,
        name: 'Minha Coleção',
        userId: 'user-123',
        mangas: [{ id: mangaId, name: 'Mangá Teste' }],
        _count: { likes: 5 },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const updatedCollection = {
        ...mockCollection,
        mangas: [],
        _count: { likes: 5, mangas: 0 }
      };

      (prismaMock.collection.findUnique as jest.Mock).mockResolvedValue(mockCollection);
      (prismaMock.collection.update as jest.Mock).mockResolvedValue(updatedCollection);

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
      expect(result).toEqual({
        ...updatedCollection,
        action: 'removed'
      });
    });

    it('deve lançar erro se coleção não encontrada', async () => {
      // Given
      const collectionId = 'non-existent';
      const mangaId = 'manga-123';
      const userId = 'user-123';
      (prismaMock.collection.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(toggleMangaInCollection(collectionId, mangaId, userId)).rejects.toThrow('Coleção não encontrada');
    });

    it('deve lançar erro se usuário não tem permissão', async () => {
      // Given
      const collectionId = 'collection-123';
      const mangaId = 'manga-123';
      const userId = 'user-123';
      const mockCollection = {
        id: collectionId,
        userId: 'other-user',
        mangas: []
      };
      (prismaMock.collection.findUnique as jest.Mock).mockResolvedValue(mockCollection);

      // When & Then
      await expect(toggleMangaInCollection(collectionId, mangaId, userId)).rejects.toThrow('Você não tem permissão para modificar esta coleção');
    });
  });
});