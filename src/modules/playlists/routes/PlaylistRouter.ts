import { Router } from 'express';
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
  getPlaylistsByTags
} from '../controllers/PlaylistController';
import { requireAuth, requireAdmin } from '@/middlewares/auth';

const PlaylistRouter = Router();
const AdminPlaylistRouter = Router();

// Rotas públicas (com autenticação)
PlaylistRouter.get('/', requireAuth, getPlaylists);
PlaylistRouter.get('/by-tags', requireAuth, getPlaylistsByTags);

// Rotas de tags (públicas para leitura)
PlaylistRouter.get('/tags/all', requireAuth, getAllTags);
PlaylistRouter.get('/:id', requireAuth, getPlaylistById);

// Rotas administrativas para playlists
AdminPlaylistRouter.post('/', requireAuth, requireAdmin, createPlaylist);
AdminPlaylistRouter.put('/:id', requireAuth, requireAdmin, updatePlaylist);
AdminPlaylistRouter.delete('/:id', requireAuth, requireAdmin, deletePlaylist);

// Rotas administrativas para tags
AdminPlaylistRouter.post('/tags', requireAuth, requireAdmin, createTag);
AdminPlaylistRouter.put('/tags/:id', requireAuth, requireAdmin, updateTag);
AdminPlaylistRouter.delete('/tags/:id', requireAuth, requireAdmin, deleteTag);

export { PlaylistRouter, AdminPlaylistRouter};