import { Request, Response, NextFunction } from 'express';
import { handleZodError } from '../../../utils/zodError';

// Mock dos handlers
jest.mock('../handlers/MangaListHandler', () => ({
    createMangaList: jest.fn(),
    getMangaLists: jest.fn(),
    getPublicMangaLists: jest.fn(),
    getMangaListById: jest.fn(),
    updateMangaList: jest.fn(),
    deleteMangaList: jest.fn(),
    addMangaToList: jest.fn(),
    removeMangaFromList: jest.fn(),
    updateMangaListItem: jest.fn(),
    reorderMangaListItems: jest.fn(),
    bulkAddMangasToList: jest.fn(),
    MangaListNotFoundError: class extends Error {
        constructor() {
            super('Lista de mangás não encontrada');
            this.name = 'MangaListNotFoundError';
        }
    },
    MangaNotFoundError: class extends Error {
        constructor() {
            super('Mangá não encontrado');
            this.name = 'MangaNotFoundError';
        }
    },
    MangaAlreadyInListError: class extends Error {
        constructor() {
            super('Mangá já está na lista');
            this.name = 'MangaAlreadyInListError';
        }
    }
}));

jest.mock('../../../utils/zodError');

const mockMangaListHandlers = require('../handlers/MangaListHandler');
const mockHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;

import { MangaListController } from '../controllers/MangalistController';

