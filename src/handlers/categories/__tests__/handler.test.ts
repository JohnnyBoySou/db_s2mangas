import { createCategory, listCategories, getCategoryById, updateCategory, deleteCategory } from '../index';
import { prismaMock } from '../../../test/mocks/prisma';
import { ZodError } from 'zod';

// Mock do Prisma já configurado no prismaMock

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

    describe('createCategory', () => {
        it('deve criar uma categoria com sucesso', async () => {
            const categoryData = { name: 'Ação' };
            prismaMock.category.create.mockResolvedValue(mockCategoryData);

            const result = await createCategory(categoryData);

            expect(prismaMock.category.create).toHaveBeenCalledWith({
                data: { name: 'Ação' }
            });
            expect(result).toEqual(mockCategoryData);
        });

        it('deve lançar erro de validação para dados inválidos', async () => {
            const invalidData = { name: '' }; // Nome vazio

            await expect(createCategory(invalidData)).rejects.toThrow(ZodError);
            expect(prismaMock.category.create).not.toHaveBeenCalled();
        });
    });

    describe('listCategories', () => {
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

            prismaMock.category.findMany.mockResolvedValue(mockCategories);
            prismaMock.category.count.mockResolvedValue(mockTotal);

            const result = await listCategories();

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

            prismaMock.category.findMany.mockResolvedValue(mockCategories);
            prismaMock.category.count.mockResolvedValue(mockTotal);

            const result = await listCategories(2, 5);

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

    describe('getCategoryById', () => {
        it('deve buscar categoria por ID com sucesso', async () => {
            const categoryId = 'cat-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            prismaMock.category.findUnique.mockResolvedValue(mockCategoryWithMangas);

            const result = await getCategoryById(categoryId);

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
            prismaMock.category.findUnique.mockResolvedValue(null);

            await expect(getCategoryById(categoryId)).rejects.toThrow('Categoria não encontrada');
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

    describe('updateCategory', () => {
        it('deve atualizar categoria com sucesso', async () => {
            const categoryId = 'cat-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            const updateData = { name: 'Ação Atualizada' };
            const updatedCategory = { ...mockCategoryData, name: 'Ação Atualizada' };

            prismaMock.category.findUnique.mockResolvedValue(mockCategoryData);
            prismaMock.category.update.mockResolvedValue(updatedCategory);

            const result = await updateCategory(categoryId, updateData);

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

            prismaMock.category.findUnique.mockResolvedValue(null);

            await expect(updateCategory(categoryId, updateData)).rejects.toThrow('Categoria não encontrada');
            expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
                where: { id: categoryId }
            });
            expect(prismaMock.category.update).not.toHaveBeenCalled();
        });

        it('deve lançar erro de validação para dados inválidos', async () => {
            const categoryId = 'cat-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            const invalidData = { name: '' }; // Nome vazio

            await expect(updateCategory(categoryId, invalidData)).rejects.toThrow(ZodError);
            expect(prismaMock.category.findUnique).not.toHaveBeenCalled();
            expect(prismaMock.category.update).not.toHaveBeenCalled();
        });
    });

    describe('deleteCategory', () => {
        it('deve deletar categoria com sucesso', async () => {
            const categoryId = 'cat-a1b2c3d4-e5f6-7890-abcd-ef1234567890';

            prismaMock.category.findUnique.mockResolvedValue(mockCategoryData);
            prismaMock.category.delete.mockResolvedValue(mockCategoryData);

            const result = await deleteCategory(categoryId);

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

            prismaMock.category.findUnique.mockResolvedValue(null);

            await expect(deleteCategory(categoryId)).rejects.toThrow('Categoria não encontrada');
            expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
                where: { id: categoryId }
            });
            expect(prismaMock.category.delete).not.toHaveBeenCalled();
        });
    });
});