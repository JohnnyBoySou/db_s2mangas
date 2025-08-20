import fs from 'fs';
import path from 'path';
import { uploadFile, getFileById, deleteFile } from '../handlers/FilesHandler';
import prisma from '../../../prisma/client';

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
    file: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
    },
}));

// Mock do fs
jest.mock('fs', () => ({
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    promises: {
        writeFile: jest.fn(),
        unlink: jest.fn(),
    },
}));

// Mock do uuid
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid-123'),
}));

const prismaMock = prisma as jest.Mocked<typeof prisma>;
const fsMock = fs as jest.Mocked<typeof fs>;

describe('Files Handler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.PUBLIC_BASE_URL = 'http://localhost:3000';
    });

    describe('uploadFile', () => {
        const mockFileData = {
            base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD',
            filename: 'test.jpg',
            mimetype: 'image/jpeg'
        };

        const mockFileRecord = {
            id: 'test-uuid-123',
            filename: 'test.jpg',
            path: expect.any(String),
            url: 'http://localhost:3000/uploads/test-uuid-123.jpg',
            mimetype: 'image/jpeg',
            size: expect.any(Number),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        it('should upload a file successfully', async () => {
            // Given
            (fsMock.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
            (prismaMock.file.create as jest.Mock).mockResolvedValue(mockFileRecord);

            // When
            const result = await uploadFile(mockFileData);

            // Then
            expect(fsMock.promises.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('test-uuid-123.jpg'),
                expect.any(Buffer)
            );
            expect(prismaMock.file.create).toHaveBeenCalledWith({
                data: {
                    id: 'test-uuid-123',
                    filename: 'test.jpg',
                    path: expect.stringContaining('test-uuid-123.jpg'),
                    url: 'http://localhost:3000/uploads/test-uuid-123.jpg',
                    mimetype: 'image/jpeg',
                    size: expect.any(Number)
                }
            });
            expect(result).toEqual(mockFileRecord);
        });

        it('should throw error for invalid mimetype', async () => {
            // Given
            const invalidFileData = {
                ...mockFileData,
                mimetype: 'application/pdf'
            };

            // When & Then
            await expect(uploadFile(invalidFileData))
                .rejects.toThrow('Tipo de arquivo não permitido');
        });

        it('should throw error for file too large', async () => {
            // Given
            const largeBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(7000000); // > 5MB
            const largeFileData = {
                ...mockFileData,
                base64: largeBase64
            };

            // When & Then
            await expect(uploadFile(largeFileData))
                .rejects.toThrow('Arquivo muito grande');
        });

        it('should handle file write error', async () => {
            // Given
            (fsMock.promises.writeFile as jest.Mock).mockRejectedValue(new Error('Write error'));

            // When & Then
            await expect(uploadFile(mockFileData))
                .rejects.toThrow('Write error');
        });
    });

    describe('getFileById', () => {
        it('should get file by id successfully', async () => {
            // Given
            const fileId = 'test-file-id';
            const mockFile = {
                id: fileId,
                filename: 'test.jpg',
                path: '/uploads/test.jpg',
                url: 'http://localhost:3000/uploads/test.jpg',
                mimetype: 'image/jpeg',
                size: 1024,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            (prismaMock.file.findUnique as jest.Mock).mockResolvedValue(mockFile);

            // When
            const result = await getFileById(fileId);

            // Then
            expect(prismaMock.file.findUnique).toHaveBeenCalledWith({
                where: { id: fileId }
            });
            expect(result).toEqual(mockFile);
        });

        it('should return null when file not found', async () => {
            // Given
            const fileId = 'non-existent-id';
            (prismaMock.file.findUnique as jest.Mock).mockResolvedValue(null);

            // When
            const result = await getFileById(fileId);

            // Then
            expect(result).toBeNull();
        });
    });

    describe('deleteFile', () => {
        const mockFile = {
            id: 'test-file-id',
            filename: 'test.jpg',
            path: '/uploads/test.jpg',
            url: 'http://localhost:3000/uploads/test.jpg',
            mimetype: 'image/jpeg',
            size: 1024,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        it('should delete file successfully', async () => {
            // Given
            const fileId = 'test-file-id';
            (prismaMock.file.findUnique as jest.Mock).mockResolvedValue(mockFile);
            (fsMock.promises.unlink as jest.Mock).mockResolvedValue(undefined);
            (prismaMock.file.delete as jest.Mock).mockResolvedValue(mockFile);

            // When
            const result = await deleteFile(fileId);

            // Then
            expect(prismaMock.file.findUnique).toHaveBeenCalledWith({
                where: { id: fileId }
            });
            expect(fsMock.promises.unlink).toHaveBeenCalledWith(mockFile.path);
            expect(prismaMock.file.delete).toHaveBeenCalledWith({
                where: { id: fileId }
            });
            expect(result).toEqual(mockFile);
        });

        it('should throw error when file not found', async () => {
            // Given
            const fileId = 'non-existent-id';
            (prismaMock.file.findUnique as jest.Mock).mockResolvedValue(null);

            // When & Then
            await expect(deleteFile(fileId))
                .rejects.toThrow('Arquivo não encontrado');
        });

        it('should continue deletion even if physical file removal fails', async () => {
            // Given
            const fileId = 'test-file-id';
            (prismaMock.file.findUnique as jest.Mock).mockResolvedValue(mockFile);
            (fsMock.promises.unlink as jest.Mock).mockRejectedValue(new Error('File not found'));
            (prismaMock.file.delete as jest.Mock).mockResolvedValue(mockFile);
            
            // Mock console.error to avoid noise in tests
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // When
            const result = await deleteFile(fileId);

            // Then
            expect(consoleSpy).toHaveBeenCalledWith('Erro ao deletar arquivo físico:', expect.any(Error));
            expect(prismaMock.file.delete).toHaveBeenCalledWith({
                where: { id: fileId }
            });
            expect(result).toEqual(mockFile);
            
            consoleSpy.mockRestore();
        });
    });
});