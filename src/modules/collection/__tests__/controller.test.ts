import { Request, Response } from 'express';
import { prismaMock } from '../../../test/mocks/prisma';
import {
  create,
  list,
  get,
  update,
  remove,
  listPublic,
  checkInCollections,
  toggleCollection
} from '../controllers/CollectionController';
import { CollectionStatus } from '@prisma/client';

// Extender o tipo Request para incluir a propriedade user
interface RequestWithUser extends Request {
  user?: { id: string };
}

// Mock do Prisma Client
jest.mock('@/prisma/client', () => prismaMock);

// Mock do handleZodError
jest.mock('@/utils/zodError', () => ({
  handleZodError: jest.fn()
}));

// Mock dos handlers
jest.mock('../handlers/CollectionHandler', () => ({
  createCollection: jest.fn(),
  listCollections: jest.fn(),
  getCollection: jest.fn(),
  updateCollection: jest.fn(),
  deleteCollection: jest.fn(),
  listPublicCollections: jest.fn(),
  checkMangaInCollections: jest.fn(),
  toggleMangaInCollection: jest.fn()
}));

// Mock da paginação
jest.mock('@/utils/pagination', () => ({
  getPaginationParams: jest.fn(() => ({ page: 1, take: 10 }))
}));

const {
  createCollection,
  listCollections,
  getCollection,
  updateCollection,
  deleteCollection,
  listPublicCollections,
  checkMangaInCollections,
  toggleMangaInCollection
} = require('../handlers/CollectionHandler');

