import { Request, Response, NextFunction } from 'express';
import { uploadFile, getFileById, deleteFile, cleanOrphanFilesEndpoint } from '../controllers/FilesController';
import * as fileHandler from '../handlers/FilesHandler';
import { cleanOrphanFiles } from '../../../utils/cleanOrphanFiles';
import { uploadFileSchema } from '../validators/FilesValidator';
import { handleZodError } from '../../../utils/zodError';

// Mock dos handlers e utilitários
jest.mock('../handlers/FilesHandler');
jest.mock('../../../utils/cleanOrphanFiles');
jest.mock('../validators/FilesValidator');
jest.mock('../../../utils/zodError');

const fileHandlerMock = fileHandler as jest.Mocked<typeof fileHandler>;
const cleanOrphanFilesMock = cleanOrphanFiles as jest.MockedFunction<typeof cleanOrphanFiles>;
const uploadFileSchemaMock = uploadFileSchema as jest.Mocked<typeof uploadFileSchema>;
const handleZodErrorMock = handleZodError as jest.MockedFunction<typeof handleZodError>;

describe('Files Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;
    let mockSend: jest.Mock;

    beforeEach(() => {
        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnThis();
        mockSend = jest.fn();
        
        mockResponse = {
            json: mockJson,
            status: mockStatus,
            send: mockSend
        };
        
        mockRequest = {};
        
        jest.clearAllMocks();
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
            path: '/uploads/test-uuid-123.jpg',
            url: 'http://localhost:3000/uploads/test-uuid-123.jpg',
            mimetype: 'image/jpeg',
            size: 1024,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        it('should upload file successfully', async () => {
            // Given
            mockRequest.body = mockFileData;
            uploadFileSchemaMock.parse = jest.fn().mockReturnValue(mockFileData);
            fileHandlerMock.uploadFile.mockResolvedValue(mockFileRecord);

            // When
            await uploadFile(mockRequest as Request, mockResponse as Response, {} as NextFunction);

            // Then
            expect(uploadFileSchemaMock.parse).toHaveBeenCalledWith(mockFileData);
            expect(fileHandlerMock.uploadFile).toHaveBeenCalledWith(mockFileData);
            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith(mockFileRecord);
        });

        it('should handle validation error', async () => {
            // Given
            const validationError = new Error('Validation failed');
            mockRequest.body = { invalid: 'data' };
            uploadFileSchemaMock.parse = jest.fn().mockImplementation(() => {
                throw validationError;
            });

            // When
            await uploadFile(mockRequest as Request, mockResponse as Response, {} as NextFunction);

            // Then
            expect(handleZodErrorMock).toHaveBeenCalledWith(validationError, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Validation failed' });
        });

        it('should handle upload error', async () => {
            // Given
            const uploadError = new Error('Upload failed');
            mockRequest.body = mockFileData;
            uploadFileSchemaMock.parse = jest.fn().mockReturnValue(mockFileData);
            fileHandlerMock.uploadFile.mockRejectedValue(uploadError);

            // When
            await uploadFile(mockRequest as Request, mockResponse as Response, {} as NextFunction);

            // Then
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Upload failed' });
        });
    });

    describe('getFileById', () => {
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

        it('should get file by id successfully', async () => {
            // Given
            const fileId = 'test-file-id';
            mockRequest.params = { id: fileId };
            fileHandlerMock.getFileById.mockResolvedValue(mockFile);

            // When
            await getFileById(mockRequest as Request, mockResponse as Response, {} as NextFunction);

            // Then
            expect(fileHandlerMock.getFileById).toHaveBeenCalledWith(fileId);
            expect(mockJson).toHaveBeenCalledWith(mockFile);
        });

        it('should return 404 when file not found', async () => {
            // Given
            const fileId = 'non-existent-id';
            mockRequest.params = { id: fileId };
            fileHandlerMock.getFileById.mockResolvedValue(null);

            // When
            await getFileById(mockRequest as Request, mockResponse as Response, {} as NextFunction);

            // Then
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Arquivo não encontrado' });
        });

        it('should handle server error', async () => {
            // Given
            const fileId = 'test-file-id';
            const serverError = new Error('Database error');
            mockRequest.params = { id: fileId };
            fileHandlerMock.getFileById.mockRejectedValue(serverError);

            // When
            await getFileById(mockRequest as Request, mockResponse as Response, {} as NextFunction);

            // Then
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Database error' });
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
            mockRequest.params = { id: fileId };
            fileHandlerMock.deleteFile.mockResolvedValue(mockFile);

            // When
            await deleteFile(mockRequest as Request, mockResponse as Response, {} as NextFunction);

            // Then
            expect(fileHandlerMock.deleteFile).toHaveBeenCalledWith(fileId);
            expect(mockStatus).toHaveBeenCalledWith(204);
            expect(mockSend).toHaveBeenCalled();
        });

        it('should return 404 when file not found', async () => {
            // Given
            const fileId = 'non-existent-id';
            const notFoundError = new Error('Arquivo não encontrado');
            mockRequest.params = { id: fileId };
            fileHandlerMock.deleteFile.mockRejectedValue(notFoundError);

            // When
            await deleteFile(mockRequest as Request, mockResponse as Response, {} as NextFunction);

            // Then
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Arquivo não encontrado' });
        });

        it('should handle server error', async () => {
            // Given
            const fileId = 'test-file-id';
            const serverError = new Error('Database error');
            mockRequest.params = { id: fileId };
            fileHandlerMock.deleteFile.mockRejectedValue(serverError);

            // When
            await deleteFile(mockRequest as Request, mockResponse as Response, {} as NextFunction);

            // Then
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Database error' });
        });
    });

    describe('cleanOrphanFilesEndpoint', () => {
        it('should clean orphan files successfully', async () => {
            // Given
            cleanOrphanFilesMock.mockResolvedValue(undefined);

            // When
            await cleanOrphanFilesEndpoint(mockRequest as Request, mockResponse as Response, {} as NextFunction);

            // Then
            expect(cleanOrphanFilesMock).toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({
                message: 'Limpeza de arquivos órfãos concluída com sucesso'
            });
        });

        it('should handle clean orphan files error', async () => {
            // Given
            const cleanError = new Error('Clean failed');
            cleanOrphanFilesMock.mockRejectedValue(cleanError);

            // When
            await cleanOrphanFilesEndpoint(mockRequest as Request, mockResponse as Response, {} as NextFunction);

            // Then
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Clean failed' });
        });
    });
});