import prisma from "@/prisma/client";
import { z } from "zod";
import { 
  createMangaListSchema,
  updateMangaListSchema,
  addMangaToListSchema,
  updateMangaListItemSchema,
  reorderMangaListItemsSchema,
  bulkAddToMangaListSchema,
  mangaListFiltersSchema
} from "../validators/MangalistValidators";

// Erros customizados
export class MangaListNotFoundError extends Error {
  constructor(message: string = "Lista de mangás não encontrada") {
    super(message);
    this.name = "MangaListNotFoundError";
  }
}

export class MangaNotFoundError extends Error {
  constructor(message: string = "Mangá não encontrado") {
    super(message);
    this.name = "MangaNotFoundError";
  }
}

export class MangaListItemNotFoundError extends Error {
  constructor(message: string = "Item da lista não encontrado") {
    super(message);
    this.name = "MangaListItemNotFoundError";
  }
}

export class MangaAlreadyInListError extends Error {
  constructor(message: string = "Mangá já está na lista") {
    super(message);
    this.name = "MangaAlreadyInListError";
  }
}

export class InvalidMangaListDataError extends Error {
  constructor(message: string = "Dados inválidos para lista de mangás") {
    super(message);
    this.name = "InvalidMangaListDataError";
  }
}

// Criar lista de mangás
export const createMangaList = async (data: z.infer<typeof createMangaListSchema>, userId?: string) => {
  const validatedData = createMangaListSchema.parse(data);
  
  const mangaList = await prisma.mangaList.create({
    data: {
      name: validatedData.name,
      cover: validatedData.cover,
      mood: validatedData.mood,
      description: validatedData.description,
      status: validatedData.status,
      isDefault: validatedData.isDefault,
      // userId será adicionado quando implementarmos a relação com usuário
    },
    include: {
      _count: {
        select: {
          items: true,
          likes: true
        }
      }
    }
  });

  // Adicionar mangás se fornecidos
  if (validatedData.mangaIds && validatedData.mangaIds.length > 0) {
    for (let i = 0; i < validatedData.mangaIds.length; i++) {
      const mangaId = validatedData.mangaIds[i];
      
      // Verificar se o mangá existe
      const manga = await prisma.manga.findUnique({
        where: { id: mangaId }
      });
      
      if (!manga) {
        throw new MangaNotFoundError(`Mangá com ID ${mangaId} não encontrado`);
      }
      
      await prisma.mangaListItem.create({
        data: {
          listId: mangaList.id,
          mangaId: mangaId,
          order: i
        }
      });
    }
  }

  return mangaList;
};

// Listar listas de mangás
export const getMangaLists = async (filters: z.infer<typeof mangaListFiltersSchema>) => {
  const validatedFilters = mangaListFiltersSchema.parse(filters);
  
  const {
    userId,
    status,
    mood,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
    page = 1,
    limit = 20,
  } = validatedFilters;

  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (userId) where.userId = userId;
  if (status) where.status = status;
  if (mood) where.mood = { contains: mood, mode: "insensitive" };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } }
    ];
  }

  const orderBy: any = {};
  if (sortBy === "likesCount") {
    orderBy.likes = { _count: sortOrder };
  } else {
    orderBy[sortBy] = sortOrder;
  }

  const [lists, total] = await Promise.all([
    prisma.mangaList.findMany({
      where,
      include: {
        _count: {
          select: {
            items: true,
            likes: true
          }
        }
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.mangaList.count({ where }),
  ]);

  return {
    lists,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page
  };
};

// Listar listas públicas
export const getPublicMangaLists = async (filters: z.infer<typeof mangaListFiltersSchema>) => {
  const publicFilters = { ...filters, status: "PUBLIC" as const };
  return await getMangaLists(publicFilters);
};

// Obter lista por ID
export const getMangaListById = async (id: string) => {
  const mangaList = await prisma.mangaList.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          manga: {
            include: {
              translations: {
                where: {
                  language: 'pt-BR' // ou outro idioma padrão
                },
                take: 1
              }
            }
          }
        },
        orderBy: {
          order: 'asc'
        }
      },
      _count: {
        select: {
          items: true,
          likes: true
        }
      }
    }
  });

  if (!mangaList) {
    throw new MangaListNotFoundError();
  }

  // Transformar os dados para incluir o nome do mangá
  const transformedList = {
    ...mangaList,
    items: mangaList.items.map(item => ({
      ...item,
      manga: {
        ...item.manga,
        title: item.manga.translations[0]?.name || 'Sem título'
      }
    }))
  };

  return transformedList;
};

