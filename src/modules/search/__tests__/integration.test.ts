import request from 'supertest';
import express from 'express';
import { prismaMock } from '../../../test/mocks/prisma';
import { MANGA_STATUS, MANGA_TYPE, MANGA_ORDER } from '@/constants/search';

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
    __esModule: true,
    default: prismaMock,
}));

// Mock dos middlewares
jest.mock('@/middlewares/auth', () => ({
    requireAuth: jest.fn((req, res, next) => {
        req.user = { id: 'user-123' };
        next();
    })
}));

jest.mock('@/middlewares/cache', () => ({
    cacheMiddleware: jest.fn((ttl) => (req, res, next) => next())
}));

jest.mock('@/config/redis', () => ({
    cacheTTL: {
        categories: 3600,
        languages: 3600
    }
}));

// Mock da função handleZodError
jest.mock('@/utils/zodError', () => ({
    handleZodError: jest.fn((err, res) => {
        res.status(400).json({ error: 'Validation error' });
    })
}));

import { SearchRouter } from '../routes/SearchRouter';

describe('Search Integration Tests', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/search', SearchRouter);
    });

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

    describe('POST /search/ - Busca básica de mangás', () => {
        it('deve realizar busca básica com sucesso', async () => {
            prismaMock.manga.findMany.mockResolvedValue([mockManga]);
            prismaMock.manga.count.mockResolvedValue(1);

            const response = await request(app)
                .post('/search/')
                .send({
                    name: 'One Piece',
                    category: 'Ação',
                    page: 1,
                    limit: 10
                })
                .expect(200);

            expect(response.body).toMatchObject({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        id: 'manga-123',
                        title: 'One Piece'
                    })
                ]),
                pagination: expect.objectContaining({
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1
                })
            });
        });

        it('deve retornar resultados vazios quando não encontrar mangás', async () => {
            prismaMock.manga.findMany.mockResolvedValue([]);
            prismaMock.manga.count.mockResolvedValue(0);

            const response = await request(app)
                .post('/search/')
                .send({
                    name: 'Mangá Inexistente'
                })
                .expect(200);

            expect(response.body).toEqual({
                data: [],
                pagination: expect.objectContaining({
                    total: 0,
                    totalPages: 0
                })
            });
        });

        it('deve filtrar por status corretamente', async () => {
            prismaMock.manga.findMany.mockResolvedValue([mockManga]);
            prismaMock.manga.count.mockResolvedValue(1);

            await request(app)
                .post('/search/')
                .send({
                    status: MANGA_STATUS.ONGOING
                })
                .expect(200);

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        status: {
                            equals: MANGA_STATUS.ONGOING,
                            mode: 'insensitive'
                        }
                    })
                })
            );
        });

        it('deve filtrar por tipo corretamente', async () => {
            prismaMock.manga.findMany.mockResolvedValue([mockManga]);
            prismaMock.manga.count.mockResolvedValue(1);

            await request(app)
                .post('/search/')
                .send({
                    type: MANGA_TYPE.MANGA
                })
                .expect(200);

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        type: {
                            equals: MANGA_TYPE.MANGA,
                            mode: 'insensitive'
                        }
                    })
                })
            );
        });
    });

    describe('GET /search/advanced - Busca avançada', () => {
        it('deve realizar busca avançada com múltiplos filtros', async () => {
            prismaMock.manga.findMany.mockResolvedValue([mockManga]);
            prismaMock.manga.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/search/advanced')
                .query({
                    name: 'One Piece',
                    status: MANGA_STATUS.ONGOING,
                    type: MANGA_TYPE.MANGA,
                    orderBy: MANGA_ORDER.MOST_RECENT,
                    page: '1',
                    limit: '10'
                })
                .expect(200);

            expect(response.body).toMatchObject({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        title: 'One Piece'
                    })
                ]),
                pagination: expect.objectContaining({
                    total: 1
                })
            });

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: {
                        createdAt: 'desc'
                    }
                })
            );
        });

        it('deve validar parâmetros de query', async () => {
            const response = await request(app)
                .get('/search/advanced')
                .query({
                    status: 'Status Inválido',
                    type: 'Tipo Inválido'
                })
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'Validation error'
            });
        });

        it('deve usar valores padrão para parâmetros opcionais', async () => {
            prismaMock.manga.findMany.mockResolvedValue([]);
            prismaMock.manga.count.mockResolvedValue(0);

            await request(app)
                .get('/search/advanced')
                .expect(200);

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 0, // page padrão = 1
                    take: 10, // limit padrão = 10
                    orderBy: {
                        createdAt: 'desc' // orderBy padrão = most_recent
                    }
                })
            );
        });
    });

    describe('GET /search/categories - Listar categorias', () => {
        it('deve listar todas as categorias', async () => {
            const mockCategories = [
                { id: 'cat-1', name: 'Ação', createdAt: new Date(), updatedAt: new Date() },
                { id: 'cat-2', name: 'Romance', createdAt: new Date(), updatedAt: new Date() }
            ];

            prismaMock.category.findMany.mockResolvedValue(mockCategories);

            const response = await request(app)
                .get('/search/categories')
                .expect(200);

            expect(response.body).toEqual(mockCategories);
            expect(prismaMock.category.findMany).toHaveBeenCalledWith({
                orderBy: {
                    name: 'asc'
                }
            });
        });
    });

    describe('POST /search/categories - Buscar por categoria', () => {
        it('deve buscar mangás por categoria', async () => {
            prismaMock.manga.findMany.mockResolvedValue([mockManga]);
            prismaMock.manga.count.mockResolvedValue(1);

            const response = await request(app)
                .post('/search/categories')
                .send({
                    name: 'Ação',
                    page: 1,
                    limit: 10
                })
                .expect(200);

            expect(response.body).toMatchObject({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        title: 'One Piece'
                    })
                ])
            });

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        categories: {
                            some: {
                                name: {
                                    contains: 'Ação',
                                    mode: 'insensitive'
                                }
                            }
                        }
                    }
                })
            );
        });

        it('deve retornar erro quando nome da categoria não for fornecido', async () => {
            const response = await request(app)
                .post('/search/categories')
                .send({})
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'Nome da categoria é obrigatório.'
            });
        });

        it('deve retornar erro quando nome não for string', async () => {
            const response = await request(app)
                .post('/search/categories')
                .send({
                    name: 123
                })
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'Nome da categoria é obrigatório.'
            });
        });
    });

    describe('GET /search/types - Listar tipos', () => {
        it('deve listar todos os tipos de mangá', async () => {
            const response = await request(app)
                .get('/search/types')
                .expect(200);

            expect(response.body).toEqual([
                MANGA_TYPE.MANGA,
                MANGA_TYPE.MANHWA,
                MANGA_TYPE.MANHUA,
                MANGA_TYPE.WEBTOON
            ]);
        });
    });

    describe('GET /search/languages - Listar linguagens', () => {
        it('deve listar todas as linguagens', async () => {
            const mockLanguages = [
                { id: 'lang-1', name: 'Português', code: 'pt-BR', createdAt: new Date(), updatedAt: new Date() },
                { id: 'lang-2', name: 'English', code: 'en', createdAt: new Date(), updatedAt: new Date() }
            ];

            prismaMock.language.findMany.mockResolvedValue(mockLanguages);

            const response = await request(app)
                .get('/search/languages')
                .expect(200);

            expect(response.body).toEqual(mockLanguages);
            expect(prismaMock.language.findMany).toHaveBeenCalledWith({
                orderBy: {
                    name: 'asc'
                }
            });
        });
    });

    describe('Fluxos de erro', () => {
        it('deve tratar erros de banco de dados na busca de mangás', async () => {
            prismaMock.manga.findMany.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/search/')
                .send({ name: 'Test' })
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'Validation error'
            });
        });

        it('deve tratar erros de banco de dados na listagem de categorias', async () => {
            prismaMock.category.findMany.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/search/categories')
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'Validation error'
            });
        });

        it('deve tratar erros de banco de dados na listagem de linguagens', async () => {
            prismaMock.language.findMany.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/search/languages')
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'Validation error'
            });
        });
    });

    describe('Paginação e performance', () => {
        it('deve paginar resultados corretamente', async () => {
            const mangaList = Array.from({ length: 5 }, (_, i) => ({
                ...mockManga,
                id: `manga-${i}`,
                title: `Manga ${i}`
            }));

            prismaMock.manga.findMany.mockResolvedValue(mangaList);
            prismaMock.manga.count.mockResolvedValue(25);

            const response = await request(app)
                .post('/search/')
                .send({
                    page: 3,
                    limit: 5
                })
                .expect(200);

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 10, // (3-1) * 5
                    take: 5
                })
            );

            expect(response.body.pagination).toMatchObject({
                page: 3,
                limit: 5,
                total: 25,
                totalPages: 5,
                next: true,
                prev: true
            });
        });

        it('deve limitar o número máximo de itens por página', async () => {
            prismaMock.manga.findMany.mockResolvedValue([]);
            prismaMock.manga.count.mockResolvedValue(0);

            await request(app)
                .post('/search/')
                .send({
                    limit: 100 // Acima do limite máximo
                })
                .expect(200);

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 50 // Limitado ao MAX_LIMIT
                })
            );
        });
    });

    describe('Autenticação e autorização', () => {
        it('deve permitir acesso a rotas públicas sem autenticação', async () => {
            const publicRoutes = [
                { method: 'get', path: '/search/types' },
                { method: 'get', path: '/search/categories' },
                { method: 'get', path: '/search/languages' },
                { method: 'post', path: '/search/categories', data: { name: 'Ação' } }
            ];

            // Mock de categorias e linguagens para rotas que precisam
            prismaMock.category.findMany.mockResolvedValue([]);
            prismaMock.language.findMany.mockResolvedValue([]);
            prismaMock.manga.findMany.mockResolvedValue([]);
            prismaMock.manga.count.mockResolvedValue(0);

            for (const route of publicRoutes) {
                const response = route.method === 'get' 
                    ? await request(app)[route.method](route.path)
                    : await request(app)[route.method](route.path).send(route.data);

                expect(response.status).not.toBe(401);
            }
        });
    });
});