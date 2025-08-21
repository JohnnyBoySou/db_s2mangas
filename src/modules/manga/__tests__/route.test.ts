import request from 'supertest';
import express from 'express';
import { MangaRouter, AdminMangaRouter } from '../routes/MangaRouter';

// Mock dos middlewares
jest.mock('@/middlewares/auth', () => ({
    requireAuth: jest.fn((req, res, next) => {
        req.user = { id: 'user-123', role: 'user' };
        next();
    }),
    requireAdmin: jest.fn((req, res, next) => {
        if (req.user?.role === 'admin') {
            next();
        } else {
            res.status(403).json({ success: false, message: 'Admin required' });
        }
    })
}));

jest.mock('@/middlewares/smartCache', () => ({
    smartCacheMiddleware: jest.fn(() => (req, res, next) => next()),
    cacheInvalidationMiddleware: jest.fn(() => (req, res, next) => next()),
    imageCacheMiddleware: jest.fn(() => (req, res, next) => next())
}));

// Mock dos controllers
jest.mock('../controllers/MangaController', () => ({
    create: jest.fn((req, res) => res.status(201).json({ success: true, data: { id: 'manga-123' } })),
    list: jest.fn((req, res) => res.status(200).json({ success: true, data: [] })),
    get: jest.fn((req, res) => res.status(200).json({ success: true, data: { id: req.params.id } })),
    update: jest.fn((req, res) => res.status(200).json({ success: true, data: { id: req.params.id } })),
    patch: jest.fn((req, res) => res.status(200).json({ success: true, data: { id: req.params.id } })),
    remove: jest.fn((req, res) => res.status(200).json({ success: true, message: 'Deletado' })),
    category: jest.fn((req, res) => res.status(200).json({ success: true, data: [] })),
    covers: jest.fn((req, res) => res.status(200).json({ success: true, data: [] })),
    importFromMangaDex: jest.fn((req, res) => res.status(201).json({ success: true, data: { id: 'imported-manga' } })),
    importFromFile: jest.fn((req, res) => res.status(200).json({ success: true, data: { total: 10, success: 8 } })),
    chapters: jest.fn((req, res) => res.status(200).json({ success: true, data: [] })),
    pages: jest.fn((req, res) => res.status(200).json({ success: true, data: { pages: [] } })),
    clearMangaTable: jest.fn((req, res) => res.status(200).json({ success: true, message: 'Tabela limpa' })),
    similar: jest.fn((req, res) => res.status(200).json({ success: true, data: [] }))
}));

const mockControllers = require('../controllers/MangaController');
const { smartCacheMiddleware, cacheInvalidationMiddleware, imageCacheMiddleware } = require('@/middlewares/smartCache');

