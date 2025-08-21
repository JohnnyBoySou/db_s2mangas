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
    importMangaFromJSON: jest.fn(),
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

import * as MangaController from '../controllers/MangaController';

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
            query: {}
        };
        (mockReq as any).user = { id: 'user-123' };
        
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

            await MangaController.create(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.createManga).toHaveBeenCalledWith(mockReq.body);
            expect(statusSpy).toHaveBeenCalledWith(201);
            expect(jsonSpy).toHaveBeenCalledWith(mockMangaData);
        });

        it('deve tratar erro de validação', async () => {
            const zodError = new Error('Validation error');
            zodError.name = 'ZodError';

            mockMangaHandlers.createManga.mockRejectedValue(zodError);
            mockHandleZodError.mockReturnValue({
                message: 'Dados inválidos',
                errors: []
            } as any);

            await MangaController.create(mockReq as Request, mockRes as Response, mockNext);

            expect(mockHandleZodError).toHaveBeenCalledWith(zodError, mockRes);
        });

        it('deve tratar erro interno do servidor', async () => {
            const error = new Error('Database error');
            mockMangaHandlers.createManga.mockRejectedValue(error);

            await MangaController.create(mockReq as Request, mockRes as Response, mockNext);

            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockRes);
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

            await MangaController.list(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.listMangas).toHaveBeenCalledWith('en', 1, 10);
            expect(jsonSpy).toHaveBeenCalledWith(mockResponse);
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

            await MangaController.list(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.listMangas).toHaveBeenCalledWith('en', 1, 10);
        });
    });

    describe('getMangaById', () => {
        it('deve retornar mangá por ID', async () => {
            mockReq.params = { id: 'manga-123' };
            mockReq.query = { language: 'pt' };

            mockMangaHandlers.getMangaById.mockResolvedValue(mockMangaData);

            await MangaController.get(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.getMangaById).toHaveBeenCalledWith('manga-123', 'en', 'user-123');
            expect(jsonSpy).toHaveBeenCalledWith(mockMangaData);
        });

        it('deve tratar mangá não encontrado', async () => {
            mockReq.params = { id: 'invalid-id' };
            
            const error = new Error('Mangá não encontrado');
            mockMangaHandlers.getMangaById.mockRejectedValue(error);

            await MangaController.get(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(404);
            expect(jsonSpy).toHaveBeenCalledWith({
                error: 'Mangá não encontrado'
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

            await MangaController.update(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.updateManga).toHaveBeenCalledWith('manga-123', mockReq.body);
            expect(jsonSpy).toHaveBeenCalledWith(mockMangaData);
        });
    });

    describe('patchManga', () => {
        it('deve atualizar parcialmente mangá com sucesso', async () => {
            mockReq.params = { id: 'manga-123' };
            mockReq.body = {
                cover: 'https://example.com/new-cover.jpg'
            };

            mockMangaHandlers.patchManga.mockResolvedValue(mockMangaData);

            await MangaController.patch(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.patchManga).toHaveBeenCalledWith('manga-123', mockReq.body);
            expect(jsonSpy).toHaveBeenCalledWith(mockMangaData);
        });
    });

    describe('deleteManga', () => {
        it('deve deletar mangá com sucesso', async () => {
            mockReq.params = { id: 'manga-123' };

            const mockDeleteResponse = {
                message: 'Mangá deletado com sucesso'
            };

            mockMangaHandlers.deleteManga.mockResolvedValue(mockDeleteResponse);

            await MangaController.remove(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.deleteManga).toHaveBeenCalledWith('manga-123');
            expect(jsonSpy).toHaveBeenCalledWith({
                message: 'Mangá deletado com sucesso'
            });
        });
    });

    describe('getMangaByCategory', () => {
        it('deve retornar mangás por categoria', async () => {
            mockReq.query = { category: 'action', page: '1', limit: '10' };

            const mockCategoryResult = {
                data: [mockMangaData],
                pagination: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1
                }
            };

            mockMangaHandlers.getMangaByCategory.mockResolvedValue(mockCategoryResult);

            await MangaController.category(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.getMangaByCategory).toHaveBeenCalledWith('action', 1, 10);
            expect(jsonSpy).toHaveBeenCalledWith(mockCategoryResult);
        });

        it('deve tratar erro quando categoria não encontrada', async () => {
            mockReq.query = { category: 'invalid-category', page: '1', limit: '10' };

            const error = new Error('Categoria não encontrada');
            mockMangaHandlers.getMangaByCategory.mockRejectedValue(error);

            await MangaController.category(mockReq as Request, mockRes as Response, mockNext);

            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockRes);
        });
    });

    describe('getMangaCovers', () => {
        it('deve retornar capas do mangá', async () => {
            mockReq.params = { id: 'manga-123' };

            const mockCoversResult = [
                {
                    id: 'cover-123',
                    img: 'https://example.com/cover.jpg',
                    volume: '1'
                }
            ];

            mockMangaHandlers.getMangaCovers.mockResolvedValue(mockCoversResult);

            await MangaController.covers(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.getMangaCovers).toHaveBeenCalledWith('manga-123');
            expect(jsonSpy).toHaveBeenCalledWith(mockCoversResult);
        });

        it('deve tratar erro ao buscar capas', async () => {
            mockReq.params = { id: 'manga-123' };

            const error = new Error('UUID do mangá não encontrado');
            mockMangaHandlers.getMangaCovers.mockRejectedValue(error);

            await MangaController.covers(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(404);
            expect(jsonSpy).toHaveBeenCalledWith({ error: 'UUID do mangá não encontrado' });
        });
    });

    describe('importFromMangaDex', () => {
        it('deve importar mangá do MangaDex', async () => {
            mockReq.params = { mangaId: 'mangadex-123' };

            const mockImportResult = {
                message: 'Mangá importado com sucesso',
                manga: mockMangaData
            };

            mockMangaHandlers.importMangaFromMangaDex.mockResolvedValue(mockImportResult);

            await MangaController.importFromMangaDex(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.importMangaFromMangaDex).toHaveBeenCalledWith('mangadex-123');
            expect(statusSpy).toHaveBeenCalledWith(201);
            expect(jsonSpy).toHaveBeenCalledWith(mockImportResult);
        });

        it('deve tratar erro na importação do MangaDex', async () => {
            mockReq.params = { mangaId: 'invalid-id' };

            const error = new Error('Mangá não encontrado no MangaDex');
            mockMangaHandlers.importMangaFromMangaDex.mockRejectedValue(error);

            await MangaController.importFromMangaDex(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(500);
            expect(jsonSpy).toHaveBeenCalledWith({ error: 'Erro ao importar mangá do MangaDex' });
        });
    });

    describe('importFromJSON', () => {
        it('deve importar mangás do JSON', async () => {
            mockReq.body = {
                mangas: [
                    {
                        title: 'Manga 1',
                        description: 'Descrição 1'
                    },
                    {
                        title: 'Manga 2',
                        description: 'Descrição 2'
                    }
                ]
            };

            const mockImportResult = {
                message: 'Importação concluída. 2 de 2 mangás importados com sucesso.',
                results: {
                    success: 2,
                    failed: 0,
                    errors: []
                }
            };

            mockMangaHandlers.importMangaFromJSON.mockResolvedValue(mockImportResult);

            await MangaController.importFromJSON(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.importMangaFromJSON).toHaveBeenCalledWith(mockReq.body);
            expect(statusSpy).toHaveBeenCalledWith(201);
            expect(jsonSpy).toHaveBeenCalledWith(mockImportResult);
        });

        it('deve tratar erro na importação do JSON', async () => {
            mockReq.body = { mangas: [] };

            const error = new Error('Dados inválidos');
            mockMangaHandlers.importMangaFromJSON.mockRejectedValue(error);

            await MangaController.importFromJSON(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(500);
            expect(jsonSpy).toHaveBeenCalledWith({ 
                error: 'Erro ao importar mangá do JSON',
                details: 'Dados inválidos'
            });
        });
    });

    describe('patchManga', () => {
        it('deve atualizar parcialmente o mangá', async () => {
            mockReq.params = { id: 'manga-123' };
            mockReq.body = { status: 'completed' };

            const mockUpdatedManga = {
                ...mockMangaData,
                status: 'completed'
            };

            mockMangaHandlers.patchManga.mockResolvedValue(mockUpdatedManga);

            await MangaController.patch(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.patchManga).toHaveBeenCalledWith('manga-123', { status: 'completed' });
            expect(jsonSpy).toHaveBeenCalledWith(mockUpdatedManga);
        });

        it('deve tratar erro ao atualizar mangá', async () => {
            mockReq.params = { id: 'manga-123' };
            mockReq.body = { status: 'completed' };

            const error = new Error('Mangá não encontrado');
            mockMangaHandlers.patchManga.mockRejectedValue(error);

            await MangaController.patch(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(404);
            expect(jsonSpy).toHaveBeenCalledWith({ error: 'Mangá não encontrado' });
        });
    });

    describe('deleteManga', () => {
        it('deve deletar mangá com sucesso', async () => {
            mockReq.params = { id: 'manga-123' };

            const mockDeleteResult = { message: 'Mangá deletado com sucesso' };
            mockMangaHandlers.deleteManga.mockResolvedValue(mockDeleteResult);

            await MangaController.remove(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.deleteManga).toHaveBeenCalledWith('manga-123');
            expect(jsonSpy).toHaveBeenCalledWith(mockDeleteResult);
        });

        it('deve tratar erro ao deletar mangá', async () => {
            mockReq.params = { id: 'manga-123' };

            const error = new Error('Mangá não encontrado');
            mockMangaHandlers.deleteManga.mockRejectedValue(error);

            await MangaController.remove(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(404);
            expect(jsonSpy).toHaveBeenCalledWith({ error: 'Mangá não encontrado' });
        });
    });

    describe('getMangaById', () => {
        it('deve retornar mangá por ID', async () => {
            mockReq.params = { id: 'manga-123' };
            mockReq.query = { lg: 'en' };

            mockMangaHandlers.getMangaById.mockResolvedValue(mockMangaData);

            await MangaController.get(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.getMangaById).toHaveBeenCalledWith('manga-123', 'en', 'user-123');
            expect(jsonSpy).toHaveBeenCalledWith(mockMangaData);
        });

        it('deve tratar erro quando mangá não encontrado', async () => {
            mockReq.params = { id: 'manga-123' };
            mockReq.query = { lg: 'en' };

            const error = new Error('Mangá não encontrado');
            mockMangaHandlers.getMangaById.mockRejectedValue(error);

            await MangaController.get(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(404);
            expect(jsonSpy).toHaveBeenCalledWith({ error: 'Mangá não encontrado' });
        });
    });

    describe('updateManga', () => {
        it('deve atualizar mangá com sucesso', async () => {
            mockReq.params = { id: 'manga-123' };
            mockReq.body = {
                title: 'Manga Atualizado',
                description: 'Nova descrição'
            };

            const mockUpdatedManga = {
                ...mockMangaData,
                title: 'Manga Atualizado',
                description: 'Nova descrição'
            };

            mockMangaHandlers.updateManga.mockResolvedValue(mockUpdatedManga);

            await MangaController.update(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.updateManga).toHaveBeenCalledWith('manga-123', mockReq.body);
            expect(jsonSpy).toHaveBeenCalledWith(mockUpdatedManga);
        });

        it('deve tratar erro ao atualizar mangá', async () => {
            mockReq.params = { id: 'manga-123' };
            mockReq.body = { title: 'Manga Atualizado' };

            const error = new Error('Mangá não encontrado');
            mockMangaHandlers.updateManga.mockRejectedValue(error);

            await MangaController.update(mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(404);
            expect(jsonSpy).toHaveBeenCalledWith({ error: 'Mangá não encontrado' });
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

            await MangaController.chapters(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.getMangaChapters).toHaveBeenCalledWith('manga-123', 'pt', 'asc', 1, 10);
            expect(jsonSpy).toHaveBeenCalledWith(mockChapters);
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

            await MangaController.pages(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.getChapterPages).toHaveBeenCalledWith('chapter-123', 'high');
            expect(jsonSpy).toHaveBeenCalledWith(mockPages);
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

            await MangaController.similar(mockReq as Request, mockRes as Response, mockNext);

            expect(mockMangaHandlers.getSimilarMangas).toHaveBeenCalledWith('manga-123', 5);
            expect(jsonSpy).toHaveBeenCalledWith(mockSimilar);
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
            expect(jsonSpy).toHaveBeenCalledWith(mockClearResult);
        });
    });
});