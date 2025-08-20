import { Request, Response } from 'express';
import {
    addCollaboratorToCollection,
    listCollectionCollaborators,
    updateCollaboratorRoleInCollection,
    removeCollaboratorFromCollection,
} from '../controllers/CollaboratorController';
import * as CollaboratorHandler from '../handlers/CollaboratorHandler';
import { handleZodError } from '../../../utils/zodError';

// Extender o tipo Request para incluir a propriedade user
interface RequestWithUser extends Request {
    user?: { id: string };
}

// Mock dos handlers
jest.mock('../handlers/CollaboratorHandler', () => ({
    addCollaborator: jest.fn(),
    removeCollaborator: jest.fn(),
    updateCollaboratorRole: jest.fn(),
    listCollaborators: jest.fn(),
    checkUserPermission: jest.fn(),
}));

// Mock do handleZodError
jest.mock('@/utils/zodError', () => ({
    handleZodError: jest.fn(),
}));

const mockAddCollaborator = CollaboratorHandler.addCollaborator as jest.MockedFunction<typeof CollaboratorHandler.addCollaborator>;
const mockRemoveCollaborator = CollaboratorHandler.removeCollaborator as jest.MockedFunction<typeof CollaboratorHandler.removeCollaborator>;
const mockUpdateCollaboratorRole = CollaboratorHandler.updateCollaboratorRole as jest.MockedFunction<typeof CollaboratorHandler.updateCollaboratorRole>;
const mockListCollaborators = CollaboratorHandler.listCollaborators as jest.MockedFunction<typeof CollaboratorHandler.listCollaborators>;
const mockCheckUserPermission = CollaboratorHandler.checkUserPermission as jest.MockedFunction<typeof CollaboratorHandler.checkUserPermission>;
const mockHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;

