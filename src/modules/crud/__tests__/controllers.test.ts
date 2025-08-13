import { Request, Response } from 'express';
import { createCrudController, ICrudController } from '../controllers/CrudControler';
import { CrudHandler } from '../handlers/CrudHandler';
import { handleZodError } from '../../../utils/zodError';
import { z } from 'zod';

// Mock das dependências
jest.mock('@/utils/zodError');

const mockHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;

// Schemas de teste
const createSchema = z.object({
  name: z.string().min(1)
});

const updateSchema = z.object({
  name: z.string().min(1).optional()
});

describe('CrudController', () => {
  let controller: ICrudController;
  let mockHandler: jest.Mocked<CrudHandler<any, any, any>>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonSpy: jest.SpyInstance;
  let statusSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock do handler
    mockHandler = {
      create: jest.fn(),
      getById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      exists: jest.fn(),
      batchDelete: jest.fn(),
      search: jest.fn()
    } as any;

    controller = createCrudController(mockHandler, createSchema, updateSchema);

    // Mock da request e response
    mockReq = {
      body: {},
      params: {},
      query: {}
    };

    jsonSpy = jest.fn().mockReturnThis();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    
    mockRes = {
      status: statusSpy as any,
      json: jsonSpy as any
    };

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar item com sucesso', async () => {
      const createData = { name: 'Test Category' };
      const expectedResult = { id: '123', ...createData };
      
      mockReq.body = createData;
      mockHandler.create.mockResolvedValue(expectedResult);
      
      await controller.create(mockReq as Request, mockRes as Response);
      
      expect(mockHandler.create).toHaveBeenCalledWith(createData);
      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith(expectedResult);
    });

    it('deve tratar erro de validação', async () => {
      const invalidData = { name: '' };
      mockReq.body = invalidData;
      
      await controller.create(mockReq as Request, mockRes as Response);
      
      expect(mockHandleZodError).toHaveBeenCalled();
      expect(mockHandler.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('deve listar itens com paginação padrão', async () => {
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
      
      mockHandler.list.mockResolvedValue(expectedResult);
      
      await controller.list(mockReq as Request, mockRes as Response);
      
      expect(mockHandler.list).toHaveBeenCalledWith({
        page: 1,
        limit: 10
      });
      expect(jsonSpy).toHaveBeenCalledWith(expectedResult);
    });

    it('deve listar itens com parâmetros customizados', async () => {
      const expectedResult = {
        data: [{ id: '1', name: 'Test Category' }],
        pagination: {
          total: 1,
          page: 2,
          limit: 20,
          totalPages: 1,
          next: false,
          prev: true
        }
      };
      
      mockReq.query = {
        page: '2',
        limit: '20',
        search: 'test',
        orderBy: 'name',
        order: 'desc'
      };
      
      mockHandler.search.mockResolvedValue(expectedResult);
      
      await controller.list(mockReq as Request, mockRes as Response);
      
      expect(mockHandler.search).toHaveBeenCalledWith('test', {
        page: 2,
        limit: 20,
        orderBy: { name: 'desc' }
      });
      expect(jsonSpy).toHaveBeenCalledWith(expectedResult);
    });
  });

  describe('getById', () => {
    it('deve retornar item por ID', async () => {
      const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const expectedResult = { id, name: 'Test Category' };
      
      mockReq.params = { id };
      mockHandler.getById.mockResolvedValue(expectedResult);
      
      await controller.getById(mockReq as Request, mockRes as Response);
      
      expect(mockHandler.getById).toHaveBeenCalledWith(id);
      expect(jsonSpy).toHaveBeenCalledWith(expectedResult);
    });

    it('deve tratar ID inválido', async () => {
      mockReq.params = { id: 'invalid-id' };
      
      await controller.getById(mockReq as Request, mockRes as Response);
      
      expect(mockHandleZodError).toHaveBeenCalled();
      expect(mockHandler.getById).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('deve atualizar item com sucesso', async () => {
      const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateData = { name: 'Updated Name' };
      const expectedResult = { id, ...updateData };
      
      mockReq.params = { id };
      mockReq.body = updateData;
      mockHandler.update.mockResolvedValue(expectedResult);
      
      await controller.update(mockReq as Request, mockRes as Response);
      
      expect(mockHandler.update).toHaveBeenCalledWith(id, updateData);
      expect(jsonSpy).toHaveBeenCalledWith(expectedResult);
    });
  });

  describe('delete', () => {
    it('deve deletar item com sucesso', async () => {
      const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const expectedResult = { message: 'Item deletado com sucesso' };
      
      mockReq.params = { id };
      mockHandler.delete.mockResolvedValue(expectedResult);
      
      await controller.delete(mockReq as Request, mockRes as Response);
      
      expect(mockHandler.delete).toHaveBeenCalledWith(id);
      expect(jsonSpy).toHaveBeenCalledWith(expectedResult);
    });
  });

  describe('count', () => {
    it('deve retornar contagem de itens', async () => {
      const expectedResult = { count: 10 };
      
      mockHandler.count.mockResolvedValue(expectedResult);
      
      await controller.count(mockReq as Request, mockRes as Response);
      
      expect(mockHandler.count).toHaveBeenCalledWith();
      expect(jsonSpy).toHaveBeenCalledWith(expectedResult);
    });
  });

  describe('batchDelete', () => {
    it('deve deletar múltiplos itens', async () => {
      const ids = [
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        'b1c2d3e4-f5a6-7890-abcd-ef1234567890'
      ];
      const expectedResult = {
        message: '2 itens deletados com sucesso',
        count: 2
      };
      
      mockReq.body = { ids };
      mockHandler.batchDelete.mockResolvedValue(expectedResult);
      
      await controller.batchDelete(mockReq as Request, mockRes as Response);
      
      expect(mockHandler.batchDelete).toHaveBeenCalledWith(ids);
      expect(jsonSpy).toHaveBeenCalledWith(expectedResult);
    });
  });

  describe('search', () => {
    it('deve buscar itens por query', async () => {
      const query = 'test search';
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
      
      mockReq.query = { q: query, page: '1', limit: '10' };
      mockHandler.search.mockResolvedValue(expectedResult as any);
      
      await controller.search(mockReq as Request, mockRes as Response);
      
      expect(mockHandler.search).toHaveBeenCalledWith(query, {
        page: 1,
        limit: 10
      });
      expect(jsonSpy).toHaveBeenCalledWith(expectedResult);
    });
  });
});