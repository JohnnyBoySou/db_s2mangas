import request from 'supertest';
import express from 'express';
import { MangaListRouter } from '../routes/MangaListRouter';
import { AdminMangaListRouter } from '../routes/AdminMangaListRouter';

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

// Mock dos controllers
jest.mock('../controllers/MangalistController', () => ({
    list: jest.fn((req, res) => res.status(200).json({ 
        success: true, 
        lists: [], 
        total: 0, 
        totalPages: 0, 
        currentPage: 1 
    })),
    listPublic: jest.fn((req, res) => res.status(200).json({ 
        success: true, 
        lists: [], 
        total: 0, 
        totalPages: 0, 
        currentPage: 1 
    })),
    get: jest.fn((req, res) => res.status(200).json({ 
        success: true, 
        data: { id: req.params.id, name: 'Test List' } 
    })),
    getStats: jest.fn((req, res) => res.status(200).json({ 
        success: true, 
        data: { items: 5, likes: 10, views: 100 } 
    })),
    getByMood: jest.fn((req, res) => res.status(200).json({ 
        success: true, 
        lists: [] 
    })),
    create: jest.fn((req, res) => res.status(201).json({ 
        success: true, 
        data: { id: 'list-123', name: req.body.name } 
    })),
    update: jest.fn((req, res) => res.status(200).json({ 
        success: true, 
        data: { id: req.params.id, name: req.body.name } 
    })),
    remove: jest.fn((req, res) => res.status(200).json({ 
        success: true, 
        message: 'Lista deletada com sucesso' 
    })),
    addManga: jest.fn((req, res) => res.status(201).json({ 
        success: true, 
        data: { id: 'item-123', mangaId: req.body.mangaId } 
    })),
    bulkAddMangas: jest.fn((req, res) => res.status(200).json({ 
        success: true, 
        data: { added: req.body.mangaIds.length, skipped: 0 } 
    })),
    reorderItems: jest.fn((req, res) => res.status(200).json({ 
        success: true, 
        message: 'Itens reordenados com sucesso' 
    })),
    updateMangaItem: jest.fn((req, res) => res.status(200).json({ 
        success: true, 
        data: { id: req.params.itemId, order: req.body.order } 
    })),
    removeManga: jest.fn((req, res) => res.status(200).json({ 
        success: true, 
        message: 'Mangá removido da lista' 
    }))
}));

const mockControllers = require('../controllers/MangalistController');

