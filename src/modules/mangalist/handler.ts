import prisma from "@/prisma/client";
import { z } from "zod";
import { MangaListResponse, MangaListFilters } from "@/interfaces/mangaList";

const mangaListCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]).default("PUBLIC"),
  mood: z.string().optional(),
  mangaIds: z.array(z.string()).optional(),
});

const bulkAddSchema = z.object({
  mangaIds: z.array(z.string()),
  notes: z.record(z.string()).optional(),
});

const mangaListUpdateSchema = mangaListCreateSchema
  .partial()
  .omit({ mangaIds: true });

const mangaListItemCreateSchema = z.object({
  mangaId: z.string(),
  order: z.number().optional(),
  note: z.string().optional(),
});

const mangaListItemUpdateSchema = z.object({
  order: z.number().optional(),
  note: z.string().optional(),
});

const reorderItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
    })
  ),
});

export const createMangaList = async (data: {
  name: string;
  status: "PUBLIC" | "PRIVATE" | "UNLISTED";
  description?: string | undefined;
  cover?: string | undefined;
  mood?: string | undefined;
  mangaIds?: string[] | undefined;
}) => {
 return await prisma.mangaList.create({
    data: {
      cover: data?.cover ?? "",
      name: data.name ?? "Sem nome",
      description: data.description,
      mood: data.mood ?? "Sem mood",
      status: data.status,
    },
  });
};

export const getMangaLists = async (filters: MangaListFilters) => {
  const {
    mood,
    sortBy = "createdAt",
    sortOrder = "desc",
    page = 1,
    limit = 20,
  } = filters;

  const skip = (page - 1) * limit;

  const where: any = {
    ...(mood && { mood: { contains: mood, mode: "insensitive" } }),
  };

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
            items: true
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.mangaList.count({ where }),
  ]);

  const formattedLists = lists.map((list) => ({
    ...list,
    itemCount: list._count.items
  }));

  return {
    datsa: formattedLists,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getMangaListById = async (
  id: string
) => {
  const list = await prisma.mangaList.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          manga: {
            select: {
              id: true,
              cover: true,
              manga_uuid: true,
              translations: {
                select: {
                  language: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!list) return null;

  return {
    ...list,
    itemCount: list.items.length,
  };
};

export const updateMangaList = async (
  id: string,
  data: any,
) => {
  const validatedData = mangaListUpdateSchema.parse(data);
  const existingList = await prisma.mangaList.findFirst({
    where: { id },
  });

  if (!existingList) return null;

  const result = await prisma.mangaList.update({
    where: { id },
    data: validatedData,
    include: {
      _count: {
        select: {
          items: true,
          likes: true,
        },
      },
    },
  });

  return {
    ...result,
    itemCount: result._count.items,
    likesCount: result._count.likes,
  };
};

export const deleteMangaList = async (id: string): Promise<boolean> => {
  const result = await prisma.mangaList.deleteMany({
    where: { id },
  });

  return result.count > 0;
};

export const addMangaToList = async (
  listId: string,
  data: z.infer<typeof mangaListItemCreateSchema>
): Promise<boolean> => {
  const validatedData = mangaListItemCreateSchema.parse(data);
  const list = await prisma.mangaList.findFirst({
    where: { id: listId },
  });

  if (!list) return false;

  // Verificar se o manga existe
  const manga = await prisma.manga.findUnique({
    where: { id: data.mangaId },
  });

  if (!manga) return false;

  // Se order não foi fornecido, usar o próximo disponível
  let order = validatedData.order;
  if (order === undefined) {
    const lastItem = await prisma.mangaListItem.findFirst({
      where: { listId },
      orderBy: { order: "desc" },
    });
    order = lastItem ? lastItem.order + 1 : 0;
  }

  try {
    await prisma.mangaListItem.create({
      data: {
        listId,
        mangaId: validatedData.mangaId,
        order,
        note: validatedData.note,
      },
    });
    return true;
  } catch (error) {
    // Manga já está na lista
    return false;
  }
};

export const removeMangaFromList = async (
  listId: string,
  itemId: string
): Promise<boolean> => {
  const list = await prisma.mangaList.findFirst({
    where: { id: listId },
  });

  if (!list) return false;

  const result = await prisma.mangaListItem.deleteMany({
    where: { id: itemId, listId },
  });

  return result.count > 0;
};

export const updateMangaListItem = async (
  listId: string,
  itemId: string,
  data: z.infer<typeof mangaListItemUpdateSchema>
): Promise<boolean> => {
  const validatedData = mangaListItemUpdateSchema.parse(data);
  const list = await prisma.mangaList.findFirst({
    where: { id: listId },
  });

  if (!list) return false;

  const result = await prisma.mangaListItem.updateMany({
    where: { id: itemId, listId },
    data: validatedData,
  });

  return result.count > 0;
};

export const reorderMangaListItems = async (
  listId: string,
  data: z.infer<typeof reorderItemsSchema>
): Promise<boolean> => {
  const validatedData = reorderItemsSchema.parse(data);
  const list = await prisma.mangaList.findFirst({
    where: { id: listId }, // Only admin lists
  });

  if (!list) return false;

  await prisma.$transaction(async (tx) => {
    for (const item of validatedData.items) {
      await tx.mangaListItem.updateMany({
        where: { id: item.id, listId },
        data: { order: item.order },
      });
    }
  });

  return true;
};

export const bulkAddToMangaList = async (
  listId: string,
  data: z.infer<typeof bulkAddSchema>
): Promise<{ added: number; skipped: number }> => {
  const validatedData = bulkAddSchema.parse(data);
  const list = await prisma.mangaList.findFirst({
    where: { id: listId }, // Only admin lists
  });

  if (!list) throw new Error("Lista não encontrada");

  // Verificar quais mangás existem
  const existingMangas = await prisma.manga.findMany({
    where: { id: { in: validatedData.mangaIds } },
    select: { id: true },
  });

  const existingMangaIds = existingMangas.map((m) => m.id);

  // Verificar quais já estão na lista
  const existingItems = await prisma.mangaListItem.findMany({
    where: {
      listId,
      mangaId: { in: existingMangaIds },
    },
    select: { mangaId: true },
  });

  const existingItemMangaIds = existingItems.map((item) => item.mangaId);
  const mangasToAdd = existingMangaIds.filter(
    (id) => !existingItemMangaIds.includes(id)
  );

  if (mangasToAdd.length === 0) {
    return { added: 0, skipped: validatedData.mangaIds.length };
  }

  // Obter o próximo order disponível
  const lastItem = await prisma.mangaListItem.findFirst({
    where: { listId },
    orderBy: { order: "desc" },
  });

  const startOrder = lastItem ? lastItem.order + 1 : 0;

  const itemsToCreate = mangasToAdd.map((mangaId, index) => ({
    listId,
    mangaId,
    order: startOrder + index,
    note: validatedData.notes?.[mangaId],
  }));

  await prisma.mangaListItem.createMany({
    data: itemsToCreate,
  });

  return {
    added: mangasToAdd.length,
    skipped: validatedData.mangaIds.length - mangasToAdd.length,
  };
};
