import type { RequestHandler, Request } from "express";
import prisma from "@/prisma/client";
import { createMangaSchema, updateMangaSchema } from "@/schemas/mangaSchemas";
import { handleZodError } from "@/utils/zodError";
import { getPaginationParams } from '@/utils/pagination';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

// Interface para a requisição com usuário
interface RequestWithUser extends Request {
    user?: {
        id: string;
    };
}

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

export const create: RequestHandler = async (req, res) => {
    try {
        const data = createMangaSchema.parse(req.body);
        const manga = await prisma.manga.create({
            data: {
                cover: data.cover,
                status: data.status,
                type: data.type,
                releaseDate: data.releaseDate,
                manga_uuid: data.manga_uuid,

                languages: {
                    connect: data.languageIds.map(id => ({ id })),
                },
                categories: {
                    connect: data.categoryIds?.map(id => ({ id })) ?? [],
                },
                translations: {
                    create: data.translations.map((t) => ({
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
        res.status(201).json(manga);
    } catch (error) {
        handleZodError(error, res);
    }
};

export const list: RequestHandler = async (req, res) => {
    const language = req.query.lg as string || 'en';
    
    try {
        const mangas = await prisma.manga.findMany({
            include: {
                categories: true,
                translations: true,
                languages: true,
            },
            orderBy: { createdAt: "desc" },
        });

        const translatedMangas = mangas.map(manga => getTranslatedManga(manga, language));
        res.json(translatedMangas);
    } catch (error: unknown) {
        handleZodError(error, res);
    }
};

export const get: RequestHandler = async (req: RequestWithUser, res) => {
    const { id } = req.params;
    const language = req.query.lg as string || 'en';
    const userId = req.user?.id;

    try {
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
            res.status(404).json({ error: "Mangá não encontrado" });
            return
        }

        // Registrar a view se houver um usuário autenticado
        if (userId) {
            try {
                // Verificar se o usuário já visualizou este mangá hoje
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

                // Só registra uma nova view se o usuário ainda não visualizou hoje
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

        // Buscar o total de views após registrar a nova view
        const totalViews = await prisma.view.count({
            where: { mangaId: id }
        });

        // Buscar apenas a tradução solicitada
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

        res.json({
            ...translatedManga,
            covers
        });
    } catch (error: unknown) {
        handleZodError(error, res);
    }
};

export const update: RequestHandler = async (req, res) => {
    const { id } = req.params;
    const data = updateMangaSchema.parse(req.body);

    try {
        const existing = await prisma.manga.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: "Mangá não encontrado" });
            return
        }

        const updated = await prisma.manga.update({
            where: { id },
            data: {
                cover: data.cover,
                status: data.status,
                type: data.type,
                releaseDate: data.releaseDate,

                languages: {
                    set: data.languageIds.map(id => ({ id })), // substitui todos
                },
                categories: {
                    set: data.categoryIds?.map(id => ({ id })) ?? [],
                },

                translations: {
                    deleteMany: {}, // remove todas para recriar
                    create: data.translations.map(t => ({
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

        res.json(updated);
    } catch (error) {
        handleZodError(error, res);
    }
};

export const remove: RequestHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const existing = await prisma.manga.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: "Mangá não encontrado" });
            return
        }

        await prisma.manga.delete({ where: { id } });
        res.json({ message: "Mangá deletado com sucesso" });
    } catch (error) {
        handleZodError(error, res);
    }
};

export const category: RequestHandler = async (req, res) => {
    const { category } = req.query;
    const { skip, take, page } = getPaginationParams(req);
  
    if (!category || typeof category !== 'string') {
        res.status(400).json({ error: 'Parâmetro "category" é obrigatório.' });
        return 
    }
  
    try {
      const [mangas, total] = await Promise.all([
        prisma.manga.findMany({
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
          take,
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
        }),
        prisma.manga.count({
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
        }),
      ]);
  
      const totalPages = Math.ceil(total / take);
  
      res.json({
        data: mangas,
        pagination: {
          total,
          page,
          limit: take,
          totalPages,
          next: page < totalPages,
          prev: page > 1,
        },
      });
    } catch (err) {
      handleZodError(err, res);
    }
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

export const covers: RequestHandler = async (req, res) => {
  const { id } = req.params;

  try {
    const manga = await prisma.manga.findUnique({
      where: { id },
      select: { manga_uuid: true }
    });

    if (!manga?.manga_uuid) {
      res.status(404).json({ error: 'UUID do mangá não encontrado' });
      return 
    }

    const response = await axios.get('https://api.mangadex.org/cover', {
      params: {
        manga: [manga.manga_uuid]
      }
    });

    const covers = formatCoverData(response.data.data, manga.manga_uuid);
    res.json(covers);
  } catch (error) {
    console.error('Erro ao buscar capas:', error);
    res.status(500).json({ error: 'Erro ao buscar capas do mangá' });
  }
};

export const importFromMangaDex: RequestHandler = async (req, res) => {
    const { mangaId } = req.params;

    try {
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
                        description: mangaData.attributes.description[lang] || null,
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

        res.status(201).json(manga);
    } catch (error) {
        console.error('Erro ao importar mangá:', error);
        res.status(500).json({ error: 'Erro ao importar mangá do MangaDex' });
    }
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

export const importFromJSON: RequestHandler = async (req, res) => {
    try {
        const mangaData: MySQLMangaData = req.body;

        // Parse das categorias e idiomas que estão em formato JSON string
        const categories = JSON.parse(mangaData.categories);
        const languages = JSON.parse(mangaData.languages);

        // Criar ou conectar categorias
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
                    // Se falhar ao criar, tenta buscar novamente (pode ter sido criado por outra requisição)
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

        // Criar ou conectar idiomas
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
                    // Se falhar ao criar, tenta buscar novamente
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

        // Criar o mangá
        const manga = await prisma.manga.create({
            data: {
                manga_uuid: mangaData.uuid,
                cover: mangaData.capa,
                status: mangaData.status ?? undefined,
                type: mangaData.type ?? undefined,
                releaseDate: mangaData.year ? new Date(mangaData.year) : undefined,
                translations: {
                    create: [{
                        language: 'pt-br', // Assumindo que os dados estão em português
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

        res.status(201).json(manga);
    } catch (error) {
        console.error('Erro ao importar mangá do JSON:', error);
        res.status(500).json({ 
            error: 'Erro ao importar mangá do JSON',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

export const importFromFile: RequestHandler = async (req, res) => {
    console.log("Iniciando importação do arquivo");
    try {
        const { filename } = req.params;
        console.log("Nome do arquivo:", filename);
        
        const filePath = path.join(process.cwd(), 'src', 'import', filename);
        console.log("Caminho completo do arquivo:", filePath);

        // Verifica se o arquivo existe
        try {
            await fs.access(filePath);
        } catch (error) {
            console.error("Arquivo não encontrado:", filePath);
            res.status(404).json({ 
                error: 'Arquivo não encontrado',
                path: filePath
            });
            return;
        }

        // Lê o arquivo JSON
        console.log("Lendo arquivo...");
        const fileContent = await fs.readFile(filePath, 'utf-8');
        console.log("Arquivo lido com sucesso");

        console.log("Parseando JSON...");
        const mangasData: MySQLMangaData[] = JSON.parse(fileContent);
        console.log(`Encontrados ${mangasData.length} mangás para importar`);

        const results = {
            total: mangasData.length,
            success: 0,
            errors: [] as string[],
            imported: [] as any[]
        };

        // Processa cada mangá
        for (const mangaData of mangasData) {
            try {
                console.log(`Processando mangá: ${mangaData.name}`);
                // Parse das categorias e idiomas que estão em formato JSON string
                const categories = JSON.parse(mangaData.categories);
                const languages: LanguageData[] = JSON.parse(mangaData.languages);
                const descriptions = JSON.parse(mangaData.description);

                // Criar ou conectar categorias
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
                            // Se falhar ao criar, tenta buscar novamente (pode ter sido criado por outra requisição)
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

                // Criar ou conectar idiomas
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
                            // Se falhar ao criar, tenta buscar novamente
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

                // Verifica se o mangá já existe pelo UUID
                const existingManga = await prisma.manga.findFirst({
                    where: { manga_uuid: mangaData.uuid }
                });

                if (existingManga) {
                    results.errors.push(`Mangá com UUID ${mangaData.uuid} já existe`);
                    continue;
                }

                // Criar o mangá com todas as traduções disponíveis
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
                console.log(`Mangá ${mangaData.name} importado com sucesso`);
            } catch (error) {
                console.error(`Erro ao processar mangá ${mangaData.name}:`, error);
                results.errors.push(`Erro ao importar mangá ${mangaData.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            }
        }

        console.log("Importação concluída");
        res.json({
            message: `Importação concluída. ${results.success} de ${results.total} mangás importados com sucesso.`,
            results
        });
    } catch (error) {
        console.error('Erro ao importar mangás do arquivo:', error);
        res.status(500).json({ 
            error: 'Erro ao importar mangás do arquivo',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

export const chapters: RequestHandler = async (req, res) => {
    const { id } = req.params;
    const lg = req.query.lg as string || 'pt-br';
    const order = req.query.order as string || 'desc';
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = parseInt(req.query.limit as string || '20');
    const offset = (page - 1) * limit;
    const baseUrl = `${req.protocol}://${req.get('host')}${req.originalUrl.split('?')[0]}`;

    try {
        const manga = await prisma.manga.findUnique({
            where: { id },
            select: { manga_uuid: true }
        });

        if (!manga?.manga_uuid) {
            res.status(404).json({ error: 'Mangá não encontrado ou UUID não disponível' });
            return;
        }

        const apiUrl = `https://api.mangadex.org/manga/${manga.manga_uuid}/feed?limit=${limit}&offset=${offset}&translatedLanguage[]=${lg}&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&includeFutureUpdates=1&order[createdAt]=${order}&order[updatedAt]=${order}&order[publishAt]=${order}&order[readableAt]=${order}&order[volume]=${order}&order[chapter]=${order}`;

        console.log('URL da API:', apiUrl);

        const response = await axios.get(apiUrl, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (response.status !== 200) {
            res.status(500).json({ error: 'Failed to fetch chapters' });
            return;
        }

        const { data, total } = response.data;

        // Se não houver capítulos, retorna uma resposta vazia
        if (!data || data.length === 0) {
            res.json({
                current_page: page,
                data: [],
                from: 0,
                last_page: 1,
                next: false,
                per_page: limit,
                prev: false,
                to: 0,
                total: 0
            });
            return;
        }

        const transformed = transformChapterData(data, total, limit, page, offset, lg);
        const chapters = transformed.chapters;

        const lastPage = Math.ceil(total / limit);
        const from = offset + 1;
        const to = Math.min(offset + limit, total);

        res.json({
            current_page: page,
            data: chapters,
            from,
            last_page: lastPage,
            next: page < lastPage,
            per_page: limit,
            prev: page > 1,
            to,
            total
        });
    } catch (error) {
        console.error('Erro ao buscar capítulos:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Erro desconhecido' });
    }
};

const transformChapterData = (chapters: any[], total: number, limit: number, page: number, offset: number, lg: string) => {
    const transformedChapters = chapters
        .map(chapter => {
            const attributes = chapter.attributes ?? {};
            const pages = attributes.pages ?? 0;
            const externalUrl = attributes.externalUrl || null;

            // Incluir capítulos mesmo que tenham 0 páginas ou sejam externos
            const publishDate = new Date(attributes.publishAt || new Date())
                .toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });

            return {
                id: chapter.id || null,
                title: attributes.title || `Capítulo ${attributes.chapter || 0}`,
                chapter: attributes.chapter ? parseFloat(attributes.chapter) : 0,
                volume: attributes.volume ? parseFloat(attributes.volume) : null,
                language: [attributes.translatedLanguage || ''],
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

export const pages: RequestHandler = async (req, res) => {
    const { chapterID } = req.params;
    const quality = req.query.quality as string || 'high'; // 'high' ou 'low'

    try {
        const baseUrl = 'https://api.mangadex.org';
        console.log('Buscando páginas do capítulo:', chapterID);

        const chapterResponse = await axios.get(`${baseUrl}/at-home/server/${chapterID}?forcePort443=false`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        console.log('Resposta da API:', {
            status: chapterResponse.status,
            data: chapterResponse.data
        });

        if (chapterResponse.status !== 200) {
            res.status(500).json({ error: 'Failed to fetch chapter' });
            return;
        }

        const chapterData = chapterResponse.data.chapter;
        const baseUrlImages = chapterResponse.data.baseUrl;

        if (!chapterData?.hash || (!chapterData?.data && !chapterData?.dataSaver)) {
            console.error('Dados do capítulo inválidos:', chapterData);
            res.status(500).json({ error: 'Invalid chapter data' });
            return;
        }

        // Escolhe entre data (alta qualidade) e dataSaver (baixa qualidade)
        const imageData = quality === 'low' ? chapterData.dataSaver : chapterData.data;

        if (!imageData || imageData.length === 0) {
            console.error('Nenhuma imagem encontrada para o capítulo');
            res.status(404).json({ error: 'No images found for this chapter' });
            return;
        }

        const pages = imageData.map((image: string) => `${baseUrlImages}/data/${chapterData.hash}/${image}`);

        console.log('Páginas encontradas:', {
            total: pages.length,
            firstPage: pages[0],
            lastPage: pages[pages.length - 1],
            quality
        });

        res.json({
            pages,
            total: pages.length,
            chapter_id: chapterID,
            base_url: baseUrlImages,
            quality,
            hash: chapterData.hash
        });
    } catch (error) {
        console.error('Erro ao buscar páginas:', error);
        res.status(500).json({ 
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            details: error instanceof Error ? error.stack : undefined
        });
    }
};

export const clearMangaTable: RequestHandler = async (req, res) => {
    try {
        // Primeiro, limpar as tabelas relacionadas
        await prisma.$transaction([
            // Limpar views
            prisma.view.deleteMany({}),
            // Limpar likes
            prisma.like.deleteMany({}),
            // Limpar comentários
            prisma.comment.deleteMany({}),
            // Limpar notificações
            prisma.notification.deleteMany({}),
            // Limpar entradas da biblioteca
            prisma.libraryEntry.deleteMany({}),
            // Limpar coleções
            prisma.collection.deleteMany({}),
            // Limpar capítulos
            prisma.chapter.deleteMany({}),
            // Limpar traduções
            prisma.mangaTranslation.deleteMany({}),
            // Limpar relações com categorias e idiomas
            prisma.$executeRaw`DELETE FROM "_MangaCategories"`,
            prisma.$executeRaw`DELETE FROM "_MangaLanguages"`,
            // Por fim, limpar a tabela de mangás
            prisma.manga.deleteMany({})
        ]);

        res.json({ 
            message: 'Tabela de mangás e suas relações foram limpas com sucesso',
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Erro ao limpar tabela de mangás:', error);
        res.status(500).json({ 
            error: 'Erro ao limpar tabela de mangás',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

