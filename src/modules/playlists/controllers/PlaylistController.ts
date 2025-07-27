import type { RequestHandler } from "express";
import * as playlistHandler from "../handlers/PlaylistHandler";

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
    const tagId = req.query.tagId as string;

    const result = await playlistHandler.getPlaylists(page, take, tagId);
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
      res.status(404).json({ error: "Playlist não encontrada" });
      return;
    }

    res.json(playlist);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePlaylist: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const playlist = await playlistHandler.updatePlaylist(id, req.body);
    res.json(playlist);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deletePlaylist: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await playlistHandler.deletePlaylist(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Controllers para tags
export const getAllTags: RequestHandler = async (req, res) => {
  try {
    const tags = await playlistHandler.getAllTags();
    res.status(200).json({ data: tags });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createTag: RequestHandler = async (req, res) => {
  try {
    const tag = await playlistHandler.createTag(req.body);
    res.status(201).json(tag);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateTag: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await playlistHandler.updateTag(id, req.body);
    res.json(tag);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTag: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await playlistHandler.deleteTag(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPlaylistsByTags: RequestHandler = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const take = Number(req.query.limit) || 10;
    const tagIds = req.query.tagIds as string;

    console.log(tagIds)
    if (!tagIds) {
      res.status(400).json({ error: "IDs das tags são obrigatórios" });
      return;
    }

    const tagIdsArray = tagIds.split(",").map((id) => id.trim());
    const result = await playlistHandler.getPlaylistsByTags(
      tagIdsArray,
      page,
      take
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
