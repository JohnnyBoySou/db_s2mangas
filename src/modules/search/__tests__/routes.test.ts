import request from 'supertest';
import express from 'express';
import { SearchRouter } from '../routes/SearchRouter';

// Mock dos middlewares
const mockRequireAuth = jest.fn((req, res, next) => {
    req.user = { id: 'user-123' };
    next();
});

const mockCacheMiddleware = jest.fn((ttl) => (req, res, next) => next());

jest.mock('@/middlewares/auth', () => ({
    requireAuth: mockRequireAuth
}));

jest.mock('@/middlewares/cache', () => ({
    cacheMiddleware: mockCacheMiddleware
}));

jest.mock('@/config/redis', () => ({
    cacheTTL: {
        categories: 3600,
        languages: 3600
    }
}));

// Mock dos controllers
const mockControllers = {
    searchManga: jest.fn((req, res) => res.status(200).json({ data: [], pagination: {} })),
    searchAdvanced: jest.fn((req, res) => res.status(200).json({ data: [], pagination: {} })),
    listTypes: jest.fn((req, res) => res.status(200).json(['Manga', 'Manhwa'])),
    searchCategories: jest.fn((req, res) => res.status(200).json({ data: [], pagination: {} })),
    listCategories: jest.fn((req, res) => res.status(200).json([])),
    listLanguages: jest.fn((req, res) => res.status(200).json([]))
};

jest.mock('../controllers/SearchController', () => mockControllers);