describe('CollaboratorController', () => {
    let mockRequest: Partial<RequestWithUser>;
    let mockResponse: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        
        mockRequest = {
            params: { id: '123e4567-e89b-12d3-a456-426614174000' },
            body: {},
            user: { id: 'user123' }
        };
        
        mockResponse = {
            status: statusMock,
            json: jsonMock,
        };

        jest.clearAllMocks();
    });

    describe('addCollaboratorToCollection', () => {
        beforeEach(() => {
            mockRequest.body = {
                userId: '123e4567-e89b-12d3-a456-426614174001',
                role: 'EDITOR'
            };
        });

        it('should add collaborator successfully', async () => {
            const mockCollaborator = {
                id: 'collab123',
                userId: '123e4567-e89b-12d3-a456-426614174001',
                collectionId: '123e4567-e89b-12d3-a456-426614174000',
                role: 'EDITOR' as const,
                createdAt: new Date(),
                updatedAt: new Date(),
                user: {
                    id: '123e4567-e89b-12d3-a456-426614174001',
                    name: 'Test User',
                    username: 'testuser',
                    avatar: null,
                },
            };

            mockCheckUserPermission.mockResolvedValue({
                hasPermission: true,
                isOwner: true,
                role: 'OWNER'
            });
            mockAddCollaborator.mockResolvedValue(mockCollaborator);

            await addCollaboratorToCollection(mockRequest as RequestWithUser, mockResponse as Response);

            expect(mockCheckUserPermission).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', 'user123');
            expect(mockAddCollaborator).toHaveBeenCalledWith({
                collectionId: '123e4567-e89b-12d3-a456-426614174000',
                userId: '123e4567-e89b-12d3-a456-426614174001',
                role: 'EDITOR'
            });
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(mockCollaborator);
        });

        it('should return 400 for invalid collection ID', async () => {
            mockRequest.params = { id: 'invalid-uuid' };

            await addCollaboratorToCollection(mockRequest as RequestWithUser, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                issues: expect.arrayContaining([
                    expect.objectContaining({
                        message: 'ID da coleção deve ser um UUID válido'
                    })
                ])
            }));
        });

        it('should return 400 for invalid body data', async () => {
            mockRequest.body = { userId: 'invalid-uuid' };

            await addCollaboratorToCollection(mockRequest as RequestWithUser, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                issues: expect.arrayContaining([
                    expect.objectContaining({
                        message: 'ID do usuário deve ser um UUID válido'
                    })
                ])
            }));
        });

        it('should return 401 when user is not authenticated', async () => {
            mockRequest.user = undefined;

            await addCollaboratorToCollection(mockRequest as RequestWithUser, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Não autorizado' });
        });

        it('should return 403 when user has no permission', async () => {
            mockCheckUserPermission.mockResolvedValue({
                hasPermission: false,
                isOwner: false,
                role: null
            });

            await addCollaboratorToCollection(mockRequest as RequestWithUser, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Você não tem permissão para adicionar colaboradores a esta coleção.' });
        });

        it('should return 403 when user is only an editor', async () => {
            mockCheckUserPermission.mockResolvedValue({
                hasPermission: true,
                isOwner: false,
                role: 'EDITOR'
            });

            await addCollaboratorToCollection(mockRequest as RequestWithUser, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Você não tem permissão para adicionar colaboradores a esta coleção.' });
        });

        it('should return 404 when collection is not found', async () => {
            mockCheckUserPermission.mockResolvedValue({
                hasPermission: true,
                isOwner: true,
                role: 'OWNER'
            });
            mockAddCollaborator.mockRejectedValue(new Error('Coleção não encontrada'));

            await addCollaboratorToCollection(mockRequest as RequestWithUser, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Coleção não encontrada' });
        });

        it('should return 400 when user is already a collaborator', async () => {
            mockCheckUserPermission.mockResolvedValue({
                hasPermission: true,
                isOwner: true,
                role: 'OWNER'
            });
            mockAddCollaborator.mockRejectedValue(new Error('Usuário já é colaborador desta coleção'));

            await addCollaboratorToCollection(mockRequest as RequestWithUser, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Usuário já é colaborador desta coleção' });
        });

        it('should handle other errors with zodError', async () => {
            mockCheckUserPermission.mockResolvedValue({
                hasPermission: true,
                isOwner: true,
                role: 'OWNER'
            });
            const error = new Error('Some other error');
            mockAddCollaborator.mockRejectedValue(error);

            await addCollaboratorToCollection(mockRequest as RequestWithUser, mockResponse as Response);

            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockResponse);
        });
    });

    describe('listCollectionCollaborators', () => {
        it('should list collaborators successfully', async () => {
            const mockCollaborators = [
                {
                    id: 'collab1',
                    userId: 'user1',
                    collectionId: '123e4567-e89b-12d3-a456-426614174000',
                    role: 'EDITOR' as const,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    user: {
                        id: 'user1',
                        name: 'User One',
                        username: 'userone',
                        avatar: null,
                    },
                },
                {
                    id: 'collab2',
                    userId: 'user2',
                    collectionId: '123e4567-e89b-12d3-a456-426614174000',
                    role: 'ADMIN' as const,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    user: {
                        id: 'user2',
                        name: 'User Two',
                        username: 'usertwo',
                        avatar: null,
                    },
                }
            ];

            mockCheckUserPermission.mockResolvedValue({
                hasPermission: true,
                isOwner: false,
                role: 'EDITOR'
            });
            mockListCollaborators.mockResolvedValue(mockCollaborators);

            await listCollectionCollaborators(mockRequest as RequestWithUser, mockResponse as Response);

            expect(mockCheckUserPermission).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', 'user123');
            expect(mockListCollaborators).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockCollaborators);
        });

        it('should return 400 for invalid collection ID', async () => {
            mockRequest.params = { id: 'invalid-uuid' };

            await listCollectionCollaborators(mockRequest as RequestWithUser, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should return 401 when user is not authenticated', async () => {
            mockRequest.user = undefined;

            await listCollectionCollaborators(mockRequest as RequestWithUser, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Não autorizado' });
        });

        it('should return 403 when user has no permission', async () => {
            mockCheckUserPermission.mockResolvedValue({
                hasPermission: false,
                isOwner: false,
                role: null
            });

            await listCollectionCollaborators(mockRequest as RequestWithUser, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Você não tem permissão para visualizar colaboradores desta coleção.' });
        });

        it('should return 404 when collection is not found', async () => {
            mockCheckUserPermission.mockResolvedValue({
                hasPermission: true,
                isOwner: true,
                role: 'OWNER'
            });
            mockListCollaborators.mockRejectedValue(new Error('Coleção não encontrada'));

            await listCollectionCollaborators(mockRequest as RequestWithUser, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Coleção não encontrada' });
        });

        it('should handle other errors with zodError', async () => {
            mockCheckUserPermission.mockResolvedValue({
                hasPermission: true,
                isOwner: true,
                role: 'OWNER'
            });
            const error = new Error('Some other error');
            mockListCollaborators.mockRejectedValue(error);

            await listCollectionCollaborators(mockRequest as RequestWithUser, mockResponse as Response);

            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockResponse);
        });
    });

    describe('updateCollaboratorRoleInCollection', () => {
        beforeEach(() => {
            mockRequest.params = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                userId: '123e4567-e89b-12d3-a456-426614174001'
            };
            mockRequest.body = { role: 'ADMIN' };
        });

        it('should update collaborator role successfully', async () => {
            const mockUpdatedCollaborator = {
                id: 'collab123',
                userId: '123e4567-e89b-12d3-a456-426614174001',
                collectionId: '123e4567-e89b-12d3-a456-426614174000',
                role: 'ADMIN' as const,
                createdAt: new Date(),
                updatedAt: new Date(),
                user: {
                    id: '123e4567-e89b-12d3-a456-426614174001',
                    name: 'Test User',
                    username: 'testuser',
                    avatar: null,
                },
            };

            mockCheckUserPermission.mockResolvedValue({
                hasPermission: true,
                isOwner: true,
                role: 'OWNER'
            });
            mockUpdateCollaboratorRole.mockResolvedValue(mockUpdatedCollaborator);

            await updateCollaboratorRoleInCollection(mockRequest as RequestWithUser, mockResponse as Response);

            expect(mockCheckUserPermission).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', 'user123');
            expect(mockUpdateCollaboratorRole).toHaveBeenCalledWith({
                collectionId: '123e4567-e89b-12d3-a456-426614174000',
                userId: '123e4567-e89b-12d3-a456-426614174001',
                role: 'ADMIN'
            });
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockUpdatedCollaborator);
        });

        it('should return 400 for invalid params', async () => {
            mockRequest.params = { id: 'invalid-uuid', userId: 'invalid-uuid' };

            await updateCollaboratorRoleInCollection(mockRequest as RequestWithUser, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should return 401 when user is not authenticated', async () => {
            mockRequest.user = undefined;

            await updateCollaboratorRoleInCollection(mockRequest as RequestWithUser, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Não autorizado' });
        });

        it('should return 403 when user has no permission', async () => {
            mockCheckUserPermission.mockResolvedValue({
                hasPermission: false,
                isOwner: false,
                role: null
            });

            await updateCollaboratorRoleInCollection(mockRequest as RequestWithUser, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Você não tem permissão para atualizar colaboradores desta coleção.' });
        });

        it('should return 404 when collaborator is not found', async () => {
            mockCheckUserPermission.mockResolvedValue({
                hasPermission: true,
                isOwner: true,
                role: 'OWNER'
            });
            mockUpdateCollaboratorRole.mockRejectedValue(new Error('Colaborador não encontrado'));

            await updateCollaboratorRoleInCollection(mockRequest as RequestWithUser, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Colaborador não encontrado' });
        });
    });

    describe('removeCollaboratorFromCollection', () => {
        beforeEach(() => {
            mockRequest.params = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                userId: '123e4567-e89b-12d3-a456-426614174001'
            };
        });

        it('should remove collaborator successfully', async () => {
            const mockResult = { message: 'Colaborador removido com sucesso' };

            mockCheckUserPermission.mockResolvedValue({
                hasPermission: true,
                isOwner: true,
                role: 'OWNER'
            });
            mockRemoveCollaborator.mockResolvedValue(mockResult);

            await removeCollaboratorFromCollection(mockRequest as RequestWithUser, mockResponse as Response);

            expect(mockCheckUserPermission).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', 'user123');
            expect(mockRemoveCollaborator).toHaveBeenCalledWith({
                collectionId: '123e4567-e89b-12d3-a456-426614174000',
                userId: '123e4567-e89b-12d3-a456-426614174001'
            });
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockResult);
        });

        it('should return 400 for invalid params', async () => {
            mockRequest.params = { id: 'invalid-uuid', userId: 'invalid-uuid' };

            await removeCollaboratorFromCollection(mockRequest as RequestWithUser, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should return 401 when user is not authenticated', async () => {
            mockRequest.user = undefined;

            await removeCollaboratorFromCollection(mockRequest as RequestWithUser, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Não autorizado' });
        });

        it('should return 403 when user has no permission', async () => {
            mockCheckUserPermission.mockResolvedValue({
                hasPermission: false,
                isOwner: false,
                role: null
            });

            await removeCollaboratorFromCollection(mockRequest as RequestWithUser, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Você não tem permissão para remover colaboradores desta coleção.' });
        });

        it('should return 404 when collaborator is not found', async () => {
            mockCheckUserPermission.mockResolvedValue({
                hasPermission: true,
                isOwner: true,
                role: 'OWNER'
            });
            mockRemoveCollaborator.mockRejectedValue(new Error('Colaborador não encontrado'));

            await removeCollaboratorFromCollection(mockRequest as RequestWithUser, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Colaborador não encontrado' });
        });

        it('should handle other errors with zodError', async () => {
            mockCheckUserPermission.mockResolvedValue({
                hasPermission: true,
                isOwner: true,
                role: 'OWNER'
            });
            const error = new Error('Some other error');
            mockRemoveCollaborator.mockRejectedValue(error);

            await removeCollaboratorFromCollection(mockRequest as RequestWithUser, mockResponse as Response);

            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockResponse);
        });
    });
});