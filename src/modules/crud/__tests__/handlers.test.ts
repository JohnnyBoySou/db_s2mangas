import { createCrudHandler, ICrudRepository, CrudHandler, createRepositoryHelpers, createFullCrudHandler, createPrismaRepository } from '../handlers/CrudHandler';

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
  let helpers: any;
  let mockModel: any;

  beforeEach(() => {
    repository = createMockRepository();
    handler = createCrudHandler(repository);
      
    // Mock do modelo Prisma para testar helpers
    mockModel = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      createMany: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn()
    };
      
    // Criar helpers para testes adicionais
    helpers = createRepositoryHelpers(repository, mockModel);
      
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

  describe('Repository Helpers', () => {
    describe('findFirst', () => {
      it('deve encontrar o primeiro item que corresponde ao critério', async () => {
        const where = { name: 'Test' };
        const expectedItem = { id: '1', name: 'Test' };
        
        mockModel.findFirst.mockResolvedValue(expectedItem);
        
        const result = await helpers.findFirst(where);
        
        expect(mockModel.findFirst).toHaveBeenCalledWith({
          where,
          include: undefined,
          select: undefined
        });
        expect(result).toEqual(expectedItem);
      });
    });

    describe('findUnique', () => {
      it('deve encontrar um item único baseado no critério', async () => {
        const where = { id: '1' };
        const expectedItem = { id: '1', name: 'Test' };
        
        mockModel.findUnique.mockResolvedValue(expectedItem);
        
        const result = await helpers.findUnique(where);
        
        expect(mockModel.findUnique).toHaveBeenCalledWith({
          where,
          include: undefined,
          select: undefined
        });
        expect(result).toEqual(expectedItem);
      });
    });

    describe('upsert', () => {
      it('deve criar ou atualizar um item', async () => {
        const where = { id: '1' };
        const createData = { name: 'New Item' };
        const updateData = { name: 'Updated Item' };
        const expectedItem = { id: '1', ...updateData };
        
        mockModel.upsert.mockResolvedValue(expectedItem);
        
        const result = await helpers.upsert(where, createData, updateData);
        
        expect(mockModel.upsert).toHaveBeenCalledWith({
          where,
          create: createData,
          update: updateData,
          include: undefined
        });
        expect(result).toEqual(expectedItem);
      });
    });

    describe('batchCreate', () => {
      it('deve criar múltiplos itens', async () => {
        const items = [{ name: 'Item 1' }, { name: 'Item 2' }];
        const expectedResult = { count: 2 };
        
        mockModel.createMany.mockResolvedValue(expectedResult);
        
        const result = await helpers.batchCreate(items);
        
        expect(mockModel.createMany).toHaveBeenCalledWith({
          data: items,
          skipDuplicates: true
        });
        expect(result).toEqual(expectedResult);
      });
    });

    describe('batchUpdate', () => {
      it('deve atualizar múltiplos itens', async () => {
        const where = { category: 'test' };
        const data = { active: true };
        const expectedResult = { count: 5 };
        
        mockModel.updateMany.mockResolvedValue(expectedResult);
        
        const result = await helpers.batchUpdate(where, data);
        
        expect(mockModel.updateMany).toHaveBeenCalledWith({
          where,
          data
        });
        expect(result).toEqual(expectedResult);
      });
    });
  });

  describe('createFullCrudHandler', () => {
    it('deve criar um handler completo com repositório e helpers', () => {
      const fullHandler = createFullCrudHandler({
        model: mockModel,
        searchFields: ['name']
      });
      
      expect(fullHandler).toHaveProperty('create');
      expect(fullHandler).toHaveProperty('getById');
      expect(fullHandler).toHaveProperty('list');
      expect(fullHandler).toHaveProperty('update');
      expect(fullHandler).toHaveProperty('delete');
      expect(fullHandler).toHaveProperty('batchDelete');
      expect(fullHandler).toHaveProperty('search');
      expect(fullHandler).toHaveProperty('count');
      expect(fullHandler).toHaveProperty('exists');
      expect(fullHandler).toHaveProperty('helpers');
      expect(fullHandler).toHaveProperty('repository');
    });
  });

  describe('createPrismaRepository', () => {
    describe('create', () => {
      it('deve criar um item no repositório Prisma', async () => {
        const data = { name: 'Test Item' };
        const expectedResult = { id: '1', ...data };
        
        mockModel.create.mockResolvedValue(expectedResult);
        
        const prismaRepo = createPrismaRepository({
          model: mockModel,
          searchFields: ['name']
        });
        
        const result = await prismaRepo.create(data);
        
        expect(mockModel.create).toHaveBeenCalledWith({
          data,
          include: undefined
        });
        expect(result).toEqual(expectedResult);
      });

      it('deve criar um item com opções de include', async () => {
        const data = { name: 'Test Item' };
        const include = { related: true };
        const expectedResult = { id: '1', ...data, related: [] };
        
        mockModel.create.mockResolvedValue(expectedResult);
        
        const prismaRepo = createPrismaRepository({
          model: mockModel,
          searchFields: ['name'],
          defaultInclude: include
        });
        
        const result = await prismaRepo.create(data);
        
        expect(mockModel.create).toHaveBeenCalledWith({
          data,
          include
        });
        expect(result).toEqual(expectedResult);
      });
    });
    
    describe('findById', () => {
      it('deve encontrar um item por ID no repositório Prisma', async () => {
        const id = '1';
        const expectedResult = { id, name: 'Test Item' };
        
        mockModel.findUnique.mockResolvedValue(expectedResult);
        
        const prismaRepo = createPrismaRepository({
          model: mockModel,
          searchFields: ['name']
        });
        
        const result = await prismaRepo.findById(id);
        
        expect(mockModel.findUnique).toHaveBeenCalledWith({
          where: { id },
          include: undefined
        });
        expect(result).toEqual(expectedResult);
      });
      
      it('deve retornar null quando o item não existe', async () => {
        const id = 'nonexistent';
        
        mockModel.findUnique.mockResolvedValue(null);
        
        const prismaRepo = createPrismaRepository({
          model: mockModel,
          searchFields: ['name']
        });
        
        const result = await prismaRepo.findById(id);
        
        expect(mockModel.findUnique).toHaveBeenCalledWith({
          where: { id },
          include: undefined
        });
        expect(result).toBeNull();
      });
    });
    
    describe('findMany', () => {
      it('deve encontrar múltiplos itens com paginação', async () => {
        const options = { page: 1, limit: 10 };
        const items = [{ id: '1', name: 'Item 1' }, { id: '2', name: 'Item 2' }];
        const count = 2;
        
        mockModel.findMany.mockResolvedValue(items);
        mockModel.count.mockResolvedValue(count);
        
        const prismaRepo = createPrismaRepository({
          model: mockModel,
          searchFields: ['name']
        });
        
        const result = await prismaRepo.findMany(options);
        
        expect(mockModel.findMany).toHaveBeenCalledWith({
          skip: 0,
          take: 10,
          where: undefined,
          orderBy: undefined,
          include: undefined
        });
        expect(mockModel.count).toHaveBeenCalledWith({
          where: undefined
        });
        expect(result).toEqual({
          data: items,
          pagination: {
            page: 1,
            limit: 10,
            total: count,
            totalPages: 1,
            next: false,
            prev: false
          }
        });
      });
    });
    
    describe('search', () => {
      it('deve buscar itens baseado em campos de busca', async () => {
        const query = 'test';
        const options = { page: 1, limit: 10 };
        const items = [{ id: '1', name: 'Test Item' }];
        const count = 1;
        
        mockModel.findMany.mockResolvedValue(items);
        mockModel.count.mockResolvedValue(count);
        
        const prismaRepo = createPrismaRepository({
          model: mockModel,
          searchFields: ['name', 'description']
        });
        
        const result = await prismaRepo.search(query, options);
        
        expect(mockModel.findMany).toHaveBeenCalledWith(expect.objectContaining({
          skip: 0,
          take: 10,
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } }
            ]
          }
        }));
        expect(result).toEqual({
          data: items,
          pagination: {
            page: 1,
            limit: 10,
            total: count,
            totalPages: 1,
            next: false,
            prev: false
          }
        });
      });

      it('deve lançar erro quando searchFields não está definido', async () => {
        const query = 'test';
        const options = { page: 1, limit: 10 };
        
        const prismaRepo = createPrismaRepository({
          model: mockModel,
          searchFields: []
        });
        
        await expect(prismaRepo.search(query, options)).rejects.toThrow(
          "Search fields not defined for this repository"
        );
      });
    });

    describe('update', () => {
      it('deve atualizar um item no repositório Prisma', async () => {
        const id = '1';
        const data = { name: 'Updated Item' };
        const expectedResult = { id, ...data };
        
        mockModel.update.mockResolvedValue(expectedResult);
        
        const prismaRepo = createPrismaRepository({
          model: mockModel,
          searchFields: ['name']
        });
        
        const result = await prismaRepo.update(id, data);
        
        expect(mockModel.update).toHaveBeenCalledWith({
          where: { id },
          data,
          include: undefined
        });
        expect(result).toEqual(expectedResult);
      });

      it('deve atualizar um item com opções de include', async () => {
        const id = '1';
        const data = { name: 'Updated Item' };
        const include = { related: true };
        const expectedResult = { id, ...data, related: [] };
        
        mockModel.update.mockResolvedValue(expectedResult);
        
        const prismaRepo = createPrismaRepository({
          model: mockModel,
          searchFields: ['name'],
          defaultInclude: include
        });
        
        const result = await prismaRepo.update(id, data);
        
        expect(mockModel.update).toHaveBeenCalledWith({
          where: { id },
          data,
          include
        });
        expect(result).toEqual(expectedResult);
      });
    });

    describe('delete', () => {
      it('deve excluir um item do repositório Prisma', async () => {
        const id = '1';
        const expectedResult = { id, name: 'Deleted Item' };
        
        mockModel.delete.mockResolvedValue(expectedResult);
        
        const prismaRepo = createPrismaRepository({
          model: mockModel,
          searchFields: ['name']
        });
        
        await prismaRepo.delete(id);
        
        expect(mockModel.delete).toHaveBeenCalledWith({
          where: { id },
          include: undefined
        });
      });
    });

    describe('count', () => {
      it('deve contar itens no repositório Prisma', async () => {
        const where = { active: true };
        const expectedCount = 5;
        
        mockModel.count.mockResolvedValue(expectedCount);
        
        const prismaRepo = createPrismaRepository({
          model: mockModel,
          searchFields: ['name']
        });
        
        const result = await prismaRepo.count(where);
        
        expect(mockModel.count).toHaveBeenCalledWith({ where });
        expect(result).toEqual(expectedCount);
      });
    });

    describe('exists', () => {
      it('deve verificar se um item existe no repositório Prisma', async () => {
        const id = '1';
        const expectedCount = 1;
        
        mockModel.count.mockResolvedValue(expectedCount);
        
        const prismaRepo = createPrismaRepository({
          model: mockModel,
          searchFields: ['name']
        });
        
        const result = await prismaRepo.exists(id);
        
        expect(mockModel.count).toHaveBeenCalledWith({ where: { id } });
        expect(result).toBe(true);
      });

      it('deve retornar false quando o item não existe', async () => {
        const id = 'nonexistent';
        const expectedCount = 0;
        
        mockModel.count.mockResolvedValue(expectedCount);
        
        const prismaRepo = createPrismaRepository({
          model: mockModel,
          searchFields: ['name']
        });
        
        const result = await prismaRepo.exists(id);
        
        expect(mockModel.count).toHaveBeenCalledWith({ where: { id } });
        expect(result).toBe(false);
      });
    });

    describe('batchDelete', () => {
      it('deve excluir múltiplos itens do repositório Prisma', async () => {
        const ids = ['1', '2', '3'];
        const expectedResult = { count: 3 };
        
        mockModel.deleteMany.mockResolvedValue(expectedResult);
        
        const prismaRepo = createPrismaRepository({
          model: mockModel,
          searchFields: ['name']
        });
        
        const result = await prismaRepo.batchDelete(ids);
        
        expect(mockModel.deleteMany).toHaveBeenCalledWith({
          where: { id: { in: ids } }
        });
        expect(result).toEqual(expectedResult);
      });
    });
  });
});