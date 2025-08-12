import prisma from '@/prisma/client';
import { z } from 'zod';

const playlistSchema = z.object({
  name: z.string().min(1),
  cover: z.string().url(),
  link: z.string().url(),
  description: z.string().optional(),
});

export const createPlaylist = async (data: z.infer<typeof playlistSchema>) => {
  const validatedData = playlistSchema.parse(data);
  return prisma.playlist.create({
    data: validatedData,
  });
};

export const getPlaylists = async (page: number = 1, take: number = 10) => {
  const skip = (page - 1) * take;

  const [playlists, total] = await Promise.all([
    prisma.playlist.findMany({
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.playlist.count()
  ]);

  const totalPages = Math.ceil(total / take);

  return {
    data: playlists,
    pagination: {
      total,
      page,
      limit: take,
      totalPages,
      next: page < totalPages,
      prev: page > 1,
    },
  };
};

export const getPlaylistById = async (id: string) => {
  return prisma.playlist.findUnique({
    where: { id },
  });
};

export const updatePlaylist = async (id: string, data: Partial<z.infer<typeof playlistSchema>>) => {
  const validatedData = playlistSchema.partial().parse(data);
  return prisma.playlist.update({
    where: { id },
    data: validatedData,
  });
};

export const deletePlaylist = async (id: string) => {
  return prisma.playlist.delete({
    where: { id },
  });
};