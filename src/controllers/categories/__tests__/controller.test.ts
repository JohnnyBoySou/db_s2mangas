import { Request, Response, NextFunction } from 'express';
import { prismaMock } from '../../../test/mocks/prisma';
import * as categoryController from '../index';
import * as categoryHandlers from '../../../handlers/categories';
import { handleZodError } from '../../../utils/zodError';

// Mock dos handlers
jest.mock('../../../handlers/categories');
jest.mock('../../../utils/zodError');

const mockCategoryHandlers = categoryHandlers as jest.Mocked<typeof categoryHandlers>;
const mockHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;

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
                name: 'Romance',
                description: 'Categoria de mangás românticos'
            };

            mockReq.body = categoryData;
            mockCategoryHandlers.createCategory.mockResolvedValue(mockCategoryData);

            await categoryController.create(mockReq as Request, mockRes as Response, mockNext);

            expect(mockCategoryHandlers.createCategory).toHaveBeenCalledWith(categoryData);
            expect(statusSpy).toHaveBeenCalledWith(201);
            expect(jsonSpy).toHaveBeenCalledWith(mockCategoryData);
        });

        it('deve tratar erros usando handleZodError', async () => {
            const error = new Error('Dados inválidos');
            mockCategoryHandlers.createCategory.mockRejectedValue(error);

            await categoryController.create(mockReq as Request, mockRes as Response, mockNext);

            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockRes);
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

            mockCategoryHandlers.listCategories.mockResolvedValue(mockCategoriesResponse);

            await categoryController.list(mockReq as Request, mockRes as Response, mockNext);

            expect(mockCategoryHandlers.listCategories).toHaveBeenCalled();
            expect(jsonSpy).toHaveBeenCalledWith(mockCategoriesResponse);
        });

        it('deve tratar erros usando handleZodError', async () => {
            const error = new Error('Erro interno');
            mockCategoryHandlers.listCategories.mockRejectedValue(error);

            await categoryController.list(mockReq as Request, mockRes as Response, mockNext);

            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockRes);
        });
    });

    describe('get', () => {
        it('deve buscar uma categoria por ID com sucesso', async () => {
            const categoryId = 'cat-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            mockReq.params = { id: categoryId };
            mockCategoryHandlers.getCategoryById.mockResolvedValue(mockCategoryWithMangas);

            await categoryController.get(mockReq as Request, mockRes as Response, mockNext);

            expect(mockCategoryHandlers.getCategoryById).toHaveBeenCalledWith(categoryId);
            expect(jsonSpy).toHaveBeenCalledWith(mockCategoryWithMangas);
        });

        it('deve retornar erro 404 quando categoria não for encontrada', async () => {
            const categoryId = 'cat-inexistente';
            mockReq.params = { id: categoryId };
            const error = new Error('Categoria não encontrada');
            mockCategoryHandlers.getCategoryById.mockRejectedValue(error);

            await categoryController.get(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(404);
            expect(jsonSpy).toHaveBeenCalledWith({ error: 'Categoria não encontrada' });
        });

        it('deve tratar outros erros usando handleZodError', async () => {
            const categoryId = 'cat-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            mockReq.params = { id: categoryId };
            const error = new Error('Erro de validação');
            mockCategoryHandlers.getCategoryById.mockRejectedValue(error);

            await categoryController.get(mockReq as Request, mockRes as Response, mockNext);

            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockRes);
        });
    });

    describe('update', () => {
        it('deve atualizar uma categoria com sucesso', async () => {
            const categoryId = 'cat-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            const updateData = {
                name: 'Ação Atualizada',
                description: 'Descrição atualizada'
            };
            const updatedCategory = {
                ...mockCategoryData,
                ...updateData,
                updatedAt: new Date('2023-01-15')
            };

            mockReq.params = { id: categoryId };
            mockReq.body = updateData;
            mockCategoryHandlers.updateCategory.mockResolvedValue(updatedCategory);

            await categoryController.update(mockReq as Request, mockRes as Response, mockNext);

            expect(mockCategoryHandlers.updateCategory).toHaveBeenCalledWith(categoryId, updateData);
            expect(jsonSpy).toHaveBeenCalledWith(updatedCategory);
        });

        it('deve retornar erro 404 quando categoria não for encontrada', async () => {
            const categoryId = 'cat-inexistente';
            const updateData = { name: 'Nome Atualizado' };
            mockReq.params = { id: categoryId };
            mockReq.body = updateData;
            const error = new Error('Categoria não encontrada');
            mockCategoryHandlers.updateCategory.mockRejectedValue(error);

            await categoryController.update(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(404);
            expect(jsonSpy).toHaveBeenCalledWith({ error: 'Categoria não encontrada' });
        });

        it('deve tratar outros erros usando handleZodError', async () => {
            const categoryId = 'cat-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            const updateData = { name: '' }; // dados inválidos
            mockReq.params = { id: categoryId };
            mockReq.body = updateData;
            const error = new Error('Dados inválidos');
            mockCategoryHandlers.updateCategory.mockRejectedValue(error);

            await categoryController.update(mockReq as Request, mockRes as Response, mockNext);

            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockRes);
        });
    });

    describe('remove', () => {
        it('deve remover uma categoria com sucesso', async () => {
            const categoryId = 'cat-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            const deleteResult = {
                message: 'Categoria removida com sucesso',
                deletedCategory: mockCategoryData
            };

            mockReq.params = { id: categoryId };
            mockCategoryHandlers.deleteCategory.mockResolvedValue(deleteResult);

            await categoryController.remove(mockReq as Request, mockRes as Response, mockNext);

            expect(mockCategoryHandlers.deleteCategory).toHaveBeenCalledWith(categoryId);
            expect(jsonSpy).toHaveBeenCalledWith(deleteResult);
        });

        it('deve retornar erro 404 quando categoria não for encontrada', async () => {
            const categoryId = 'cat-inexistente';
            mockReq.params = { id: categoryId };
            const error = new Error('Categoria não encontrada');
            mockCategoryHandlers.deleteCategory.mockRejectedValue(error);

            await categoryController.remove(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(404);
            expect(jsonSpy).toHaveBeenCalledWith({ error: 'Categoria não encontrada' });
        });

        it('deve tratar outros erros usando handleZodError', async () => {
            const categoryId = 'cat-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            mockReq.params = { id: categoryId };
            const error = new Error('Erro interno');
            mockCategoryHandlers.deleteCategory.mockRejectedValue(error);

            await categoryController.remove(mockReq as Request, mockRes as Response, mockNext);

            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockRes);
        });
    });
});