import { Router } from 'express';
import { createPlaylist, getPlaylists, getPlaylistById, updatePlaylist, deletePlaylist } from '@/controllers/playlists';
import { requireAuth, requireAdmin } from '@/middlewares/auth';

const PlaylistRouter = Router();
const AdminPlaylistRouter = Router();

PlaylistRouter.get('/', requireAuth, getPlaylists);
PlaylistRouter.get('/:id', requireAuth, getPlaylistById);

AdminPlaylistRouter.post('/', requireAuth, requireAdmin, createPlaylist);
AdminPlaylistRouter.put('/:id', requireAuth, requireAdmin, updatePlaylist);
AdminPlaylistRouter.delete('/:id', requireAuth, requireAdmin, deletePlaylist);

export { PlaylistRouter, AdminPlaylistRouter}; 