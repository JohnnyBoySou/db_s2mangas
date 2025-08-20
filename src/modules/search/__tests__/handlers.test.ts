import { prismaMock } from '../../../test/mocks/prisma';
import { MANGA_STATUS, MANGA_TYPE, MANGA_ORDER } from '@/constants/search';

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
    __esModule: true,
    default: prismaMock,
}));

import * as searchHandlers from '../handlers/SearchHandler';

describe('Search Handlers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockManga = {
        id: 'manga-123',
        manga_uuid: 'uuid-123',
        title: 'One Piece',
        cover: 'cover.jpg',
        type: 'Manga',
        status: 'Em andamento',
        releaseDate: new Date('2023-01-01'),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        translations: [
            {
                id: 'trans-123',
                name: 'One Piece',
                mangaId: 'manga-123',
                language: 'pt-BR',
                description: 'Uma aventura épica sobre piratas'
            }
        ],
        categories: [
            {
                id: 'cat-123',
                name: 'Ação',
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-01')
            }
        ],
        _count: {
            likes: 100,
            views: 1000
        }
    };

    const mockCategory = {
        id: 'cat-123',
        name: 'Ação',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
    };

    const mockLanguage = {
        id: 'lang-123',
        name: 'Português',
        code: 'pt-BR',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
    };

    describe('searchManga', () => {
        it('deve buscar mangás com filtros básicos', async () => {
            const mockResult = [mockManga];
            const mockCount = 1;

            prismaMock.manga.findMany.mockResolvedValue(mockResult);
            prismaMock.manga.count.mockResolvedValue(mockCount);

            const result = await searchHandlers.searchManga({
                name: 'One Piece',
                page: 1,
                limit: 10,
                language: 'pt-BR'
            });

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith({
                where: {
                    translations: {
                        some: {
                            AND: [
                                {
                                    language: {
                                        equals: 'pt-BR',
                                        mode: 'insensitive'
                                    }
                                },
                                {
                                    OR: [
                                        {
                                            OR: [
                                                {
                                                    name: {
                                                        contains: 'one',
                                                        mode: 'insensitive'
                                                    }
                                                },
                                                {
                                                    description: {
                                                        contains: 'one',
                                                        mode: 'insensitive'
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            OR: [
                                                {
                                                    name: {
                                                        contains: 'piece',
                                                        mode: 'insensitive'
                                                    }
                                                },
                                                {
                                                    description: {
                                                        contains: 'piece',
                                                        mode: 'insensitive'
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                },
                skip: 0,
                take: 10,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    translations: {
                        where: {
                            language: {
                                equals: 'pt-BR',
                                mode: 'insensitive'
                            }
                        }
                    },
                    categories: true,
                    _count: {
                        select: {
                            likes: true,
                            views: true
                        }
                    }
                }
            });

            expect(result.data).toHaveLength(1);
            expect(result.data[0].title).toBe('One Piece');
            expect(result.pagination.total).toBe(1);
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.totalPages).toBe(1);
        });

        it('deve buscar mangás por categoria', async () => {
            const mockResult = [mockManga];
            const mockCount = 1;

            prismaMock.manga.findMany.mockResolvedValue(mockResult);
            prismaMock.manga.count.mockResolvedValue(mockCount);

            const result = await searchHandlers.searchManga({
                category: 'Ação',
                page: 1,
                limit: 10,
                language: 'pt-BR'
            });

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        categories: {
                            some: {
                                name: {
                                    equals: 'Ação',
                                    mode: 'insensitive'
                                }
                            }
                        }
                    }
                })
            );

            expect(result.data).toHaveLength(1);
        });

        it('deve buscar mangás por status', async () => {
            const mockResult = [mockManga];
            const mockCount = 1;

            prismaMock.manga.findMany.mockResolvedValue(mockResult);
            prismaMock.manga.count.mockResolvedValue(mockCount);

            const result = await searchHandlers.searchManga({
                status: MANGA_STATUS.ONGOING,
                page: 1,
                limit: 10,
                language: 'pt-BR'
            });

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        status: {
                            equals: MANGA_STATUS.ONGOING,
                            mode: 'insensitive'
                        }
                    }
                })
            );

            expect(result.data).toHaveLength(1);
        });

        it('deve buscar mangás por tipo', async () => {
            const mockResult = [mockManga];
            const mockCount = 1;

            prismaMock.manga.findMany.mockResolvedValue(mockResult);
            prismaMock.manga.count.mockResolvedValue(mockCount);

            const result = await searchHandlers.searchManga({
                type: MANGA_TYPE.MANGA,
                page: 1,
                limit: 10,
                language: 'pt-BR'
            });

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        type: {
                            equals: MANGA_TYPE.MANGA,
                            mode: 'insensitive'
                        }
                    }
                })
            );

            expect(result.data).toHaveLength(1);
        });

        it('deve aplicar paginação corretamente', async () => {
            const mockResult = [mockManga];
            const mockCount = 25;

            prismaMock.manga.findMany.mockResolvedValue(mockResult);
            prismaMock.manga.count.mockResolvedValue(mockCount);

            const result = await searchHandlers.searchManga({
                page: 3,
                limit: 10,
                language: 'pt-BR'
            });

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 20, // (3-1) * 10
                    take: 10
                })
            );

            expect(result.pagination.page).toBe(3);
            expect(result.pagination.total).toBe(25);
            expect(result.pagination.totalPages).toBe(3);
            expect(result.pagination.next).toBe(false);
            expect(result.pagination.prev).toBe(true);
        });

        it('deve usar valores padrão quando parâmetros não são fornecidos', async () => {
            const mockResult = [mockManga];
            const mockCount = 1;

            prismaMock.manga.findMany.mockResolvedValue(mockResult);
            prismaMock.manga.count.mockResolvedValue(mockCount);

            const result = await searchHandlers.searchManga({});

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 0,
                    take: 10,
                    include: expect.objectContaining({
                        translations: {
                            where: {
                                language: {
                                    equals: 'pt-BR',
                                    mode: 'insensitive'
                                }
                            }
                        }
                    })
                })
            );

            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(10);
        });

        it('deve limitar o número máximo de resultados por página', async () => {
            const mockResult = [mockManga];
            const mockCount = 1;

            prismaMock.manga.findMany.mockResolvedValue(mockResult);
            prismaMock.manga.count.mockResolvedValue(mockCount);

            await searchHandlers.searchManga({
                limit: 100 // Acima do limite máximo
            });

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 50 // Deve ser limitado ao MAX_LIMIT
                })
            );
        });

        it('deve lidar com resultados vazios', async () => {
            prismaMock.manga.findMany.mockResolvedValue([]);
            prismaMock.manga.count.mockResolvedValue(0);

            const result = await searchHandlers.searchManga({
                name: 'mangá inexistente'
            });

            expect(result.data).toHaveLength(0);
            expect(result.pagination.total).toBe(0);
            expect(result.pagination.totalPages).toBe(0);
        });
    });

    describe('listCategories', () => {
        it('deve listar todas as categorias ordenadas por nome', async () => {
            const mockCategories = [
                { ...mockCategory, name: 'Ação' },
                { ...mockCategory, id: 'cat-456', name: 'Romance' }
            ];

            prismaMock.category.findMany.mockResolvedValue(mockCategories);

            const result = await searchHandlers.listCategories();

            expect(prismaMock.category.findMany).toHaveBeenCalledWith({
                orderBy: {
                    name: 'asc'
                }
            });

            expect(result).toEqual(mockCategories);
        });

        it('deve retornar array vazio quando não há categorias', async () => {
            prismaMock.category.findMany.mockResolvedValue([]);

            const result = await searchHandlers.listCategories();

            expect(result).toEqual([]);
        });
    });

    describe('searchCategories', () => {
        it('deve buscar mangás por nome de categoria', async () => {
            const mockResult = [mockManga];
            const mockCount = 1;

            prismaMock.manga.findMany.mockResolvedValue(mockResult);
            prismaMock.manga.count.mockResolvedValue(mockCount);

            const result = await searchHandlers.searchCategories('Ação', 1, 10, 'pt-BR');

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith({
                where: {
                    categories: {
                        some: {
                            name: {
                                contains: 'Ação',
                                mode: 'insensitive'
                            }
                        }
                    }
                },
                include: {
                    translations: {
                        where: {
                            language: {
                                equals: 'pt-BR',
                                mode: 'insensitive'
                            }
                        }
                    },
                    categories: true,
                    _count: {
                        select: {
                            likes: true,
                            views: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip: 0,
                take: 10
            });

            expect(result.data).toHaveLength(1);
            expect(result.data[0].title).toBe('One Piece');
        });

        it('deve aplicar paginação na busca por categoria', async () => {
            const mockResult = [mockManga];
            const mockCount = 15;

            prismaMock.manga.findMany.mockResolvedValue(mockResult);
            prismaMock.manga.count.mockResolvedValue(mockCount);

            const result = await searchHandlers.searchCategories('Ação', 2, 5, 'pt-BR');

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 5, // (2-1) * 5
                    take: 5
                })
            );

            expect(result.pagination.page).toBe(2);
            expect(result.pagination.totalPages).toBe(3);
        });
    });

    describe('listTypes', () => {
        it('deve retornar todos os tipos de mangá disponíveis', async () => {
            const result = await searchHandlers.listTypes();

            expect(result).toEqual([
                MANGA_TYPE.MANGA,
                MANGA_TYPE.MANHWA,
                MANGA_TYPE.MANHUA,
                MANGA_TYPE.WEBTOON
            ]);
        });
    });

    describe('listLanguages', () => {
        it('deve listar todas as linguagens ordenadas por nome', async () => {
            const mockLanguages = [
                mockLanguage,
                { ...mockLanguage, id: 'lang-456', name: 'English', code: 'en' }
            ];

            prismaMock.language.findMany.mockResolvedValue(mockLanguages);

            const result = await searchHandlers.listLanguages();

            expect(prismaMock.language.findMany).toHaveBeenCalledWith({
                orderBy: {
                    name: 'asc'
                }
            });

            expect(result).toEqual(mockLanguages);
        });

        it('deve retornar array vazio quando não há linguagens', async () => {
            prismaMock.language.findMany.mockResolvedValue([]);

            const result = await searchHandlers.listLanguages();

            expect(result).toEqual([]);
        });
    });
});