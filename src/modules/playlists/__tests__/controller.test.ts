import { Request, Response } from 'express';
import {
  createPlaylist,
  getPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
  getPlaylistsByTags,
} from '../controllers/PlaylistController';
import * as playlistHandler from '../handlers/PlaylistHandler';

// Mock do PlaylistHandler
jest.mock('../handlers/PlaylistHandler');

const mockPlaylistHandler = playlistHandler as jest.Mocked<typeof playlistHandler>;

// Mock das funções Request e Response
const mockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  ...overrides,
}) as Request;

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('PlaylistController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPlaylist', () => {
    it('should create a playlist successfully', async () => {
      const playlistData = {
        name: 'Test Playlist',
        cover: 'https://example.com/cover.jpg',
        link: 'https://example.com/playlist',
      };

      const mockPlaylist = {
        id: 'playlist-id',
        ...playlistData,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      };

      mockPlaylistHandler.createPlaylist.mockResolvedValue(mockPlaylist);

      const req = mockRequest({ body: playlistData });
      const res = mockResponse();

      await createPlaylist(req, res, jest.fn());

      expect(mockPlaylistHandler.createPlaylist).toHaveBeenCalledWith(playlistData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockPlaylist);
    });

    it('should handle validation errors', async () => {
      const invalidData = { name: '' };
      const errorMessage = 'Validation error';

      mockPlaylistHandler.createPlaylist.mockRejectedValue(new Error(errorMessage));

      const req = mockRequest({ body: invalidData });
      const res = mockResponse();

      await createPlaylist(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('getPlaylists', () => {
    it('should get playlists with default pagination', async () => {
      const mockResult = {
        data: [
          {
            id: 'playlist-1',
            name: 'Playlist 1',
            cover: 'https://example.com/cover1.jpg',
            link: 'https://example.com/playlist1',
            description: 'Test description',
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: [],
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          next: false,
          prev: false,
        },
      };

      mockPlaylistHandler.getPlaylists.mockResolvedValue(mockResult);

      const req = mockRequest({ query: {} });
      const res = mockResponse();

      await getPlaylists(req, res, jest.fn());

      expect(mockPlaylistHandler.getPlaylists).toHaveBeenCalledWith(1, 10, undefined);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should get playlists with custom pagination and tag filter', async () => {
      const mockResult = {
        data: [],
        pagination: {
          total: 0,
          page: 2,
          limit: 5,
          totalPages: 0,
          next: false,
          prev: true,
        },
      };

      mockPlaylistHandler.getPlaylists.mockResolvedValue(mockResult);

      const req = mockRequest({
        query: {
          page: '2',
          limit: '5',
          tagId: '123e4567-e89b-12d3-a456-426614174001',
        },
      });
      const res = mockResponse();

      await getPlaylists(req, res, jest.fn());

      expect(mockPlaylistHandler.getPlaylists).toHaveBeenCalledWith(
        2,
        5,
        '123e4567-e89b-12d3-a456-426614174001'
      );
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle errors', async () => {
      const errorMessage = 'Database error';
      mockPlaylistHandler.getPlaylists.mockRejectedValue(new Error(errorMessage));

      const req = mockRequest({ query: {} });
      const res = mockResponse();

      await getPlaylists(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('getPlaylistById', () => {
    it('should get playlist by id successfully', async () => {
      const mockPlaylist = {
        id: 'playlist-id',
        name: 'Test Playlist',
        cover: 'https://example.com/cover.jpg',
        link: 'https://example.com/playlist',
        description: 'Test description',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      };

      mockPlaylistHandler.getPlaylistById.mockResolvedValue(mockPlaylist);

      const req = mockRequest({ params: { id: 'playlist-id' } });
      const res = mockResponse();

      await getPlaylistById(req, res, jest.fn());

      expect(mockPlaylistHandler.getPlaylistById).toHaveBeenCalledWith('playlist-id');
      expect(res.json).toHaveBeenCalledWith(mockPlaylist);
    });

    it('should return 404 when playlist not found', async () => {
      mockPlaylistHandler.getPlaylistById.mockResolvedValue(null);

      const req = mockRequest({ params: { id: 'non-existent-id' } });
      const res = mockResponse();

      await getPlaylistById(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Playlist não encontrada' });
    });

    it('should handle errors', async () => {
      const errorMessage = 'Database error';
      mockPlaylistHandler.getPlaylistById.mockRejectedValue(new Error(errorMessage));

      const req = mockRequest({ params: { id: 'playlist-id' } });
      const res = mockResponse();

      await getPlaylistById(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('updatePlaylist', () => {
    it('should update playlist successfully', async () => {
      const updateData = {
        name: 'Updated Playlist',
        description: 'Updated description',
      };

      const mockUpdatedPlaylist = {
        id: 'playlist-id',
        ...updateData,
        cover: 'https://example.com/cover.jpg',
        link: 'https://example.com/playlist',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      };

      mockPlaylistHandler.updatePlaylist.mockResolvedValue(mockUpdatedPlaylist);

      const req = mockRequest({
        params: { id: 'playlist-id' },
        body: updateData,
      });
      const res = mockResponse();

      await updatePlaylist(req, res, jest.fn());

      expect(mockPlaylistHandler.updatePlaylist).toHaveBeenCalledWith('playlist-id', updateData);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedPlaylist);
    });

    it('should handle validation errors', async () => {
      const errorMessage = 'Validation error';
      mockPlaylistHandler.updatePlaylist.mockRejectedValue(new Error(errorMessage));

      const req = mockRequest({
        params: { id: 'playlist-id' },
        body: { name: '' },
      });
      const res = mockResponse();

      await updatePlaylist(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('deletePlaylist', () => {
    it('should delete playlist successfully', async () => {
      mockPlaylistHandler.deletePlaylist.mockResolvedValue({} as any);

      const req = mockRequest({ params: { id: 'playlist-id' } });
      const res = mockResponse();

      await deletePlaylist(req, res, jest.fn());

      expect(mockPlaylistHandler.deletePlaylist).toHaveBeenCalledWith('playlist-id');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const errorMessage = 'Database error';
      mockPlaylistHandler.deletePlaylist.mockRejectedValue(new Error(errorMessage));

      const req = mockRequest({ params: { id: 'playlist-id' } });
      const res = mockResponse();

      await deletePlaylist(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('getAllTags', () => {
    it('should get all tags successfully', async () => {
      const mockTags = [
        {
          id: 'tag-1',
          name: 'action',
          color: '#FF0000',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { playlists: 5 },
        },
        {
          id: 'tag-2',
          name: 'romance',
          color: '#00FF00',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { playlists: 3 },
        },
      ];

      mockPlaylistHandler.getAllTags.mockResolvedValue(mockTags);

      const req = mockRequest();
      const res = mockResponse();

      await getAllTags(req, res, jest.fn());

      expect(mockPlaylistHandler.getAllTags).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: mockTags });
    });

    it('should handle errors', async () => {
      const errorMessage = 'Database error';
      mockPlaylistHandler.getAllTags.mockRejectedValue(new Error(errorMessage));

      const req = mockRequest();
      const res = mockResponse();

      await getAllTags(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('createTag', () => {
    it('should create tag successfully', async () => {
      const tagData = {
        name: 'Action',
        color: '#FF0000',
      };

      const mockTag = {
        id: 'tag-id',
        name: 'action',
        color: '#FF0000',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPlaylistHandler.createTag.mockResolvedValue(mockTag);

      const req = mockRequest({ body: tagData });
      const res = mockResponse();

      await createTag(req, res, jest.fn());

      expect(mockPlaylistHandler.createTag).toHaveBeenCalledWith(tagData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockTag);
    });

    it('should handle validation errors', async () => {
      const errorMessage = 'Validation error';
      mockPlaylistHandler.createTag.mockRejectedValue(new Error(errorMessage));

      const req = mockRequest({ body: { name: '' } });
      const res = mockResponse();

      await createTag(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('updateTag', () => {
    it('should update tag successfully', async () => {
      const updateData = {
        name: 'Updated Action',
        color: '#00FF00',
      };

      const mockUpdatedTag = {
        id: 'tag-id',
        name: 'updated action',
        color: '#00FF00',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPlaylistHandler.updateTag.mockResolvedValue(mockUpdatedTag);

      const req = mockRequest({
        params: { id: 'tag-id' },
        body: updateData,
      });
      const res = mockResponse();

      await updateTag(req, res, jest.fn());

      expect(mockPlaylistHandler.updateTag).toHaveBeenCalledWith('tag-id', updateData);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedTag);
    });

    it('should handle validation errors', async () => {
      const errorMessage = 'Validation error';
      mockPlaylistHandler.updateTag.mockRejectedValue(new Error(errorMessage));

      const req = mockRequest({
        params: { id: 'tag-id' },
        body: { name: '' },
      });
      const res = mockResponse();

      await updateTag(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('deleteTag', () => {
    it('should delete tag successfully', async () => {
      mockPlaylistHandler.deleteTag.mockResolvedValue({} as any);

      const req = mockRequest({ params: { id: 'tag-id' } });
      const res = mockResponse();

      await deleteTag(req, res, jest.fn());

      expect(mockPlaylistHandler.deleteTag).toHaveBeenCalledWith('tag-id');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const errorMessage = 'Database error';
      mockPlaylistHandler.deleteTag.mockRejectedValue(new Error(errorMessage));

      const req = mockRequest({ params: { id: 'tag-id' } });
      const res = mockResponse();

      await deleteTag(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('getPlaylistsByTags', () => {
    it('should get playlists by tags successfully', async () => {
      const mockResult = {
        data: [
          {
            id: 'playlist-1',
            name: 'Playlist 1',
            cover: 'https://example.com/cover1.jpg',
            link: 'https://example.com/playlist1',
            description: 'Test description',
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: [],
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          next: false,
          prev: false,
        },
      };

      mockPlaylistHandler.getPlaylistsByTags.mockResolvedValue(mockResult);

      const req = mockRequest({
        query: {
          tagIds: '123e4567-e89b-12d3-a456-426614174001,123e4567-e89b-12d3-a456-426614174002',
          page: '1',
          limit: '10',
        },
      });
      const res = mockResponse();

      await getPlaylistsByTags(req, res, jest.fn());

      expect(mockPlaylistHandler.getPlaylistsByTags).toHaveBeenCalledWith(
        ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
        1,
        10
      );
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 400 when tagIds are missing', async () => {
      const req = mockRequest({ query: {} });
      const res = mockResponse();

      await getPlaylistsByTags(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'IDs das tags são obrigatórios' });
    });

    it('should handle errors', async () => {
      const errorMessage = 'Database error';
      mockPlaylistHandler.getPlaylistsByTags.mockRejectedValue(new Error(errorMessage));

      const req = mockRequest({
        query: {
          tagIds: '123e4567-e89b-12d3-a456-426614174001',
        },
      });
      const res = mockResponse();

      await getPlaylistsByTags(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
});