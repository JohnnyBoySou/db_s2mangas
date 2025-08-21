import { Request, Response, NextFunction } from 'express';
import { prismaMock } from '../../../test/mocks/prisma';
import { MANGA_TYPE } from '@/constants/search';

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
    __esModule: true,
    default: prismaMock,
}));

// Mock dos handlers
const mockSearchHandlers = {
    searchManga: jest.fn(),
    listCategories: jest.fn(),
    searchCategories: jest.fn(),
    listLanguages: jest.fn()
};

jest.mock('../handlers/SearchHandler', () => mockSearchHandlers);

// Mock da função handleZodError
const mockHandleZodError = jest.fn();
jest.mock('@/utils/zodError', () => ({
    handleZodError: mockHandleZodError
}));

import * as searchControllers from '../controllers/SearchController';

describe('Search Controllers', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;
    let jsonSpy: jest.SpyInstance;
    let statusSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockReq = {
            body: {},
            query: {},
            params: {}
        };

        jsonSpy = jest.fn();
        statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
        mockNext = jest.fn();
        
        mockRes = {
            status: statusSpy as any,
            json: jsonSpy as any
        };
    });

    describe('searchManga', () => {
        it('deve buscar mangás com dados válidos', async () => {
            const searchData = {
                name: 'One Piece',
                category: 'Ação',
                status: 'Em andamento',
                type: 'Manga',
                page: 1,
                limit: 10
            };

            const expectedResult = {
                data: [
                    {
                        id: 'manga-123',
                        title: 'One Piece',
                        cover: 'cover.jpg',
                        type: 'Manga',
                        status: 'Em andamento'
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

            mockReq.body = searchData;
            mockReq.params = { lg: 'pt-BR' };
            mockSearchHandlers.searchManga.mockResolvedValue(expectedResult);

            await searchControllers.searchManga(mockReq as Request, mockRes as Response, mockNext);

            expect(mockSearchHandlers.searchManga).toHaveBeenCalledWith({
                name: 'One Piece',
                category: 'Ação',
                status: 'Em andamento',
                type: 'Manga',
                page: 1,
                limit: 10,
                language: 'pt-BR'
            });

            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith(expectedResult);
        });

        it('deve usar valores padrão quando não fornecidos', async () => {
            const expectedResult = {
                data: [],
                pagination: {
                    total: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 0,
                    next: false,
                    prev: false
                }
            };

            mockReq.body = {};
            mockSearchHandlers.searchManga.mockResolvedValue(expectedResult);

            await searchControllers.searchManga(mockReq as Request, mockRes as Response, mockNext);

            expect(mockSearchHandlers.searchManga).toHaveBeenCalledWith({
                name: undefined,
                category: undefined,
                status: undefined,
                type: undefined,
                page: 1,
                limit: 10,
                language: 'pt-BR'
            });

            expect(statusSpy).toHaveBeenCalledWith(200);
        });

        it('deve usar idioma padrão quando não especificado', async () => {
            const expectedResult = { data: [], pagination: {} };

            mockReq.body = { name: 'Test' };
            mockSearchHandlers.searchManga.mockResolvedValue(expectedResult);

            await searchControllers.searchManga(mockReq as Request, mockRes as Response, mockNext);

            expect(mockSearchHandlers.searchManga).toHaveBeenCalledWith(
                expect.objectContaining({
                    language: 'pt-BR'
                })
            );
        });

        it('deve tratar erros corretamente', async () => {
            const error = new Error('Database error');
            mockReq.body = { name: 'Test' };
            mockSearchHandlers.searchManga.mockRejectedValue(error);

            await searchControllers.searchManga(mockReq as Request, mockRes as Response, mockNext);

            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockRes);
        });
    });

    describe('listCategories', () => {
        it('deve listar todas as categorias', async () => {
            const expectedCategories = [
                { id: 'cat-1', name: 'Ação' },
                { id: 'cat-2', name: 'Romance' }
            ];

            mockSearchHandlers.listCategories.mockResolvedValue(expectedCategories);

            await searchControllers.listCategories(mockReq as Request, mockRes as Response, mockNext);

            expect(mockSearchHandlers.listCategories).toHaveBeenCalled();
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith(expectedCategories);
        });

        it('deve tratar erros ao listar categorias', async () => {
            const error = new Error('Database error');
            mockSearchHandlers.listCategories.mockRejectedValue(error);

            await searchControllers.listCategories(mockReq as Request, mockRes as Response, mockNext);

            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockRes);
        });
    });

    describe('searchCategories', () => {
        it('deve buscar categorias com nome válido', async () => {
            const searchData = {
                name: 'Ação',
                page: 1,
                limit: 10
            };

            const expectedResult = {
                data: [
                    {
                        id: 'manga-123',
                        title: 'One Piece',
                        categories: [{ name: 'Ação' }]
                    }
                ],
                pagination: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1
                }
            };

            mockReq.body = searchData;
            mockReq.params = { lg: 'pt-BR' };
            mockSearchHandlers.searchCategories.mockResolvedValue(expectedResult);

            await searchControllers.searchCategories(mockReq as Request, mockRes as Response, mockNext);

            expect(mockSearchHandlers.searchCategories).toHaveBeenCalledWith(
                'Ação',
                1,
                10,
                'pt-BR'
            );

            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith(expectedResult);
        });

        it('deve usar valores padrão para paginação', async () => {
            const searchData = { name: 'Ação' };
            const expectedResult = { data: [], pagination: {} };

            mockReq.body = searchData;
            mockSearchHandlers.searchCategories.mockResolvedValue(expectedResult);

            await searchControllers.searchCategories(mockReq as Request, mockRes as Response, mockNext);

            expect(mockSearchHandlers.searchCategories).toHaveBeenCalledWith(
                'Ação',
                1,  // valor padrão
                10, // valor padrão
                'pt-BR'
            );
        });

        it('deve retornar erro 400 quando nome não for fornecido', async () => {
            mockReq.body = {};

            await searchControllers.searchCategories(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(400);
            expect(jsonSpy).toHaveBeenCalledWith({
                error: 'Nome da categoria é obrigatório.'
            });
        });

        it('deve retornar erro 400 quando nome não for string', async () => {
            mockReq.body = { name: 123 };

            await searchControllers.searchCategories(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(400);
            expect(jsonSpy).toHaveBeenCalledWith({
                error: 'Nome da categoria é obrigatório.'
            });
        });

        it('deve tratar erros do handler', async () => {
            const error = new Error('Database error');
            mockReq.body = { name: 'Ação' };
            mockSearchHandlers.searchCategories.mockRejectedValue(error);

            await searchControllers.searchCategories(mockReq as Request, mockRes as Response, mockNext);

            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockRes);
        });
    });

    describe('searchAdvanced', () => {
        // Mock do schema de validação
        const mockAdvancedSearchSchema = {
            parse: jest.fn()
        };

        jest.mock('../validators/SearchValidator', () => ({
            advancedSearchSchema: mockAdvancedSearchSchema
        }));

        it('deve realizar busca avançada com dados válidos', async () => {
            const queryData = {
                name: 'One Piece',
                categories: ['Ação', 'Aventura'],
                status: 'Em andamento',
                type: 'Manga',
                orderBy: 'most_recent',
                page: '1',
                limit: '10'
            };

            const validatedData = {
                name: 'One Piece',
                categories: ['Ação', 'Aventura'],
                status: 'Em andamento',
                type: 'Manga',
                orderBy: 'most_recent',
                page: 1,
                limit: 10
            };

            const expectedResult = {
                data: [{ id: 'manga-123', title: 'One Piece' }],
                pagination: { total: 1, page: 1, limit: 10 }
            };

            mockReq.query = queryData;
            mockReq.params = { lg: 'pt-BR' };

            // Como estamos importando o controlador depois do mock, precisamos re-importar
            const { searchAdvanced } = await import('../controllers/SearchController');
            
            // Mock do schema parse
            const mockParse = jest.fn().mockReturnValue(validatedData);
            jest.doMock('../validators/SearchValidator', () => ({
                advancedSearchSchema: { parse: mockParse }
            }));

            mockSearchHandlers.searchManga.mockResolvedValue(expectedResult);

            await searchAdvanced(mockReq as Request, mockRes as Response, mockNext);

            expect(mockSearchHandlers.searchManga).toHaveBeenCalledWith({
                ...validatedData,
                language: 'pt-BR'
            });

            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith(expectedResult);
        });

        it('deve tratar erros de validação', async () => {
            const error = new Error('Validation error');
            mockReq.query = { invalid: 'data' };

            // Re-importar com o mock
            const { searchAdvanced } = await import('../controllers/SearchController');
            
            const mockParse = jest.fn().mockImplementation(() => {
                throw error;
            });

            jest.doMock('../validators/SearchValidator', () => ({
                advancedSearchSchema: { parse: mockParse }
            }));

            await searchAdvanced(mockReq as Request, mockRes as Response, mockNext);

            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockRes);
        });
    });

    describe('listTypes', () => {
        it('deve listar todos os tipos de mangá', async () => {
            const expectedTypes = Object.values(MANGA_TYPE);

            await searchControllers.listTypes(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith(expectedTypes);
        });

        it('deve tratar erros ao listar tipos', async () => {
            // Simular erro no Object.values
            const originalValues = Object.values;
            Object.values = jest.fn().mockImplementation(() => {
                throw new Error('Object error');
            });

            await searchControllers.listTypes(mockReq as Request, mockRes as Response, mockNext);

            expect(mockHandleZodError).toHaveBeenCalled();

            // Restaurar Object.values
            Object.values = originalValues;
        });
    });

    describe('listLanguages', () => {
        it('deve listar todas as linguagens', async () => {
            const expectedLanguages = [
                { id: 'lang-1', name: 'Português', code: 'pt-BR' },
                { id: 'lang-2', name: 'English', code: 'en' }
            ];

            mockSearchHandlers.listLanguages.mockResolvedValue(expectedLanguages);

            await searchControllers.listLanguages(mockReq as Request, mockRes as Response, mockNext);

            expect(mockSearchHandlers.listLanguages).toHaveBeenCalled();
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith(expectedLanguages);
        });

        it('deve tratar erros ao listar linguagens', async () => {
            const error = new Error('Database error');
            mockSearchHandlers.listLanguages.mockRejectedValue(error);

            await searchControllers.listLanguages(mockReq as Request, mockRes as Response, mockNext);

            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockRes);
        });
    });

    describe('smartSearch', () => {
        it('deve realizar busca inteligente com sucesso', async () => {
            const queryData = {
                name: 'One Piece',
                page: '1',
                limit: '10'
            };

            const expectedResult = {
                data: [{ id: 'manga-123', title: 'One Piece' }],
                total: 1,
                searchType: 'sql',
                pagination: { page: 1, limit: 10, total: 1, totalPages: 1, next: false, prev: false },
                performance: { elasticsearchAvailable: false, responseTime: 100 }
            };

            mockReq.query = queryData;
            mockReq.params = { lg: 'pt-BR' };

            // Mock SmartSearchHandler
            jest.doMock('../handlers/SmartSearchHandler', () => {
                return jest.fn().mockImplementation(() => ({
                    intelligentSearch: jest.fn().mockResolvedValue(expectedResult)
                }));
            });

            await searchControllers.smartSearch(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith(expectedResult);
        });
    });

    describe('autocomplete', () => {
        it('deve retornar sugestões com sucesso', async () => {
            const expectedResult = {
                suggestions: [
                    { text: 'One Piece', score: 0.95, type: 'title' }
                ],
                total: 1
            };

            mockReq.query = { q: 'One' };
            mockReq.params = { lg: 'pt-BR' };

            // Mock SmartSearchHandler
            jest.doMock('../handlers/SmartSearchHandler', () => {
                return jest.fn().mockImplementation(() => ({
                    getAutocompleteSuggestions: jest.fn().mockResolvedValue(expectedResult.suggestions)
                }));
            });

            await searchControllers.autocomplete(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith(expectedResult);
        });

        it('deve retornar erro 400 quando query não for fornecida', async () => {
            mockReq.query = {};

            await searchControllers.autocomplete(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(400);
            expect(jsonSpy).toHaveBeenCalledWith({
                error: 'Query parameter \'q\' é obrigatório'
            });
        });
    });

    describe('searchHealth', () => {
        it('deve retornar status de saúde da busca', async () => {
            const expectedHealth = {
                elasticsearch: false,
                sql: true,
                recommendedSearchType: 'sql'
            };

            // Mock SmartSearchHandler
            jest.doMock('../handlers/SmartSearchHandler', () => {
                return jest.fn().mockImplementation(() => ({
                    getSearchHealth: jest.fn().mockResolvedValue(expectedHealth)
                }));
            });

            await searchControllers.searchHealth(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith(expectedHealth);
        });
    });
});