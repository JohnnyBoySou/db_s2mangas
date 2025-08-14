import request from 'supertest';
import express from 'express';
import { handleZodError } from '../../../utils/zodError';

// Mock das dependências
jest.mock('../handlers/LibraryHandler', () => ({
    upsertLibraryEntry: jest.fn(),
    updateLibraryEntry: jest.fn(),
    removeLibraryEntry: jest.fn(),
    listLibrary: jest.fn(),
    toggleLibraryEntry: jest.fn(),
    checkMangaStatus: jest.fn()
}));

jest.mock('@/utils/zodError');
jest.mock('@/utils/pagination', () => ({
    getPaginationParams: jest.fn().mockReturnValue({ page: 1, take: 10 })
}));

const mockedLibraryHandlers = require('../handlers/LibraryHandler');
const mockedHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;

import * as libraryController from '../controllers/LibraryController';

// Setup do Express app para testes
const app = express();
app.use(express.json());

// Middleware para simular usuário autenticado
app.use((req, res, next) => {
    (req as any).user = { id: 'user-123' };
    next();
});

// Rotas para teste
app.get('/library/:type', libraryController.listLibrary);
app.post('/library', libraryController.upsertLibraryEntry);
app.patch('/library', libraryController.updateLibraryEntry);
app.delete('/library/:mangaId', libraryController.removeLibraryEntry);
app.post('/library/:type/toggle/:mangaId', libraryController.toggleLibraryEntry);
app.get('/library/status/:mangaId', libraryController.checkMangaStatus);

