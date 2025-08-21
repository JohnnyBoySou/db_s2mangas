import { prismaMock } from '../../../test/mocks/prisma';
import {
    getRecentMangas,
    getMostViewedMangas,
    getMostLikedMangas,
    getFeedForUser,
    getIARecommendations,
    getMangasByCategories,
    getDiscoverStats
} from '../handlers/DiscoverHandler';

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
    __esModule: true,
    default: prismaMock,
}));

// Define os tipos dos mocks
const mockMangaFindMany = prismaMock.manga.findMany as jest.MockedFunction<any>;
const mockMangaCount = prismaMock.manga.count as jest.MockedFunction<any>;
const mockCategoryCount = prismaMock.category.count as jest.MockedFunction<any>;

describe('Handlers Discover', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockMangaData = {
        id: 'manga-123',
        manga_uuid: 'uuid-123',
        cover: 'cover.jpg',
        status: 'ACTIVE',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        translations: [
            {
                language: 'pt-BR',
                name: 'Manga Teste',
                description: 'Descrição do manga teste'
            },
            {
                language: 'en',
                name: 'Test Manga',
                description: 'Test manga description'
            }
        ],
        categories: [
            { id: 'cat-1', name: 'Ação' }
        ],
        _count: {
            views: 100,
            likes: 50,
            chapters: 10
        }
    };

    describe('getRecentMangas', () => {
        it('deve retornar mangás recentes com paginação', async () => {
            const mockMangas = [mockMangaData];

            mockMangaFindMany.mockResolvedValue(mockMangas);
            mockMangaCount.mockResolvedValue(1);

            const result = await getRecentMangas({
                page: 1,
                take: 10,
                language: 'pt-BR'
            });

            expect(result).toEqual({
                data: [{
                    id: 'manga-123',
                    manga_uuid: 'uuid-123',
                    title: 'Manga Teste',
                    description: 'Descrição do manga teste',
                    cover: 'cover.jpg',
                    views_count: 100,
                    likes_count: 50,
                    chapters_count: 10,
                    categories: [{ id: 'cat-1', name: 'Ação' }],
                    createdAt: expect.any(Date),
                    updatedAt: expect.any(Date)
                }],
                pagination: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                    next: false,
                    prev: false
                }
            });

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith({
                where: {
                    status: 'ACTIVE'
                },
                include: {
                    translations: {
                        where: {
                            language: 'pt-BR'
                        },
                        select: {
                            name: true,
                            description: true,
                            language: true
                        }
                    },
                    categories: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    _count: {
                        select: {
                            views: true,
                            likes: true,
                            chapters: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip: 0,
                take: 10
            });
        });

        it('deve usar idioma padrão quando não especificado', async () => {
            const mockMangas = [mockMangaData];
            mockMangaFindMany.mockResolvedValue(mockMangas);
            mockMangaCount.mockResolvedValue(1);

            await getRecentMangas({ page: 1, take: 10 });

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.objectContaining({
                        translations: expect.objectContaining({
                            where: { language: 'pt-BR' }
                        })
                    })
                })
            );
        });

        it('deve calcular paginação corretamente', async () => {
            const mockMangas = Array(10).fill(mockMangaData);
            mockMangaFindMany.mockResolvedValue(mockMangas);
            mockMangaCount.mockResolvedValue(25);

            const result = await getRecentMangas({
                page: 2,
                take: 10,
                language: 'pt-BR'
            });

            expect(result.pagination).toEqual({
                total: 25,
                page: 2,
                limit: 10,
                totalPages: 3,
                next: true,
                prev: true
            });
        });
    });

    describe('getMostViewedMangas', () => {
        it('deve retornar mangás mais vistos com paginação', async () => {
            const mockMangas = [mockMangaData];

            mockMangaFindMany.mockResolvedValue(mockMangas);
            mockMangaCount.mockResolvedValue(1);

            const result = await getMostViewedMangas({
                page: 1,
                take: 10,
                language: 'pt-BR'
            });

            expect(result.data).toHaveLength(1);
            expect(result.pagination.total).toBe(1);

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: {
                        views: {
                            _count: 'desc'
                        }
                    }
                })
            );
        });
    });

    describe('getMostLikedMangas', () => {
        it('deve retornar mangás mais curtidos com paginação', async () => {
            const mockMangas = [mockMangaData];

            mockMangaFindMany.mockResolvedValue(mockMangas);
            mockMangaCount.mockResolvedValue(1);

            const result = await getMostLikedMangas({
                page: 1,
                take: 10,
                language: 'pt-BR'
            });

            expect(result.data).toHaveLength(1);
            expect(result.pagination.total).toBe(1);

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: {
                        likes: {
                            _count: 'desc'
                        }
                    }
                })
            );
        });
    });

    describe('getFeedForUser', () => {
        it('deve retornar feed personalizado para o usuário', async () => {
            const mockMangas = [mockMangaData];

            mockMangaFindMany.mockResolvedValue(mockMangas);
            mockMangaCount.mockResolvedValue(1);

            const result = await getFeedForUser('user-123', {
                page: 1,
                take: 10,
                language: 'pt-BR'
            });

            expect(result.data).toHaveLength(1);
            expect(result.pagination.total).toBe(1);

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: [
                        {
                            likes: {
                                _count: 'desc'
                            }
                        },
                        {
                            views: {
                                _count: 'desc'
                            }
                        }
                    ]
                })
            );
        });
    });

    describe('getIARecommendations', () => {
        it('deve retornar recomendações de IA para o usuário', async () => {
            const mockMangas = [mockMangaData];

            mockMangaFindMany.mockResolvedValue(mockMangas);
            mockMangaCount.mockResolvedValue(1);

            const result = await getIARecommendations('user-123', {
                page: 1,
                take: 10,
                language: 'pt-BR'
            });

            expect(result.data).toHaveLength(1);
            expect(result.pagination.total).toBe(1);

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: [
                        {
                            likes: {
                                _count: 'desc'
                            }
                        },
                        {
                            createdAt: 'desc'
                        }
                    ]
                })
            );
        });
    });

    describe('getMangasByCategories', () => {
        it('deve retornar mangás por categorias específicas', async () => {
            const mockMangas = [mockMangaData];
            const categoryIds = ['cat-1', 'cat-2'];

            mockMangaFindMany.mockResolvedValue(mockMangas);
            mockMangaCount.mockResolvedValue(1);

            const result = await getMangasByCategories(categoryIds, {
                page: 1,
                take: 10,
                language: 'pt-BR'
            });

            expect(result.data).toHaveLength(1);
            expect(result.pagination.total).toBe(1);

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        status: 'ACTIVE',
                        categories: {
                            some: {
                                id: {
                                    in: categoryIds
                                }
                            }
                        }
                    }
                })
            );
        });
    });

    describe('getDiscoverStats', () => {
        it('deve retornar estatísticas do sistema', async () => {
            mockMangaCount.mockResolvedValue(100);
            mockCategoryCount.mockResolvedValue(10);

            const result = await getDiscoverStats('pt-BR');

            expect(result).toEqual({
                totalMangas: 100,
                totalCategories: 10,
                totalViews: 0,
                totalLikes: 0,
                averageMangasPerCategory: 10,
                language: 'pt-BR'
            });

            expect(prismaMock.manga.count).toHaveBeenCalledWith({
                where: { status: 'ACTIVE' }
            });
            expect(prismaMock.category.count).toHaveBeenCalled();
        });

        it('deve lidar com divisão por zero', async () => {
            mockMangaCount.mockResolvedValue(0);
            mockCategoryCount.mockResolvedValue(0);

            const result = await getDiscoverStats('pt-BR');

            expect(result.averageMangasPerCategory).toBe(0);
        });
    });

    describe('Tratamento de traduções', () => {
        it('deve usar tradução padrão quando não encontrar tradução específica', async () => {
            const mangaWithoutTranslation = {
                ...mockMangaData,
                translations: [
                    {
                        language: 'en',
                        name: 'English Title',
                        description: 'English Description'
                    }
                ]
            };

            mockMangaFindMany.mockResolvedValue([mangaWithoutTranslation]);
            mockMangaCount.mockResolvedValue(1);

            const result = await getRecentMangas({
                page: 1,
                take: 10,
                language: 'pt-BR'
            });

            expect(result.data[0].title).toBe('English Title');
            expect(result.data[0].description).toBe('English Description');
        });

        it('deve usar valores padrão quando não há traduções', async () => {
            const mangaWithoutTranslations = {
                ...mockMangaData,
                translations: []
            };

            mockMangaFindMany.mockResolvedValue([mangaWithoutTranslations]);
            mockMangaCount.mockResolvedValue(1);

            const result = await getRecentMangas({
                page: 1,
                take: 10,
                language: 'pt-BR'
            });

            expect(result.data[0].title).toBe('Sem título');
            expect(result.data[0].description).toBe('Sem descrição');
        });

        it('deve usar primeira tradução quando não encontrar tradução específica', async () => {
            const mangaWithMultipleTranslations = {
                ...mockMangaData,
                translations: [
                    {
                        language: 'en',
                        name: 'English Title',
                        description: 'English Description'
                    },
                    {
                        language: 'es',
                        name: 'Spanish Title',
                        description: 'Spanish Description'
                    }
                ]
            };

            mockMangaFindMany.mockResolvedValue([mangaWithMultipleTranslations]);
            mockMangaCount.mockResolvedValue(1);

            const result = await getRecentMangas({
                page: 1,
                take: 10,
                language: 'pt-BR'
            });

            expect(result.data[0].title).toBe('English Title');
            expect(result.data[0].description).toBe('English Description');
        });
    });

    describe('Paginação e casos edge', () => {
        it('deve lidar com paginação múltipla páginas', async () => {
            const mockMangas = [mockMangaData];
            mockMangaFindMany.mockResolvedValue(mockMangas);
            mockMangaCount.mockResolvedValue(25);

            const result = await getRecentMangas({
                page: 2,
                take: 10,
                language: 'pt-BR'
            });

            expect(result.pagination).toEqual({
                total: 25,
                page: 2,
                limit: 10,
                totalPages: 3,
                next: true,
                prev: true
            });
        });

        it('deve lidar com primeira página', async () => {
            const mockMangas = [mockMangaData];
            mockMangaFindMany.mockResolvedValue(mockMangas);
            mockMangaCount.mockResolvedValue(5);

            const result = await getRecentMangas({
                page: 1,
                take: 10,
                language: 'pt-BR'
            });

            expect(result.pagination).toEqual({
                total: 5,
                page: 1,
                limit: 10,
                totalPages: 1,
                next: false,
                prev: false
            });
        });

        it('deve lidar com última página', async () => {
            const mockMangas = [mockMangaData];
            mockMangaFindMany.mockResolvedValue(mockMangas);
            mockMangaCount.mockResolvedValue(25);

            const result = await getRecentMangas({
                page: 3,
                take: 10,
                language: 'pt-BR'
            });

            expect(result.pagination).toEqual({
                total: 25,
                page: 3,
                limit: 10,
                totalPages: 3,
                next: false,
                prev: true
            });
        });

        it('deve usar valores padrão quando opções não são fornecidas', async () => {
            const mockMangas = [mockMangaData];
            mockMangaFindMany.mockResolvedValue(mockMangas);
            mockMangaCount.mockResolvedValue(1);

            const result = await getRecentMangas();

            expect(result.pagination).toEqual({
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                next: false,
                prev: false
            });

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 0,
                    take: 10
                })
            );
        });

        it('deve usar valores padrão quando opções parciais são fornecidas', async () => {
            const mockMangas = [mockMangaData];
            mockMangaFindMany.mockResolvedValue(mockMangas);
            mockMangaCount.mockResolvedValue(1);

            const result = await getRecentMangas({
                page: 2
            });

            expect(result.pagination).toEqual({
                total: 1,
                page: 2,
                limit: 10,
                totalPages: 1,
                next: false,
                prev: true
            });

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 10,
                    take: 10
                })
            );
        });
    });

    describe('getMostViewedMangas - casos edge', () => {
        it('deve lidar com mangás sem visualizações', async () => {
            const mangaWithoutViews = {
                ...mockMangaData,
                _count: {
                    views: 0,
                    likes: 0,
                    chapters: 0
                }
            };

            mockMangaFindMany.mockResolvedValue([mangaWithoutViews]);
            mockMangaCount.mockResolvedValue(1);

            const result = await getMostViewedMangas({
                page: 1,
                take: 10,
                language: 'pt-BR'
            });

            expect(result.data[0].views_count).toBe(0);
            expect(result.data[0].likes_count).toBe(0);
            expect(result.data[0].chapters_count).toBe(0);
        });

        it('deve usar valores padrão quando opções não são fornecidas', async () => {
            const mockMangas = [mockMangaData];
            mockMangaFindMany.mockResolvedValue(mockMangas);
            mockMangaCount.mockResolvedValue(1);

            const result = await getMostViewedMangas();

            expect(result.pagination).toEqual({
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                next: false,
                prev: false
            });
        });
    });

    describe('getMostLikedMangas - casos edge', () => {
        it('deve lidar com mangás sem likes', async () => {
            const mangaWithoutLikes = {
                ...mockMangaData,
                _count: {
                    views: 100,
                    likes: 0,
                    chapters: 5
                }
            };

            mockMangaFindMany.mockResolvedValue([mangaWithoutLikes]);
            mockMangaCount.mockResolvedValue(1);

            const result = await getMostLikedMangas({
                page: 1,
                take: 10,
                language: 'pt-BR'
            });

            expect(result.data[0].likes_count).toBe(0);
        });

        it('deve usar valores padrão quando opções não são fornecidas', async () => {
            const mockMangas = [mockMangaData];
            mockMangaFindMany.mockResolvedValue(mockMangas);
            mockMangaCount.mockResolvedValue(1);

            const result = await getMostLikedMangas();

            expect(result.pagination).toEqual({
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                next: false,
                prev: false
            });
        });
    });

    describe('getFeedForUser - casos edge', () => {
        it('deve lidar com usuário sem preferências', async () => {
            const mockMangas = [mockMangaData];
            mockMangaFindMany.mockResolvedValue(mockMangas);
            mockMangaCount.mockResolvedValue(1);

            const result = await getFeedForUser('user-123', {
                page: 1,
                take: 10,
                language: 'pt-BR'
            });

            expect(result.data).toHaveLength(1);
            expect(result.pagination.total).toBe(1);
        });

        it('deve usar valores padrão quando opções não são fornecidas', async () => {
            const mockMangas = [mockMangaData];
            mockMangaFindMany.mockResolvedValue(mockMangas);
            mockMangaCount.mockResolvedValue(1);

            const result = await getFeedForUser('user-123');

            expect(result.pagination).toEqual({
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                next: false,
                prev: false
            });
        });
    });

    describe('getMangasByCategories - casos edge', () => {
        it('deve lidar com categorias vazias', async () => {
            const mockMangas = [mockMangaData];
            mockMangaFindMany.mockResolvedValue(mockMangas);
            mockMangaCount.mockResolvedValue(1);

            const result = await getMangasByCategories([], {
                page: 1,
                take: 10,
                language: 'pt-BR'
            });

            expect(result.data).toHaveLength(1);
            expect(result.pagination.total).toBe(1);
        });

        it('deve usar valores padrão quando opções não são fornecidas', async () => {
            const mockMangas = [mockMangaData];
            mockMangaFindMany.mockResolvedValue(mockMangas);
            mockMangaCount.mockResolvedValue(1);

            const result = await getMangasByCategories(['cat-1']);

            expect(result.pagination).toEqual({
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                next: false,
                prev: false
            });
        });
    });

    describe('getDiscoverStats - casos edge', () => {
        it('deve lidar com estatísticas vazias', async () => {
            mockMangaCount.mockResolvedValue(0);
            mockCategoryCount.mockResolvedValue(0);

            const result = await getDiscoverStats('pt-BR');

            expect(result).toEqual({
                totalMangas: 0,
                totalCategories: 0,
                totalViews: 0,
                totalLikes: 0,
                averageMangasPerCategory: 0,
                language: 'pt-BR'
            });
        });

        it('deve lidar com apenas mangás sem categorias', async () => {
            mockMangaCount.mockResolvedValue(10);
            mockCategoryCount.mockResolvedValue(0);

            const result = await getDiscoverStats('pt-BR');

            expect(result.averageMangasPerCategory).toBe(0);
        });

        it('deve usar valores padrão quando language não é fornecida', async () => {
            mockMangaCount.mockResolvedValue(100);
            mockCategoryCount.mockResolvedValue(10);

            const result = await getDiscoverStats();

            expect(result.language).toBe('pt-BR');
        });
    });

    describe('Tratamento de erros', () => {
        it('deve propagar erros do banco de dados', async () => {
            const dbError = new Error('Database connection failed');
            mockMangaFindMany.mockRejectedValue(dbError);

            await expect(getRecentMangas()).rejects.toThrow('Database connection failed');
        });

        it('deve propagar erros de contagem', async () => {
            const countError = new Error('Count query failed');
            mockMangaFindMany.mockResolvedValue([]);
            mockMangaCount.mockRejectedValue(countError);

            await expect(getRecentMangas()).rejects.toThrow('Count query failed');
        });
    });
});
