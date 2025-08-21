import { Request, Response, NextFunction } from 'express';
import { postSummary } from '../controllers/SummaryControllers';
import { summarizeHandler } from '../handlers/SummaryHandlers';

// Mock do handler
jest.mock('../handlers/SummaryHandlers');
const mockSummarizeHandler = summarizeHandler as jest.MockedFunction<typeof summarizeHandler>;

describe('Summary Controllers', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;
    let jsonSpy: jest.SpyInstance;

    beforeEach(() => {
        mockReq = {
            body: {},
            files: []
        };
        
        jsonSpy = jest.fn();
        mockRes = {
            json: jsonSpy
        } as any;
        
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('postSummary', () => {
        it('deve processar requisição com arquivos', async () => {
            const mockFiles = [
                {
                    buffer: Buffer.from('fake image data'),
                    originalname: 'test.jpg',
                    mimetype: 'image/jpeg'
                }
            ] as any;

            mockReq.files = mockFiles;
            
            const mockResult = {
                success: true,
                summary: 'Texto extraído'
            };

            mockSummarizeHandler.mockResolvedValueOnce(mockResult);

            await postSummary(mockReq as Request, mockRes as Response, mockNext);

            expect(mockSummarizeHandler).toHaveBeenCalledWith({
                files: mockFiles,
                imageUrls: []
            });
            expect(jsonSpy).toHaveBeenCalledWith(mockResult);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('deve processar requisição com image_urls no body', async () => {
            const imageUrls = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'];
            mockReq.body = { image_urls: imageUrls };
            
            const mockResult = {
                success: true,
                summary: 'Texto extraído das URLs'
            };

            mockSummarizeHandler.mockResolvedValueOnce(mockResult);

            await postSummary(mockReq as Request, mockRes as Response, mockNext);

            expect(mockSummarizeHandler).toHaveBeenCalledWith({
                files: [],
                imageUrls
            });
            expect(jsonSpy).toHaveBeenCalledWith(mockResult);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('deve processar requisição com imageUrls no body (formato alternativo)', async () => {
            const imageUrls = ['https://example.com/image1.jpg'];
            mockReq.body = { imageUrls };
            
            const mockResult = {
                success: true,
                summary: 'Texto extraído'
            };

            mockSummarizeHandler.mockResolvedValueOnce(mockResult);

            await postSummary(mockReq as Request, mockRes as Response, mockNext);

            expect(mockSummarizeHandler).toHaveBeenCalledWith({
                files: [],
                imageUrls
            });
            expect(jsonSpy).toHaveBeenCalledWith(mockResult);
        });

        it('deve usar array vazio quando não há image_urls nem imageUrls', async () => {
            mockReq.body = {};
            
            const mockResult = {
                success: true,
                summary: 'Resultado padrão'
            };

            mockSummarizeHandler.mockResolvedValueOnce(mockResult);

            await postSummary(mockReq as Request, mockRes as Response, mockNext);

            expect(mockSummarizeHandler).toHaveBeenCalledWith({
                files: [],
                imageUrls: []
            });
        });

        it('deve processar requisição com arquivos e URLs simultaneamente', async () => {
            const mockFiles = [
                {
                    buffer: Buffer.from('fake image data'),
                    originalname: 'test.jpg',
                    mimetype: 'image/jpeg'
                }
            ] as any;
            const imageUrls = ['https://example.com/image1.jpg'];

            mockReq.files = mockFiles;
            mockReq.body = { image_urls: imageUrls };
            
            const mockResult = {
                success: true,
                summary: 'Texto extraído de arquivos e URLs'
            };

            mockSummarizeHandler.mockResolvedValueOnce(mockResult);

            await postSummary(mockReq as Request, mockRes as Response, mockNext);

            expect(mockSummarizeHandler).toHaveBeenCalledWith({
                files: mockFiles,
                imageUrls
            });
            expect(jsonSpy).toHaveBeenCalledWith(mockResult);
        });

        it('deve chamar next com erro quando handler falha', async () => {
            const error = new Error('Erro no handler');
            mockSummarizeHandler.mockRejectedValueOnce(error);

            await postSummary(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
            expect(jsonSpy).not.toHaveBeenCalled();
        });

        it('deve tratar files como array vazio quando não definido', async () => {
            mockReq.files = undefined;
            
            const mockResult = {
                success: true,
                summary: 'Resultado sem arquivos'
            };

            mockSummarizeHandler.mockResolvedValueOnce(mockResult);

            await postSummary(mockReq as Request, mockRes as Response, mockNext);

            expect(mockSummarizeHandler).toHaveBeenCalledWith({
                files: [],
                imageUrls: []
            });
        });
    });
});