// Atualizar lista de mangás
export const updateMangaList = async (id: string, data: z.infer<typeof updateMangaListSchema>) => {
  const validatedData = updateMangaListSchema.parse(data);
  
  const existingList = await prisma.mangaList.findUnique({
    where: { id }
  });

  if (!existingList) {
    throw new MangaListNotFoundError();
  }

  const updatedList = await prisma.mangaList.update({
    where: { id },
    data: validatedData,
    include: {
      _count: {
        select: {
          items: true,
          likes: true
        }
      }
    }
  });

  return updatedList;
};

// Deletar lista de mangás
export const deleteMangaList = async (id: string) => {
  const existingList = await prisma.mangaList.findUnique({
    where: { id }
  });

  if (!existingList) {
    throw new MangaListNotFoundError();
  }

  await prisma.mangaList.delete({
    where: { id }
  });

  return { message: "Lista deletada com sucesso" };
};

// Adicionar mangá à lista
export const addMangaToList = async (listId: string, data: z.infer<typeof addMangaToListSchema>) => {
  const validatedData = addMangaToListSchema.parse(data);
  
  const list = await prisma.mangaList.findUnique({
    where: { id: listId }
  });

  if (!list) {
    throw new MangaListNotFoundError();
  }

  const manga = await prisma.manga.findUnique({
    where: { id: validatedData.mangaId }
  });

  if (!manga) {
    throw new MangaNotFoundError();
  }

  // Verificar se o mangá já está na lista
  const existingItem = await prisma.mangaListItem.findFirst({
    where: {
      listId: listId,
      mangaId: validatedData.mangaId
    }
  });

  if (existingItem) {
    throw new MangaAlreadyInListError();
  }

  // Obter a maior ordem atual
  const maxOrder = await prisma.mangaListItem.findFirst({
    where: { listId: listId },
    orderBy: { order: 'desc' },
    select: { order: true }
  });

  const newOrder = validatedData.order ?? (maxOrder?.order ?? -1) + 1;

  const item = await prisma.mangaListItem.create({
    data: {
      listId: listId,
      mangaId: validatedData.mangaId,
      order: newOrder,
      note: validatedData.note
    },
    include: {
      manga: {
        include: {
          translations: {
            where: {
              language: 'pt-BR'
            },
            take: 1
          }
        }
      }
    }
  });

  // Transformar para incluir o título
  return {
    ...item,
    manga: {
      ...item.manga,
      title: item.manga.translations[0]?.name || 'Sem título'
    }
  };
};

// Remover mangá da lista
export const removeMangaFromList = async (listId: string, itemId: string) => {
  const list = await prisma.mangaList.findUnique({
    where: { id: listId }
  });

  if (!list) {
    throw new MangaListNotFoundError();
  }

  const item = await prisma.mangaListItem.findUnique({
    where: { id: itemId }
  });

  if (!item || item.listId !== listId) {
    throw new MangaListItemNotFoundError();
  }

  await prisma.mangaListItem.delete({
    where: { id: itemId }
  });

  return { message: "Mangá removido da lista com sucesso" };
};

