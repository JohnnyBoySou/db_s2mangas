import type { RequestHandler } from "express";
import * as playlistHandler from '@/handlers/playlists';

export const createPlaylist: RequestHandler = async (req, res) => {
  try {
    const playlist = await playlistHandler.createPlaylist(req.body);
    res.status(201).json(playlist);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getPlaylists: RequestHandler = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const take = Number(req.query.limit) || 10;
    
    const result = await playlistHandler.getPlaylists(page, take);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPlaylistById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const playlist = await playlistHandler.getPlaylistById(id);
    
    if (!playlist) {
      res.status(404).json({ error: 'Playlist não encontrada' });
      return;
    }
    
    res.json(playlist);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePlaylist: RequestHandler = async (req, res, ) => {
  try {
    const { id } = req.params;
    const playlist = await playlistHandler.updatePlaylist(id, req.body);
    res.json(playlist);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deletePlaylist: RequestHandler = async (req, res, ) => {
  try {
    const { id } = req.params;
    await playlistHandler.deletePlaylist(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}; 