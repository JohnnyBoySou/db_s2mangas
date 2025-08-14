import { prismaMock } from '../../../test/mocks/prisma';
import { ZodError } from 'zod';

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
    __esModule: true,
    default: prismaMock,
}));

import { CategoryHandler } from '../handlers/CategoriesHandler';

describe('Category Handlers', () => {
    beforeEach(() => {
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
            const categoryData = { name: 'Ação' };
            (prismaMock.category.create as jest.Mock).mockResolvedValue(mockCategoryData);

            const result = await CategoryHandler.create(categoryData);

            expect(prismaMock.category.create).toHaveBeenCalledWith({
                data: { name: 'Ação' }
            });
            expect(result).toEqual(mockCategoryData);
        });

        it('deve lançar erro de validação para dados inválidos', async () => {
            const invalidData = { name: '' }; // Nome vazio

            await expect(CategoryHandler.create(invalidData)).rejects.toThrow(ZodError);
            expect(prismaMock.category.create).not.toHaveBeenCalled();
        });
    });

    describe('list', () => {
        it('deve listar categorias com paginação padrão', async () => {
            const mockCategories = [
                { ...mockCategoryData, _count: { mangas: 5 } },
                { 
                    id: 'cat-2',
                    name: 'Comédia',
                    createdAt: new Date('2023-01-02'),
                    updatedAt: new Date('2023-01-02'),
                    _count: { mangas: 3 }
                }
            ];
            const mockTotal = 2;

            (prismaMock.category.findMany as jest.Mock).mockResolvedValue(mockCategories);
            (prismaMock.category.count as jest.Mock).mockResolvedValue(mockTotal);

            const result = await CategoryHandler.list();

            expect(prismaMock.category.findMany).toHaveBeenCalledWith({
                include: {
                    _count: {
                        select: {
                            mangas: true
                        }
                    }
                },
                orderBy: {
                    name: 'asc'
                },
                skip: 0,
                take: 10
            });
            expect(prismaMock.category.count).toHaveBeenCalled();
            expect(result).toEqual({
                data: mockCategories,
                pagination: {
                    total: 2,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                    next: false,
                    prev: false
                }
            });
        });

        it('deve listar categorias com paginação customizada', async () => {
            const mockCategories = [{ ...mockCategoryData, _count: { mangas: 5 } }];
            const mockTotal = 15;

            (prismaMock.category.findMany as jest.Mock).mockResolvedValue(mockCategories);
            (prismaMock.category.count as jest.Mock).mockResolvedValue(mockTotal);

            const result = await CategoryHandler.list(2, 5);

            expect(prismaMock.category.findMany).toHaveBeenCalledWith({
                include: {
                    _count: {
                        select: {
                            mangas: true
                        }
                    }
                },
                orderBy: {
                    name: 'asc'
                },
                skip: 5,
                take: 5
            });
            expect(result.pagination).toEqual({
                total: 15,
                page: 2,
                limit: 5,
                totalPages: 3,
                next: true,
                prev: true
            });
        });
    });

    describe('getById', () => {
        it('deve buscar categoria por ID com sucesso', async () => {
            const categoryId = 'cat-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            (prismaMock.category.findUnique as jest.Mock).mockResolvedValue(mockCategoryWithMangas);

            const result = await CategoryHandler.getById(categoryId);

            expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
                where: { id: categoryId },
                include: {
                    mangas: {
                        include: {
                            translations: true,
                            languages: true
                        }
                    }
                }
            });
            expect(result).toEqual(mockCategoryWithMangas);
        });

        it('deve lançar erro quando categoria não for encontrada', async () => {
            const categoryId = 'categoria-inexistente';
            (prismaMock.category.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(CategoryHandler.getById(categoryId)).rejects.toThrow('Categoria não encontrada');
            expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
                where: { id: categoryId },
                include: {
                    mangas: {
                        include: {
                            translations: true,
                            languages: true
                        }
                    }
                }
            });
        });
    });

    describe('update', () => {
        it('deve atualizar categoria com sucesso', async () => {
            const categoryId = 'cat-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            const updateData = { name: 'Ação Atualizada' };
            const updatedCategory = { ...mockCategoryData, name: 'Ação Atualizada' };

            (prismaMock.category.findUnique as jest.Mock).mockResolvedValue(mockCategoryData);
            (prismaMock.category.update as jest.Mock).mockResolvedValue(updatedCategory);

            const result = await CategoryHandler.update(categoryId, updateData);

            expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
                where: { id: categoryId }
            });
            expect(prismaMock.category.update).toHaveBeenCalledWith({
                where: { id: categoryId },
                data: { name: 'Ação Atualizada' }
            });
            expect(result).toEqual(updatedCategory);
        });

        it('deve lançar erro quando categoria não existir', async () => {
            const categoryId = 'categoria-inexistente';
            const updateData = { name: 'Ação Atualizada' };

            (prismaMock.category.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(CategoryHandler.update(categoryId, updateData)).rejects.toThrow('Categoria não encontrada');
            expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
                where: { id: categoryId }
            });
            expect(prismaMock.category.update).not.toHaveBeenCalled();
        });

        it('deve lançar erro de validação para dados inválidos', async () => {
            const categoryId = 'cat-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            const invalidData = { name: '' }; // Nome vazio

            await expect(CategoryHandler.update(categoryId, invalidData)).rejects.toThrow(ZodError);
            expect(prismaMock.category.findUnique).not.toHaveBeenCalled();
            expect(prismaMock.category.update).not.toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('deve deletar categoria com sucesso', async () => {
            const categoryId = 'cat-a1b2c3d4-e5f6-7890-abcd-ef1234567890';

            (prismaMock.category.findUnique as jest.Mock).mockResolvedValue(mockCategoryData);
            (prismaMock.category.delete as jest.Mock).mockResolvedValue(mockCategoryData);

            const result = await CategoryHandler.delete(categoryId);

            expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
                where: { id: categoryId }
            });
            expect(prismaMock.category.delete).toHaveBeenCalledWith({
                where: { id: categoryId }
            });
            expect(result).toEqual({ message: 'Categoria deletada com sucesso' });
        });

        it('deve lançar erro quando categoria não existir', async () => {
            const categoryId = 'categoria-inexistente';

            (prismaMock.category.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(CategoryHandler.delete(categoryId)).rejects.toThrow('Categoria não encontrada');
            expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
                where: { id: categoryId }
            });
            expect(prismaMock.category.delete).not.toHaveBeenCalled();
        });
    });
});