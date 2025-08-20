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
} from '../handlers/PlaylistHandler';
import prisma from '../../../prisma/client';

// Mock do Prisma
jest.mock('../../../prisma/client', () => ({
  playlist: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  tag: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  playlistTag: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
}));

const mockPrisma = prisma as any;

describe('PlaylistHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPlaylist', () => {
    it('should create a playlist without tags', async () => {
      const playlistData = {
        name: 'Test Playlist',
        cover: 'https://example.com/cover.jpg',
        link: 'https://example.com/playlist',
        description: 'Test description',
      };

      const mockPlaylist = {
        id: 'playlist-id',
        ...playlistData,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          playlist: {
            create: jest.fn().mockResolvedValue({ id: 'playlist-id', ...playlistData }),
            findUnique: jest.fn().mockResolvedValue(mockPlaylist),
          },
          tag: { findUnique: jest.fn() },
          playlistTag: { create: jest.fn() },
        };
        return callback(mockTx as any);
      });

      const result = await createPlaylist(playlistData);

      expect(result).toEqual(mockPlaylist);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should create a playlist with tags', async () => {
      const playlistData = {
        name: 'Test Playlist',
        cover: 'https://example.com/cover.jpg',
        link: 'https://example.com/playlist',
        tags: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
      };

      const mockTag = { id: '123e4567-e89b-12d3-a456-426614174001', name: 'test tag' };
      const mockPlaylist = {
        id: 'playlist-id',
        name: playlistData.name,
        cover: playlistData.cover,
        link: playlistData.link,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [{ tag: mockTag }],
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          playlist: {
            create: jest.fn().mockResolvedValue({ id: 'playlist-id' }),
            findUnique: jest.fn().mockResolvedValue(mockPlaylist),
          },
          tag: { findUnique: jest.fn().mockResolvedValue(mockTag) },
          playlistTag: { create: jest.fn() },
        };
        return callback(mockTx as any);
      });

      const result = await createPlaylist(playlistData);

      expect(result).toEqual(mockPlaylist);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw error for invalid data', async () => {
      const invalidData = {
        name: '',
        cover: 'invalid-url',
        link: 'invalid-url',
      };

      await expect(createPlaylist(invalidData as any)).rejects.toThrow();
    });
  });

  describe('getPlaylists', () => {
    it('should get playlists with pagination', async () => {
      const mockPlaylists = [
        {
          id: 'playlist-1',
          name: 'Playlist 1',
          cover: 'https://example.com/cover1.jpg',
          link: 'https://example.com/playlist1',
          tags: [],
        },
      ];

      mockPrisma.playlist.findMany.mockResolvedValue(mockPlaylists);
      mockPrisma.playlist.count.mockResolvedValue(1);

      const result = await getPlaylists(1, 10);

      expect(result).toEqual({
        data: mockPlaylists,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          next: false,
          prev: false,
        },
      });
      expect(mockPrisma.playlist.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {},
        orderBy: { createdAt: 'desc' },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    it('should filter playlists by tag', async () => {
      const mockPlaylists = [];
      mockPrisma.playlist.findMany.mockResolvedValue(mockPlaylists);
      mockPrisma.playlist.count.mockResolvedValue(0);

      await getPlaylists(1, 10, 'tag-id');

      expect(mockPrisma.playlist.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          tags: {
            some: {
              tagId: 'tag-id',
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });
  });

  describe('getPlaylistById', () => {
    it('should get playlist by id', async () => {
      const mockPlaylist = {
        id: 'playlist-id',
        name: 'Test Playlist',
        tags: [],
      };

      mockPrisma.playlist.findUnique.mockResolvedValue(mockPlaylist);

      const result = await getPlaylistById('playlist-id');

      expect(result).toEqual(mockPlaylist);
      expect(mockPrisma.playlist.findUnique).toHaveBeenCalledWith({
        where: { id: 'playlist-id' },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    it('should return null for non-existent playlist', async () => {
      mockPrisma.playlist.findUnique.mockResolvedValue(null);

      const result = await getPlaylistById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('updatePlaylist', () => {
    it('should update playlist without tags', async () => {
      const updateData = {
        name: 'Updated Playlist',
        description: 'Updated description',
      };

      const mockUpdatedPlaylist = {
        id: 'playlist-id',
        ...updateData,
        cover: 'https://example.com/cover.jpg',
        link: 'https://example.com/playlist',
        tags: [],
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          playlist: {
            update: jest.fn(),
            findUnique: jest.fn().mockResolvedValue(mockUpdatedPlaylist),
          },
          playlistTag: { deleteMany: jest.fn() },
          tag: { findUnique: jest.fn() },
        };
        return callback(mockTx as any);
      });

      const result = await updatePlaylist('playlist-id', updateData);

      expect(result).toEqual(mockUpdatedPlaylist);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should update playlist with tags', async () => {
      const updateData = {
        name: 'Updated Playlist',
        tags: ['123e4567-e89b-12d3-a456-426614174001'],
      };

      const mockTag = { id: '123e4567-e89b-12d3-a456-426614174001', name: 'test tag' };
      const mockUpdatedPlaylist = {
        id: 'playlist-id',
        name: updateData.name,
        tags: [{ tag: mockTag }],
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          playlist: {
            update: jest.fn(),
            findUnique: jest.fn().mockResolvedValue(mockUpdatedPlaylist),
          },
          playlistTag: {
            deleteMany: jest.fn(),
            create: jest.fn(),
          },
          tag: { findUnique: jest.fn().mockResolvedValue(mockTag) },
        };
        return callback(mockTx as any);
      });

      const result = await updatePlaylist('playlist-id', updateData);

      expect(result).toEqual(mockUpdatedPlaylist);
    });
  });

  describe('deletePlaylist', () => {
    it('should delete playlist', async () => {
      const mockDeletedPlaylist = {
        id: 'playlist-id',
        name: 'Deleted Playlist',
      };

      mockPrisma.playlist.delete.mockResolvedValue(mockDeletedPlaylist);

      const result = await deletePlaylist('playlist-id');

      expect(result).toEqual(mockDeletedPlaylist);
      expect(mockPrisma.playlist.delete).toHaveBeenCalledWith({
        where: { id: 'playlist-id' },
      });
    });
  });

  describe('getAllTags', () => {
    it('should get all tags with count', async () => {
      const mockTags = [
        {
          id: 'tag-1',
          name: 'action',
          _count: { playlists: 5 },
        },
        {
          id: 'tag-2',
          name: 'romance',
          _count: { playlists: 3 },
        },
      ];

      mockPrisma.tag.findMany.mockResolvedValue(mockTags);

      const result = await getAllTags();

      expect(result).toEqual(mockTags);
      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              playlists: true,
            },
          },
        },
      });
    });
  });

  describe('createTag', () => {
    it('should create a tag', async () => {
      const tagData = {
        name: 'Action',
        color: '#FF0000',
      };

      const mockTag = {
        id: 'tag-id',
        name: 'action',
        color: '#FF0000',
      };

      mockPrisma.tag.create.mockResolvedValue(mockTag);

      const result = await createTag(tagData);

      expect(result).toEqual(mockTag);
      expect(mockPrisma.tag.create).toHaveBeenCalledWith({
        data: {
          name: 'action',
          color: '#FF0000',
        },
      });
    });

    it('should throw error for invalid tag data', async () => {
      const invalidData = {
        name: '',
        color: 'invalid-color',
      };

      await expect(createTag(invalidData as any)).rejects.toThrow();
    });
  });

  describe('updateTag', () => {
    it('should update a tag', async () => {
      const updateData = {
        name: 'Updated Action',
        color: '#00FF00',
      };

      const mockUpdatedTag = {
        id: 'tag-id',
        name: 'updated action',
        color: '#00FF00',
      };

      mockPrisma.tag.update.mockResolvedValue(mockUpdatedTag);

      const result = await updateTag('tag-id', updateData);

      expect(result).toEqual(mockUpdatedTag);
      expect(mockPrisma.tag.update).toHaveBeenCalledWith({
        where: { id: 'tag-id' },
        data: {
          name: 'updated action',
          color: '#00FF00',
        },
      });
    });
  });

  describe('deleteTag', () => {
    it('should delete a tag', async () => {
      const mockDeletedTag = {
        id: 'tag-id',
        name: 'deleted tag',
      };

      mockPrisma.tag.delete.mockResolvedValue(mockDeletedTag);

      const result = await deleteTag('tag-id');

      expect(result).toEqual(mockDeletedTag);
      expect(mockPrisma.tag.delete).toHaveBeenCalledWith({
        where: { id: 'tag-id' },
      });
    });
  });

  describe('getPlaylistsByTags', () => {
    it('should get playlists by tags with pagination', async () => {
      const tagIds = ['tag-1', 'tag-2'];
      const mockPlaylists = [
        {
          id: 'playlist-1',
          name: 'Playlist 1',
          tags: [],
        },
      ];

      mockPrisma.playlist.findMany.mockResolvedValue(mockPlaylists);
      mockPrisma.playlist.count.mockResolvedValue(1);

      const result = await getPlaylistsByTags(tagIds, 1, 10);

      expect(result).toEqual({
        data: mockPlaylists,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          next: false,
          prev: false,
        },
      });

      expect(mockPrisma.playlist.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          tags: {
            some: {
              tagId: {
                in: tagIds,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });
  });
});