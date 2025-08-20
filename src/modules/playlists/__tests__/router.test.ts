import request from 'supertest';
import express from 'express';
import { PlaylistRouter, AdminPlaylistRouter } from '../routes/PlaylistRouter';
import * as playlistController from '../controllers/PlaylistController';
import { requireAuth, requireAdmin } from '../../../middlewares/auth';

// Mock dos middlewares
jest.mock('@/middlewares/auth');

// Mock do PlaylistController
jest.mock('../controllers/PlaylistController');

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>;
const mockPlaylistController = playlistController as jest.Mocked<typeof playlistController>;

// Setup da aplicação de teste
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/playlists', PlaylistRouter);
  app.use('/api/admin/playlists', AdminPlaylistRouter);
  return app;
};

describe('PlaylistRouter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock dos middlewares para passar por padrão
    mockRequireAuth.mockImplementation((req: any, res, next) => {
      req.user = { id: 'user-id', role: 'USER' }
      next();
    });
    
    mockRequireAdmin.mockImplementation((req, res, next) => {
      next();
    });
    
    // Mock das funções do controller para retornar sucesso por padrão
    mockPlaylistController.getPlaylists.mockImplementation((req, res) => {
      res.json({ data: [], pagination: {} });
    });
    
    mockPlaylistController.getPlaylistById.mockImplementation((req, res) => {
      res.json({ id: req.params.id, name: 'Test Playlist' });
    });
    
    mockPlaylistController.getAllTags.mockImplementation((req, res) => {
      res.json({ data: [] });
    });
    
    mockPlaylistController.getPlaylistsByTags.mockImplementation((req, res) => {
      res.json({ data: [], pagination: {} });
    });
  });

  describe('Public Routes', () => {
    const app = createTestApp();

    describe('GET /api/playlists', () => {
      it('should require authentication', async () => {
        const response = await request(app)
          .get('/api/playlists')
          .expect(200);

        expect(mockRequireAuth).toHaveBeenCalled();
        expect(mockPlaylistController.getPlaylists).toHaveBeenCalled();
      });

      it('should handle query parameters', async () => {
        await request(app)
          .get('/api/playlists?page=2&limit=5&tagId=123')
          .expect(200);

        expect(mockPlaylistController.getPlaylists).toHaveBeenCalled();
      });
    });

    describe('GET /api/playlists/:id', () => {
      it('should require authentication and get playlist by id', async () => {
        const playlistId = 'playlist-123';
        
        await request(app)
          .get(`/api/playlists/${playlistId}`)
          .expect(200);

        expect(mockRequireAuth).toHaveBeenCalled();
        expect(mockPlaylistController.getPlaylistById).toHaveBeenCalled();
      });
    });

    describe('GET /api/playlists/tags/all', () => {
      it('should require authentication and get all tags', async () => {
        await request(app)
          .get('/api/playlists/tags/all')
          .expect(200);

        expect(mockRequireAuth).toHaveBeenCalled();
        expect(mockPlaylistController.getAllTags).toHaveBeenCalled();
      });
    });

    describe('GET /api/playlists/by-tags', () => {
      it('should require authentication and get playlists by tags', async () => {
        await request(app)
          .get('/api/playlists/by-tags?tagIds=tag1,tag2')
          .expect(200);

        expect(mockRequireAuth).toHaveBeenCalled();
        expect(mockPlaylistController.getPlaylistsByTags).toHaveBeenCalled();
      });
    });

    describe('Authentication Middleware', () => {
      it('should block unauthenticated requests', async () => {
        mockRequireAuth.mockImplementation((req, res, next) => {
          res.status(401).json({ error: 'Unauthorized' });
        });

        await request(app)
          .get('/api/playlists')
          .expect(401);

        expect(mockPlaylistController.getPlaylists).not.toHaveBeenCalled();
      });
    });
  });

  describe('Admin Routes', () => {
    const app = createTestApp();

    beforeEach(() => {
      // Mock das funções administrativas do controller
      mockPlaylistController.createPlaylist.mockImplementation((req, res) => {
        res.status(201).json({ id: 'new-playlist', ...req.body });
      });
      
      mockPlaylistController.updatePlaylist.mockImplementation((req, res) => {
        res.json({ id: req.params.id, ...req.body });
      });
      
      mockPlaylistController.deletePlaylist.mockImplementation((req, res) => {
        res.status(204).send();
      });
      
      mockPlaylistController.createTag.mockImplementation((req, res) => {
        res.status(201).json({ id: 'new-tag', ...req.body });
      });
      
      mockPlaylistController.updateTag.mockImplementation((req, res) => {
        res.json({ id: req.params.id, ...req.body });
      });
      
      mockPlaylistController.deleteTag.mockImplementation((req, res) => {
        res.status(204).send();
      });
    });

    describe('POST /api/admin/playlists', () => {
      it('should require authentication and admin role to create playlist', async () => {
        const playlistData = {
          name: 'New Playlist',
          cover: 'https://example.com/cover.jpg',
          link: 'https://example.com/playlist',
        };

        await request(app)
          .post('/api/admin/playlists')
          .send(playlistData)
          .expect(201);

        expect(mockRequireAuth).toHaveBeenCalled();
        expect(mockRequireAdmin).toHaveBeenCalled();
        expect(mockPlaylistController.createPlaylist).toHaveBeenCalled();
      });
    });

    describe('PUT /api/admin/playlists/:id', () => {
      it('should require authentication and admin role to update playlist', async () => {
        const playlistId = 'playlist-123';
        const updateData = {
          name: 'Updated Playlist',
          description: 'Updated description',
        };

        await request(app)
          .put(`/api/admin/playlists/${playlistId}`)
          .send(updateData)
          .expect(200);

        expect(mockRequireAuth).toHaveBeenCalled();
        expect(mockRequireAdmin).toHaveBeenCalled();
        expect(mockPlaylistController.updatePlaylist).toHaveBeenCalled();
      });
    });

    describe('DELETE /api/admin/playlists/:id', () => {
      it('should require authentication and admin role to delete playlist', async () => {
        const playlistId = 'playlist-123';

        await request(app)
          .delete(`/api/admin/playlists/${playlistId}`)
          .expect(204);

        expect(mockRequireAuth).toHaveBeenCalled();
        expect(mockRequireAdmin).toHaveBeenCalled();
        expect(mockPlaylistController.deletePlaylist).toHaveBeenCalled();
      });
    });

    describe('POST /api/admin/playlists/tags', () => {
      it('should require authentication and admin role to create tag', async () => {
        const tagData = {
          name: 'New Tag',
          color: '#FF0000',
        };

        await request(app)
          .post('/api/admin/playlists/tags')
          .send(tagData)
          .expect(201);

        expect(mockRequireAuth).toHaveBeenCalled();
        expect(mockRequireAdmin).toHaveBeenCalled();
        expect(mockPlaylistController.createTag).toHaveBeenCalled();
      });
    });

    describe('PUT /api/admin/playlists/tags/:id', () => {
      it('should require authentication and admin role to update tag', async () => {
        const tagId = 'tag-123';
        const updateData = {
          name: 'Updated Tag',
          color: '#00FF00',
        };

        await request(app)
          .put(`/api/admin/playlists/tags/${tagId}`)
          .send(updateData)
          .expect(200);

        expect(mockRequireAuth).toHaveBeenCalled();
        expect(mockRequireAdmin).toHaveBeenCalled();
        expect(mockPlaylistController.updateTag).toHaveBeenCalled();
      });
    });

    describe('DELETE /api/admin/playlists/tags/:id', () => {
      it('should require authentication and admin role to delete tag', async () => {
        const tagId = 'tag-123';

        await request(app)
          .delete(`/api/admin/playlists/tags/${tagId}`)
          .expect(204);

        expect(mockRequireAuth).toHaveBeenCalled();
        expect(mockRequireAdmin).toHaveBeenCalled();
        expect(mockPlaylistController.deleteTag).toHaveBeenCalled();
      });
    });

    describe('Authorization Middleware', () => {
      it('should block non-admin users', async () => {
        mockRequireAdmin.mockImplementation((req, res, next) => {
          res.status(403).json({ error: 'Forbidden: Admin access required' });
        });

        await request(app)
          .post('/api/admin/playlists')
          .send({ name: 'Test' })
          .expect(403);

        expect(mockPlaylistController.createPlaylist).not.toHaveBeenCalled();
      });

      it('should block unauthenticated requests to admin routes', async () => {
        mockRequireAuth.mockImplementation((req, res, next) => {
          res.status(401).json({ error: 'Unauthorized' });
        });

        await request(app)
          .post('/api/admin/playlists')
          .send({ name: 'Test' })
          .expect(401);

        expect(mockRequireAdmin).not.toHaveBeenCalled();
        expect(mockPlaylistController.createPlaylist).not.toHaveBeenCalled();
      });
    });
  });

  describe('Route Parameters Validation', () => {
    const app = createTestApp();

    it('should handle invalid playlist ID format', async () => {
      await request(app)
        .get('/api/playlists/invalid-id')
        .expect(200); // O controller deve lidar com a validação

      expect(mockPlaylistController.getPlaylistById).toHaveBeenCalled();
    });
  });

  describe('Content-Type Validation', () => {
    const app = createTestApp();

    it('should handle JSON content type for POST requests', async () => {
      const playlistData = {
        name: 'Test Playlist',
        cover: 'https://example.com/cover.jpg',
        link: 'https://example.com/playlist',
      };

      await request(app)
        .post('/api/admin/playlists')
        .set('Content-Type', 'application/json')
        .send(playlistData)
        .expect(201);

      expect(mockPlaylistController.createPlaylist).toHaveBeenCalled();
    });

    it('should handle malformed JSON', async () => {
      await request(app)
        .post('/api/admin/playlists')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });
  });
});