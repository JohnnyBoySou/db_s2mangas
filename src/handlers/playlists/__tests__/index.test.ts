import * as playlistHandler from '../index'; 
import { prismaMock } from '../../../test/mocks/prisma';

describe('Playlist Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPlaylist', () => {
    const mockPlaylistData = {
      name: 'Test Playlist',
      cover: 'https://example.com/cover.jpg',
      link: 'https://example.com/playlist',
      description: 'Test description'
    };

    const mockCreatedPlaylist = {
      id: '1',
      ...mockPlaylistData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('deve criar uma playlist com dados válidos', async () => {
      prismaMock.playlist.create.mockResolvedValue(mockCreatedPlaylist);

      const result = await playlistHandler.createPlaylist(mockPlaylistData);

      expect(result).toEqual(mockCreatedPlaylist);
      expect(prismaMock.playlist.create).toHaveBeenCalledWith({
        data: mockPlaylistData
      });
    });

    it('deve lançar erro quando dados são inválidos', async () => {
      const invalidData = {
        name: '', // nome vazio
        cover: 'invalid-url',
        link: 'invalid-url'
      };

      await expect(playlistHandler.createPlaylist(invalidData as any))
        .rejects.toThrow();
    });

    it('deve lançar erro quando Prisma falha', async () => {
      const errorMessage = 'Database error';
      prismaMock.playlist.create.mockRejectedValue(new Error(errorMessage));

      await expect(playlistHandler.createPlaylist(mockPlaylistData))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('getPlaylists', () => {
    const mockPlaylists = [
      {
        id: '1',
        name: 'Playlist 1',
        cover: 'https://example.com/cover1.jpg',
        link: 'https://example.com/playlist1',
        description: 'Description 1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: 'Playlist 2',
        cover: 'https://example.com/cover2.jpg',
        link: 'https://example.com/playlist2',
        description: 'Description 2',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('deve retornar playlists com paginação padrão', async () => {
      prismaMock.playlist.findMany.mockResolvedValue(mockPlaylists);
      prismaMock.playlist.count.mockResolvedValue(2);

      const result = await playlistHandler.getPlaylists();

      expect(result.data).toEqual(mockPlaylists);
      expect(result.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        next: false,
        prev: false
      });
      expect(prismaMock.playlist.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: {
          createdAt: 'desc'
        }
      });
    });

    it('deve retornar playlists com paginação customizada', async () => {
      prismaMock.playlist.findMany.mockResolvedValue([mockPlaylists[0]]);
      prismaMock.playlist.count.mockResolvedValue(15);

      const result = await playlistHandler.getPlaylists(2, 5);

      expect(result.data).toEqual([mockPlaylists[0]]);
      expect(result.pagination).toEqual({
        total: 15,
        page: 2,
        limit: 5,
        totalPages: 3,
        next: true,
        prev: true
      });
      expect(prismaMock.playlist.findMany).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      });
    });

    it('deve calcular corretamente quando não há próxima página', async () => {
      prismaMock.playlist.findMany.mockResolvedValue(mockPlaylists);
      prismaMock.playlist.count.mockResolvedValue(10);

      const result = await playlistHandler.getPlaylists(1, 10);

      expect(result.pagination.next).toBe(false);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('deve calcular corretamente quando há próxima página', async () => {
      prismaMock.playlist.findMany.mockResolvedValue(mockPlaylists);
      prismaMock.playlist.count.mockResolvedValue(25);

      const result = await playlistHandler.getPlaylists(1, 10);

      expect(result.pagination.next).toBe(true);
      expect(result.pagination.totalPages).toBe(3);
    });

    it('deve lançar erro quando Prisma falha', async () => {
      const errorMessage = 'Database error';
      prismaMock.playlist.findMany.mockRejectedValue(new Error(errorMessage));

      await expect(playlistHandler.getPlaylists())
        .rejects.toThrow(errorMessage);
    });
  });

  describe('getPlaylistById', () => {
    const mockPlaylist = {
      id: '1',
      name: 'Test Playlist',
      cover: 'https://example.com/cover.jpg',
      link: 'https://example.com/playlist',
      description: 'Test description',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('deve retornar playlist quando encontrada', async () => {
      prismaMock.playlist.findUnique.mockResolvedValue(mockPlaylist);

      const result = await playlistHandler.getPlaylistById('1');

      expect(result).toEqual(mockPlaylist);
      expect(prismaMock.playlist.findUnique).toHaveBeenCalledWith({
        where: { id: '1' }
      });
    });

    it('deve retornar null quando playlist não encontrada', async () => {
      prismaMock.playlist.findUnique.mockResolvedValue(null);

      const result = await playlistHandler.getPlaylistById('999');

      expect(result).toBeNull();
      expect(prismaMock.playlist.findUnique).toHaveBeenCalledWith({
        where: { id: '999' }
      });
    });

    it('deve lançar erro quando Prisma falha', async () => {
      const errorMessage = 'Database error';
      prismaMock.playlist.findUnique.mockRejectedValue(new Error(errorMessage));

      await expect(playlistHandler.getPlaylistById('1'))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('updatePlaylist', () => {
    const mockUpdateData = {
      name: 'Updated Playlist',
      description: 'Updated description'
    };

    const mockUpdatedPlaylist = {
      id: '1',
      name: 'Updated Playlist',
      cover: 'https://example.com/cover.jpg',
      link: 'https://example.com/playlist',
      description: 'Updated description',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('deve atualizar playlist com dados válidos', async () => {
      prismaMock.playlist.update.mockResolvedValue(mockUpdatedPlaylist);

      const result = await playlistHandler.updatePlaylist('1', mockUpdateData);

      expect(result).toEqual(mockUpdatedPlaylist);
      expect(prismaMock.playlist.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: mockUpdateData
      });
    });

    it('deve atualizar playlist com dados parciais', async () => {
      const partialData = { name: 'Only Name Updated' };
      const partialUpdatedPlaylist = {
        ...mockUpdatedPlaylist,
        name: 'Only Name Updated'
      };
      
      prismaMock.playlist.update.mockResolvedValue(partialUpdatedPlaylist);

      const result = await playlistHandler.updatePlaylist('1', partialData);

      expect(result).toEqual(partialUpdatedPlaylist);
      expect(prismaMock.playlist.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: partialData
      });
    });

    it('deve lançar erro quando dados são inválidos', async () => {
      const invalidData = {
        name: '', // nome vazio
        cover: 'invalid-url'
      };

      await expect(playlistHandler.updatePlaylist('1', invalidData as any))
        .rejects.toThrow();
    });

    it('deve lançar erro quando Prisma falha', async () => {
      const errorMessage = 'Database error';
      prismaMock.playlist.update.mockRejectedValue(new Error(errorMessage));

      await expect(playlistHandler.updatePlaylist('1', mockUpdateData))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('deletePlaylist', () => {
    it('deve deletar playlist com sucesso', async () => {
      const mockDeletedPlaylist = {
        id: '1',
        name: 'Deleted Playlist',
        cover: 'https://example.com/cover.jpg',
        link: 'https://example.com/playlist',
        description: 'Deleted description',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prismaMock.playlist.delete.mockResolvedValue(mockDeletedPlaylist);

      const result = await playlistHandler.deletePlaylist('1');

      expect(result).toEqual(mockDeletedPlaylist);
      expect(prismaMock.playlist.delete).toHaveBeenCalledWith({
        where: { id: '1' }
      });
    });

    it('deve lançar erro quando playlist não encontrada', async () => {
      const errorMessage = 'Record to delete does not exist';
      prismaMock.playlist.delete.mockRejectedValue(new Error(errorMessage));

      await expect(playlistHandler.deletePlaylist('999'))
        .rejects.toThrow(errorMessage);
    });

    it('deve lançar erro quando Prisma falha', async () => {
      const errorMessage = 'Database error';
      prismaMock.playlist.delete.mockRejectedValue(new Error(errorMessage));

      await expect(playlistHandler.deletePlaylist('1'))
        .rejects.toThrow(errorMessage);
    });
  });
});