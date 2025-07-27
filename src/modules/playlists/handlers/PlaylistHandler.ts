import prisma from '@/prisma/client';
import { z } from 'zod';
import { playlistSchema, tagSchema } from '../valitators/playlistSchema';

export const createPlaylist = async (data: z.infer<typeof playlistSchema>) => {
  const validatedData = playlistSchema.parse(data);
  const { tags, ...playlistData } = validatedData;

  return await prisma.$transaction(async (tx) => {
    // Criar a playlist
    const playlist = await tx.playlist.create({
      data: playlistData,
    });

    // Se houver tags, processar elas
    if (tags && tags.length > 0) {
      for (const tagId of tags) {
        // Verificar se a tag existe
        const tag = await tx.tag.findUnique({
          where: { id: tagId }
        });

        if (tag) {
          // Associar a tag à playlist
          await tx.playlistTag.create({
            data: {
              playlistId: playlist.id,
              tagId: tag.id
            }
          });
        }
      }
    }

    // Retornar a playlist criada com as tags
    return await tx.playlist.findUnique({
      where: { id: playlist.id },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });
  });
};

export const getPlaylists = async (page: number = 1, take: number = 10, tagId?: string) => {
  const skip = (page - 1) * take;

  const whereClause = tagId ? {
    tags: {
      some: {
        tagId: tagId
      }
    }
  } : {};

  const [playlists, total] = await Promise.all([
    prisma.playlist.findMany({
      skip,
      take,
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    }),
    prisma.playlist.count({
      where: whereClause
    })
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
    include: {
      tags: {
        include: {
          tag: true
        }
      }
    }
  });
};

export const updatePlaylist = async (id: string, data: Partial<z.infer<typeof playlistSchema>>) => {
  const validatedData = playlistSchema.partial().parse(data);
  const { tags, ...playlistData } = validatedData;

  return await prisma.$transaction(async (tx) => {
    // Atualizar dados básicos da playlist
    await tx.playlist.update({
      where: { id },
      data: playlistData,
    });

    // Se tags foram fornecidas, atualizar as associações
    if (tags !== undefined) {
      // Remover todas as tags existentes
      await tx.playlistTag.deleteMany({
        where: { playlistId: id }
      });

      // Adicionar as novas tags
      if (tags.length > 0) {
        for (const tagId of tags) {
          // Verificar se a tag existe
          const tag = await tx.tag.findUnique({
            where: { id: tagId }
          });

          if (tag) {
            // Associar a tag à playlist
            await tx.playlistTag.create({
              data: {
                playlistId: id,
                tagId: tag.id
              }
            });
          }
        }
      }
    }

    // Retornar a playlist atualizada com as tags
    return await tx.playlist.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });
  });
};

export const deletePlaylist = async (id: string) => {
  return prisma.playlist.delete({
    where: { id },
  });
};

// Funções específicas para tags
export const getAllTags = async () => {
  return prisma.tag.findMany({
    orderBy: {
      name: 'asc'
    },
    include: {
      _count: {
        select: {
          playlists: true
        }
      }
    }
  });
};

export const createTag = async (data: z.infer<typeof tagSchema>) => {
  const validatedData = tagSchema.parse(data);
  return prisma.tag.create({
    data: {
      ...validatedData,
      name: validatedData.name.toLowerCase()
    }
  });
};

export const updateTag = async (id: string, data: Partial<z.infer<typeof tagSchema>>) => {
  const validatedData = tagSchema.partial().parse(data);
  return prisma.tag.update({
    where: { id },
    data: {
      ...validatedData,
      name: validatedData.name ? validatedData.name.toLowerCase() : undefined
    }
  });
};

export const deleteTag = async (id: string) => {
  return prisma.tag.delete({
    where: { id },
  });
};

export const getPlaylistsByTags = async (tagIds: string[], page: number = 1, take: number = 10) => {
  const skip = (page - 1) * take;
  
  const [playlists, total] = await Promise.all([
    prisma.playlist.findMany({
      skip,
      take,
      where: {
        tags: {
          some: {
            tagId: {
              in: tagIds
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    }),
    prisma.playlist.count({
      where: {
        tags: {
          some: {
            tagId: {
              in: tagIds
            }
          }
        }
      }
    })
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