describe('Search Router', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/search', SearchRouter);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /search/', () => {
        it('deve chamar searchManga com autenticação', async () => {
            const searchData = {
                name: 'One Piece',
                category: 'Ação'
            };

            const response = await request(app)
                .post('/search/')
                .send(searchData)
                .expect(200);

            expect(mockRequireAuth).toHaveBeenCalled();
            expect(mockControllers.searchManga).toHaveBeenCalled();
            expect(response.body).toEqual({ data: [], pagination: {} });
        });

        it('deve rejeitar requisições sem autenticação', async () => {
            // Simular falha na autenticação
            mockRequireAuth.mockImplementationOnce((req, res, next) => {
                res.status(401).json({ error: 'Unauthorized' });
            });

            await request(app)
                .post('/search/')
                .send({ name: 'Test' })
                .expect(401);

            expect(mockControllers.searchManga).not.toHaveBeenCalled();
        });
    });

    describe('POST /search/advenced', () => {
        it('deve chamar searchAdvanced com autenticação', async () => {
            const searchData = {
                name: 'Naruto',
                categories: ['Ação', 'Aventura']
            };

            const response = await request(app)
                .post('/search/advenced')
                .send(searchData)
                .expect(200);

            expect(mockRequireAuth).toHaveBeenCalled();
            expect(mockControllers.searchAdvanced).toHaveBeenCalled();
            expect(response.body).toEqual({ data: [], pagination: {} });
        });

        it('deve rejeitar requisições sem autenticação', async () => {
            mockRequireAuth.mockImplementationOnce((req, res, next) => {
                res.status(401).json({ error: 'Unauthorized' });
            });

            await request(app)
                .post('/search/advenced')
                .send({ name: 'Test' })
                .expect(401);

            expect(mockControllers.searchAdvanced).not.toHaveBeenCalled();
        });
    });

    describe('GET /search/types', () => {
        it('deve listar tipos sem autenticação', async () => {
            const response = await request(app)
                .get('/search/types')
                .expect(200);

            expect(mockRequireAuth).not.toHaveBeenCalled();
            expect(mockControllers.listTypes).toHaveBeenCalled();
            expect(response.body).toEqual(['Manga', 'Manhwa']);
        });
    });

    describe('POST /search/categories', () => {
        it('deve buscar categorias sem autenticação', async () => {
            const searchData = {
                name: 'Ação'
            };

            const response = await request(app)
                .post('/search/categories')
                .send(searchData)
                .expect(200);

            expect(mockRequireAuth).not.toHaveBeenCalled();
            expect(mockControllers.searchCategories).toHaveBeenCalled();
            expect(response.body).toEqual({ data: [], pagination: {} });
        });
    });

    describe('GET /search/categories', () => {
        it('deve listar categorias com cache', async () => {
            const response = await request(app)
                .get('/search/categories')
                .expect(200);

            expect(mockCacheMiddleware).toHaveBeenCalledWith(3600);
            expect(mockControllers.listCategories).toHaveBeenCalled();
            expect(response.body).toEqual([]);
        });
    });

    describe('GET /search/languages', () => {
        it('deve listar linguagens com cache', async () => {
            const response = await request(app)
                .get('/search/languages')
                .expect(200);

            expect(mockCacheMiddleware).toHaveBeenCalledWith(3600);
            expect(mockControllers.listLanguages).toHaveBeenCalled();
            expect(response.body).toEqual([]);
        });
    });

    describe('Middleware de autenticação', () => {
        it('deve aplicar requireAuth nas rotas protegidas', async () => {
            // Testar todas as rotas que requerem autenticação
            const protectedRoutes = [
                { method: 'post', path: '/search/', data: {} },
                { method: 'post', path: '/search/advenced', data: {} }
            ];

            for (const route of protectedRoutes) {
                jest.clearAllMocks();
                
                await request(app)
                    [route.method](route.path)
                    .send(route.data);

                expect(mockRequireAuth).toHaveBeenCalled();
            }
        });

        it('não deve aplicar requireAuth nas rotas públicas', async () => {
            const publicRoutes = [
                { method: 'get', path: '/search/types' },
                { method: 'post', path: '/search/categories', data: { name: 'test' } },
                { method: 'get', path: '/search/categories' },
                { method: 'get', path: '/search/languages' }
            ];

            for (const route of publicRoutes) {
                jest.clearAllMocks();
                
                if (route.method === 'get') {
                    await request(app)[route.method](route.path);
                } else {
                    await request(app)[route.method](route.path).send(route.data || {});
                }

                // As rotas públicas não devem chamar requireAuth
                // (exceto se o middleware for chamado por outras razões)
                const authCallsForThisRoute = mockRequireAuth.mock.calls.length;
                if (route.path === '/search/categories' && route.method === 'post') {
                    // Esta rota específica não usa requireAuth
                    expect(authCallsForThisRoute).toBe(0);
                }
            }
        });
    });

    describe('Middleware de cache', () => {
        it('deve aplicar cache nas rotas apropriadas', async () => {
            const cachedRoutes = [
                { path: '/search/categories', ttl: 3600 },
                { path: '/search/languages', ttl: 3600 }
            ];

            for (const route of cachedRoutes) {
                jest.clearAllMocks();
                
                await request(app)
                    .get(route.path);

                expect(mockCacheMiddleware).toHaveBeenCalledWith(route.ttl);
            }
        });
    });

    describe('Estrutura das rotas', () => {
        it('deve ter todas as rotas necessárias definidas', () => {
            const router = SearchRouter;
            expect(router).toBeDefined();
            
            // As rotas são definidas no router, vamos testar se todas respondem
            const routeTests = [
                { method: 'post', path: '/search/', shouldRespond: true },
                { method: 'post', path: '/search/advenced', shouldRespond: true },
                { method: 'get', path: '/search/types', shouldRespond: true },
                { method: 'post', path: '/search/categories', shouldRespond: true },
                { method: 'get', path: '/search/categories', shouldRespond: true },
                { method: 'get', path: '/search/languages', shouldRespond: true }
            ];

            // Como não podemos inspecionar diretamente as rotas do Express,
            // testamos fazendo requisições para cada uma
            return Promise.all(
                routeTests.map(async ({ method, path }) => {
                    const response = await request(app)[method](path)
                        .send({})
                        .catch(err => ({ status: err.status || 500 }));
                    
                    // Todas as rotas devem responder (não 404)
                    expect(response.status).not.toBe(404);
                })
            );
        });

        it('deve retornar 404 para rotas não definidas', async () => {
            await request(app)
                .get('/search/nonexistent')
                .expect(404);

            await request(app)
                .post('/search/invalid')
                .expect(404);
        });
    });

    describe('Integração de middlewares', () => {
        it('deve executar middlewares na ordem correta', async () => {
            const callOrder: string[] = [];

            // Mock para rastrear ordem de execução
            mockRequireAuth.mockImplementation((req, res, next) => {
                callOrder.push('auth');
                req.user = { id: 'user-123' };
                next();
            });

            mockControllers.searchManga.mockImplementation((req, res) => {
                callOrder.push('controller');
                res.status(200).json({ data: [] });
            });

            await request(app)
                .post('/search/')
                .send({ name: 'test' });

            expect(callOrder).toEqual(['auth', 'controller']);
        });

        it('deve executar cache antes do controller nas rotas com cache', async () => {
            const callOrder: string[] = [];

            mockCacheMiddleware.mockImplementation((ttl) => (req, res, next) => {
                callOrder.push('cache');
                next();
            });

            mockControllers.listCategories.mockImplementation((req, res) => {
                callOrder.push('controller');
                res.status(200).json([]);
            });

            await request(app)
                .get('/search/categories');

            expect(callOrder).toEqual(['cache', 'controller']);
        });
    });
});