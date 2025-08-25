import prisma from "@/prisma/client";
import { createMangaSchema, updateMangaSchema, patchMangaSchema } from "../validators/MangaValidator";
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const getTranslatedManga = (manga: any, language: string) => {
  const translation = manga.translations.find((t: any) => t.language === language);
  if (translation) {
    return {
      ...manga,
      title: translation.name,
      description: translation.description,
    };
  }
  // Se não encontrar a tradução, retorna a versão em inglês ou a primeira disponível
  const defaultTranslation = manga.translations.find((t: any) => t.language === 'en') ?? manga.translations[0];
  return {
    ...manga,
    title: defaultTranslation?.name ?? manga.title,
    description: defaultTranslation?.description ?? manga.description,
  };
};

export const createManga = async (data: any) => {
    const validatedData = createMangaSchema.parse(data);
    const manga = await prisma.manga.create({
        data: {
            cover: validatedData.cover,
            status: validatedData.status,
            type: validatedData.type,
            releaseDate: validatedData.releaseDate,
            manga_uuid: validatedData.manga_uuid,

            languages: {
                connect: validatedData.languageIds.map(id => ({ id })),
            },
            categories: {
                connect: validatedData.categoryIds?.map(id => ({ id })) ?? [],
            },
            translations: {
                create: validatedData.translations.map((t) => ({
                    language: t.language,
                    name: t.name,
                    description: t.description,
                })),
            },
        },
        include: {
            categories: true,
            translations: true,
            languages: true,
        },
    });
    return manga;
};

export const listMangas = async (language: string, page: number = 1, limit: number = 10) => {
    const total = await prisma.manga.count();
    const totalPages = Math.ceil(total / limit);
    
    if (page > totalPages && totalPages > 0) {
        throw new Error(`Página ${page} não existe. Total de páginas: ${totalPages}`);
    }
    
    if (total === 0) {
        return {
            data: [],
            pagination: {
                total: 0,
                page: 1,
                limit,
                totalPages: 0,
                next: false,
                prev: false,
            },
        };
    }
    
    const adjustedPage = Math.min(page, totalPages);
    const skip = (adjustedPage - 1) * limit;

    
    const mangas = await prisma.manga.findMany({
        include: {
            categories: true,
            translations: true,
            languages: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
    });

    return {
        data: mangas.map(manga => getTranslatedManga(manga, language)),
        pagination: {
            total,
            page: adjustedPage,
            limit,
            totalPages,
            next: adjustedPage < totalPages,
            prev: adjustedPage > 1,
        },
    };
};

export const getMangaById = async (id: string, language: string, userId?: string) => {
    const [manga, coversResponse] = await Promise.all([
        prisma.manga.findUnique({
            where: { id },
            include: {
                categories: true,
                languages: true,
                chapters: {
                    include: {
                        language: true
                    }
                },
                likes: true,
            },
        }),
        prisma.manga.findUnique({
            where: { id },
            select: { manga_uuid: true }
        }).then(async (manga) => {
            if (!manga?.manga_uuid) return { data: { data: [] } };
            try {
                return await axios.get('https://api.mangadex.org/cover', {
                    params: {
                        manga: [manga.manga_uuid]
                    }
                });
            } catch {
                return { data: { data: [] } };
            }
        })
    ]);

    if (!manga) {
        throw new Error("Mangá não encontrado");
    }

    // Registrar a view se houver um usuário autenticado
    if (userId) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const existingView = await prisma.view.findFirst({
                where: {
                    userId,
                    mangaId: id,
                    createdAt: {
                        gte: today
                    }
                }
            });

            if (!existingView) {
                await prisma.view.create({
                    data: {
                        userId,
                        mangaId: id
                    }
                });
            }
        } catch (error) {
            console.error('Erro ao registrar view:', error);
        }
    }

    const totalViews = await prisma.view.count({
        where: { mangaId: id }
    });

    const translation = await prisma.mangaTranslation.findFirst({
        where: {
            mangaId: id,
            language: language
        }
    });

    const translatedManga = {
        ...manga,
        title: translation?.name ?? '',
        description: translation?.description ?? '',
        language: language,
        views: totalViews
    };

    const covers = formatCoverData(coversResponse.data.data, manga.manga_uuid ?? '');

    return {
        ...translatedManga,
        covers
    };
};

