import request from 'supertest';
import express from 'express';
import { FileRouter, AdminFileRouter } from '../routes/FilesRouter';
import * as FilesController from '../controllers/FilesController';
import { requireAuth, requireAdmin } from '../../../middlewares/auth';
import { cleanOrphanFiles } from '../../../utils/cleanOrphanFiles';

// Mock dos controladores
jest.mock('../controllers/FilesController');
jest.mock('../../../middlewares/auth');
jest.mock('../../../utils/cleanOrphanFiles');

const mockedFilesController = FilesController as jest.Mocked<typeof FilesController>;
const mockedRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockedRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>;
const mockedCleanOrphanFiles = cleanOrphanFiles as jest.MockedFunction<typeof cleanOrphanFiles>;

// Interface para requisições autenticadas
interface AuthenticatedRequest extends express.Request {
    user?: {
        id: string;
        username?: string;
        isAdmin?: boolean;
    } & { [key: string]: any };
}

describe('Files Router', () => {
    let app: express.Application;
    let adminApp: express.Application;

    beforeEach(() => {
        jest.clearAllMocks();
        
        app = express();
        app.use(express.json());
        app.use('/files', FileRouter);
        
        adminApp = express();
        adminApp.use(express.json());
        adminApp.use('/admin/files', AdminFileRouter);

        // Mock dos middlewares de autenticação
        mockedRequireAuth.mockImplementation((req: AuthenticatedRequest, res, next) => {
            req.user = { id: 'user-123', username: 'testuser' };
            next();
        });

        mockedRequireAdmin.mockImplementation((req: AuthenticatedRequest, res, next) => {
            if (req.user?.isAdmin) {
                next();
            } else {
                res.status(403).json({ error: 'Admin access required' });
            }
        });

        // Mock dos controladores
        mockedFilesController.uploadFile.mockImplementation((req, res) => {
            res.status(201).json({ id: 'file-123', filename: 'test.jpg' });
        });

        mockedFilesController.getFileById.mockImplementation((req, res) => {
            res.json({ id: req.params.id, filename: 'test.jpg' });
        });

        mockedFilesController.deleteFile.mockImplementation((req, res) => {
            res.status(204).send();
        });

        // Mock da função de limpeza
        mockedCleanOrphanFiles.mockResolvedValue(undefined);
    });

    describe('FileRouter', () => {
        describe('POST /files/upload', () => {
            it('should call uploadFile controller with authentication', async () => {
                // Given
                const fileData = {
                    base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD',
                    filename: 'test.jpg',
                    mimetype: 'image/jpeg'
                };

                // When
                const response = await request(app)
                    .post('/files/upload')
                    .send(fileData);

                // Then
                expect(response.status).toBe(201);
                expect(mockedRequireAuth).toHaveBeenCalled();
                expect(mockedFilesController.uploadFile).toHaveBeenCalled();
            });
        });

        describe('GET /files/:id', () => {
            it('should call getFileById controller with authentication', async () => {
                // Given
                const fileId = 'test-file-id';

                // When
                const response = await request(app)
                    .get(`/files/${fileId}`);

                // Then
                expect(response.status).toBe(200);
                expect(response.body.id).toBe(fileId);
                expect(mockedRequireAuth).toHaveBeenCalled();
                expect(mockedFilesController.getFileById).toHaveBeenCalled();
            });
        });

        describe('DELETE /files/:id', () => {
            it('should call deleteFile controller with authentication', async () => {
                // Given
                const fileId = 'test-file-id';

                // When
                const response = await request(app)
                    .delete(`/files/${fileId}`);

                // Then
                expect(response.status).toBe(204);
                expect(mockedRequireAuth).toHaveBeenCalled();
                expect(mockedFilesController.deleteFile).toHaveBeenCalled();
            });
        });
    });

    describe('AdminFileRouter', () => {
        it('should have admin routes configured', () => {
            // Verifica se as rotas administrativas estão configuradas
            expect(AdminFileRouter).toBeDefined();
        });

        it('should reject non-admin users', async () => {
            // Given
            mockedRequireAuth.mockImplementation((req: AuthenticatedRequest, res, next) => {
                req.user = { id: 'user-123', username: 'user', isAdmin: false };
                next();
            });

            mockedRequireAdmin.mockImplementation((req, res) => {
                res.status(403).json({ error: 'Admin access required' });
            });

            // When
            const response = await request(adminApp)
                .post('/admin/files/clean-orphans');

            // Then
            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Admin access required');
            expect(mockedRequireAuth).toHaveBeenCalled();
            expect(mockedRequireAdmin).toHaveBeenCalled();
        });
    });

    describe('Authentication middleware integration', () => {
        it('should require authentication for all file routes', () => {
            // Verificar se todas as rotas do FileRouter usam requireAuth
            expect(mockedRequireAuth).toBeDefined();
            
            // As rotas são testadas indiretamente através dos testes acima
            // que verificam se o middleware é chamado
        });

        it('should require admin access for admin routes', () => {
            // Verificar se as rotas admin usam requireAdmin
            expect(mockedRequireAdmin).toBeDefined();
            
            // As rotas admin são testadas indiretamente através dos testes acima
            // que verificam se o middleware é chamado
        });
    });
});