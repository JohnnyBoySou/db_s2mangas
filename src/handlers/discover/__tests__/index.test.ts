import { prismaMock } from '../../../test/mocks/prisma';
import {
    getRecent,
    getMostViewed,
    getMostLiked,
    getFeed,
    getIA
} from '../index';

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
    __esModule: true,
    default: prismaMock,
}));

describe('Handlers Discover', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockMangaData = {
        id: 'manga-123',
        manga_uuid: 'uuid-123',
        cover: 'cover.jpg',
        releaseDate: new Date('2023-01-01'),
        createdAt: new Date('2023-01-01'),
        translations: [
            {
                language: 'pt',
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
            likes: 50
        }
    };

    describe('getRecent', () => {
        it('deve retornar mangás recentes com paginação', async () => {
            const mockMangas = [{
                id: 'manga-123',
                manga_uuid: 'uuid-123',
                cover: 'cover.jpg',
                translations: [{
                    name: 'Manga Teste',
                    description: 'Descrição do manga teste'
                }],
                _count: { views: 100 }
            }];

            prismaMock.manga.findMany.mockResolvedValue(mockMangas as any);
            prismaMock.manga.count.mockResolvedValue(1);

            const result = await getRecent('pt', 1, 10);

            expect(result).toEqual({
                data: [{
                    id: 'manga-123',
                    manga_uuid: 'uuid-123',
                    title: 'Manga Teste',
                    description: 'Descrição do manga teste',
                    cover: 'cover.jpg',
                    views_count: 100
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
                skip: 0,
                take: 10,
                where: {
                    translations: {
                        some: {
                            language: 'pt'
                        }
                    }
                },
                orderBy: { releaseDate: 'desc' },
                select: expect.any(Object)
            });
        });

        it('deve calcular paginação corretamente', async () => {
            prismaMock.manga.findMany.mockResolvedValue([]);
            prismaMock.manga.count.mockResolvedValue(25);

            const result = await getRecent('pt', 2, 10);

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

    describe('getMostViewed', () => {
        it('deve retornar mangás mais visualizados', async () => {
            prismaMock.manga.findMany.mockResolvedValue([mockMangaData] as any);
            prismaMock.manga.count.mockResolvedValue(1);

            const result = await getMostViewed('pt', 1, 10);

            expect(result.data).toHaveLength(1);
            expect(result.data[0].title).toBe('Manga Teste');
            expect(prismaMock.manga.findMany).toHaveBeenCalledWith({
                skip: 0,
                take: 10,
                where: {
                    translations: {
                        some: {
                            language: 'pt'
                        }
                    }
                },
                orderBy: {
                    views: {
                        _count: 'desc'
                    }
                },
                include: expect.any(Object)
            });
        });

        it('deve usar tradução em inglês como fallback', async () => {
            const mangaWithoutPtTranslation = {
                ...mockMangaData,
                translations: [
                    {
                        language: 'en',
                        name: 'Test Manga',
                        description: 'Test manga description'
                    }
                ]
            };

            prismaMock.manga.findMany.mockResolvedValue([mangaWithoutPtTranslation] as any);
            prismaMock.manga.count.mockResolvedValue(1);

            const result = await getMostViewed('pt', 1, 10);

            expect(result.data[0].title).toBe('Test Manga');
        });
    });

    describe('getMostLiked', () => {
        it('deve retornar mangás mais curtidos', async () => {
            prismaMock.manga.findMany.mockResolvedValue([mockMangaData] as any);
            prismaMock.manga.count.mockResolvedValue(1);

            const result = await getMostLiked('pt', 1, 10);

            expect(result.data).toHaveLength(1);
            expect(result.data[0].title).toBe('Manga Teste');
            expect(prismaMock.manga.findMany).toHaveBeenCalledWith({
                skip: 0,
                take: 10,
                where: {
                    translations: {
                        some: {
                            language: 'pt'
                        }
                    }
                },
                orderBy: {
                    likes: {
                        _count: 'desc'
                    }
                },
                include: expect.any(Object)
            });
        });
    });

    describe('getFeed', () => {
        it('deve retornar feed personalizado para usuário com categorias', async () => {
            const mockUser = {
                id: 'user-123',
                categories: [
                    { id: 'cat-1', name: 'Ação' },
                    { id: 'cat-2', name: 'Romance' }
                ]
            };

            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
            prismaMock.manga.findMany.mockResolvedValue([mockMangaData] as any);
            prismaMock.manga.count.mockResolvedValue(1);

            const result = await getFeed('user-123', 'pt', 1, 10);

            expect(result.data).toHaveLength(1);
            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                include: { categories: true }
            });
        });

        it('deve retornar array vazio quando usuário não tem categorias', async () => {
            const mockUser = {
                id: 'user-123',
                categories: []
            };

            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

            const result = await getFeed('user-123', 'pt', 1, 10);

            expect(result.data).toEqual([]);
            expect(result.pagination.total).toBe(0);
        });

        it('deve retornar array vazio quando usuário não existe', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);

            const result = await getFeed('user-inexistente', 'pt', 1, 10);

            expect(result.data).toEqual([]);
            expect(result.pagination.total).toBe(0);
        });
    });

    describe('getIA', () => {
        it('deve retornar recomendações baseadas em preferências do usuário', async () => {
            const mockUser = {
                id: 'user-123',
                categories: [{ id: 'cat-1', name: 'Ação' }],
                views: [
                    {
                        mangaId: 'viewed-manga-1',
                        manga: {
                            categories: [{ id: 'cat-2', name: 'Romance' }],
                            translations: []
                        }
                    }
                ],
                likes: [
                    {
                        manga: {
                            categories: [{ id: 'cat-3', name: 'Comédia' }],
                            translations: []
                        }
                    }
                ]
            };

            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
            prismaMock.manga.findMany.mockResolvedValue([mockMangaData] as any);
            prismaMock.manga.count.mockResolvedValue(1);

            const result = await getIA('user-123', 'pt', 1, 10);

            expect(result.data).toHaveLength(1);
            expect(prismaMock.manga.findMany).toHaveBeenCalledWith({
                where: {
                    categories: {
                        some: {
                            id: {
                                in: expect.arrayContaining(['cat-1', 'cat-2', 'cat-3'])
                            }
                        }
                    },
                    translations: {
                        some: {
                            language: 'pt'
                        }
                    },
                    id: {
                        notIn: ['viewed-manga-1']
                    }
                },
                include: expect.any(Object),
                orderBy: expect.any(Array),
                skip: 0,
                take: 10
            });
        });

        it('deve retornar array vazio quando usuário não existe', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);

            const result = await getIA('user-inexistente', 'pt', 1, 10);

            expect(result.data).toEqual([]);
            expect(result.pagination.total).toBe(0);
        });

        it('deve excluir mangás já visualizados das recomendações', async () => {
            const mockUser = {
                id: 'user-123',
                categories: [{ id: 'cat-1', name: 'Ação' }],
                views: [
                    {
                        mangaId: 'viewed-manga-1',
                        manga: { categories: [], translations: [] }
                    },
                    {
                        mangaId: 'viewed-manga-2',
                        manga: { categories: [], translations: [] }
                    }
                ],
                likes: []
            };

            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
            prismaMock.manga.findMany.mockResolvedValue([]);
            prismaMock.manga.count.mockResolvedValue(0);

            await getIA('user-123', 'pt', 1, 10);

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: {
                            notIn: ['viewed-manga-1', 'viewed-manga-2']
                        }
                    })
                })
            );
        });
    });
});