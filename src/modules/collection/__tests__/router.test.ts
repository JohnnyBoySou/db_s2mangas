import request from 'supertest';
import express from 'express';

// Mock do middleware de autenticação (definido antes do jest.mock)
const mockRequireAuth = jest.fn((req: any, res: any, next: any) => {
    req.user = { id: 'user123', email: 'test@example.com' };
    next();
});

// Mock dos controllers (definidos antes do jest.mock)
const mockCollectionControllers = {
    create: jest.fn(),
    list: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    listPublic: jest.fn(),
    checkInCollections: jest.fn(),
    toggleCollection: jest.fn(),
};

const mockCollaboratorControllers = {
    addCollaboratorToCollection: jest.fn(),
    listCollectionCollaborators: jest.fn(),
    updateCollaboratorRoleInCollection: jest.fn(),
    removeCollaboratorFromCollection: jest.fn(),
};

jest.mock('@/middlewares/auth', () => ({
    requireAuth: mockRequireAuth,
}));

jest.mock('../controllers/CollectionController', () => ({
    create: mockCollectionControllers.create,
    list: mockCollectionControllers.list,
    get: mockCollectionControllers.get,
    update: mockCollectionControllers.update,
    remove: mockCollectionControllers.remove,
    listPublic: mockCollectionControllers.listPublic,
    checkInCollections: mockCollectionControllers.checkInCollections,
    toggleCollection: mockCollectionControllers.toggleCollection,
}));

jest.mock('../controllers/CollaboratorController', () => ({
    addCollaboratorToCollection: mockCollaboratorControllers.addCollaboratorToCollection,
    listCollectionCollaborators: mockCollaboratorControllers.listCollectionCollaborators,
    updateCollaboratorRoleInCollection: mockCollaboratorControllers.updateCollaboratorRoleInCollection,
    removeCollaboratorFromCollection: mockCollaboratorControllers.removeCollaboratorFromCollection,
}));

import { CollectionRouter } from '../routers/CollectionRouter';