// Atualizar item da lista
export const updateMangaListItem = async (
  listId: string, 
  itemId: string, 
  data: z.infer<typeof updateMangaListItemSchema>
) => {
  const validatedData = updateMangaListItemSchema.parse(data);
  
  const list = await prisma.mangaList.findUnique({
    where: { id: listId }
  });

  if (!list) {
    throw new MangaListNotFoundError();
  }

  const item = await prisma.mangaListItem.findUnique({
    where: { id: itemId }
  });

  if (!item || item.listId !== listId) {
    throw new MangaListItemNotFoundError();
  }

  const updatedItem = await prisma.mangaListItem.update({
    where: { id: itemId },
    data: validatedData,
    include: {
      manga: {
        include: {
          translations: {
            where: {
              language: 'pt-BR'
            },
            take: 1
          }
        }
      }
    }
  });

  // Transformar para incluir o título
  return {
    ...updatedItem,
    manga: {
      ...updatedItem.manga,
      title: updatedItem.manga.translations[0]?.name || 'Sem título'
    }
  };
};

// Reordenar itens da lista
export const reorderMangaListItems = async (
  listId: string, 
  data: z.infer<typeof reorderMangaListItemsSchema>
) => {
  const validatedData = reorderMangaListItemsSchema.parse(data);
  
  const list = await prisma.mangaList.findUnique({
    where: { id: listId }
  });

  if (!list) {
    throw new MangaListNotFoundError();
  }

  // Verificar se todos os itens pertencem à lista
  const itemIds = validatedData.items.map((item: { id: string; order: number }) => item.id);
  const existingItems = await prisma.mangaListItem.findMany({
    where: {
      id: { in: itemIds },
      listId: listId
    }
  });

  if (existingItems.length !== itemIds.length) {
    throw new InvalidMangaListDataError("Alguns itens não pertencem à lista");
  }

  // Atualizar a ordem dos itens
  for (const item of validatedData.items) {
    await prisma.mangaListItem.update({
      where: { id: item.id },
      data: { order: item.order }
    });
  }

  return { message: "Itens reordenados com sucesso" };
};

// Adicionar múltiplos mangás à lista
export const bulkAddMangasToList = async (
  listId: string, 
  data: z.infer<typeof bulkAddToMangaListSchema>
) => {
  const validatedData = bulkAddToMangaListSchema.parse(data);
  
  const list = await prisma.mangaList.findUnique({
    where: { id: listId }
  });

  if (!list) {
    throw new MangaListNotFoundError();
  }

  let added = 0;
  let skipped = 0;

  // Obter a maior ordem atual
  const maxOrder = await prisma.mangaListItem.findFirst({
    where: { listId: listId },
    orderBy: { order: 'desc' },
    select: { order: true }
  });

  let currentOrder = (maxOrder?.order ?? -1) + 1;

  for (const mangaId of validatedData.mangaIds) {
    // Verificar se o mangá existe
    const manga = await prisma.manga.findUnique({
      where: { id: mangaId }
    });

    if (!manga) {
      skipped++;
      continue;
    }

    // Verificar se já está na lista
    const existingItem = await prisma.mangaListItem.findFirst({
      where: {
        listId: listId,
        mangaId: mangaId
      }
    });

    if (existingItem) {
      skipped++;
      continue;
    }

    // Adicionar à lista
    await prisma.mangaListItem.create({
      data: {
        listId: listId,
        mangaId: mangaId,
        order: currentOrder++,
        note: validatedData.notes?.[mangaId]
      }
    });

    added++;
  }

  return { added, skipped };
};

// Obter estatísticas da lista
export const getMangaListStats = async (id: string) => {
  const list = await prisma.mangaList.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          items: true,
          likes: true
        }
      }
    }
  });

  if (!list) {
    throw new MangaListNotFoundError();
  }

  // Estatísticas dos mangás na lista
  const mangaStats = await prisma.mangaListItem.groupBy({
    by: ['mangaId'],
    where: { listId: id },
    _count: true
  });

  return {
    totalItems: list._count.items,
    totalLikes: list._count.likes,
    uniqueMangas: mangaStats.length,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt
  };
};

// Obter listas por mood
export const getMangaListsByMood = async (mood: string, filters: z.infer<typeof mangaListFiltersSchema>) => {
  const moodFilters = { ...filters, mood };
  return await getMangaLists(moodFilters);
};

// Processar paginação dos query params
export const processPaginationFromQuery = (query: any) => {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  
  return {
    page,
    limit,
    filters: {
      ...query,
      page,
      limit
    }
  };
}; 