export const updateManga = async (id: string, data: any) => {
    const validatedData = updateMangaSchema.parse(data);
    const existing = await prisma.manga.findUnique({ where: { id } });
    if (!existing) {
        throw new Error("Mangá não encontrado");
    }

    const updated = await prisma.manga.update({
        where: { id },
        data: {
            cover: validatedData.cover,
            status: validatedData.status,
            type: validatedData.type,
            releaseDate: validatedData.releaseDate,

            languages: {
                set: validatedData.languageIds.map(id => ({ id })),
            },
            categories: {
                set: validatedData.categoryIds?.map(id => ({ id })) ?? [],
            },

            translations: {
                deleteMany: {},
                create: validatedData.translations.map(t => ({
                    language: t.language,
                    name: t.name,
                    description: t.description,
                })),
            },
        },
        include: {
            categories: true,
            translations: true,
            languages: true,
        },
    });

    return updated;
};

export const patchManga = async (id: string, data: any) => {
    const validatedData = patchMangaSchema.parse(data);
    const existing = await prisma.manga.findUnique({ 
        where: { id },
        include: {
            categories: true,
            translations: true,
            languages: true,
        }
    });
    
    if (!existing) {
        throw new Error("Mangá não encontrado");
    }

    // Preparar dados para atualização apenas dos campos fornecidos
    const updateData: any = {};

    // Campos simples
    if (validatedData.cover !== undefined) updateData.cover = validatedData.cover;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.releaseDate !== undefined) updateData.releaseDate = validatedData.releaseDate;

    // Relacionamentos
    if (validatedData.languageIds !== undefined) {
        updateData.languages = {
            set: validatedData.languageIds.map(id => ({ id })),
        };
    }

    if (validatedData.categoryIds !== undefined) {
        updateData.categories = {
            set: validatedData.categoryIds.map(id => ({ id })),
        };
    }

    // Traduções - se fornecidas, substitui todas
    if (validatedData.translations !== undefined) {
        updateData.translations = {
            deleteMany: {},
            create: validatedData.translations.map(t => ({
                language: t.language,
                name: t.name,
                description: t.description,
            })),
        };
    }

    const updated = await prisma.manga.update({
        where: { id },
        data: updateData,
        include: {
            categories: true,
            translations: true,
            languages: true,
        },
    });

    return updated;
};

export const deleteManga = async (id: string) => {
    const existing = await prisma.manga.findUnique({ where: { id } });
    if (!existing) {
        throw new Error("Mangá não encontrado");
    }

    await prisma.manga.delete({ where: { id } });
    return { message: "Mangá deletado com sucesso" };
};

export const getMangaByCategory = async (category: string, page: number, limit: number) => {
    // Primeiro, vamos contar o total para validar a página
    const total = await prisma.manga.count({
        where: {
            categories: {
                some: {
                    name: {
                        equals: category,
                        mode: 'insensitive',
                    },
                },
            },
        },
    });
    
    const totalPages = Math.ceil(total / limit);
    
    // Validar se a página solicitada é válida
    if (page > totalPages && totalPages > 0) {
        throw new Error(`Página ${page} não existe. Total de páginas: ${totalPages}`);
    }
    
    // Se não há dados, retornar página 1
    if (total === 0) {
        return {
            data: [],
            pagination: {
                total: 0,
                page: 1,
                limit,
                totalPages: 0,
                next: false,
                prev: false,
            },
        };
    }
    
    // Ajustar página para o máximo se exceder o total
    const adjustedPage = Math.min(page, totalPages);
    const skip = (adjustedPage - 1) * limit;

    const mangas = await prisma.manga.findMany({
        where: {
            categories: {
                some: {
                    name: {
                        equals: category,
                        mode: 'insensitive',
                    },
                },
            },
        },
        skip,
        take: limit,
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            translations: true,
            categories: true,
            _count: {
                select: {
                    likes: true,
                    views: true,
                },
            },
        },
    });

    return {
        data: mangas,
        pagination: {
            total,
            page: adjustedPage,
            limit,
            totalPages,
            next: adjustedPage < totalPages,
            prev: adjustedPage > 1,
        },
    };
};

