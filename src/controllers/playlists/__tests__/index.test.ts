import express, { RequestHandler } from 'express';
import request from 'supertest';
import * as playlistController from '../index';
import * as playlistHandler from '../../../handlers/playlists';
import { handleZodError } from '../../../utils/zodError';

// Mock dos handlers
jest.mock('@/handlers/playlists');
jest.mock('@/utils/zodError');

const mockedPlaylistHandler = playlistHandler as jest.Mocked<typeof playlistHandler>;
const mockedHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;

// Setup do Express app para testes
const app = express();
app.use(express.json());
app.post('/playlists', playlistController.createPlaylist);
app.get('/playlists', playlistController.getPlaylists);
app.get('/playlists/:id', playlistController.getPlaylistById);
app.put('/playlists/:id', playlistController.updatePlaylist);
app.delete('/playlists/:id', playlistController.deletePlaylist);

describe('Playlist Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /playlists', () => {
    const mockPlaylistData = {
      name: 'Test Playlist',
      cover: 'https://example.com/cover.jpg',
      link: 'https://example.com/playlist',
      description: 'Test description'
    };

    const mockCreatedPlaylist = {
      id: '1',
      ...mockPlaylistData,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z')
    };

    it('deve criar uma playlist com sucesso', async () => {
      mockedPlaylistHandler.createPlaylist.mockResolvedValue(mockCreatedPlaylist);

      const response = await request(app)
        .post('/playlists')
        .send(mockPlaylistData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: '1',
        ...mockPlaylistData
      });
      expect(mockedPlaylistHandler.createPlaylist).toHaveBeenCalledWith(mockPlaylistData);
    });

    it('deve retornar erro 400 quando handler falha', async () => {
      const errorMessage = 'Dados inválidos';
      mockedPlaylistHandler.createPlaylist.mockRejectedValue(new Error(errorMessage));

      const response = await request(app)
        .post('/playlists')
        .send(mockPlaylistData);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: errorMessage });
    });
  });

  describe('GET /playlists', () => {
    const mockPlaylistsResponse = {
      data: [
        {
          id: '1',
          name: 'Playlist 1',
          cover: 'https://example.com/cover1.jpg',
          link: 'https://example.com/playlist1',
          description: 'Description 1',
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
          updatedAt: new Date('2025-01-01T00:00:00.000Z')
        }
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        next: false,
        prev: false
      }
    };

    it('deve retornar lista de playlists com paginação padrão', async () => {
      mockedPlaylistHandler.getPlaylists.mockResolvedValue(mockPlaylistsResponse);

      const response = await request(app)
        .get('/playlists');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        data: expect.any(Array),
        pagination: expect.any(Object)
      });
      expect(mockedPlaylistHandler.getPlaylists).toHaveBeenCalledWith(1, 10);
    });

    it('deve retornar lista de playlists com paginação customizada', async () => {
      mockedPlaylistHandler.getPlaylists.mockResolvedValue(mockPlaylistsResponse);

      const response = await request(app)
        .get('/playlists?page=2&limit=5');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        data: expect.any(Array),
        pagination: expect.any(Object)
      });
      expect(mockedPlaylistHandler.getPlaylists).toHaveBeenCalledWith(2, 5);
    });

    it('deve retornar erro 500 quando handler falha', async () => {
      const errorMessage = 'Erro interno';
      mockedPlaylistHandler.getPlaylists.mockRejectedValue(new Error(errorMessage));

      const response = await request(app)
        .get('/playlists');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: errorMessage });
    });
  });

  describe('GET /playlists/:id', () => {
    const mockPlaylist = {
      id: '1',
      name: 'Test Playlist',
      cover: 'https://example.com/cover.jpg',
      link: 'https://example.com/playlist',
      description: 'Test description',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z')
    };

    it('deve retornar playlist por ID', async () => {
      mockedPlaylistHandler.getPlaylistById.mockResolvedValue(mockPlaylist);

      const response = await request(app)
        .get('/playlists/1');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: '1',
        name: 'Test Playlist',
        cover: 'https://example.com/cover.jpg',
        link: 'https://example.com/playlist',
        description: 'Test description'
      });
      expect(mockedPlaylistHandler.getPlaylistById).toHaveBeenCalledWith('1');
    });

    it('deve retornar erro 404 quando playlist não encontrada', async () => {
      mockedPlaylistHandler.getPlaylistById.mockResolvedValue(null);

      const response = await request(app)
        .get('/playlists/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Playlist não encontrada' });
    });

    it('deve retornar erro 500 quando handler falha', async () => {
      const errorMessage = 'Erro interno';
      mockedPlaylistHandler.getPlaylistById.mockRejectedValue(new Error(errorMessage));

      const response = await request(app)
        .get('/playlists/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: errorMessage });
    });
  });

  describe('PUT /playlists/:id', () => {
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
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z')
    };

    it('deve atualizar playlist com sucesso', async () => {
      mockedPlaylistHandler.updatePlaylist.mockResolvedValue(mockUpdatedPlaylist);

      const response = await request(app)
        .put('/playlists/1')
        .send(mockUpdateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: '1',
        name: 'Updated Playlist',
        description: 'Updated description'
      });
      expect(mockedPlaylistHandler.updatePlaylist).toHaveBeenCalledWith('1', mockUpdateData);
    });

    it('deve retornar erro 400 quando handler falha', async () => {
      const errorMessage = 'Dados inválidos';
      mockedPlaylistHandler.updatePlaylist.mockRejectedValue(new Error(errorMessage));

      const response = await request(app)
        .put('/playlists/1')
        .send(mockUpdateData);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: errorMessage });
    });
  });

  describe('DELETE /playlists/:id', () => {
    it('deve deletar playlist com sucesso', async () => {
      const mockDeletedPlaylist = {
        id: '1',
        name: 'Deleted Playlist',
        cover: 'https://example.com/cover.jpg',
        link: 'https://example.com/playlist',
        description: 'Deleted description',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
         updatedAt: new Date('2025-01-01T00:00:00.000Z')
       };
      mockedPlaylistHandler.deletePlaylist.mockResolvedValue(mockDeletedPlaylist);

      const response = await request(app)
        .delete('/playlists/1');

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
      expect(mockedPlaylistHandler.deletePlaylist).toHaveBeenCalledWith('1');
    });

    it('deve retornar erro 500 quando handler falha', async () => {
      const errorMessage = 'Erro ao deletar';
      mockedPlaylistHandler.deletePlaylist.mockRejectedValue(new Error(errorMessage));

      const response = await request(app)
        .delete('/playlists/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: errorMessage });
    });
  });
});