describe('MangaList Routes', () => {
    let app: express.Application;
    let adminApp: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/mangalists', MangaListRouter);

        adminApp = express();
        adminApp.use(express.json());
        adminApp.use('/admin/mangalists', AdminMangaListRouter);

        jest.clearAllMocks();
    });

    describe('Public MangaList Routes', () => {
        describe('GET /mangalists', () => {
            it('deve listar listas do usuário', async () => {
                const response = await request(app)
                    .get('/mangalists')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(mockControllers.list).toHaveBeenCalled();
            });

            it('deve aceitar parâmetros de query', async () => {
                await request(app)
                    .get('/mangalists')
                    .query({ 
                        status: 'PUBLIC', 
                        search: 'ação', 
                        page: 1, 
                        limit: 10 
                    })
                    .expect(200);

                expect(mockControllers.list).toHaveBeenCalled();
            });
        });

        describe('GET /mangalists/public', () => {
            it('deve listar listas públicas', async () => {
                const response = await request(app)
                    .get('/mangalists/public')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(mockControllers.listPublic).toHaveBeenCalled();
            });
        });

        describe('GET /mangalists/:id', () => {
            it('deve retornar lista por ID', async () => {
                const response = await request(app)
                    .get('/mangalists/list-123')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.id).toBe('list-123');
                expect(mockControllers.get).toHaveBeenCalled();
            });
        });

        describe('GET /mangalists/:id/stats', () => {
            it('deve retornar estatísticas da lista', async () => {
                const response = await request(app)
                    .get('/mangalists/list-123/stats')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveProperty('items');
                expect(response.body.data).toHaveProperty('likes');
                expect(response.body.data).toHaveProperty('views');
                expect(mockControllers.getStats).toHaveBeenCalled();
            });
        });

        describe('GET /mangalists/mood/:mood', () => {
            it('deve retornar listas por mood', async () => {
                const response = await request(app)
                    .get('/mangalists/mood/ação')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(mockControllers.getByMood).toHaveBeenCalled();
            });
        });
    });

    describe('Admin MangaList Routes', () => {
        beforeEach(() => {
            // Mock admin user
            const { requireAuth } = require('@/middlewares/auth');
            requireAuth.mockImplementation((req, res, next) => {
                req.user = { id: 'admin-123', role: 'admin' };
                next();
            });
        });

        describe('POST /admin/mangalists', () => {
            it('deve criar nova lista', async () => {
                const listData = {
                    name: 'Nova Lista',
                    cover: 'https://example.com/cover.jpg',
                    mood: 'Aventura',
                    description: 'Lista de aventuras'
                };

                const response = await request(adminApp)
                    .post('/admin/mangalists')
                    .send(listData)
                    .expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.name).toBe(listData.name);
                expect(mockControllers.create).toHaveBeenCalled();
            });
        });

        describe('PUT /admin/mangalists/:id', () => {
            it('deve atualizar lista existente', async () => {
                const updateData = {
                    name: 'Lista Atualizada',
                    description: 'Nova descrição'
                };

                const response = await request(adminApp)
                    .put('/admin/mangalists/list-123')
                    .send(updateData)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.name).toBe(updateData.name);
                expect(mockControllers.update).toHaveBeenCalled();
            });
        });

        describe('DELETE /admin/mangalists/:id', () => {
            it('deve deletar lista existente', async () => {
                const response = await request(adminApp)
                    .delete('/admin/mangalists/list-123')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('deletada com sucesso');
                expect(mockControllers.remove).toHaveBeenCalled();
            });
        });

        describe('POST /admin/mangalists/:id/items', () => {
            it('deve adicionar mangá à lista', async () => {
                const addData = {
                    mangaId: 'manga-123',
                    note: 'Ótimo mangá',
                    order: 0
                };

                const response = await request(adminApp)
                    .post('/admin/mangalists/list-123/items')
                    .send(addData)
                    .expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.mangaId).toBe(addData.mangaId);
                expect(mockControllers.addManga).toHaveBeenCalled();
            });
        });

        describe('POST /admin/mangalists/:id/items/bulk', () => {
            it('deve adicionar múltiplos mangás à lista', async () => {
                const bulkData = {
                    mangaIds: ['manga-123', 'manga-456', 'manga-789'],
                    notes: {
                        'manga-123': 'Primeiro mangá',
                        'manga-456': 'Segundo mangá'
                    }
                };

                const response = await request(adminApp)
                    .post('/admin/mangalists/list-123/items/bulk')
                    .send(bulkData)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.added).toBe(3);
                expect(mockControllers.bulkAddMangas).toHaveBeenCalled();
            });
        });

        describe('PUT /admin/mangalists/:id/items/reorder', () => {
            it('deve reordenar itens da lista', async () => {
                const reorderData = {
                    items: [
                        { id: 'item-123', order: 0 },
                        { id: 'item-456', order: 1 },
                        { id: 'item-789', order: 2 }
                    ]
                };

                const response = await request(adminApp)
                    .put('/admin/mangalists/list-123/items/reorder')
                    .send(reorderData)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('reordenados com sucesso');
                expect(mockControllers.reorderItems).toHaveBeenCalled();
            });
        });

        describe('PUT /admin/mangalists/:listId/items/:itemId', () => {
            it('deve atualizar item da lista', async () => {
                const updateData = {
                    order: 5,
                    note: 'Nova nota'
                };

                const response = await request(adminApp)
                    .put('/admin/mangalists/list-123/items/item-456')
                    .send(updateData)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.order).toBe(updateData.order);
                expect(mockControllers.updateMangaItem).toHaveBeenCalled();
            });
        });

        describe('DELETE /admin/mangalists/:listId/items/:itemId', () => {
            it('deve remover item da lista', async () => {
                const response = await request(adminApp)
                    .delete('/admin/mangalists/list-123/items/item-456')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('removido da lista');
                expect(mockControllers.removeManga).toHaveBeenCalled();
            });
        });
    });

    describe('Middleware Integration', () => {
        it('deve aplicar middleware de autenticação em rotas públicas', async () => {
            const { requireAuth } = require('@/middlewares/auth');
            
            await request(app)
                .get('/mangalists')
                .expect(200);

            expect(requireAuth).toHaveBeenCalled();
        });

        it('deve aplicar middleware de admin para rotas administrativas', async () => {
            const { requireAdmin } = require('@/middlewares/auth');
            const { requireAuth } = require('@/middlewares/auth');
            
            // Mock regular user (não admin)
            requireAuth.mockImplementation((req, res, next) => {
                req.user = { id: 'user-123', role: 'user' };
                next();
            });

            // Mock requireAdmin to return 403 for non-admin users
            requireAdmin.mockImplementation((req, res, next) => {
                if (req.user?.role === 'admin') {
                    next();
                } else {
                    res.status(403).json({ success: false, message: 'Admin required' });
                }
            });

            await request(adminApp)
                .post('/admin/mangalists')
                .send({ name: 'Test List' })
                .expect(403);

            expect(requireAdmin).toHaveBeenCalled();
        });

        it('deve permitir acesso admin com permissões corretas', async () => {
            const { requireAuth } = require('@/middlewares/auth');
            
            // Mock admin user
            requireAuth.mockImplementation((req, res, next) => {
                req.user = { id: 'admin-123', role: 'admin' };
                next();
            });

            await request(adminApp)
                .post('/admin/mangalists')
                .send({
                    name: 'Test List',
                    cover: 'https://example.com/cover.jpg',
                    mood: 'Action'
                })
                .expect(201);
        });
    });

    describe('Route Parameters', () => {
        it('deve capturar parâmetro ID corretamente', async () => {
            await request(app)
                .get('/mangalists/test-list-id')
                .expect(200);

            expect(mockControllers.get).toHaveBeenCalled();
        });

        it('deve capturar parâmetro mood corretamente', async () => {
            await request(app)
                .get('/mangalists/mood/aventura')
                .expect(200);

            expect(mockControllers.getByMood).toHaveBeenCalled();
        });

        it('deve capturar múltiplos parâmetros corretamente', async () => {
            const { requireAuth } = require('@/middlewares/auth');
            
            // Mock admin user
            requireAuth.mockImplementation((req, res, next) => {
                req.user = { id: 'admin-123', role: 'admin' };
                next();
            });

            await request(adminApp)
                .put('/admin/mangalists/list-123/items/item-456')
                .send({ order: 1 })
                .expect(200);

            expect(mockControllers.updateMangaItem).toHaveBeenCalled();
        });
    });

    describe('Request Body Handling', () => {
        it('deve processar JSON corretamente', async () => {
            const { requireAuth } = require('@/middlewares/auth');
            
            // Mock admin user
            requireAuth.mockImplementation((req, res, next) => {
                req.user = { id: 'admin-123', role: 'admin' };
                next();
            });

            const listData = {
                name: 'Test List',
                cover: 'https://example.com/cover.jpg',
                mood: 'Action',
                status: 'PRIVATE'
            };

            await request(adminApp)
                .post('/admin/mangalists')
                .send(listData)
                .expect(201);

            expect(mockControllers.create).toHaveBeenCalled();
        });

        it('deve aceitar dados de reordenação complexos', async () => {
            const { requireAuth } = require('@/middlewares/auth');
            
            // Mock admin user
            requireAuth.mockImplementation((req, res, next) => {
                req.user = { id: 'admin-123', role: 'admin' };
                next();
            });

            const complexReorderData = {
                items: [
                    { id: '550e8400-e29b-41d4-a716-446655440000', order: 0 },
                    { id: '550e8400-e29b-41d4-a716-446655440001', order: 1 },
                    { id: '550e8400-e29b-41d4-a716-446655440002', order: 2 },
                    { id: '550e8400-e29b-41d4-a716-446655440003', order: 3 },
                    { id: '550e8400-e29b-41d4-a716-446655440004', order: 4 }
                ]
            };

            await request(adminApp)
                .put('/admin/mangalists/list-123/items/reorder')
                .send(complexReorderData)
                .expect(200);

            expect(mockControllers.reorderItems).toHaveBeenCalled();
        });
    });
});