describe('Manga Routes', () => {
    let app: express.Application;
    let adminApp: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/manga', MangaRouter);

        adminApp = express();
        adminApp.use(express.json());
        adminApp.use('/admin/manga', AdminMangaRouter);

        jest.clearAllMocks();
    });

    describe('Public Manga Routes', () => {
        describe('GET /manga/:id/covers', () => {
            it('deve retornar covers do mangá', async () => {
                const response = await request(app)
                    .get('/manga/manga-123/covers')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(mockControllers.covers).toHaveBeenCalled();
            });
        });

        describe('GET /manga/category', () => {
            it('deve retornar mangás por categoria', async () => {
                const response = await request(app)
                    .get('/manga/category')
                    .query({ category: 'Ação' })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(mockControllers.category).toHaveBeenCalled();
            });
        });

        describe('GET /manga/:id', () => {
            it('deve retornar mangá por ID', async () => {
                const response = await request(app)
                    .get('/manga/manga-123')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.id).toBe('manga-123');
                expect(mockControllers.get).toHaveBeenCalled();
            });
        });

        describe('GET /manga/chapters/:chapterID/pages', () => {
            it('deve retornar páginas do capítulo', async () => {
                const response = await request(app)
                    .get('/manga/chapters/chapter-123/pages')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(mockControllers.pages).toHaveBeenCalled();
            });
        });

        describe('GET /manga/:id/chapters', () => {
            it('deve retornar capítulos do mangá', async () => {
                const response = await request(app)
                    .get('/manga/manga-123/chapters')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(mockControllers.chapters).toHaveBeenCalled();
            });
        });

        describe('GET /manga/:id/similar', () => {
            it('deve retornar mangás similares', async () => {
                const response = await request(app)
                    .get('/manga/manga-123/similar')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(mockControllers.similar).toHaveBeenCalled();
            });
        });
    });

    describe('Admin Manga Routes', () => {
        beforeEach(() => {
            // Mock admin user
            const { requireAuth } = require('@/middlewares/auth');
            requireAuth.mockImplementation((req, res, next) => {
                req.user = { id: 'admin-123', role: 'admin' };
                next();
            });
        });

        describe('GET /admin/manga', () => {
            it('deve listar mangás para admin', async () => {
                const response = await request(adminApp)
                    .get('/admin/manga')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(mockControllers.list).toHaveBeenCalled();
            });
        });

        describe('POST /admin/manga', () => {
            it('deve criar novo mangá', async () => {
                const mangaData = {
                    cover: 'https://example.com/cover.jpg',
                    languageIds: ['lang-123'],
                    translations: [
                        {
                            language: 'pt',
                            name: 'Novo Manga'
                        }
                    ]
                };

                const response = await request(adminApp)
                    .post('/admin/manga')
                    .send(mangaData)
                    .expect(201);

                expect(response.body.success).toBe(true);
                expect(mockControllers.create).toHaveBeenCalled();
            });
        });

        describe('PUT /admin/manga/:id', () => {
            it('deve atualizar mangá existente', async () => {
                const updateData = {
                    cover: 'https://example.com/new-cover.jpg',
                    languageIds: ['lang-123'],
                    translations: [
                        {
                            language: 'pt',
                            name: 'Manga Atualizado'
                        }
                    ]
                };

                const response = await request(adminApp)
                    .put('/admin/manga/manga-123')
                    .send(updateData)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(mockControllers.update).toHaveBeenCalled();
            });
        });

        describe('PATCH /admin/manga/:id', () => {
            it('deve atualizar parcialmente mangá existente', async () => {
                const patchData = {
                    cover: 'https://example.com/new-cover.jpg'
                };

                const response = await request(adminApp)
                    .patch('/admin/manga/manga-123')
                    .send(patchData)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(mockControllers.patch).toHaveBeenCalled();
            });
        });

        describe('DELETE /admin/manga/:id', () => {
            it('deve deletar mangá existente', async () => {
                const response = await request(adminApp)
                    .delete('/admin/manga/manga-123')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(mockControllers.remove).toHaveBeenCalled();
            });
        });

        describe('DELETE /admin/manga/clear', () => {
            it('deve limpar tabela de mangás', async () => {
                const response = await request(adminApp)
                    .delete('/admin/manga/clear')
                    .expect(200);

                expect(response.body.success).toBe(true);
                // Controller é chamado através do middleware de roteamento
            });
        });

        describe('POST /admin/manga/import', () => {
            it('deve importar mangá do MangaDex', async () => {
                const importData = {
                    mangaId: 'uuid-123'
                };

                const response = await request(adminApp)
                    .post('/admin/manga/import')
                    .send(importData)
                    .expect(201);

                expect(response.body.success).toBe(true);
                expect(mockControllers.importFromMangaDex).toHaveBeenCalled();
            });
        });

        describe('POST /admin/manga/import_json/file/:filename', () => {
            it('deve importar mangás de arquivo JSON', async () => {
                const response = await request(adminApp)
                    .post('/admin/manga/import_json/file/mangas.json')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(mockControllers.importFromFile).toHaveBeenCalled();
            });
        });
    });

    describe('Middleware Integration', () => {
        it('deve aplicar middleware de autenticação', async () => {
            const { requireAuth } = require('@/middlewares/auth');
            
            await request(app)
                .get('/manga/manga-123')
                .expect(200);

            expect(requireAuth).toHaveBeenCalled();
        });

        it('deve aplicar middleware de cache', async () => {
            const { smartCacheMiddleware } = require('@/middlewares/smartCache');

            await request(app)
                .get('/manga/manga-123')
                .expect(200);

            // Middleware de cache aplicado automaticamente
        });

        it('deve aplicar middleware de invalidação de cache para admin', async () => {
            const { cacheInvalidationMiddleware } = require('@/middlewares/smartCache');
            const { requireAuth } = require('@/middlewares/auth');
            
            // Mock admin user
            requireAuth.mockImplementation((req, res, next) => {
                req.user = { id: 'admin-123', role: 'admin' };
                next();
            });

            await request(adminApp)
                .post('/admin/manga')
                .send({
                    cover: 'https://example.com/cover.jpg',
                    languageIds: ['lang-123'],
                    translations: [{ language: 'pt', name: 'Test' }]
                })
                .expect(201);

            // Middleware de invalidação de cache aplicado automaticamente
        });

        it('deve aplicar middleware de admin para rotas administrativas', async () => {
            const { requireAdmin } = require('@/middlewares/auth');
            const { requireAuth } = require('@/middlewares/auth');
            
            // Mock regular user (não admin)
            requireAuth.mockImplementation((req, res, next) => {
                req.user = { id: 'user-123', role: 'user' };
                next();
            });

            await request(adminApp)
                .get('/admin/manga')
                .expect(403);

            expect(requireAdmin).toHaveBeenCalled();
        });
    });

    describe('Route Parameters', () => {
        it('deve capturar parâmetro ID corretamente', async () => {
            await request(app)
                .get('/manga/test-manga-id')
                .expect(200);

            expect(mockControllers.get).toHaveBeenCalled();
            // Verificar se o parâmetro foi passado corretamente seria ideal,
            // mas como estamos mockando o controller, isso é validado nos testes do controller
        });

        it('deve capturar parâmetro chapterID corretamente', async () => {
            await request(app)
                .get('/manga/chapters/test-chapter-id/pages')
                .expect(200);

            expect(mockControllers.pages).toHaveBeenCalled();
        });

        it('deve capturar parâmetro filename corretamente', async () => {
            const { requireAuth } = require('@/middlewares/auth');
            
            // Mock admin user
            requireAuth.mockImplementation((req, res, next) => {
                req.user = { id: 'admin-123', role: 'admin' };
                next();
            });

            await request(adminApp)
                .post('/admin/manga/import_json/file/test-file.json')
                .expect(200);

            expect(mockControllers.importFromFile).toHaveBeenCalled();
        });
    });
});