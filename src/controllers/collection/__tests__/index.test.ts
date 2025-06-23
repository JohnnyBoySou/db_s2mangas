import { Request, Response } from 'express';
import { prismaMock } from '../../../test/mocks/prisma';
import {
  create,
  list,
  //get,
  //update,
  //remove,
  listPublic,
  checkInCollections,
  toggleCollection
} from '../index';
import { CollectionStatus } from '@prisma/client';

// Mock do Prisma Client
jest.mock('../../../../prisma/client', () => prismaMock);

// Mock do handleZodError
jest.mock('../../../utils/zodError', () => ({
  handleZodError: jest.fn()
}));

describe('Collection Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockNext = jest.fn();
    mockRes = {
      json: mockJson,
      status: mockStatus
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
        id: 'collection-123',
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

      prismaMock.collection.create.mockResolvedValue(mockCollection);

      await create(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.collection.create).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockCollection);
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      // Provide valid body data so schema validation passes
      mockReq.body = {
        name: 'Test Collection',
        cover: 'https://example.com/cover.jpg',
        description: 'Test Description',
        status: CollectionStatus.PUBLIC,
        mangaIds: []
      };

      await create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });

  describe('list', () => {
    it('should list user collections with pagination', async () => {
      const mockCollections = [ 
        {
          id: 'collection-1',
          name: 'Collection 1',
          _count: { likes: 0, mangas: 0 }
        }
      ];

      mockReq.query = { page: '1', limit: '10' };

      prismaMock.collection.findMany.mockResolvedValue(mockCollections);
      prismaMock.collection.count.mockResolvedValue(1);

      await list(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.collection.findMany).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
        data: mockCollections,
        pagination: expect.any(Object)
      }));
    });
  });
  /*
  describe('get', () => {
    it('should get a collection by id', async () => {
      const mockCollection = {
        id: 'collection-123',
        name: 'Test Collection',
        userId: 'user-123',
        mangas: [],
        user: {},
        likes: []
      };

      mockReq.params = { id: 'collection-123' };
      prismaMock.collection.findUnique.mockResolvedValue(mockCollection);

      await get(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.collection.findUnique).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith(mockCollection);
    });

    it('should return 404 if collection not found', async () => {
      mockReq.params = { id: 'non-existent' };
      prismaMock.collection.findUnique.mockResolvedValue(null);

      await get(mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Coleção não encontrada.' });
    });
  });

  describe('update', () => {
    it('should update a collection successfully', async () => {
      const mockCollection = {
        id: 'collection-123',
        name: 'Updated Collection',
        userId: 'user-123'
      };

      mockReq.params = { id: 'collection-123' };
      mockReq.body = { name: 'Updated Collection' };

      prismaMock.collection.findUnique.mockResolvedValue(mockCollection);
      prismaMock.collection.update.mockResolvedValue(mockCollection);

      await update(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.collection.update).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith(mockCollection);
    });
  });

  describe('remove', () => {
    it('should delete a collection successfully', async () => {
      const mockCollection = {
        id: 'collection-123',
        userId: 'user-123'
      };

      mockReq.params = { id: 'collection-123' };
      prismaMock.collection.findUnique.mockResolvedValue(mockCollection);
      prismaMock.collection.delete.mockResolvedValue(mockCollection);

      await remove(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.collection.delete).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(204);
    });
  });
*/
  describe('listPublic', () => {
    it('should list public collections with pagination', async () => {
      const mockCollections = [
        {
          id: 'collection-1',
          name: 'Public Collection',
          status: CollectionStatus.PUBLIC,
          user: { id: 'user-1', name: 'User 1', avatar: 'avatar.jpg' },
          _count: { likes: 0 }
        }
      ];

      mockReq.query = { page: '1', limit: '10' };

      prismaMock.collection.findMany.mockResolvedValue(mockCollections);
      prismaMock.collection.count.mockResolvedValue(1);

      await listPublic(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.collection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: CollectionStatus.PUBLIC }
        })
      );
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
        data: mockCollections,
        pagination: expect.any(Object)
      }));
    });
  });

  describe('checkInCollections', () => {
    it('should check if manga is in collections', async () => {
      const mockCollections = [
        {
          id: 'collection-1',
          name: 'Collection 1',
          mangas: [{ id: 'manga-123' }],
          _count: { likes: 0, mangas: 1 }
        }
      ];

      mockReq.params = { mangaId: 'manga-123' };
      mockReq.query = { page: '1', limit: '10' };

      prismaMock.collection.findMany.mockResolvedValue(mockCollections);
      prismaMock.collection.count.mockResolvedValue(1);

      await checkInCollections(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.collection.findMany).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            isIncluded: true
          })
        ])
      }));
    });
  });

  describe('toggleCollection', () => {
    it('should add manga to collection when not present', async () => {
      const mockCollection = {
        id: 'collection-123',
        userId: 'user-123',
        mangas: []
      };

      mockReq.params = { id: 'collection-123', mangaId: 'manga-123' };

      prismaMock.collection.findUnique.mockResolvedValue(mockCollection);
      prismaMock.collection.update.mockResolvedValue({
        ...mockCollection,
        mangas: [{ id: 'manga-123' }],
        _count: { likes: 0, mangas: 1 }
      });

      await toggleCollection(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.collection.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            mangas: expect.objectContaining({
              connect: { id: 'manga-123' }
            })
          })
        })
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
        action: 'added'
      }));
    });

    it('should remove manga from collection when present', async () => {
      const mockCollection = {
        id: 'collection-123',
        userId: 'user-123',
        mangas: [{ id: 'manga-123' }]
      };

      mockReq.params = { id: 'collection-123', mangaId: 'manga-123' };

      prismaMock.collection.findUnique.mockResolvedValue(mockCollection);
      prismaMock.collection.update.mockResolvedValue({
        ...mockCollection,
        mangas: [],
        _count: { likes: 0, mangas: 0 }
      });

      await toggleCollection(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.collection.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            mangas: expect.objectContaining({
              disconnect: { id: 'manga-123' }
            })
          })
        })
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
        action: 'removed'
      }));
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      // Provide valid body data
      mockReq.body = {
        collectionId: 'collection-123',
        mangaId: 'manga-123'
      };

      await toggleCollection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' }); // Changed from 'Não autorizado'
    });

    it('should return 404 if collection not found', async () => {
      mockReq.params = { id: 'non-existent', mangaId: 'manga-123' };
      prismaMock.collection.findUnique.mockResolvedValue(null);

      await toggleCollection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Coleção não encontrada' });
    });

    it('should return 403 if user is not the collection owner', async () => {
      const mockCollection = {
        id: 'collection-123',
        userId: 'other-user',
        mangas: []
      };

      mockReq.params = { id: 'collection-123', mangaId: 'manga-123' };
      prismaMock.collection.findUnique.mockResolvedValue(mockCollection);

      await toggleCollection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Você não tem permissão para modificar esta coleção' });
    });
  });
});