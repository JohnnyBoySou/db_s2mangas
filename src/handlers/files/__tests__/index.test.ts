import { uploadFile, getFileById, deleteFile } from '../index';
import { prismaMock } from '../../../test/mocks/prisma';
import fs from 'fs';
import path from 'path';

// Mock do fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  promises: {
    writeFile: jest.fn(),
    unlink: jest.fn()
  }
}));

// Mock do path
jest.mock('path', () => ({
  join: jest.fn(),
  extname: jest.fn()
}));

// Mock do uuid
jest.mock('uuid', () => ({
  v4: jest.fn()
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;
const { v4: mockUuidv4 } = require('uuid');

describe('Files Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup padrão dos mocks
    mockFs.existsSync.mockReturnValue(true);
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.extname.mockReturnValue('.jpg');
    mockUuidv4.mockReturnValue('test-uuid-123');
  });

  describe('uploadFile', () => {
    const validFileData = {
      base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD',
      filename: 'test.jpg',
      mimetype: 'image/jpeg'
    };

    it('deve fazer upload de arquivo com sucesso', async () => {
      // Given
      const mockFileRecord = {
        id: 'test-uuid-123',
        filename: 'test.jpg',
        path: 'uploads/test-uuid-123.jpg',
        url: '/uploads/test-uuid-123.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      };
      
      prismaMock.file.create.mockResolvedValue(mockFileRecord);
      (mockFs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

      // When
      const result = await uploadFile(validFileData);

      // Then
      expect(mockFs.promises.writeFile).toHaveBeenCalled();
      expect(prismaMock.file.create).toHaveBeenCalledWith({
        data: {
          id: 'test-uuid-123',
          filename: 'test.jpg',
          path: expect.stringContaining('test-uuid-123.jpg'),
          url: '/uploads/test-uuid-123.jpg',
          mimetype: 'image/jpeg',
          size: expect.any(Number)
        }
      });
      expect(result).toEqual(mockFileRecord);
    });

    it('deve rejeitar tipo de arquivo não permitido', async () => {
      // Given
      const invalidFileData = {
        ...validFileData,
        mimetype: 'application/pdf'
      };

      // When & Then
      await expect(uploadFile(invalidFileData)).rejects.toThrow(
        'Tipo de arquivo não permitido'
      );
      expect(mockFs.promises.writeFile).not.toHaveBeenCalled();
      expect(prismaMock.file.create).not.toHaveBeenCalled();
    });

    it('deve rejeitar arquivo muito grande', async () => {
      // Given
      const largeBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(7000000); // > 5MB
      const largeFileData = {
        ...validFileData,
        base64: largeBase64
      };

      // When & Then
      await expect(uploadFile(largeFileData)).rejects.toThrow(
        'Arquivo muito grande'
      );
      expect(mockFs.promises.writeFile).not.toHaveBeenCalled();
      expect(prismaMock.file.create).not.toHaveBeenCalled();
    });

    it('deve criar arquivo no sistema de arquivos', async () => {
      // Given
      const fileData = {
        base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD',
        filename: 'test.jpg',
        mimetype: 'image/jpeg'
      };

      const mockFileRecord = {
        id: 'test-uuid-123',
        filename: 'test.jpg',
        path: '/uploads/test-uuid-123.jpg',
        url: '/uploads/test-uuid-123.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUuidv4.mockReturnValue('test-uuid-123');
      prismaMock.file.create.mockResolvedValue(mockFileRecord);
      (mockFs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

      // When
      await uploadFile(fileData);

      // Then
      expect(mockFs.promises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('test-uuid-123.jpg'),
        expect.any(Buffer)
      );
    });

    it('deve propagar erro do Prisma', async () => {
      // Given
      const errorMessage = 'Erro de conexão com o banco';
      prismaMock.file.create.mockRejectedValue(new Error(errorMessage));
      (mockFs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

      // When & Then
      await expect(uploadFile(validFileData)).rejects.toThrow(errorMessage);
    });

    it('deve propagar erro de escrita do arquivo', async () => {
      // Given
      const errorMessage = 'Erro ao escrever arquivo';
      (mockFs.promises.writeFile as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // When & Then
      await expect(uploadFile(validFileData)).rejects.toThrow(errorMessage);
      expect(prismaMock.file.create).not.toHaveBeenCalled();
    });
  });

  describe('getFileById', () => {
    it('deve retornar arquivo por ID com sucesso', async () => {
      // Given
      const fileId = 'file-123';
      const mockFile = {
        id: fileId,
        filename: 'test.jpg',
        path: '/uploads/test.jpg',
        url: '/uploads/test.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      };
      
      prismaMock.file.findUnique.mockResolvedValue(mockFile);

      // When
      const result = await getFileById(fileId);

      // Then
      expect(prismaMock.file.findUnique).toHaveBeenCalledWith({
        where: { id: fileId }
      });
      expect(result).toEqual(mockFile);
    });

    it('deve retornar null quando arquivo não é encontrado', async () => {
      // Given
      const fileId = 'file-123';
      prismaMock.file.findUnique.mockResolvedValue(null);

      // When
      const result = await getFileById(fileId);

      // Then
      expect(prismaMock.file.findUnique).toHaveBeenCalledWith({
        where: { id: fileId }
      });
      expect(result).toBeNull();
    });

    it('deve propagar erro do Prisma', async () => {
      // Given
      const fileId = 'file-123';
      const errorMessage = 'Erro de conexão com o banco';
      prismaMock.file.findUnique.mockRejectedValue(new Error(errorMessage));

      // When & Then
      await expect(getFileById(fileId)).rejects.toThrow(errorMessage);
    });
  });

  describe('deleteFile', () => {
    it('deve deletar arquivo com sucesso', async () => {
      // Given
      const fileId = 'file-123';
      const mockFile = {
        id: fileId,
        filename: 'test.jpg',
        path: '/uploads/test.jpg',
        url: '/uploads/test.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      };
      
      prismaMock.file.findUnique.mockResolvedValue(mockFile);
      prismaMock.file.delete.mockResolvedValue(mockFile);
      (mockFs.promises.unlink as jest.Mock).mockResolvedValue(undefined);

      // When
      const result = await deleteFile(fileId);

      // Then
      expect(prismaMock.file.findUnique).toHaveBeenCalledWith({
        where: { id: fileId }
      });
      expect(mockFs.promises.unlink).toHaveBeenCalledWith(mockFile.path);
      expect(prismaMock.file.delete).toHaveBeenCalledWith({
        where: { id: fileId }
      });
      expect(result).toEqual(mockFile);
    });

    it('deve lançar erro quando arquivo não é encontrado', async () => {
      // Given
      const fileId = 'file-123';
      prismaMock.file.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(deleteFile(fileId)).rejects.toThrow('Arquivo não encontrado');
      expect(prismaMock.file.findUnique).toHaveBeenCalledWith({
        where: { id: fileId }
      });
      expect(mockFs.promises.unlink).not.toHaveBeenCalled();
      expect(prismaMock.file.delete).not.toHaveBeenCalled();
    });

    it('deve continuar mesmo se falhar ao deletar arquivo físico', async () => {
      // Given
      const fileId = 'file-123';
      const mockFile = {
        id: fileId,
        filename: 'test.jpg',
        path: '/uploads/test.jpg',
        url: '/uploads/test.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      };
      
      prismaMock.file.findUnique.mockResolvedValue(mockFile);
      prismaMock.file.delete.mockResolvedValue(mockFile);
      (mockFs.promises.unlink as jest.Mock).mockRejectedValue(new Error('Arquivo físico não encontrado'));
      
      // Mock console.error para evitar logs durante o teste
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // When
      const result = await deleteFile(fileId);

      // Then
      expect(mockFs.promises.unlink).toHaveBeenCalledWith(mockFile.path);
      expect(consoleSpy).toHaveBeenCalledWith('Erro ao deletar arquivo físico:', expect.any(Error));
      expect(prismaMock.file.delete).toHaveBeenCalledWith({
        where: { id: fileId }
      });
      expect(result).toEqual(mockFile);
      
      consoleSpy.mockRestore();
    });

    it('deve propagar erro do Prisma ao deletar registro', async () => {
      // Given
      const fileId = 'file-123';
      const mockFile = {
        id: fileId,
        filename: 'test.jpg',
        path: '/uploads/test.jpg',
        url: '/uploads/test.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      };
      const errorMessage = 'Erro de conexão com o banco';
      
      prismaMock.file.findUnique.mockResolvedValue(mockFile);
      (mockFs.promises.unlink as jest.Mock).mockResolvedValue(undefined);
      prismaMock.file.delete.mockRejectedValue(new Error(errorMessage));

      // When & Then
      await expect(deleteFile(fileId)).rejects.toThrow(errorMessage);
      expect(mockFs.promises.unlink).toHaveBeenCalledWith(mockFile.path);
    });
  });
});