describe('Controlador de Biblioteca', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /library/:type - listLibrary', () => {
        const mockLibraryResponse = {
            data: [
                {
                    id: 'entry-1',
                    userId: 'user-123',
                    mangaId: 'manga-1',
                    isRead: true,
                    isLiked: false,
                    isFollowed: true,
                    isComplete: false,
                    updatedAt: expect.any(String),
                    manga: {
                        id: 'manga-1',
                        manga_uuid: 'uuid-1',
                        title: 'Manga Title',
                        cover: 'cover-url',
                        views_count: 100
                    }
                }
            ],
            pagination: {
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                next: null,
                prev: null
            }
        };

        it('deve listar biblioteca de progresso com sucesso', async () => {
            // Given
            mockedLibraryHandlers.listLibrary.mockResolvedValue(mockLibraryResponse);

            // When
            const response = await request(app)
                .get('/library/progress');

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('pagination');
        });

        it('deve listar biblioteca de favoritos com sucesso', async () => {
            // Given
            mockedLibraryHandlers.listLibrary.mockResolvedValue(mockLibraryResponse);

            // When
            const response = await request(app)
                .get('/library/favorite');

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');
        });

        it('deve retornar erro 500 quando handler falha', async () => {
            // Given
            const error = new Error('Database error');
            mockedLibraryHandlers.listLibrary.mockRejectedValue(error);

            mockedHandleZodError.mockImplementation((err: any, res: any) => {
                return res.status(500).json({ error: 'Erro interno' });
            });

            // When
            const response = await request(app)
                .get('/library/progress');

            // Then
            expect(response.status).toBe(500);
        });
    });

    describe('POST /library - upsertLibraryEntry', () => {
        const mockEntryData = {
            mangaId: '123e4567-e89b-12d3-a456-426614174000',
            isRead: true,
            isLiked: false,
            isFollowed: true,
            isComplete: false
        };

        const mockCreatedEntry = {
            id: 'entry-1',
            userId: 'user-123',
            mangaId: '123e4567-e89b-12d3-a456-426614174000',
            isRead: true,
            isLiked: false,
            isFollowed: true,
            isComplete: false,
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
        };

        it('deve criar entrada na biblioteca com sucesso', async () => {
            // Given
            mockedLibraryHandlers.upsertLibraryEntry.mockResolvedValue(mockCreatedEntry);

            // When
            const response = await request(app)
                .post('/library')
                .send(mockEntryData);

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id', 'entry-1');
            expect(response.body).toHaveProperty('mangaId', '123e4567-e89b-12d3-a456-426614174000');
        });

        it('deve retornar erro 500 quando handler falha', async () => {
            // Given
            const error = new Error('Database error');
            mockedLibraryHandlers.upsertLibraryEntry.mockRejectedValue(error);

            mockedHandleZodError.mockImplementation((err: any, res: any) => {
                return res.status(500).json({ error: 'Erro interno' });
            });

            // When
            const response = await request(app)
                .post('/library')
                .send(mockEntryData);

            // Then
            expect(response.status).toBe(500);
        });
    });

    describe('PATCH /library - updateLibraryEntry', () => {
        const mockUpdateData = {
            mangaId: '123e4567-e89b-12d3-a456-426614174000',
            isRead: true,
            isLiked: true
        };

        const mockUpdatedEntry = {
            id: 'entry-1',
            userId: 'user-123',
            mangaId: '123e4567-e89b-12d3-a456-426614174000',
            isRead: true,
            isLiked: true,
            isFollowed: false,
            isComplete: false,
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
        };

        it('deve atualizar entrada na biblioteca com sucesso', async () => {
            // Given
            mockedLibraryHandlers.updateLibraryEntry.mockResolvedValue(mockUpdatedEntry);

            // When
            const response = await request(app)
                .patch('/library')
                .send(mockUpdateData);

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id', 'entry-1');
            expect(response.body).toHaveProperty('isRead', true);
        });
    });

    describe('DELETE /library/:mangaId - removeLibraryEntry', () => {
        it('deve remover entrada da biblioteca com sucesso', async () => {
            // Given
            mockedLibraryHandlers.removeLibraryEntry.mockResolvedValue(undefined);

            // When
            const response = await request(app)
                .delete('/library/manga-1');

            // Then
            expect(response.status).toBe(204);
        });

        it('deve retornar erro 500 quando handler falha', async () => {
            // Given
            const error = new Error('Database error');
            mockedLibraryHandlers.removeLibraryEntry.mockRejectedValue(error);

            mockedHandleZodError.mockImplementation((err: any, res: any) => {
                return res.status(500).json({ error: 'Erro interno' });
            });

            // When
            const response = await request(app)
                .delete('/library/manga-1');

            // Then
            expect(response.status).toBe(500);
        });
    });

    describe('POST /library/:type/toggle/:mangaId - toggleLibraryEntry', () => {
        const mockToggledEntry = {
            id: 'entry-1',
            userId: 'user-123',
            mangaId: 'manga-1',
            isRead: false,
            isLiked: true,
            isFollowed: false,
            isComplete: false,
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
        };

        it('deve alternar status de favorito com sucesso', async () => {
            // Given
            mockedLibraryHandlers.toggleLibraryEntry.mockResolvedValue(mockToggledEntry);

            // When
            const response = await request(app)
                .post('/library/favorite/toggle/manga-1');

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('isLiked', true);
        });

        it('deve alternar status de progresso com sucesso', async () => {
            // Given
            mockedLibraryHandlers.toggleLibraryEntry.mockResolvedValue(mockToggledEntry);

            // When
            const response = await request(app)
                .post('/library/progress/toggle/manga-1');

            // Then
            expect(response.status).toBe(200);
        });
    });

    describe('GET /library/status/:mangaId - checkMangaStatus', () => {
        const mockStatus = {
            isRead: true,
            isLiked: false,
            isFollowed: true,
            isComplete: false
        };

        it('deve verificar status do mangá com sucesso', async () => {
            // Given
            mockedLibraryHandlers.checkMangaStatus.mockResolvedValue(mockStatus);

            // When
            const response = await request(app)
                .get('/library/status/manga-1');

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockStatus);
        });

        it('deve retornar status padrão quando não há entrada', async () => {
            // Given
            const defaultStatus = {
                isRead: false,
                isLiked: false,
                isFollowed: false,
                isComplete: false
            };

            mockedLibraryHandlers.checkMangaStatus.mockResolvedValue(defaultStatus);

            // When
            const response = await request(app)
                .get('/library/status/manga-1');

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toEqual(defaultStatus);
        });
    });
});
