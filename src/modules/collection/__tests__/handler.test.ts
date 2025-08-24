// Define the enum locally since we can't import from Prisma client
enum CollectionStatus {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC'
}

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

// Adicionar no início do arquivo:
jest.mock('../handlers/CollaboratorHandler', () => ({
  checkUserCanEdit: jest.fn().mockResolvedValue({ hasPermission: true, isOwner: true, role: 'OWNER' }),
  checkUserCanView: jest.fn().mockResolvedValue({ hasPermission: true, isOwner: true, role: 'OWNER' })
}));

// Importar o mock do CollaboratorHandler
import { checkUserCanView } from '../handlers/CollaboratorHandler';

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
        collectionMangas: [
          { 
            manga: { id: 'manga-1', name: 'Mangá 1' },
            addedByUser: { id: 'user-123', name: 'Usuário', username: 'usuario', avatar: 'avatar.jpg' }
          },
          { 
            manga: { id: 'manga-2', name: 'Mangá 2' },
            addedByUser: { id: 'user-123', name: 'Usuário', username: 'usuario', avatar: 'avatar.jpg' }
          }
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
          collectionMangas: {
            create: [
              { mangaId: 'manga-1', addedBy: 'user-123' },
              { mangaId: 'manga-2', addedBy: 'user-123' }
            ]
          }
        },
        include: {
          collectionMangas: {
            include: {
              manga: true,
              addedByUser: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  avatar: true,
                }
              }
            }
          },
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
        collectionMangas: [],
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
          collectionMangas: undefined
        },
        include: {
          collectionMangas: {
            include: {
              manga: true,
              addedByUser: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  avatar: true,
                }
              }
            }
          },
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
          user: {
            id: 'user-123',
            name: 'Usuário',
            username: 'usuario',
            avatar: 'avatar.jpg'
          },
          collaborators: [],
          collectionMangas: [],
          _count: { likes: 5, collectionMangas: 10, collaborators: 0 },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'collection-2',
          name: 'Minha Coleção 2',
          userId: 'user-123',
          user: {
            id: 'user-123',
            name: 'Usuário',
            username: 'usuario',
            avatar: 'avatar.jpg'
          },
          collaborators: [],
          collectionMangas: [],
          _count: { likes: 3, collectionMangas: 5, collaborators: 0 },
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
        where: {
          OR: [
            { userId },
            {
              collaborators: {
                some: {
                  userId
                }
              }
            }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            }
          },
          collaborators: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  avatar: true,
                }
              }
            }
          },
          _count: { 
            select: { 
              likes: true,
              collectionMangas: true,
              collaborators: true
            } 
          },
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
      expect(prismaMock.collection.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { userId },
            {
              collaborators: {
                some: {
                  userId
                }
              }
            }
          ]
        }
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
        collectionMangas: [
          {
            manga: {
              id: 'manga-1',
              cover: 'manga-cover.jpg',
              translations: [
                { name: 'Mangá 1', language: 'pt-BR' }
              ]
            },
            addedByUser: {
              id: 'user-123',
              name: 'Usuário',
              username: 'usuario',
              avatar: 'avatar.jpg'
            }
          }
        ],
        user: {
          id: 'user-123',
          name: 'Usuário Teste',
          avatar: 'avatar.jpg',
          username: 'testuser'
        },
        likes: [],
        collaborators: [],
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
          collectionMangas: {
            include: {
              manga: {
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
              addedByUser: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  avatar: true,
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              username: true,
            }
          },
          likes: true,
          collaborators: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  avatar: true,
                }
              }
            }
          }
        }
      });
      
      // O resultado esperado deve incluir mangas transformados com addedBy e addedByUser
      expect(result).toEqual({
        ...mockCollection,
        mangas: [
          {
            id: 'manga-1',
            cover: 'manga-cover.jpg',
            name: 'Mangá 1',
            translations: undefined,
            addedBy: undefined,
            addedByUser: {
              id: 'user-123',
              name: 'Usuário',
              username: 'usuario',
              avatar: 'avatar.jpg'
            }
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
        userId: 'other-user', // Usuário diferente do que está tentando acessar
        collectionMangas: [],
        user: { id: 'other-user' },
        likes: [],
        collaborators: []
      };
      (prismaMock.collection.findUnique as jest.Mock).mockResolvedValue(mockCollection);
      
      // Configurar o mock para rejeitar a promessa neste teste específico
      (checkUserCanView as jest.Mock).mockRejectedValueOnce(
        new Error('Você não tem permissão para visualizar esta coleção.')
      );

      // When & Then
      await expect(getCollection(collectionId, userId)).rejects.toThrow('Você não tem permissão para visualizar esta coleção.');
    });
  });

  // ... updateCollection e deleteCollection permanecem iguais

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
        collectionMangas: [],
        _count: { likes: 5 },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const updatedCollection = {
        ...mockCollection,
        collectionMangas: [
          {
            manga: { id: mangaId, name: 'Mangá Teste' },
            addedByUser: { id: userId, name: 'Usuário', username: 'usuario', avatar: 'avatar.jpg' }
          }
        ],
        _count: { likes: 5, collectionMangas: 1 }
      };

      (prismaMock.collection.findUnique as jest.Mock).mockResolvedValue(mockCollection);
      (prismaMock.collection.update as jest.Mock).mockResolvedValue(updatedCollection);

      // When
      const result = await toggleMangaInCollection(collectionId, mangaId, userId);

      // Then
      expect(prismaMock.collection.findUnique).toHaveBeenCalledWith({
        where: { id: collectionId },
        include: {
          collectionMangas: {
            where: {
              mangaId: mangaId
            }
          }
        }
      });
      
      expect(prismaMock.collection.update).toHaveBeenCalledWith({
        where: { id: collectionId },
        data: {
          collectionMangas: {
            create: { mangaId: mangaId, addedBy: userId }
          }
        },
        include: {
          collectionMangas: {
            include: {
              manga: true,
              addedByUser: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  avatar: true,
                }
              }
            }
          },
          _count: {
            select: {
              likes: true,
              collectionMangas: true
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
        collectionMangas: [
          {
            mangaId: mangaId,
            manga: { id: mangaId, name: 'Mangá Teste' }
          }
        ],
        _count: { likes: 5 },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const updatedCollection = {
        ...mockCollection,
        collectionMangas: [],
        _count: { likes: 5, collectionMangas: 0 }
      };

      (prismaMock.collection.findUnique as jest.Mock).mockResolvedValue(mockCollection);
      (prismaMock.collection.update as jest.Mock).mockResolvedValue(updatedCollection);

      // When
      const result = await toggleMangaInCollection(collectionId, mangaId, userId);

      // Then
      expect(prismaMock.collection.update).toHaveBeenCalledWith({
        where: { id: collectionId },
        data: {
          collectionMangas: {
            deleteMany: { mangaId: mangaId }
          }
        },
        include: {
          collectionMangas: {
            include: {
              manga: true,
              addedByUser: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  avatar: true,
                }
              }
            }
          },
          _count: {
            select: {
              likes: true,
              collectionMangas: true
            }
          }
        }
      });
      expect(result).toEqual({
        ...updatedCollection,
        action: 'removed'
      });
    });

    // ... outros testes de toggleMangaInCollection permanecem iguais
  });
});