interface CoverData {
    img: string;
    volume: string | null;
    id: string;
}

const formatCoverData = (covers: any[], mangaId: string): CoverData[] => {
    return covers.map(cover => ({
        img: `https://uploads.mangadex.org/covers/${mangaId}/${cover.attributes.fileName}`,
        volume: cover.attributes.volume,
        id: cover.id
    }));
};

export const getMangaCovers = async (id: string) => {
    const manga = await prisma.manga.findUnique({
        where: { id },
        select: { manga_uuid: true }
    });

    if (!manga?.manga_uuid) {
        throw new Error('UUID do mangá não encontrado');
    }

    const response = await axios.get('https://api.mangadex.org/cover', {
        params: {
            manga: [manga.manga_uuid]
        }
    });

    return formatCoverData(response.data.data, manga.manga_uuid);
};

export const importMangaFromMangaDex = async (mangaId: string) => {
    const response = await axios.get(`https://api.mangadex.org/manga/${mangaId}`);
    const mangaData = response.data.data;

    const manga = await prisma.manga.create({
        data: {
            manga_uuid: mangaId,
            cover: mangaData.attributes.coverArt?.fileName 
                ? `https://uploads.mangadex.org/covers/${mangaId}/${mangaData.attributes.coverArt.fileName}`
                : '',
            status: mangaData.attributes.status,
            type: mangaData.attributes.type,
            releaseDate: mangaData.attributes.year ? new Date(mangaData.attributes.year) : null,
            translations: {
                create: Object.entries(mangaData.attributes.title).map(([lang, title]) => ({
                    language: lang,
                    name: title as string,
                    description: mangaData.attributes.description[lang] ?? null,
                })),
            },
            languages: {
                connect: mangaData.attributes.availableTranslatedLanguages.map((lang: string) => ({
                    code: lang,
                })),
            },
            categories: {
                connect: mangaData.relationships
                    .filter((rel: any) => rel.type === 'tag')
                    .map((tag: any) => ({
                        id: tag.id,
                    })),
            },
        },
        include: {
            translations: true,
            languages: true,
            categories: true,
        },
    });

    return manga;
};

interface MySQLMangaData {
    id: string;
    uuid: string;
    name: string;
    capa: string;
    description: string;
    release_date: string;
    status: string;
    type: string;
    year: string;
    categories: string;
    languages: string;
    likes_count: string;
    views_count: string;
    total_rate: string;
}

interface LanguageData {
    id: string;
    name: string;
}

