import { createCrudHandler, ICrudRepository, CrudHandler } from '../handlers/CrudHandler';

// Mock de repositório para testes
const createMockRepository = (): jest.Mocked<ICrudRepository<any, any, any>> => ({
  create: jest.fn(),
  findById: jest.fn(),
  findMany: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  exists: jest.fn(),
  batchDelete: jest.fn(),
  search: jest.fn()
});

describe('CrudHandler', () => {
  let handler: CrudHandler<any, any, any>;
  let repository: jest.Mocked<ICrudRepository<any, any, any>>;

  beforeEach(() => {
    repository = createMockRepository();
    handler = createCrudHandler(repository);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um novo item', async () => {
      const createData = { name: 'Test Category' };
      const expectedResult = { id: '123', ...createData };
      
      repository.create.mockResolvedValue(expectedResult);
      
      const result = await handler.create(createData);
      
      expect(repository.create).toHaveBeenCalledWith(createData);
      expect(result).toEqual(expectedResult);
    });

    it('deve propagar erros do repositório', async () => {
      const createData = { name: 'Test' };
      const error = new Error('Database error');
      
      repository.create.mockRejectedValue(error);
      
      await expect(handler.create(createData)).rejects.toThrow('Database error');
    });
  });

  describe('getById', () => {
    it('deve retornar item por ID', async () => {
      const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const expectedResult = { id, name: 'Test Category' };
      
      repository.findById.mockResolvedValue(expectedResult);
      
      const result = await handler.getById(id);
      
      expect(repository.findById).toHaveBeenCalledWith(id, undefined);
      expect(result).toEqual(expectedResult);
    });

    it('deve lançar erro quando item não existe', async () => {
      const id = 'non-existent-id';
      
      repository.findById.mockResolvedValue(null);
      
      await expect(handler.getById(id)).rejects.toThrow('Item não encontrado');
    });

    it('deve passar opções de filtro', async () => {
      const id = 'test-id';
      const options = { include: { mangas: true } };
      const expectedResult = { id, name: 'Test' };
      
      repository.findById.mockResolvedValue(expectedResult);
      
      await handler.getById(id, options);
      
      expect(repository.findById).toHaveBeenCalledWith(id, options);
    });
  });

  describe('list', () => {
    it('deve retornar lista paginada', async () => {
      const options = { page: 1, limit: 10 };
      const expectedResult = {
        data: [{ id: '1', name: 'Category 1' }],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          next: false,
          prev: false
        }
      };
      
      repository.findMany.mockResolvedValue(expectedResult);
      
      const result = await handler.list(options);
      
      expect(repository.findMany).toHaveBeenCalledWith(options);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('deve atualizar item existente', async () => {
      const id = 'test-id';
      const updateData = { name: 'Updated Name' };
      const expectedResult = { id, ...updateData };
      
      repository.exists.mockResolvedValue(true);
      repository.update.mockResolvedValue(expectedResult);
      
      const result = await handler.update(id, updateData);
      
      expect(repository.exists).toHaveBeenCalledWith(id);
      expect(repository.update).toHaveBeenCalledWith(id, updateData);
      expect(result).toEqual(expectedResult);
    });

    it('deve lançar erro quando item não existe', async () => {
      const id = 'non-existent-id';
      const updateData = { name: 'Updated Name' };
      
      repository.exists.mockResolvedValue(false);
      
      await expect(handler.update(id, updateData)).rejects.toThrow('Item não encontrado');
    });
  });

  describe('delete', () => {
    it('deve deletar item por ID', async () => {
      const id = 'test-id';
      
      repository.exists.mockResolvedValue(true);
      repository.delete.mockResolvedValue(undefined);
      
      const result = await handler.delete(id);
      
      expect(repository.exists).toHaveBeenCalledWith(id);
      expect(repository.delete).toHaveBeenCalledWith(id);
      expect(result).toEqual({ message: 'Item deletado com sucesso' });
    });

    it('deve lançar erro quando item não existe', async () => {
      const id = 'non-existent-id';
      
      repository.exists.mockResolvedValue(false);
      
      await expect(handler.delete(id)).rejects.toThrow('Item não encontrado');
    });
  });

  describe('count', () => {
    it('deve retornar contagem de itens', async () => {
      const where = { name: 'test' };
      const expectedCount = 5;
      
      repository.count.mockResolvedValue(expectedCount);
      
      const result = await handler.count(where);
      
      expect(repository.count).toHaveBeenCalledWith(where);
      expect(result).toEqual({ count: expectedCount });
    });
  });

  describe('exists', () => {
    it('deve retornar true quando item existe', async () => {
      const id = 'existing-id';
      
      repository.exists.mockResolvedValue(true);
      
      const result = await handler.exists(id);
      
      expect(repository.exists).toHaveBeenCalledWith(id);
      expect(result).toEqual({ exists: true });
    });

    it('deve retornar false quando item não existe', async () => {
      const id = 'non-existing-id';
      
      repository.exists.mockResolvedValue(false);
      
      const result = await handler.exists(id);
      
      expect(result).toEqual({ exists: false });
    });
  });

  describe('batchDelete', () => {
    it('deve deletar múltiplos itens', async () => {
      const ids = ['id1', 'id2', 'id3'];
      const repositoryResult = { count: 3 };
      
      repository.batchDelete.mockResolvedValue(repositoryResult);
      
      const result = await handler.batchDelete(ids);
      
      expect(repository.batchDelete).toHaveBeenCalledWith(ids);
      expect(result).toEqual({
        message: '3 itens deletados com sucesso',
        count: 3
      });
    });
  });

  describe('search', () => {
    it('deve buscar itens por query', async () => {
      const query = 'test search';
      const options = { page: 1, limit: 10 };
      const expectedResult = {
        data: [{ id: '1', name: 'Test Category' }],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          next: false,
          prev: false
        }
      };
      
      repository.search.mockResolvedValue(expectedResult);
      
      const result = await handler.search(query, options);
      
      expect(repository.search).toHaveBeenCalledWith(query, options);
      expect(result).toEqual(expectedResult);
    });
  });
});