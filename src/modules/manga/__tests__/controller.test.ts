import { Request, Response, NextFunction } from 'express';
import { handleZodError } from '../../../utils/zodError';

// Mock dos handlers
jest.mock('../handlers/MangaHandler', () => ({
    createManga: jest.fn(),
    listMangas: jest.fn(),
    getMangaById: jest.fn(),
    updateManga: jest.fn(),
    patchManga: jest.fn(),
    deleteManga: jest.fn(),
    getMangaByCategory: jest.fn(),
    getMangaCovers: jest.fn(),
    importMangaFromMangaDex: jest.fn(),
    importMangaFromFile: jest.fn(),
    getMangaChapters: jest.fn(),
    getChapterPages: jest.fn(),
    getAdjacentChapters: jest.fn(),
    getSimilarMangas: jest.fn(),
    clearMangaTable: jest.fn()
}));

jest.mock('../../../utils/zodError');

const mockMangaHandlers = require('../handlers/MangaHandler');
const mockHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;

import { MangaController } from '../controllers/MangaController';

describe('Controllers Manga', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;
    let jsonSpy: jest.SpyInstance;
    let statusSpy: jest.SpyInstance;

    beforeEach(() => {
        mockReq = {
            body: {},
            params: {},
            query: {},
            user: { id: 'user-123' }
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

    const mockMangaData = {
        id: 'manga-123',
        cover: 'https://example.com/cover.jpg',
        status: 'ongoing',
        type: 'manga',
        translations: [
            {
                language: 'pt',
                name: 'Manga Teste',
                description: 'Descrição'
            }
        ]
    };

    describe('createManga', () => {
        it('deve criar mangá com sucesso', async () => {
            mockReq.body = {
                cover: 'https://example.com/cover.jpg',
                languageIds: ['lang-123'],
                translations: [
                    {
                        language: 'pt',
                        name: 'Manga Teste'
                    }
                ]
            };

            mockMangaHandlers.createManga.mockResolvedValue(mockMangaData);

            await MangaController.createManga(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.createManga).toHaveBeenCalledWith(mockReq.body);
            expect(statusSpy).toHaveBeenCalledWith(201);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: mockMangaData
            });
        });

        it('deve tratar erro de validação', async () => {
            const zodError = new Error('Validation error');
            zodError.name = 'ZodError';

            mockMangaHandlers.createManga.mockRejectedValue(zodError);
            mockHandleZodError.mockReturnValue({
                success: false,
                message: 'Dados inválidos',
                errors: []
            });

            await MangaController.createManga(mockReq as Request, mockRes as Response, mockNext);

            expect(mockHandleZodError).toHaveBeenCalledWith(zodError);
            expect(statusSpy).toHaveBeenCalledWith(400);
        });

        it('deve tratar erro interno do servidor', async () => {
            const error = new Error('Database error');
            mockMangaHandlers.createManga.mockRejectedValue(error);

            await MangaController.createManga(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(500);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: 'Erro interno do servidor'
            });
        });
    });

    describe('listMangas', () => {
        it('deve listar mangás com paginação', async () => {
            mockReq.query = {
                page: '1',
                limit: '10',
                language: 'pt'
            };

            const mockResponse = {
                data: [mockMangaData],
                pagination: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                    next: false,
                    prev: false
                }
            };

            mockMangaHandlers.listMangas.mockResolvedValue(mockResponse);

            await MangaController.listMangas(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.listMangas).toHaveBeenCalledWith('pt', 1, 10);
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: mockResponse.data,
                pagination: mockResponse.pagination
            });
        });

        it('deve usar valores padrão para parâmetros opcionais', async () => {
            mockReq.query = {};

            const mockResponse = {
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

            mockMangaHandlers.listMangas.mockResolvedValue(mockResponse);

            await MangaController.listMangas(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.listMangas).toHaveBeenCalledWith('pt-br', 1, 10);
        });
    });

    describe('getMangaById', () => {
        it('deve retornar mangá por ID', async () => {
            mockReq.params = { id: 'manga-123' };
            mockReq.query = { language: 'pt' };

            mockMangaHandlers.getMangaById.mockResolvedValue(mockMangaData);

            await MangaController.getMangaById(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.getMangaById).toHaveBeenCalledWith('manga-123', 'pt', 'user-123');
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: mockMangaData
            });
        });

        it('deve tratar mangá não encontrado', async () => {
            mockReq.params = { id: 'invalid-id' };
            
            const error = new Error('Mangá não encontrado');
            mockMangaHandlers.getMangaById.mockRejectedValue(error);

            await MangaController.getMangaById(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(404);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: 'Mangá não encontrado'
            });
        });
    });

    describe('updateManga', () => {
        it('deve atualizar mangá com sucesso', async () => {
            mockReq.params = { id: 'manga-123' };
            mockReq.body = {
                cover: 'https://example.com/new-cover.jpg',
                languageIds: ['lang-123'],
                translations: [
                    {
                        language: 'pt',
                        name: 'Novo Nome'
                    }
                ]
            };

            mockMangaHandlers.updateManga.mockResolvedValue(mockMangaData);

            await MangaController.updateManga(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.updateManga).toHaveBeenCalledWith('manga-123', mockReq.body);
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: mockMangaData
            });
        });
    });

    describe('patchManga', () => {
        it('deve atualizar parcialmente mangá com sucesso', async () => {
            mockReq.params = { id: 'manga-123' };
            mockReq.body = {
                cover: 'https://example.com/new-cover.jpg'
            };

            mockMangaHandlers.patchManga.mockResolvedValue(mockMangaData);

            await MangaController.patchManga(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.patchManga).toHaveBeenCalledWith('manga-123', mockReq.body);
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: mockMangaData
            });
        });
    });

    describe('deleteManga', () => {
        it('deve deletar mangá com sucesso', async () => {
            mockReq.params = { id: 'manga-123' };

            const mockDeleteResponse = {
                message: 'Mangá deletado com sucesso'
            };

            mockMangaHandlers.deleteManga.mockResolvedValue(mockDeleteResponse);

            await MangaController.deleteManga(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.deleteManga).toHaveBeenCalledWith('manga-123');
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                ...mockDeleteResponse
            });
        });
    });

    describe('getMangaByCategory', () => {
        it('deve retornar mangás por categoria', async () => {
            mockReq.params = { category: 'Ação' };
            mockReq.query = { page: '1', limit: '10' };

            const mockResponse = {
                data: [mockMangaData],
                pagination: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                    next: false,
                    prev: false
                }
            };

            mockMangaHandlers.getMangaByCategory.mockResolvedValue(mockResponse);

            await MangaController.getMangaByCategory(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.getMangaByCategory).toHaveBeenCalledWith('Ação', 1, 10);
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: mockResponse.data,
                pagination: mockResponse.pagination
            });
        });
    });

    describe('getMangaCovers', () => {
        it('deve retornar covers do mangá', async () => {
            mockReq.params = { id: 'manga-123' };

            const mockCovers = [
                {
                    img: 'https://example.com/cover1.jpg',
                    volume: '1',
                    id: 'cover-123'
                }
            ];

            mockMangaHandlers.getMangaCovers.mockResolvedValue(mockCovers);

            await MangaController.getMangaCovers(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.getMangaCovers).toHaveBeenCalledWith('manga-123');
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: mockCovers
            });
        });
    });

    describe('importMangaFromMangaDex', () => {
        it('deve importar mangá do MangaDex', async () => {
            mockReq.params = { mangaId: 'uuid-123' };

            mockMangaHandlers.importMangaFromMangaDex.mockResolvedValue(mockMangaData);

            await MangaController.importMangaFromMangaDex(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.importMangaFromMangaDex).toHaveBeenCalledWith('uuid-123');
            expect(statusSpy).toHaveBeenCalledWith(201);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: mockMangaData
            });
        });
    });

    describe('importMangaFromFile', () => {
        it('deve importar mangás de arquivo', async () => {
            mockReq.body = { filename: 'mangas.json' };

            const mockImportResult = {
                total: 10,
                success: 8,
                errors: ['Erro 1', 'Erro 2'],
                imported: []
            };

            mockMangaHandlers.importMangaFromFile.mockResolvedValue(mockImportResult);

            await MangaController.importMangaFromFile(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.importMangaFromFile).toHaveBeenCalledWith('mangas.json');
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: mockImportResult
            });
        });
    });

    describe('getMangaChapters', () => {
        it('deve retornar capítulos do mangá', async () => {
            mockReq.params = { id: 'manga-123' };
            mockReq.query = {
                lg: 'pt',
                order: 'asc',
                page: '1',
                limit: '10'
            };

            const mockChapters = {
                current_page: 1,
                data: [],
                from: 1,
                last_page: 1,
                next: false,
                per_page: 10,
                prev: false,
                to: 0,
                total: 0
            };

            mockMangaHandlers.getMangaChapters.mockResolvedValue(mockChapters);

            await MangaController.getMangaChapters(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.getMangaChapters).toHaveBeenCalledWith('manga-123', 'pt', 'asc', 1, 10);
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: mockChapters
            });
        });
    });

    describe('getChapterPages', () => {
        it('deve retornar páginas do capítulo', async () => {
            mockReq.params = { chapterID: 'chapter-123' };
            mockReq.query = { quality: 'high' };

            const mockPages = {
                pages: ['page1.jpg', 'page2.jpg'],
                total: 2,
                chapter_id: 'chapter-123',
                quality: 'high'
            };

            mockMangaHandlers.getChapterPages.mockResolvedValue(mockPages);

            await MangaController.getChapterPages(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.getChapterPages).toHaveBeenCalledWith('chapter-123', 'high');
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: mockPages
            });
        });
    });

    describe('getAdjacentChapters', () => {
        it('deve retornar capítulos adjacentes', async () => {
            mockReq.params = { mangaId: 'manga-123', currentChapter: '1' };

            const mockAdjacent = {
                previous: null,
                next: {
                    id: 'chapter-2',
                    chapter: '2',
                    title: 'Capítulo 2',
                    volume: '1'
                }
            };

            mockMangaHandlers.getAdjacentChapters.mockResolvedValue(mockAdjacent);

            await MangaController.getAdjacentChapters(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.getAdjacentChapters).toHaveBeenCalledWith('manga-123', '1');
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: mockAdjacent
            });
        });
    });

    describe('getSimilarMangas', () => {
        it('deve retornar mangás similares', async () => {
            mockReq.params = { id: 'manga-123' };
            mockReq.query = { limit: '5' };

            const mockSimilar = [
                {
                    id: 'manga-456',
                    cover: 'https://example.com/cover2.jpg',
                    title: 'Manga Similar'
                }
            ];

            mockMangaHandlers.getSimilarMangas.mockResolvedValue(mockSimilar);

            await MangaController.getSimilarMangas(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.getSimilarMangas).toHaveBeenCalledWith('manga-123', 5);
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: mockSimilar
            });
        });
    });

    describe('clearMangaTable', () => {
        it('deve limpar tabela de mangás', async () => {
            const mockClearResult = {
                message: 'Tabela limpa com sucesso',
                timestamp: new Date()
            };

            mockMangaHandlers.clearMangaTable.mockResolvedValue(mockClearResult);

            await MangaController.clearMangaTable(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.clearMangaTable).toHaveBeenCalled();
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: mockClearResult
            });
        });
    });
});