describe('Collection Controller', () => {
  let mockReq: Partial<RequestWithUser>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockNext: jest.Mock;
  let mockSend: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockSend = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson, send: mockSend });
    mockNext = jest.fn();
    mockRes = {
      json: mockJson,
      status: mockStatus,
      send: mockSend
    };
    mockReq = {
      user: { id: 'user-123' },
      body: {},
      params: {},
      query: {}
    };
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a collection successfully', async () => {
      const mockCollection = {
        id: 'b59b50aa-1116-493d-89cc-b759f3626f68',
        name: 'Test Collection',
        cover: 'cover.jpg',
        description: 'Test Description',
        status: CollectionStatus.PUBLIC,
        userId: 'user-123',
        mangas: [],
        _count: { likes: 0 }
      };

      mockReq.body = {
        name: 'Test Collection',
        cover: 'https://example.com/cover.jpg',
        description: 'Test Description',
        status: CollectionStatus.PUBLIC,
        mangaIds: []
      };

      createCollection.mockResolvedValue(mockCollection);

      await create(mockReq as Request, mockRes as Response);

      expect(createCollection).toHaveBeenCalledWith({
        userId: 'user-123',
        name: 'Test Collection',
        cover: 'https://example.com/cover.jpg',
        description: 'Test Description',
        status: CollectionStatus.PUBLIC,
        mangaIds: []
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockCollection);
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.body = {
        name: 'Test Collection',
        cover: 'https://example.com/cover.jpg',
        description: 'Test Description',
        status: CollectionStatus.PUBLIC,
        mangaIds: []
      };

      await create(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });

  describe('list', () => {
    it('should list user collections with pagination', async () => {
      const mockResult = {
        data: [
          {
            id: 'collection-1',
            name: 'Collection 1',
            _count: { likes: 0, mangas: 0 }
          }
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      };

      mockReq.query = { page: '1', limit: '10' };
      listCollections.mockResolvedValue(mockResult);

      await list(mockReq as Request, mockRes as Response);

      expect(listCollections).toHaveBeenCalledWith('user-123', 1, 10);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('get', () => {
    it('should get a collection by id successfully', async () => {
      const mockCollection = {
        id: 'b59b50aa-1116-493d-89cc-b759f3626f68',
        name: 'Test Collection',
        userId: 'user-123',
        mangas: [],
        user: { id: 'user-123', name: 'Test User' },
        likes: []
      };

      mockReq.params = { id: 'b59b50aa-1116-493d-89cc-b759f3626f68' };
      mockReq.query = { lg: 'pt-BR' };
      getCollection.mockResolvedValue(mockCollection);

      await get(mockReq as Request, mockRes as Response);

      expect(getCollection).toHaveBeenCalledWith('b59b50aa-1116-493d-89cc-b759f3626f68', 'user-123', 'pt-BR');
      expect(mockJson).toHaveBeenCalledWith(mockCollection);
    });

    it('should return 404 if collection not found', async () => {
      mockReq.params = { id: '550e8400-e29b-41d4-a716-446655440000' }; // UUID válido
      getCollection.mockRejectedValue(new Error('Coleção não encontrada.'));

      await get(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Coleção não encontrada.' });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { id: 'b59b50aa-1116-493d-89cc-b759f3626f68' };

      await get(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });

  describe('update', () => {
    it('should update a collection successfully', async () => {
      const updateData = {
        name: 'Updated Collection',
        description: 'Updated Description',
        status: CollectionStatus.PRIVATE
      };

      const mockUpdatedCollection = {
        id: 'b59b50aa-1116-493d-89cc-b759f3626f68',
        ...updateData,
        userId: 'user-123'
      };

      mockReq.params = { id: 'b59b50aa-1116-493d-89cc-b759f3626f68' };
      mockReq.body = updateData;
      updateCollection.mockResolvedValue(mockUpdatedCollection);

      await update(mockReq as Request, mockRes as Response);

      expect(updateCollection).toHaveBeenCalledWith('b59b50aa-1116-493d-89cc-b759f3626f68', 'user-123', updateData);
      expect(mockJson).toHaveBeenCalledWith(mockUpdatedCollection);
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { id: 'b59b50aa-1116-493d-89cc-b759f3626f68' };

      await update(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });

  describe('remove', () => {
    it('should delete a collection successfully', async () => {
      const mockDeletedCollection = {
        id: 'b59b50aa-1116-493d-89cc-b759f3626f68',
        name: 'Test Collection',
        userId: 'user-123'
      };

      mockReq.params = { id: 'b59b50aa-1116-493d-89cc-b759f3626f68' };
      deleteCollection.mockResolvedValue(undefined);

      await remove(mockReq as Request, mockRes as Response);

      expect(deleteCollection).toHaveBeenCalledWith('b59b50aa-1116-493d-89cc-b759f3626f68', 'user-123');
      expect(mockStatus).toHaveBeenCalledWith(204);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should return 404 if collection not found', async () => {
      mockReq.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      deleteCollection.mockRejectedValue(new Error('Coleção não encontrada.'));

      await remove(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Coleção não encontrada.' });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { id: 'b59b50aa-1116-493d-89cc-b759f3626f68' };

      await remove(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 403 if user is not the owner', async () => {
      mockReq.params = { id: 'b59b50aa-1116-493d-89cc-b759f3626f68' };
      deleteCollection.mockRejectedValue(new Error('Você não tem permissão para deletar esta coleção.'));

      await remove(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Você não tem permissão para deletar esta coleção.' });
    });
  });

  describe('listPublic', () => {
    it('should list public collections with pagination', async () => {
      const mockResult = {
        data: [
          {
            id: 'collection-1',
            name: 'Public Collection 1',
            _count: { likes: 0, mangas: 0 }
          }
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      };

      mockReq.query = { page: '1', limit: '10' };
      listPublicCollections.mockResolvedValue(mockResult);

      await listPublic(mockReq as Request, mockRes as Response);

      expect(listPublicCollections).toHaveBeenCalledWith(1, 10);
      expect(mockJson).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('checkInCollections', () => {
    it('should check if manga is in user collections', async () => {
      const mockResult = {
        data: [
          {
            id: 'collection-1',
            name: 'Collection 1',
            isIncluded: true,
            _count: { likes: 0, mangas: 1 }
          }
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      };

      mockReq.params = { mangaId: 'manga-123' };
      mockReq.query = { page: '1', limit: '10' };
      checkMangaInCollections.mockResolvedValue(mockResult);

      await checkInCollections(mockReq as Request, mockRes as Response);

      expect(checkMangaInCollections).toHaveBeenCalledWith('manga-123', 'user-123', 1, 10);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockResult);
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { mangaId: 'manga-123' };

      await checkInCollections(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });

  describe('toggleCollection', () => {
    it('should toggle manga in collection successfully', async () => {
      const mockResult = {
        id: 'collection-123',
        name: 'Test Collection',
        mangas: [{ id: 'manga-123' }],
        action: 'added'
      };

      mockReq.params = { id: 'collection-123', mangaId: 'manga-123' };
      toggleMangaInCollection.mockResolvedValue(mockResult);

      await toggleCollection(mockReq as Request, mockRes as Response);

      expect(toggleMangaInCollection).toHaveBeenCalledWith('collection-123', 'manga-123', 'user-123');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockResult);
    });

    it('should return 404 if collection not found', async () => {
      mockReq.params = { id: 'non-existent', mangaId: 'manga-123' };
      toggleMangaInCollection.mockRejectedValue(new Error('Coleção não encontrada'));

      await toggleCollection(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Coleção não encontrada' });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { id: 'collection-123', mangaId: 'manga-123' };

      await toggleCollection(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 403 if user is not the owner', async () => {
      mockReq.params = { id: 'collection-123', mangaId: 'manga-123' };
      toggleMangaInCollection.mockRejectedValue(new Error('Você não tem permissão para modificar esta coleção'));

      await toggleCollection(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Você não tem permissão para modificar esta coleção' });
    });

    it('should return 404 if manga not found', async () => {
      const handleZodError = require('@/utils/zodError').handleZodError;
      mockReq.params = { id: 'collection-123', mangaId: 'non-existent' };
      toggleMangaInCollection.mockRejectedValue(new Error('Mangá não encontrado.'));

      await toggleCollection(mockReq as Request, mockRes as Response);

      expect(toggleMangaInCollection).toHaveBeenCalledWith('collection-123', 'non-existent', 'user-123');
      expect(handleZodError).toHaveBeenCalledWith(new Error('Mangá não encontrado.'), mockRes);
    });
  });
});