import { Request, Response, NextFunction } from 'express';

// Mock dos handlers
jest.mock('../handlers/DiscoverHandler', () => ({
    getRecentMangas: jest.fn(),
    getMostViewedMangas: jest.fn(),
    getMostLikedMangas: jest.fn(),
    getFeedForUser: jest.fn(),
    getIARecommendations: jest.fn(),
    getMangasByCategories: jest.fn(),
    getDiscoverStats: jest.fn()
}));

// Mock da paginação
jest.mock('@/utils/pagination', () => ({
    getPaginationParams: jest.fn(() => ({ page: 1, take: 10 }))
}));

// Importar o controller após os mocks
import {
    getRecent,
    getMostViewed,
    getMostLiked,
    getFeed,
    getIA,
    getMangasByCategories,
    getStats,
    healthCheck
} from '../controllers/DiscoverController';

describe('Discover Controller', () => {
    let mockReq: Partial<Request> & { user?: { id: string } };
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;

    beforeEach(() => {
        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });
        mockNext = jest.fn();
        mockRes = {
            json: mockJson,
            status: mockStatus
        };
        mockReq = {
            user: { id: 'user-123' },
            query: {},
            params: {}
        };
        jest.clearAllMocks();
    });

    const mockResult = {
        data: [
            {
                id: 'manga-123',
                title: 'Test Manga',
                description: 'Test Description',
                cover: 'cover.jpg',
                views_count: 100,
                likes_count: 50
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

    describe('getRecent', () => {
        it('deve retornar mangás recentes com sucesso', async () => {
            mockReq.query = { lg: 'pt' };
            
            const { getRecentMangas } = require('../handlers/DiscoverHandler');
            (getRecentMangas as jest.Mock).mockResolvedValue(mockResult);

            await getRecent(mockReq as Request, mockRes as Response, mockNext);

            expect(getRecentMangas).toHaveBeenCalledWith({
                page: 1,
                take: 10,
                language: 'pt'
            });
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockResult);
        });

        it('deve usar idioma padrão quando não especificado', async () => {
            const { getRecentMangas } = require('../handlers/DiscoverHandler');
            (getRecentMangas as jest.Mock).mockResolvedValue(mockResult);

            await getRecent(mockReq as Request, mockRes as Response, mockNext);

            expect(getRecentMangas).toHaveBeenCalledWith({
                page: 1,
                take: 10,
                language: 'pt-BR'
            });
        });

        it('deve tratar erros adequadamente', async () => {
            const error = new Error('Erro interno');
            const { getRecentMangas } = require('../handlers/DiscoverHandler');
            (getRecentMangas as jest.Mock).mockRejectedValue(error);

            await getRecent(mockReq as Request, mockRes as Response, mockNext);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Erro interno' });
        });
    });

    describe('getMostViewed', () => {
        it('deve retornar mangás mais vistos com sucesso', async () => {
            mockReq.query = { lg: 'pt' };
            
            const { getMostViewedMangas } = require('../handlers/DiscoverHandler');
            (getMostViewedMangas as jest.Mock).mockResolvedValue(mockResult);

            await getMostViewed(mockReq as Request, mockRes as Response, mockNext);

            expect(getMostViewedMangas).toHaveBeenCalledWith({
                page: 1,
                take: 10,
                language: 'pt'
            });
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockResult);
        });

        it('deve usar idioma padrão quando não especificado', async () => {
            const { getMostViewedMangas } = require('../handlers/DiscoverHandler');
            (getMostViewedMangas as jest.Mock).mockResolvedValue(mockResult);

            await getMostViewed(mockReq as Request, mockRes as Response, mockNext);

            expect(getMostViewedMangas).toHaveBeenCalledWith({
                page: 1,
                take: 10,
                language: 'pt-BR'
            });
        });

        it('deve tratar erros adequadamente', async () => {
            const error = new Error('Erro interno');
            const { getMostViewedMangas } = require('../handlers/DiscoverHandler');
            (getMostViewedMangas as jest.Mock).mockRejectedValue(error);

            await getMostViewed(mockReq as Request, mockRes as Response, mockNext);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Erro interno' });
        });
    });

    describe('getMostLiked', () => {
        it('deve retornar mangás mais curtidos com sucesso', async () => {
            mockReq.query = { lg: 'pt' };
            
            const { getMostLikedMangas } = require('../handlers/DiscoverHandler');
            (getMostLikedMangas as jest.Mock).mockResolvedValue(mockResult);

            await getMostLiked(mockReq as Request, mockRes as Response, mockNext);

            expect(getMostLikedMangas).toHaveBeenCalledWith({
                page: 1,
                take: 10,
                language: 'pt'
            });
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockResult);
        });

        it('deve usar idioma padrão quando não especificado', async () => {
            const { getMostLikedMangas } = require('../handlers/DiscoverHandler');
            (getMostLikedMangas as jest.Mock).mockResolvedValue(mockResult);

            await getMostLiked(mockReq as Request, mockRes as Response, mockNext);

            expect(getMostLikedMangas).toHaveBeenCalledWith({
                page: 1,
                take: 10,
                language: 'pt-BR'
            });
        });

        it('deve tratar erros adequadamente', async () => {
            const error = new Error('Erro interno');
            const { getMostLikedMangas } = require('../handlers/DiscoverHandler');
            (getMostLikedMangas as jest.Mock).mockRejectedValue(error);

            await getMostLiked(mockReq as Request, mockRes as Response, mockNext);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Erro interno' });
        });
    });

    describe('getFeed', () => {
        const mockUserId = 'user-123';

        it('deve retornar feed personalizado com sucesso', async () => {
            mockReq.query = { lg: 'pt' };
            mockReq.user = { id: mockUserId };
            
            const { getFeedForUser } = require('../handlers/DiscoverHandler');
            (getFeedForUser as jest.Mock).mockResolvedValue(mockResult);

            await getFeed(mockReq as Request, mockRes as Response, mockNext);

            expect(getFeedForUser).toHaveBeenCalledWith(mockUserId, {
                page: 1,
                take: 10,
                language: 'pt'
            });
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockResult);
        });

        it('deve retornar erro quando usuário não está autenticado', async () => {
            mockReq.user = undefined;

            await getFeed(mockReq as Request, mockRes as Response, mockNext);

            expect(mockStatus).toHaveBeenCalledWith(401);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Não autenticado.' });
        });

        it('deve usar idioma padrão quando não especificado', async () => {
            mockReq.user = { id: mockUserId };
            const { getFeedForUser } = require('../handlers/DiscoverHandler');
            (getFeedForUser as jest.Mock).mockResolvedValue(mockResult);

            await getFeed(mockReq as Request, mockRes as Response, mockNext);

            expect(getFeedForUser).toHaveBeenCalledWith(mockUserId, {
                page: 1,
                take: 10,
                language: 'pt-BR'
            });
        });

        it('deve tratar erros adequadamente', async () => {
            const error = new Error('Erro interno');
            mockReq.user = { id: mockUserId };
            const { getFeedForUser } = require('../handlers/DiscoverHandler');
            (getFeedForUser as jest.Mock).mockRejectedValue(error);

            await getFeed(mockReq as Request, mockRes as Response, mockNext);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Erro interno' });
        });
    });

    describe('getIA', () => {
        const mockUserId = 'user-123';

        it('deve retornar recomendações de IA com sucesso', async () => {
            mockReq.query = { lg: 'pt' };
            mockReq.user = { id: mockUserId };
            
            const { getIARecommendations } = require('../handlers/DiscoverHandler');
            (getIARecommendations as jest.Mock).mockResolvedValue(mockResult);

            await getIA(mockReq as Request, mockRes as Response, mockNext);

            expect(getIARecommendations).toHaveBeenCalledWith(mockUserId, {
                page: 1,
                take: 10,
                language: 'pt'
            });
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockResult);
        });

        it('deve retornar erro quando usuário não está autenticado', async () => {
            mockReq.user = undefined;

            await getIA(mockReq as Request, mockRes as Response, mockNext);

            expect(mockStatus).toHaveBeenCalledWith(401);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Não autenticado.' });
        });

        it('deve usar idioma padrão quando não especificado', async () => {
            mockReq.user = { id: mockUserId };
            const { getIARecommendations } = require('../handlers/DiscoverHandler');
            (getIARecommendations as jest.Mock).mockResolvedValue(mockResult);

            await getIA(mockReq as Request, mockRes as Response, mockNext);

            expect(getIARecommendations).toHaveBeenCalledWith(mockUserId, {
                page: 1,
                take: 10,
                language: 'pt-BR'
            });
        });

        it('deve tratar erros adequadamente', async () => {
            const error = new Error('Erro interno');
            mockReq.user = { id: mockUserId };
            const { getIARecommendations } = require('../handlers/DiscoverHandler');
            (getIARecommendations as jest.Mock).mockRejectedValue(error);

            await getIA(mockReq as Request, mockRes as Response, mockNext);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Erro interno' });
        });
    });

    describe('getMangasByCategories', () => {
        it('deve retornar mangás por categorias com sucesso', async () => {
            mockReq.query = { lg: 'pt' };
            mockReq.params = { categoryIds: 'cat-1,cat-2' };
            
            const { getMangasByCategories: getMangasByCategoriesHandler } = require('../handlers/DiscoverHandler');
            (getMangasByCategoriesHandler as jest.Mock).mockResolvedValue(mockResult);

            await getMangasByCategories(mockReq as Request, mockRes as Response, mockNext);

            expect(getMangasByCategoriesHandler).toHaveBeenCalledWith(['cat-1', 'cat-2'], {
                page: 1,
                take: 10,
                language: 'pt'
            });
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockResult);
        });

        it('deve retornar erro quando não há IDs de categorias', async () => {
            mockReq.params = {};

            await getMangasByCategories(mockReq as Request, mockRes as Response, mockNext);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'IDs de categorias são obrigatórios' });
        });

        it('deve usar idioma padrão quando não especificado', async () => {
            mockReq.params = { categoryIds: 'cat-1' };
            const { getMangasByCategories: getMangasByCategoriesHandler } = require('../handlers/DiscoverHandler');
            (getMangasByCategoriesHandler as jest.Mock).mockResolvedValue(mockResult);

            await getMangasByCategories(mockReq as Request, mockRes as Response, mockNext);

            expect(getMangasByCategoriesHandler).toHaveBeenCalledWith(['cat-1'], {
                page: 1,
                take: 10,
                language: 'pt-BR'
            });
        });

        it('deve tratar erros adequadamente', async () => {
            const error = new Error('Erro interno');
            mockReq.params = { categoryIds: 'cat-1' };
            const { getMangasByCategories: getMangasByCategoriesHandler } = require('../handlers/DiscoverHandler');
            (getMangasByCategoriesHandler as jest.Mock).mockRejectedValue(error);

            await getMangasByCategories(mockReq as Request, mockRes as Response, mockNext);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Erro interno' });
        });
    });

    describe('getStats', () => {
        it('deve retornar estatísticas com sucesso', async () => {
            mockReq.query = { lg: 'pt' };
            
            const mockStats = {
                totalMangas: 100,
                totalCategories: 10,
                totalViews: 0,
                totalLikes: 0,
                averageMangasPerCategory: 10,
                language: 'pt'
            };
            
            const { getDiscoverStats } = require('../handlers/DiscoverHandler');
            (getDiscoverStats as jest.Mock).mockResolvedValue(mockStats);

            await getStats(mockReq as Request, mockRes as Response, mockNext);

            expect(getDiscoverStats).toHaveBeenCalledWith('pt');
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockStats);
        });

        it('deve usar idioma padrão quando não especificado', async () => {
            const mockStats = {
                totalMangas: 100,
                totalCategories: 10,
                totalViews: 0,
                totalLikes: 0,
                averageMangasPerCategory: 10,
                language: 'pt-BR'
            };
            
            const { getDiscoverStats } = require('../handlers/DiscoverHandler');
            (getDiscoverStats as jest.Mock).mockResolvedValue(mockStats);

            await getStats(mockReq as Request, mockRes as Response, mockNext);

            expect(getDiscoverStats).toHaveBeenCalledWith('pt-BR');
        });

        it('deve tratar erros adequadamente', async () => {
            const error = new Error('Erro interno');
            const { getDiscoverStats } = require('../handlers/DiscoverHandler');
            (getDiscoverStats as jest.Mock).mockRejectedValue(error);

            await getStats(mockReq as Request, mockRes as Response, mockNext);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Erro interno' });
        });
    });

    describe('healthCheck', () => {
        it('deve retornar status saudável', async () => {
            await healthCheck(mockReq as Request, mockRes as Response, mockNext);

            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({
                status: 'healthy',
                timestamp: expect.any(String),
                service: 'discover'
            });
        });

        it('deve retornar status saudável por padrão', async () => {
            await healthCheck(mockReq as Request, mockRes as Response, mockNext);

            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({
                status: 'healthy',
                timestamp: expect.any(String),
                service: 'discover'
            });
        });
    });
});
