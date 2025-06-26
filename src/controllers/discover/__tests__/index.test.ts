import { Request, Response, NextFunction } from 'express';
import * as discoverController from '../index';
import * as discoverHandlers from '../../../handlers/discover';
import { getPaginationParams } from '../../../utils/pagination';
import { handleZodError } from '../../../utils/zodError';

// Mock das dependências
jest.mock('@/handlers/discover');
jest.mock('@/utils/pagination');
jest.mock('@/utils/zodError');

const mockDiscoverHandlers = discoverHandlers as jest.Mocked<typeof discoverHandlers>;
const mockGetPaginationParams = getPaginationParams as jest.MockedFunction<typeof getPaginationParams>;
const mockHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;

describe('Discover Controller', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;
    let jsonSpy: jest.SpyInstance;
    let statusSpy: jest.SpyInstance;

    beforeEach(() => {
        mockReq = {
            query: {},
        };
        
        jsonSpy = jest.fn().mockReturnThis();
        statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
        mockNext = jest.fn();
        
        mockRes = {
            status: statusSpy as any,
            json: jsonSpy as any
        };

        jest.clearAllMocks();
    });

    describe('getRecent', () => {
        const mockResult = {
            data: [
                {
                    id: '1',
                    manga_uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                    title: 'Mangá Recente',
                    description: 'Descrição do mangá recente',
                    cover: 'cover.jpg',
                    views_count: 100
                }
            ],
            pagination: {
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                next: false,
                prev: false
            }
        };

        beforeEach(() => {
            mockGetPaginationParams.mockReturnValue({ take: 10, page: 1, skip: 0 });
        });

        it('deve retornar mangás recentes com sucesso', async () => {
            // Given
            mockReq.query = { lg: 'pt' };
            mockDiscoverHandlers.getRecent.mockResolvedValue(mockResult);

            // When
            await discoverController.getRecent(mockReq as Request, mockRes as Response, mockNext);

            // Then
            expect(mockGetPaginationParams).toHaveBeenCalledWith(mockReq);
            expect(mockDiscoverHandlers.getRecent).toHaveBeenCalledWith('pt', 1, 10);
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith(mockResult);
        });

        it('deve usar idioma padrão "en" quando não especificado', async () => {
            // Given
            mockDiscoverHandlers.getRecent.mockResolvedValue(mockResult);

            // When
            await discoverController.getRecent(mockReq as Request, mockRes as Response, mockNext);

            // Then
            expect(mockDiscoverHandlers.getRecent).toHaveBeenCalledWith('en', 1, 10);
        });

        it('deve tratar erros usando handleZodError', async () => {
            // Given
            const error = new Error('Erro de teste');
            mockDiscoverHandlers.getRecent.mockRejectedValue(error);

            // When
            await discoverController.getRecent(mockReq as Request, mockRes as Response, mockNext);

            // Then
            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockRes);
        });
    });

    describe('getMostViewed', () => {
        const mockResult = {
            data: [
                {
                    id: '1',
                    manga_uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                    title: 'Mangá Mais Visto',
                    description: 'Descrição do mangá mais visto',
                    cover: 'cover.jpg',
                    views_count: 1000
                }
            ],
            pagination: {
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                next: false,
                prev: false
            }
        };

        beforeEach(() => {
            mockGetPaginationParams.mockReturnValue({ take: 10, page: 1, skip: 0 });
        });

        it('deve retornar mangás mais vistos com sucesso', async () => {
            // Given
            mockReq.query = { lg: 'pt' };
            mockDiscoverHandlers.getMostViewed.mockResolvedValue(mockResult);

            // When
            await discoverController.getMostViewed(mockReq as Request, mockRes as Response, mockNext);

            // Then
            expect(mockGetPaginationParams).toHaveBeenCalledWith(mockReq);
            expect(mockDiscoverHandlers.getMostViewed).toHaveBeenCalledWith('pt', 1, 10);
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith(mockResult);
        });

        it('deve usar idioma padrão "en" quando não especificado', async () => {
            // Given
            mockDiscoverHandlers.getMostViewed.mockResolvedValue(mockResult);

            // When
            await discoverController.getMostViewed(mockReq as Request, mockRes as Response, mockNext);

            // Then
            expect(mockDiscoverHandlers.getMostViewed).toHaveBeenCalledWith('en', 1, 10);
        });

        it('deve tratar erros usando handleZodError', async () => {
            // Given
            const error = new Error('Erro de teste');
            mockDiscoverHandlers.getMostViewed.mockRejectedValue(error);

            // When
            await discoverController.getMostViewed(mockReq as Request, mockRes as Response, mockNext);

            // Then
            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockRes);
        });
    });

    describe('getMostLiked', () => {
        const mockResult = {
            data: [
                {
                    id: '1',
                    manga_uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                    title: 'Mangá Mais Curtido',
                    description: 'Descrição do mangá mais curtido',
                    cover: 'cover.jpg',
                    likes_count: 500
                }
            ],
            pagination: {
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                next: false,
                prev: false
            }
        };

        beforeEach(() => {
            mockGetPaginationParams.mockReturnValue({ take: 10, page: 1, skip: 0 });
        });

        it('deve retornar mangás mais curtidos com sucesso', async () => {
            // Given
            mockReq.query = { lg: 'pt' };
            mockDiscoverHandlers.getMostLiked.mockResolvedValue(mockResult);

            // When
            await discoverController.getMostLiked(mockReq as Request, mockRes as Response, mockNext);

            // Then
            expect(mockGetPaginationParams).toHaveBeenCalledWith(mockReq);
            expect(mockDiscoverHandlers.getMostLiked).toHaveBeenCalledWith('pt', 1, 10);
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith(mockResult);
        });

        it('deve usar idioma padrão "en" quando não especificado', async () => {
            // Given
            mockDiscoverHandlers.getMostLiked.mockResolvedValue(mockResult);

            // When
            await discoverController.getMostLiked(mockReq as Request, mockRes as Response, mockNext);

            // Then
            expect(mockDiscoverHandlers.getMostLiked).toHaveBeenCalledWith('en', 1, 10);
        });

        it('deve tratar erros usando handleZodError', async () => {
            // Given
            const error = new Error('Erro de teste');
            mockDiscoverHandlers.getMostLiked.mockRejectedValue(error);

            // When
            await discoverController.getMostLiked(mockReq as Request, mockRes as Response, mockNext);

            // Then
            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockRes);
        });
    });

    describe('getFeed', () => {
        const mockUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
        const mockResult = {
            data: [
                {
                    id: '1',
                    manga_uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                    title: 'Mangá do Feed',
                    description: 'Descrição do mangá do feed',
                    cover: 'cover.jpg'
                }
            ],
            pagination: {
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                next: false,
                prev: false
            }
        };

        beforeEach(() => {
            mockGetPaginationParams.mockReturnValue({ take: 10, page: 1, skip: 0 });
        });

        it('deve retornar feed personalizado com sucesso', async () => {
            // Given
            mockReq.query = { lg: 'pt' };
            (mockReq as any).user = { id: mockUserId };
            mockDiscoverHandlers.getFeed.mockResolvedValue(mockResult);

            // When
            await discoverController.getFeed(mockReq as Request, mockRes as Response, mockNext);

            // Then
            expect(mockGetPaginationParams).toHaveBeenCalledWith(mockReq);
            expect(mockDiscoverHandlers.getFeed).toHaveBeenCalledWith(mockUserId, 'pt', 1, 10);
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith(mockResult);
        });

        it('deve retornar erro 401 quando usuário não está autenticado', async () => {
            // Given
            mockReq.query = { lg: 'pt' };
            (mockReq as any).user = undefined;

            // When
            await discoverController.getFeed(mockReq as Request, mockRes as Response, mockNext);

            // Then
            expect(statusSpy).toHaveBeenCalledWith(401);
            expect(jsonSpy).toHaveBeenCalledWith({ error: 'Não autenticado.' });
            expect(mockDiscoverHandlers.getFeed).not.toHaveBeenCalled();
        });

        it('deve usar idioma padrão "en" quando não especificado', async () => {
            // Given
            (mockReq as any).user = { id: mockUserId };
            mockDiscoverHandlers.getFeed.mockResolvedValue(mockResult);

            // When
            await discoverController.getFeed(mockReq as Request, mockRes as Response, mockNext);

            // Then
            expect(mockDiscoverHandlers.getFeed).toHaveBeenCalledWith(mockUserId, 'en', 1, 10);
        });

        it('deve tratar erros usando handleZodError', async () => {
            // Given
            (mockReq as any).user = { id: mockUserId };
            const error = new Error('Erro de teste');
            mockDiscoverHandlers.getFeed.mockRejectedValue(error);

            // When
            await discoverController.getFeed(mockReq as Request, mockRes as Response, mockNext);

            // Then
            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockRes);
        });
    });

    describe('getIA', () => {
        const mockUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
        const mockResult = {
            data: [
                {
                    id: '1',
                    manga_uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                    title: 'Recomendação IA',
                    description: 'Descrição da recomendação por IA',
                    cover: 'cover.jpg'
                }
            ],
            pagination: {
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                next: false,
                prev: false
            }
        };

        beforeEach(() => {
            mockGetPaginationParams.mockReturnValue({ take: 10, page: 1, skip: 0 });
        });

        it('deve retornar recomendações de IA com sucesso', async () => {
            // Given
            mockReq.query = { lg: 'pt' };
            (mockReq as any).user = { id: mockUserId };
            mockDiscoverHandlers.getIA.mockResolvedValue(mockResult);

            // When
            await discoverController.getIA(mockReq as Request, mockRes as Response, mockNext);

            // Then
            expect(mockGetPaginationParams).toHaveBeenCalledWith(mockReq);
            expect(mockDiscoverHandlers.getIA).toHaveBeenCalledWith(mockUserId, 'pt', 1, 10);
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith(mockResult);
        });

        it('deve retornar erro 401 quando usuário não está autenticado', async () => {
            // Given
            mockReq.query = { lg: 'pt' };
            (mockReq as any).user = undefined;

            // When
            await discoverController.getIA(mockReq as Request, mockRes as Response, mockNext);

            // Then
            expect(statusSpy).toHaveBeenCalledWith(401);
            expect(jsonSpy).toHaveBeenCalledWith({ error: 'Não autenticado.' });
            expect(mockDiscoverHandlers.getIA).not.toHaveBeenCalled();
        });

        it('deve usar idioma padrão "en" quando não especificado', async () => {
            // Given
            (mockReq as any).user = { id: mockUserId };
            mockDiscoverHandlers.getIA.mockResolvedValue(mockResult);

            // When
            await discoverController.getIA(mockReq as Request, mockRes as Response, mockNext);

            // Then
            expect(mockDiscoverHandlers.getIA).toHaveBeenCalledWith(mockUserId, 'en', 1, 10);
        });

        it('deve tratar erros usando handleZodError', async () => {
            // Given
            (mockReq as any).user = { id: mockUserId };
            const error = new Error('Erro de teste');
            mockDiscoverHandlers.getIA.mockRejectedValue(error);

            // When
            await discoverController.getIA(mockReq as Request, mockRes as Response, mockNext);

            // Then
            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockRes);
        });
    });
});