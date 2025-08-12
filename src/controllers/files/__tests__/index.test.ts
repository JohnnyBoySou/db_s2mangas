import { Request, Response, NextFunction } from 'express';
import * as filesController from '../index';
import * as fileHandler from '../../../handlers/files';
import { cleanOrphanFiles } from '../../../utils/cleanOrphanFiles';
import { z } from 'zod';

// Mock dos handlers e utils
jest.mock('../../../handlers/files');
jest.mock('../../../utils/cleanOrphanFiles');

const mockFileHandler = fileHandler as jest.Mocked<typeof fileHandler>;
const mockCleanOrphanFiles = cleanOrphanFiles as jest.MockedFunction<typeof cleanOrphanFiles>;

describe('Files Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockSend: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockSend = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson, send: mockSend });
    mockNext = jest.fn();
    
    mockReq = {
      body: {},
      params: {}
    };
    
    mockRes = {
      json: mockJson,
      status: mockStatus,
      send: mockSend
    };

    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('deve fazer upload de arquivo com sucesso', async () => {
      // Given
      const validFileData = {
        base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD',
        filename: 'test.jpg',
        mimetype: 'image/jpeg'
      };
      const mockFile = {
        id: 'file-123',
        filename: 'test.jpg',
        path: '/uploads/file-123.jpg',
        url: '/uploads/file-123.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockReq.body = validFileData;
      mockFileHandler.uploadFile.mockResolvedValue(mockFile);

      // When
      await filesController.uploadFile(mockReq as Request, mockRes as Response, mockNext);

      // Then
      expect(mockFileHandler.uploadFile).toHaveBeenCalledWith(validFileData);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockFile);
    });

    it('deve retornar erro 400 para dados inválidos (Zod)', async () => {
      // Given
      const invalidData = {
        base64: '', // Campo obrigatório vazio
        filename: 'test.jpg',
        mimetype: 'image/jpeg'
      };
      mockReq.body = invalidData;

      // When
      await filesController.uploadFile(mockReq as Request, mockRes as Response, mockNext);

      // Then
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Dados inválidos',
        details: expect.any(Array)
      });
      expect(mockFileHandler.uploadFile).not.toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando handler falha', async () => {
      // Given
      const validFileData = {
        base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD',
        filename: 'test.jpg',
        mimetype: 'image/jpeg'
      };
      const errorMessage = 'Arquivo muito grande';
      
      mockReq.body = validFileData;
      mockFileHandler.uploadFile.mockRejectedValue(new Error(errorMessage));

      // When
      await filesController.uploadFile(mockReq as Request, mockRes as Response, mockNext);

      // Then
      expect(mockFileHandler.uploadFile).toHaveBeenCalledWith(validFileData);
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: errorMessage });
    });

    it('deve validar campos obrigatórios', async () => {
      // Given
      const incompleteData = {
        base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD'
        // filename e mimetype ausentes
      };
      mockReq.body = incompleteData;

      // When
      await filesController.uploadFile(mockReq as Request, mockRes as Response, mockNext);

      // Then
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Dados inválidos',
        details: expect.any(Array)
      });
    });
  });

  describe('getFileById', () => {
    it('deve retornar arquivo por ID com sucesso', async () => {
      // Given
      const fileId = 'file-123';
      const mockFile = {
        id: fileId,
        filename: 'test.jpg',
        path: '/uploads/file-123.jpg',
        url: '/uploads/file-123.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockReq.params = { id: fileId };
      mockFileHandler.getFileById.mockResolvedValue(mockFile);

      // When
      await filesController.getFileById(mockReq as Request, mockRes as Response, mockNext);

      // Then
      expect(mockFileHandler.getFileById).toHaveBeenCalledWith(fileId);
      expect(mockJson).toHaveBeenCalledWith(mockFile);
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it('deve retornar erro 404 quando arquivo não é encontrado', async () => {
      // Given
      const fileId = 'file-123';
      mockReq.params = { id: fileId };
      mockFileHandler.getFileById.mockResolvedValue(null);

      // When
      await filesController.getFileById(mockReq as Request, mockRes as Response, mockNext);

      // Then
      expect(mockFileHandler.getFileById).toHaveBeenCalledWith(fileId);
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Arquivo não encontrado' });
    });

    it('deve retornar erro 500 quando handler falha', async () => {
      // Given
      const fileId = 'file-123';
      const errorMessage = 'Erro de conexão com o banco';
      
      mockReq.params = { id: fileId };
      mockFileHandler.getFileById.mockRejectedValue(new Error(errorMessage));

      // When
      await filesController.getFileById(mockReq as Request, mockRes as Response, mockNext);

      // Then
      expect(mockFileHandler.getFileById).toHaveBeenCalledWith(fileId);
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('deleteFile', () => {
    it('deve deletar arquivo com sucesso', async () => {
      // Given
      const fileId = 'file-123';
      mockReq.params = { id: fileId };
      const mockDeletedFile = {
        id: fileId,
        filename: 'test.jpg',
        path: '/uploads/file-123.jpg',
        url: '/uploads/file-123.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockFileHandler.deleteFile.mockResolvedValue(mockDeletedFile);

      // When
      await filesController.deleteFile(mockReq as Request, mockRes as Response, mockNext);

      // Then
      expect(mockFileHandler.deleteFile).toHaveBeenCalledWith(fileId);
      expect(mockStatus).toHaveBeenCalledWith(204);
      expect(mockSend).toHaveBeenCalled();
    });

    it('deve retornar erro 404 quando arquivo não é encontrado', async () => {
      // Given
      const fileId = 'file-123';
      const errorMessage = 'Arquivo não encontrado';
      
      mockReq.params = { id: fileId };
      mockFileHandler.deleteFile.mockRejectedValue(new Error(errorMessage));

      // When
      await filesController.deleteFile(mockReq as Request, mockRes as Response, mockNext);

      // Then
      expect(mockFileHandler.deleteFile).toHaveBeenCalledWith(fileId);
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: errorMessage });
    });

    it('deve retornar erro 500 para outros erros', async () => {
      // Given
      const fileId = 'file-123';
      const errorMessage = 'Erro ao deletar arquivo físico';
      
      mockReq.params = { id: fileId };
      mockFileHandler.deleteFile.mockRejectedValue(new Error(errorMessage));

      // When
      await filesController.deleteFile(mockReq as Request, mockRes as Response, mockNext);

      // Then
      expect(mockFileHandler.deleteFile).toHaveBeenCalledWith(fileId);
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('cleanOrphanFilesEndpoint', () => {
    it('deve limpar arquivos órfãos com sucesso', async () => {
      // Given
      mockCleanOrphanFiles.mockResolvedValue(undefined);

      // When
      await filesController.cleanOrphanFilesEndpoint(mockReq as Request, mockRes as Response, mockNext);

      // Then
      expect(mockCleanOrphanFiles).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ 
        message: 'Limpeza de arquivos órfãos concluída com sucesso' 
      });
    });

    it('deve retornar erro 500 quando limpeza falha', async () => {
      // Given
      const errorMessage = 'Erro ao acessar diretório de uploads';
      mockCleanOrphanFiles.mockRejectedValue(new Error(errorMessage));

      // When
      await filesController.cleanOrphanFilesEndpoint(mockReq as Request, mockRes as Response, mockNext);

      // Then
      expect(mockCleanOrphanFiles).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
});