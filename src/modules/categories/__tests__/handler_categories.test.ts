import { createCategory, listCategories, getCategoryById, updateCategory, deleteCategory } from '../handler';
import { prismaMock } from '../../../test/mocks/prisma';

describe('Category Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCategory', () => {
    it('deve criar uma categoria com sucesso', async () => {
      const categoryData = { name: 'Ação' };
      const mockCategory = { id: 'cat-1', name: 'Ação' };

      prismaMock.category.create.mockResolvedValue(mockCategory);

      const result = await createCategory(categoryData);

      expect(prismaMock.category.create).toHaveBeenCalledWith({
        data: { name: 'Ação' }
      });
      expect(result).toEqual(mockCategory);
    });
  });

  describe('listCategories', () => {
    it('deve listar categorias com contagem de mangás', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Ação',
          _count: { mangas: 5 }
        }
      ];

      prismaMock.category.findMany.mockResolvedValue(mockCategories);
      prismaMock.category.count.mockResolvedValue(1);

      const result = await listCategories(1, 10);

      expect(result.data).toEqual(mockCategories);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('getCategoryById', () => {
    it('deve retornar categoria por ID', async () => {
      const categoryId = 'cat-1';
      const mockCategory = {
        id: categoryId,
        name: 'Ação',
        mangas: []
      };

      prismaMock.category.findUnique.mockResolvedValue(mockCategory);

      const result = await getCategoryById(categoryId);

      expect(result).toEqual(mockCategory);
    });

    it('deve lançar erro quando categoria não for encontrada', async () => {
      prismaMock.category.findUnique.mockResolvedValue(null);

      await expect(getCategoryById('invalid-id'))
        .rejects.toThrow('Categoria não encontrada');
    });
  });

  describe('updateCategory', () => {
    it('deve atualizar uma categoria com sucesso', async () => {
      const categoryId = 'cat-1';
      const updateData = { name: 'Ação Atualizada' };
      const mockExistingCategory = { id: categoryId, name: 'Ação' };
      const mockUpdatedCategory = { id: categoryId, name: 'Ação Atualizada' };

      prismaMock.category.findUnique.mockResolvedValue(mockExistingCategory);
      prismaMock.category.update.mockResolvedValue(mockUpdatedCategory);

      const result = await updateCategory(categoryId, updateData);

      expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId }
      });
      expect(prismaMock.category.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: updateData
      });
      expect(result).toEqual(mockUpdatedCategory);
    });

    it('deve lançar erro quando categoria não existir para atualização', async () => {
      const categoryId = 'invalid-id';
      const updateData = { name: 'Ação Atualizada' };

      prismaMock.category.findUnique.mockResolvedValue(null);

      await expect(updateCategory(categoryId, updateData))
        .rejects.toThrow('Categoria não encontrada');

      expect(prismaMock.category.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteCategory', () => {
    it('deve deletar uma categoria com sucesso', async () => {
      const categoryId = 'cat-1';
      const mockCategory = {
        id: 'cat-1',
        name: 'Ação'
      };

      prismaMock.category.findUnique.mockResolvedValue(mockCategory);
      prismaMock.category.delete.mockResolvedValue(mockCategory);

      const result = await deleteCategory(categoryId);

      expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId }
      });
      expect(prismaMock.category.delete).toHaveBeenCalledWith({
        where: { id: categoryId }
      });
      // Corrigindo a expectativa para o retorno real da função
      expect(result).toEqual({ message: "Categoria deletada com sucesso" });
    });

    it('deve lançar erro quando categoria não existir para deleção', async () => {
      const categoryId = 'invalid-id';

      prismaMock.category.findUnique.mockResolvedValue(null);

      await expect(deleteCategory(categoryId))
        .rejects.toThrow('Categoria não encontrada');

      expect(prismaMock.category.delete).not.toHaveBeenCalled();
    });
  });
});