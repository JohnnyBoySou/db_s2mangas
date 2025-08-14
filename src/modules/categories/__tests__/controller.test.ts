import { Request, Response, NextFunction } from 'express';
import { handleZodError } from '../../../utils/zodError';

// Mock dos handlers
jest.mock('../handlers/CategoriesHandler', () => ({
    CategoryHandler: {
        create: jest.fn(),
        list: jest.fn(),
        getById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    }
}));

jest.mock('../../../utils/zodError');

const mockCategoryHandlers = require('../handlers/CategoriesHandler');
const mockHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;

import { CategoryController } from '../controllers/CategoriesController';

describe('Controllers Categories', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;
    let jsonSpy: jest.SpyInstance;
    let statusSpy: jest.SpyInstance;

    beforeEach(() => {
        mockReq = {
            body: {},
            params: {},
            query: {}
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

    const mockCategoryData = {
        id: 'cat-a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Ação',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
    };

    const mockCategoryWithMangas = {
        ...mockCategoryData,
        mangas: [
            {
                id: 'manga-123',
                manga_uuid: 'uuid-123',
                title: 'Manga Teste',
                cover: 'cover.jpg',
                type: 'manga',
                status: 'ongoing',
                releaseDate: new Date('2023-01-01'),
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-01'),
                translations: [
                    {
                        id: 'trans-123',
                        name: 'Manga Teste',
                        mangaId: 'manga-123',
                        language: 'pt',
                        description: 'Descrição do manga'
                    }
                ],
                languages: [
                    {
                        id: 'lang-123',
                        name: 'Português',
                        code: 'pt'
                    }
                ]
            }
        ]
    };

    describe('create', () => {
        it('deve criar uma categoria com sucesso', async () => {
            const categoryData = {
                name: 'Romance'
            };

            mockReq.body = categoryData;
            mockCategoryHandlers.CategoryHandler.create.mockResolvedValue(mockCategoryData);

            await CategoryController.create(mockReq as Request, mockRes as Response);

            expect(mockCategoryHandlers.CategoryHandler.create).toHaveBeenCalledWith(categoryData);
            expect(statusSpy).toHaveBeenCalledWith(201);
            expect(jsonSpy).toHaveBeenCalledWith(mockCategoryData);
        });

        it('deve tratar erros usando handleZodError', async () => {
            mockReq.body = { name: '' }; // Dados inválidos

            await CategoryController.create(mockReq as Request, mockRes as Response);

            expect(mockHandleZodError).toHaveBeenCalled();
        });
    });

    describe('list', () => {
        it('deve listar todas as categorias com sucesso', async () => {
            const mockCategoriesResponse = {
                data: [
                    {
                        ...mockCategoryData,
                        _count: { mangas: 5 }
                    },
                    {
                        id: 'cat-b2c3d4e5-f6g7-8901-bcde-f23456789012',
                        name: 'Comédia',
                        createdAt: new Date('2023-01-02'),
                        updatedAt: new Date('2023-01-02'),
                        _count: { mangas: 3 }
                    }
                ],
                pagination: {
                    total: 2,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                    next: false,
                    prev: false
                }
            };

            mockCategoryHandlers.CategoryHandler.list.mockResolvedValue(mockCategoriesResponse);

            await CategoryController.list(mockReq as Request, mockRes as Response);

            expect(mockCategoryHandlers.CategoryHandler.list).toHaveBeenCalled();
            expect(jsonSpy).toHaveBeenCalledWith(mockCategoriesResponse);
        });

        it('deve tratar erros usando handleZodError', async () => {
            const error = new Error('Erro interno');
            mockCategoryHandlers.CategoryHandler.list.mockRejectedValue(error);

            await CategoryController.list(mockReq as Request, mockRes as Response);

            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockRes);
        });
    });

    describe('getById', () => {
        it('deve retornar erro quando ID é inválido', async () => {
            mockReq.params = { id: 'invalid-id' };

            await CategoryController.getById(mockReq as Request, mockRes as Response);

            expect(mockHandleZodError).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('deve retornar erro quando ID é inválido', async () => {
            const updateData = { name: 'Nome Atualizado' };
            mockReq.params = { id: 'invalid-id' };
            mockReq.body = updateData;

            await CategoryController.update(mockReq as Request, mockRes as Response);

            expect(mockHandleZodError).toHaveBeenCalled();
        });

        it('deve tratar outros erros usando handleZodError', async () => {
            const categoryId = 'cat-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            const updateData = { name: '' }; // dados inválidos
            mockReq.params = { id: categoryId };
            mockReq.body = updateData;

            await CategoryController.update(mockReq as Request, mockRes as Response);

            expect(mockHandleZodError).toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('deve retornar erro quando ID é inválido', async () => {
            mockReq.params = { id: 'invalid-id' };

            await CategoryController.delete(mockReq as Request, mockRes as Response);

            expect(mockHandleZodError).toHaveBeenCalled();
        });
    });
});