export const importMangaFromJSON = async (mangaData: MySQLMangaData) => {
    const categories = JSON.parse(mangaData.categories);
    const languages = JSON.parse(mangaData.languages);

    const categoryConnections = await Promise.all(
        categories.map(async (categoryName: string) => {
            try {
                const existingCategory = await prisma.category.findUnique({
                    where: { name: categoryName }
                });

                if (existingCategory) {
                    return { id: existingCategory.id };
                }

                const newCategory = await prisma.category.create({
                    data: { name: categoryName }
                });

                return { id: newCategory.id };
            } catch (error) {
                const category = await prisma.category.findUnique({
                    where: { name: categoryName }
                });
                if (category) {
                    return { id: category.id };
                }
                throw error;
            }
        })
    );

    const languageConnections = await Promise.all(
        languages.map(async (lang: LanguageData) => {
            try {
                const existingLanguage = await prisma.language.findUnique({
                    where: { code: lang.id }
                });

                if (existingLanguage) {
                    return { id: existingLanguage.id };
                }

                const newLanguage = await prisma.language.create({
                    data: { 
                        code: lang.id,
                        name: lang.name
                    }
                });

                return { id: newLanguage.id };
            } catch (error) {
                const language = await prisma.language.findUnique({
                    where: { code: lang.id }
                });
                if (language) {
                    return { id: language.id };
                }
                throw error;
            }
        })
    );

    const manga = await prisma.manga.create({
        data: {
            manga_uuid: mangaData.uuid,
            cover: mangaData.capa,
            status: mangaData.status ?? undefined,
            type: mangaData.type ?? undefined,
            releaseDate: mangaData.year ? new Date(mangaData.year) : undefined,
            translations: {
                create: [{
                    language: 'pt-br',
                    name: mangaData.name,
                    description: mangaData.description
                }]
            },
            categories: {
                connect: categoryConnections
            },
            languages: {
                connect: languageConnections
            }
        },
        include: {
            translations: true,
            categories: true,
            languages: true
        }
    });

    return manga;
};