describe('CollectionRouter', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/collections', CollectionRouter);
        
        // Reset all mocks
        jest.clearAllMocks();
        
        // Setup default mock responses
        mockCollectionControllers.create.mockImplementation((req: any, res: any) => {
            res.status(201).json({ id: '123', ...req.body });
        });
        
        mockCollectionControllers.list.mockImplementation((req: any, res: any) => {
            res.json({ collections: [], total: 0 });
        });
        
        mockCollectionControllers.get.mockImplementation((req: any, res: any) => {
            res.json({ id: req.params.id, name: 'Test Collection' });
        });
        
        mockCollectionControllers.update.mockImplementation((req: any, res: any) => {
            res.json({ id: req.params.id, ...req.body });
        });
        
        mockCollectionControllers.remove.mockImplementation((req: any, res: any) => {
            res.status(204).send();
        });
        
        mockCollectionControllers.listPublic.mockImplementation((req: any, res: any) => {
            res.json({ collections: [], total: 0 });
        });
        
        mockCollectionControllers.checkInCollections.mockImplementation((req: any, res: any) => {
            res.json({ inCollections: [] });
        });
        
        mockCollectionControllers.toggleCollection.mockImplementation((req: any, res: any) => {
            res.json({ success: true });
        });
        
        // Setup collaborator mock responses
        mockCollaboratorControllers.addCollaboratorToCollection.mockImplementation((req: any, res: any) => {
            res.status(201).json({ success: true });
        });
        
        mockCollaboratorControllers.listCollectionCollaborators.mockImplementation((req: any, res: any) => {
            res.json({ collaborators: [] });
        });
        
        mockCollaboratorControllers.updateCollaboratorRoleInCollection.mockImplementation((req: any, res: any) => {
            res.json({ success: true });
        });
        
        mockCollaboratorControllers.removeCollaboratorFromCollection.mockImplementation((req: any, res: any) => {
            res.status(204).send();
        });
    });

    describe('Collection Routes', () => {
        describe('POST /collections', () => {
            it('should call requireAuth middleware and create controller', async () => {
                await request(app)
                    .post('/collections')
                    .send({ name: 'Test Collection' })
                    .expect(201);

                expect(mockRequireAuth).toHaveBeenCalled();
                expect(mockCollectionControllers.create).toHaveBeenCalled();
            });
        });

        describe('GET /collections', () => {
            it('should call requireAuth middleware and list controller', async () => {
                await request(app)
                    .get('/collections')
                    .expect(200);

                expect(mockRequireAuth).toHaveBeenCalled();
                expect(mockCollectionControllers.list).toHaveBeenCalled();
            });
        });

        describe('GET /collections/public', () => {
            it('should call requireAuth middleware and listPublic controller', async () => {
                await request(app)
                    .get('/collections/public')
                    .expect(200);

                expect(mockRequireAuth).toHaveBeenCalled();
                expect(mockCollectionControllers.listPublic).toHaveBeenCalled();
            });
        });

        describe('GET /collections/:id', () => {
            it('should call requireAuth middleware and get controller', async () => {
                await request(app)
                    .get('/collections/123')
                    .expect(200);

                expect(mockRequireAuth).toHaveBeenCalled();
                expect(mockCollectionControllers.get).toHaveBeenCalled();
            });
        });

        describe('PUT /collections/:id', () => {
            it('should call requireAuth middleware and update controller', async () => {
                await request(app)
                    .put('/collections/123')
                    .send({ name: 'Updated Collection' })
                    .expect(200);

                expect(mockRequireAuth).toHaveBeenCalled();
                expect(mockCollectionControllers.update).toHaveBeenCalled();
            });
        });

        describe('DELETE /collections/:id', () => {
            it('should call requireAuth middleware and remove controller', async () => {
                await request(app)
                    .delete('/collections/123')
                    .expect(204);

                expect(mockRequireAuth).toHaveBeenCalled();
                expect(mockCollectionControllers.remove).toHaveBeenCalled();
            });
        });

        describe('GET /collections/check/:mangaId', () => {
            it('should call requireAuth middleware and checkInCollections controller', async () => {
                await request(app)
                    .get('/collections/check/456')
                    .expect(200);

                expect(mockRequireAuth).toHaveBeenCalled();
                expect(mockCollectionControllers.checkInCollections).toHaveBeenCalled();
            });
        });

        describe('POST /collections/:id/toggle/:mangaId', () => {
            it('should call requireAuth middleware and toggleCollection controller', async () => {
                await request(app)
                    .post('/collections/123/toggle/456')
                    .expect(200);

                expect(mockRequireAuth).toHaveBeenCalled();
                expect(mockCollectionControllers.toggleCollection).toHaveBeenCalled();
            });
        });
    });

    describe('Collaborator Routes', () => {
        describe('POST /collections/:id/collaborators', () => {
            it('should call requireAuth middleware and addCollaboratorToCollection controller', async () => {
                await request(app)
                    .post('/collections/123/collaborators')
                    .send({ userId: 'user456', role: 'VIEWER' })
                    .expect(201);

                expect(mockRequireAuth).toHaveBeenCalled();
                expect(mockCollaboratorControllers.addCollaboratorToCollection).toHaveBeenCalled();
            });
        });

        describe('GET /collections/:id/collaborators', () => {
            it('should call requireAuth middleware and listCollectionCollaborators controller', async () => {
                await request(app)
                    .get('/collections/123/collaborators')
                    .expect(200);

                expect(mockRequireAuth).toHaveBeenCalled();
                expect(mockCollaboratorControllers.listCollectionCollaborators).toHaveBeenCalled();
            });
        });

        describe('PUT /collections/:id/collaborators/:userId', () => {
            it('should call requireAuth middleware and updateCollaboratorRoleInCollection controller', async () => {
                await request(app)
                    .put('/collections/123/collaborators/user456')
                    .send({ role: 'EDITOR' })
                    .expect(200);

                expect(mockRequireAuth).toHaveBeenCalled();
                expect(mockCollaboratorControllers.updateCollaboratorRoleInCollection).toHaveBeenCalled();
            });
        });

        describe('DELETE /collections/:id/collaborators/:userId', () => {
            it('should call requireAuth middleware and removeCollaboratorFromCollection controller', async () => {
                await request(app)
                    .delete('/collections/123/collaborators/user456')
                    .expect(204);

                expect(mockRequireAuth).toHaveBeenCalled();
                expect(mockCollaboratorControllers.removeCollaboratorFromCollection).toHaveBeenCalled();
            });
        });
    });
});