describe('Controllers MangaList', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;
    let jsonSpy: jest.SpyInstance;
    let statusSpy: jest.SpyInstance;

    beforeEach(() => {
        mockReq = {
            body: {},
            params: {},
            query: {},
            user: { id: 'user-123' }
        };
        
        jsonSpy = jest.fn().mockReturnThis();
        statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
        mockNext = jest.fn();
        
        mockRes = {
            status: statusSpy as any,
            json: jsonSpy as any
        };

        jest.clearAllMocks();
    });

    const mockMangaListData = {
        id: 'list-123',
        name: 'Minha Lista',
        cover: 'https://example.com/cover.jpg',
        mood: 'Ação',
        description: 'Lista de ação',
        status: 'PUBLIC',
        isDefault: false,
        _count: {
            items: 5,
            likes: 10
        }
    };

    const mockMangaListItem = {
        id: 'item-123',
        listId: 'list-123',
        mangaId: 'manga-123',
        order: 0,
        note: 'Ótimo mangá',
        manga: {
            id: 'manga-123',
            title: 'Manga Teste',
            cover: 'https://example.com/manga-cover.jpg',
            status: 'ongoing'
        }
    };

    describe('createMangaList', () => {
        it('deve criar lista de mangás com sucesso', async () => {
            mockReq.body = {
                name: 'Nova Lista',
                cover: 'https://example.com/cover.jpg',
                mood: 'Aventura',
                description: 'Lista de aventuras'
            };

            mockMangaListHandlers.createMangaList.mockResolvedValue(mockMangaListData);

            await MangaListController.createMangaList(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaListHandlers.createMangaList).toHaveBeenCalledWith(mockReq.body);
            expect(statusSpy).toHaveBeenCalledWith(201);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: mockMangaListData
            });
        });

        it('deve tratar erro de validação', async () => {
            const zodError = new Error('Validation error');
            zodError.name = 'ZodError';

            mockMangaListHandlers.createMangaList.mockRejectedValue(zodError);
            mockHandleZodError.mockReturnValue({
                success: false,
                message: 'Dados inválidos',
                errors: []
            });

            await MangaListController.createMangaList(mockReq as Request, mockRes as Response, mockNext);

            expect(mockHandleZodError).toHaveBeenCalledWith(zodError);
            expect(statusSpy).toHaveBeenCalledWith(400);
        });

        it('deve tratar erro interno do servidor', async () => {
            const error = new Error('Database error');
            mockMangaListHandlers.createMangaList.mockRejectedValue(error);

            await MangaListController.createMangaList(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(500);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: 'Erro interno do servidor'
            });
        });
    });

    describe('getMangaLists', () => {
        it('deve listar listas de mangás com filtros', async () => {
            mockReq.query = {
                status: 'PUBLIC',
                search: 'ação',
                page: '1',
                limit: '20'
            };

            const mockResponse = {
                lists: [mockMangaListData],
                total: 1,
                totalPages: 1,
                currentPage: 1
            };

            mockMangaListHandlers.getMangaLists.mockResolvedValue(mockResponse);

            await MangaListController.getMangaLists(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaListHandlers.getMangaLists).toHaveBeenCalledWith({
                status: 'PUBLIC',
                search: 'ação',
                page: 1,
                limit: 20
            });

            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                ...mockResponse
            });
        });

        it('deve usar valores padrão para parâmetros opcionais', async () => {
            mockReq.query = {};

            const mockResponse = {
                lists: [],
                total: 0,
                totalPages: 0,
                currentPage: 1
            };

            mockMangaListHandlers.getMangaLists.mockResolvedValue(mockResponse);

            await MangaListController.getMangaLists(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaListHandlers.getMangaLists).toHaveBeenCalledWith({
                page: 1,
                limit: 20
            });
        });
    });

    describe('getPublicMangaLists', () => {
        it('deve retornar apenas listas públicas', async () => {
            mockReq.query = {
                page: '1',
                limit: '10'
            };

            const mockResponse = {
                lists: [mockMangaListData],
                total: 1,
                totalPages: 1,
                currentPage: 1
            };

            mockMangaListHandlers.getPublicMangaLists.mockResolvedValue(mockResponse);

            await MangaListController.getPublicMangaLists(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaListHandlers.getPublicMangaLists).toHaveBeenCalledWith({
                page: 1,
                limit: 10
            });

            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                ...mockResponse
            });
        });
    });

    describe('getMangaListById', () => {
        it('deve retornar lista por ID', async () => {
            mockReq.params = { id: 'list-123' };

            const mockListWithItems = {
                ...mockMangaListData,
                items: [mockMangaListItem]
            };

            mockMangaListHandlers.getMangaListById.mockResolvedValue(mockListWithItems);

            await MangaListController.getMangaListById(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaListHandlers.getMangaListById).toHaveBeenCalledWith('list-123');
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: mockListWithItems
            });
        });

        it('deve tratar lista não encontrada', async () => {
            mockReq.params = { id: 'invalid-id' };
            
            const error = new mockMangaListHandlers.MangaListNotFoundError();
            mockMangaListHandlers.getMangaListById.mockRejectedValue(error);

            await MangaListController.getMangaListById(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(404);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: 'Lista de mangás não encontrada'
            });
        });
    });

    describe('updateMangaList', () => {
        it('deve atualizar lista com sucesso', async () => {
            mockReq.params = { id: 'list-123' };
            mockReq.body = {
                name: 'Lista Atualizada',
                description: 'Nova descrição'
            };

            const updatedList = {
                ...mockMangaListData,
                name: 'Lista Atualizada',
                description: 'Nova descrição'
            };

            mockMangaListHandlers.updateMangaList.mockResolvedValue(updatedList);

            await MangaListController.updateMangaList(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaListHandlers.updateMangaList).toHaveBeenCalledWith('list-123', mockReq.body);
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: updatedList
            });
        });

        it('deve tratar lista não encontrada', async () => {
            mockReq.params = { id: 'invalid-id' };
            mockReq.body = { name: 'Teste' };
            
            const error = new mockMangaListHandlers.MangaListNotFoundError();
            mockMangaListHandlers.updateMangaList.mockRejectedValue(error);

            await MangaListController.updateMangaList(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(404);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: 'Lista de mangás não encontrada'
            });
        });
    });

    describe('deleteMangaList', () => {
        it('deve deletar lista com sucesso', async () => {
            mockReq.params = { id: 'list-123' };

            const deleteResponse = {
                message: 'Lista deletada com sucesso'
            };

            mockMangaListHandlers.deleteMangaList.mockResolvedValue(deleteResponse);

            await MangaListController.deleteMangaList(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaListHandlers.deleteMangaList).toHaveBeenCalledWith('list-123');
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                ...deleteResponse
            });
        });

        it('deve tratar lista não encontrada', async () => {
            mockReq.params = { id: 'invalid-id' };
            
            const error = new mockMangaListHandlers.MangaListNotFoundError();
            mockMangaListHandlers.deleteMangaList.mockRejectedValue(error);

            await MangaListController.deleteMangaList(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(404);
        });
    });

    describe('addMangaToList', () => {
        it('deve adicionar mangá à lista com sucesso', async () => {
            mockReq.params = { listId: 'list-123' };
            mockReq.body = {
                mangaId: 'manga-123',
                note: 'Ótimo mangá'
            };

            mockMangaListHandlers.addMangaToList.mockResolvedValue(mockMangaListItem);

            await MangaListController.addMangaToList(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaListHandlers.addMangaToList).toHaveBeenCalledWith('list-123', mockReq.body);
            expect(statusSpy).toHaveBeenCalledWith(201);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: mockMangaListItem
            });
        });

        it('deve tratar mangá já na lista', async () => {
            mockReq.params = { listId: 'list-123' };
            mockReq.body = { mangaId: 'manga-123' };
            
            const error = new mockMangaListHandlers.MangaAlreadyInListError();
            mockMangaListHandlers.addMangaToList.mockRejectedValue(error);

            await MangaListController.addMangaToList(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(409);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: 'Mangá já está na lista'
            });
        });

        it('deve tratar mangá não encontrado', async () => {
            mockReq.params = { listId: 'list-123' };
            mockReq.body = { mangaId: 'invalid-manga' };
            
            const error = new mockMangaListHandlers.MangaNotFoundError();
            mockMangaListHandlers.addMangaToList.mockRejectedValue(error);

            await MangaListController.addMangaToList(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(404);
        });
    });

    describe('removeMangaFromList', () => {
        it('deve remover mangá da lista com sucesso', async () => {
            mockReq.params = { listId: 'list-123', itemId: 'item-123' };

            const removeResponse = {
                message: 'Mangá removido da lista com sucesso'
            };

            mockMangaListHandlers.removeMangaFromList.mockResolvedValue(removeResponse);

            await MangaListController.removeMangaFromList(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaListHandlers.removeMangaFromList).toHaveBeenCalledWith('list-123', 'item-123');
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                ...removeResponse
            });
        });
    });

    describe('updateMangaListItem', () => {
        it('deve atualizar item da lista com sucesso', async () => {
            mockReq.params = { listId: 'list-123', itemId: 'item-123' };
            mockReq.body = {
                order: 5,
                note: 'Nova nota'
            };

            const updatedItem = {
                ...mockMangaListItem,
                order: 5,
                note: 'Nova nota'
            };

            mockMangaListHandlers.updateMangaListItem.mockResolvedValue(updatedItem);

            await MangaListController.updateMangaListItem(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaListHandlers.updateMangaListItem).toHaveBeenCalledWith('list-123', 'item-123', mockReq.body);
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: updatedItem
            });
        });
    });

    describe('reorderMangaListItems', () => {
        it('deve reordenar itens da lista com sucesso', async () => {
            mockReq.params = { listId: 'list-123' };
            mockReq.body = {
                items: [
                    { id: 'item-123', order: 0 },
                    { id: 'item-456', order: 1 }
                ]
            };

            const reorderResponse = {
                message: 'Itens reordenados com sucesso',
                updatedItems: 2
            };

            mockMangaListHandlers.reorderMangaListItems.mockResolvedValue(reorderResponse);

            await MangaListController.reorderMangaListItems(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaListHandlers.reorderMangaListItems).toHaveBeenCalledWith('list-123', mockReq.body);
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                ...reorderResponse
            });
        });
    });

    describe('bulkAddMangasToList', () => {
        it('deve adicionar mangás em lote com sucesso', async () => {
            mockReq.params = { listId: 'list-123' };
            mockReq.body = {
                mangaIds: ['manga-123', 'manga-456'],
                notes: {
                    'manga-123': 'Nota do primeiro',
                    'manga-456': 'Nota do segundo'
                }
            };

            const bulkResponse = {
                added: 2,
                skipped: 0,
                errors: []
            };

            mockMangaListHandlers.bulkAddMangasToList.mockResolvedValue(bulkResponse);

            await MangaListController.bulkAddMangasToList(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaListHandlers.bulkAddMangasToList).toHaveBeenCalledWith('list-123', mockReq.body);
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: bulkResponse
            });
        });
    });

    describe('Error Handling', () => {
        it('deve tratar ZodError em qualquer endpoint', async () => {
            const zodError = new Error('Invalid data');
            zodError.name = 'ZodError';

            mockMangaListHandlers.createMangaList.mockRejectedValue(zodError);
            mockHandleZodError.mockReturnValue({
                success: false,
                message: 'Dados inválidos',
                errors: ['Campo obrigatório']
            });

            await MangaListController.createMangaList(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(400);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: 'Dados inválidos',
                errors: ['Campo obrigatório']
            });
        });

        it('deve tratar erros genéricos', async () => {
            const genericError = new Error('Unexpected error');
            mockMangaListHandlers.getMangaLists.mockRejectedValue(genericError);

            await MangaListController.getMangaLists(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(500);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: 'Erro interno do servidor'
            });
        });
    });
});