export const importMangaFromFile = async (filename: string) => {
    const filePath = path.join(process.cwd(), 'src', 'import', filename);

    try {
        await fs.access(filePath);
    } catch (error) {
        console.log(error)
        throw new Error('Arquivo não encontrado');
    }

    const fileContent = await fs.readFile(filePath, 'utf-8');
    const mangasData: MySQLMangaData[] = JSON.parse(fileContent);

    const results = {
        total: mangasData.length,
        success: 0,
        errors: [] as string[],
        imported: [] as any[]
    };

    for (const mangaData of mangasData) {
        try {
            const categories = JSON.parse(mangaData.categories);
            const languages: LanguageData[] = JSON.parse(mangaData.languages);
            const descriptions = JSON.parse(mangaData.description);

            const categoryConnections = await Promise.all(
                categories.map(async (categoryName: string) => {
                    try {
                        const existingCategory = await prisma.category.findUnique({
                            where: { name: categoryName }
                        });

                        if (existingCategory) {
                            return { id: existingCategory.id };
                        }

                        const newCategory = await prisma.category.create({
                            data: { name: categoryName }
                        });

                        return { id: newCategory.id };
                    } catch (error) {
                        const category = await prisma.category.findUnique({
                            where: { name: categoryName }
                        });
                        if (category) {
                            return { id: category.id };
                        }
                        throw error;
                    }
                })
            );

            const languageConnections = await Promise.all(
                languages.map(async (lang: LanguageData) => {
                    try {
                        const existingLanguage = await prisma.language.findUnique({
                            where: { code: lang.id }
                        });

                        if (existingLanguage) {
                            return { id: existingLanguage.id };
                        }

                        const newLanguage = await prisma.language.create({
                            data: { 
                                code: lang.id,
                                name: lang.name
                            }
                        });

                        return { id: newLanguage.id };
                    } catch (error) {
                        const language = await prisma.language.findUnique({
                            where: { code: lang.id }
                        });
                        if (language) {
                            return { id: language.id };
                        }
                        throw error;
                    }
                })
            );

            const existingManga = await prisma.manga.findFirst({
                where: { manga_uuid: mangaData.uuid }
            });

            if (existingManga) {
                results.errors.push(`Mangá com UUID ${mangaData.uuid} já existe`);
                continue;
            }

            const manga = await prisma.manga.create({
                data: {
                    manga_uuid: mangaData.uuid,
                    cover: mangaData.capa,
                    status: mangaData.status ?? undefined,
                    type: mangaData.type ?? undefined,
                    releaseDate: mangaData.year ? new Date(mangaData.year) : undefined,
                    translations: {
                        create: Object.entries(descriptions).map(([lang, desc]) => ({
                            language: lang,
                            name: mangaData.name,
                            description: desc as string
                        }))
                    },
                    categories: {
                        connect: categoryConnections
                    },
                    languages: {
                        connect: languageConnections
                    }
                },
                include: {
                    translations: true,
                    categories: true,
                    languages: true
                }
            });

            results.success++;
            results.imported.push({
                id: manga.id,
                uuid: manga.manga_uuid,
                name: mangaData.name
            });
        } catch (error) {
            results.errors.push(`Erro ao importar mangá ${mangaData.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    }

    return results;
};

export const getMangaChapters = async (id: string, lg: string, order: string, page: number, limit: number) => {
    const manga = await prisma.manga.findUnique({
        where: { id },
        select: { manga_uuid: true }
    });

    if (!manga?.manga_uuid) {
        throw new Error('Mangá não encontrado ou UUID não disponível');
    }

    // Primeiro, vamos buscar o total de capítulos para validar a página
    const totalResponse = await axios.get(`https://api.mangadex.org/manga/${manga.manga_uuid}/feed?limit=1&translatedLanguage[]=${lg}&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&includeFutureUpdates=1`);
    
    if (totalResponse.status !== 200) {
        throw new Error('Failed to fetch chapters');
    }

    const { total } = totalResponse.data;
    const lastPage = Math.ceil(total / limit);
    
    // Validar se a página solicitada é válida
    if (page > lastPage && lastPage > 0) {
        throw new Error(`Página ${page} não existe. Total de páginas: ${lastPage}`);
    }
    
    // Se não há dados, retornar página 1
    if (total === 0) {
        return {
            current_page: 1,
            data: [],
            from: 0,
            last_page: 1,
            next: false,
            per_page: limit,
            prev: false,
            to: 0,
            total: 0
        };
    }
    
    // Ajustar página para o máximo se exceder o total
    const adjustedPage = Math.min(page, lastPage);
    const offset = (adjustedPage - 1) * limit;
    
    const apiUrl = `https://api.mangadex.org/manga/${manga.manga_uuid}/feed?limit=${limit}&offset=${offset}&translatedLanguage[]=${lg}&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&includeFutureUpdates=1&order[createdAt]=${order}&order[updatedAt]=${order}&order[publishAt]=${order}&order[readableAt]=${order}&order[volume]=${order}&order[chapter]=${order}`;

    const response = await axios.get(apiUrl, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });

    if (response.status !== 200) {
        throw new Error('Failed to fetch chapters');
    }

    const { data } = response.data;

    if (!data || data.length === 0) {
        return {
            current_page: adjustedPage,
            data: [],
            from: 0,
            last_page: lastPage,
            next: false,
            per_page: limit,
            prev: false,
            to: 0,
            total: 0
        };
    }

    const transformed = transformChapterData(data, total, limit, adjustedPage, offset, lg);
    const chapters = transformed.chapters;

    const from = offset + 1;
    const to = Math.min(offset + limit, total);

    return {
        current_page: adjustedPage,
        data: chapters,
        from,
        last_page: lastPage,
        next: adjustedPage < lastPage,
        per_page: limit,
        prev: adjustedPage > 1,
        to,
        total
    };
};

const transformChapterData = (chapters: any[], total: number, limit: number, page: number, offset: number, lg: string) => {
    const transformedChapters = chapters
        .map(chapter => {
            const attributes = chapter.attributes ?? {};
            const pages = attributes.pages ?? 0;
            const externalUrl = attributes.externalUrl ?? null;

            const publishDate = new Date(attributes.publishAt ?? new Date())
                .toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });

            return {
                id: chapter.id ?? null,
                title: attributes.title ?? `Capítulo ${attributes.chapter ?? 0}`,
                chapter: attributes.chapter ? parseFloat(attributes.chapter) : 0,
                volume: attributes.volume ? parseFloat(attributes.volume) : null,
                language: [attributes.translatedLanguage ?? ''],
                publish_date: publishDate,
                pages,
                external_url: externalUrl,
                is_external: !!externalUrl
            };
        })
        .filter(Boolean);

    return {
        total,
        limit,
        page,
        offset,
        lg,
        chapters: transformedChapters
    };
};

