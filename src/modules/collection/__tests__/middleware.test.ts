import { Request, Response, NextFunction } from 'express';
import { requireCollectionOwner, requireCollectionAdmin, requireCollectionEditor } from '../middlewares/collaboratorAuth';
import * as CollaboratorHandler from '../handlers/CollaboratorHandler';

// Extender o tipo Request para incluir a propriedade user
interface RequestWithUser extends Request {
    user?: { id: string };
}

// Mock do CollaboratorHandler
jest.mock('../handlers/CollaboratorHandler', () => ({
    checkUserPermission: jest.fn(),
}));

const mockCheckUserPermission = CollaboratorHandler.checkUserPermission as jest.MockedFunction<typeof CollaboratorHandler.checkUserPermission>;

describe('Collaborator Auth Middleware', () => {
    let mockRequest: Partial<RequestWithUser>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        
        mockRequest = {
            params: { id: 'collection123' },
            user: { id: 'user123' }
        } as Partial<RequestWithUser>;
        
        mockResponse = {
            status: statusMock,
            json: jsonMock
        } as Partial<Response>;
        
        mockNext = jest.fn();
        
        jest.clearAllMocks();
    });

    describe('requireCollectionOwner', () => {
        it('should call next() when user is the owner', async () => {
            mockCheckUserPermission.mockResolvedValue({
                hasPermission: true,
                isOwner: true,
                role: 'OWNER'
            });

            await requireCollectionOwner(mockRequest as RequestWithUser, mockResponse as Response, mockNext);

            expect(mockCheckUserPermission).toHaveBeenCalledWith('collection123', 'user123');
            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('should return 401 when user is not authenticated', async () => {
            mockRequest.user = undefined;

            await requireCollectionOwner(mockRequest as RequestWithUser, mockResponse as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Não autorizado' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 403 when user is not the owner', async () => {
            mockCheckUserPermission.mockResolvedValue({
                hasPermission: true,
                isOwner: false,
                role: 'ADMIN'
            });

            await requireCollectionOwner(mockRequest as RequestWithUser, mockResponse as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Apenas o dono da coleção pode realizar esta ação.' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 404 when collection is not found', async () => {
            mockCheckUserPermission.mockRejectedValue(new Error('Collection not found'));

            await requireCollectionOwner(mockRequest as RequestWithUser, mockResponse as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Coleção não encontrada.' });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('requireCollectionAdmin', () => {
        it('should call next() when user is the owner', async () => {
            mockCheckUserPermission.mockResolvedValue({
                hasPermission: true,
                isOwner: true,
                role: 'OWNER'
            });

            await requireCollectionAdmin(mockRequest as RequestWithUser, mockResponse as Response, mockNext);

            expect(mockCheckUserPermission).toHaveBeenCalledWith('collection123', 'user123');
            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('should call next() when user is an admin', async () => {
            mockCheckUserPermission.mockResolvedValue({
                hasPermission: true,
                isOwner: false,
                role: 'ADMIN'
            });

            await requireCollectionAdmin(mockRequest as RequestWithUser, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('should return 401 when user is not authenticated', async () => {
            mockRequest.user = undefined;

            await requireCollectionAdmin(mockRequest as RequestWithUser, mockResponse as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Não autorizado' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 403 when user has no permission', async () => {
            mockCheckUserPermission.mockResolvedValue({
                hasPermission: false,
                isOwner: false,
                role: null
            });

            await requireCollectionAdmin(mockRequest as RequestWithUser, mockResponse as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Você não tem permissão para realizar esta ação.' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 403 when user is only an editor', async () => {
            mockCheckUserPermission.mockResolvedValue({
                hasPermission: true,
                isOwner: false,
                role: 'EDITOR'
            });

            await requireCollectionAdmin(mockRequest as RequestWithUser, mockResponse as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Você não tem permissão para realizar esta ação.' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 404 when collection is not found', async () => {
            mockCheckUserPermission.mockRejectedValue(new Error('Collection not found'));

            await requireCollectionAdmin(mockRequest as RequestWithUser, mockResponse as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Coleção não encontrada.' });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('requireCollectionEditor', () => {
        it('should call next() when user has permission', async () => {
            mockCheckUserPermission.mockResolvedValue({
                hasPermission: true,
                isOwner: false,
                role: 'EDITOR'
            });

            await requireCollectionEditor(mockRequest as RequestWithUser, mockResponse as Response, mockNext);

            expect(mockCheckUserPermission).toHaveBeenCalledWith('collection123', 'user123');
            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('should return 401 when user is not authenticated', async () => {
            mockRequest.user = undefined;

            await requireCollectionEditor(mockRequest as RequestWithUser, mockResponse as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Não autorizado' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 403 when user has no permission', async () => {
            mockCheckUserPermission.mockResolvedValue({
                hasPermission: false,
                isOwner: false,
                role: null
            });

            await requireCollectionEditor(mockRequest as RequestWithUser, mockResponse as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Você não tem permissão para realizar esta ação.' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 404 when collection is not found', async () => {
            mockCheckUserPermission.mockRejectedValue(new Error('Collection not found'));

            await requireCollectionEditor(mockRequest as RequestWithUser, mockResponse as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Coleção não encontrada.' });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
});