export const getChapterPages = async (chapterID: string, quality: string) => {
    const baseUrl = 'https://api.mangadex.org';
    const chapterResponse = await axios.get(`${baseUrl}/at-home/server/${chapterID}?forcePort443=false`, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    if (chapterResponse.status !== 200) {
        throw new Error('Failed to fetch chapter');
    }

    const chapterData = chapterResponse.data.chapter;
    const baseUrlImages = chapterResponse.data.baseUrl;

    if (!chapterData?.hash || (!chapterData?.data && !chapterData?.dataSaver)) {
        throw new Error('Invalid chapter data');
    }

    const imageData = quality === 'low' ? chapterData.dataSaver : chapterData.data;

    if (!imageData || imageData.length === 0) {
        throw new Error('No images found for this chapter');
    }

    const pages = imageData.map((image: string) => `${baseUrlImages}/data/${chapterData.hash}/${image}`);

    return {
        pages,
        total: pages.length,
        chapter_id: chapterID,
        base_url: baseUrlImages,
        quality,
        hash: chapterData.hash
    };
};

export const clearMangaTable = async () => {
    await prisma.$transaction([
        prisma.view.deleteMany({}),
        prisma.like.deleteMany({}),
        prisma.comment.deleteMany({}),
        prisma.notification.deleteMany({}),
        prisma.libraryEntry.deleteMany({}),
        prisma.collection.deleteMany({}),
        prisma.chapter.deleteMany({}),
        prisma.mangaTranslation.deleteMany({}),
        prisma.$executeRaw`DELETE FROM "_MangaCategories"`,
        prisma.$executeRaw`DELETE FROM "_MangaLanguages"`,
        prisma.manga.deleteMany({})
    ]);

    return { 
        message: 'Tabela de mangás e suas relações foram limpas com sucesso',
        timestamp: new Date()
    };
};

export const getAdjacentChapters = async (mangaId: string, currentChapter: string) => {
    // Busca todos os capítulos do mangá ordenados
    const chapters = await prisma.chapter.findMany({
        where: {
            mangaId,
        },
        orderBy: {
            chapter: 'asc'
        },
        select: {
            id: true,
            chapter: true,
            title: true,
            volume: true
        }
    });

    // Encontra o índice do capítulo atual
    const currentIndex = chapters.findIndex(ch => ch.chapter === currentChapter);

    if (currentIndex === -1) {
        throw new Error('Capítulo não encontrado');
    }

    // Obtém o capítulo anterior e próximo
    const previousChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
    const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

    return {
        previous: previousChapter ? {
            id: previousChapter.id,
            chapter: previousChapter.chapter,
            title: previousChapter.title,
            volume: previousChapter.volume
        } : null,
        next: nextChapter ? {
            id: nextChapter.id,
            chapter: nextChapter.chapter,
            title: nextChapter.title,
            volume: nextChapter.volume
        } : null
    };
};

export const getSimilarMangas = async (mangaId: string, limit: number = 5) => {
    // Busca o mangá original para obter suas categorias
    const manga = await prisma.manga.findUnique({
        where: { id: mangaId },
        include: {
            categories: true
        }
    });

    if (!manga) {
        throw new Error("Mangá não encontrado");
    }

    // Obtém os IDs das categorias do mangá
    const categoryIds = manga.categories.map(cat => cat.id);

    // Busca mangás que compartilham as mesmas categorias
    const similarMangas = await prisma.manga.findMany({
        where: {
            id: {
                not: mangaId // Exclui o mangá original
            },
            categories: {
                some: {
                    id: {
                        in: categoryIds
                    }
                }
            }
        },
        select: {
            id: true,
            cover: true,
            translations: {
                select: {
                    language: true,
                    name: true
                }
            }
        },
        take: limit,
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Formata a resposta para incluir apenas os dados necessários
    return similarMangas.map(manga => ({
        id: manga.id,
        cover: manga.cover,
        title: manga.translations[0]?.name || 'Sem título'
    }));
};