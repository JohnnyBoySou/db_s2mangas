import request from 'supertest';
import express from 'express';

// Mock das dependências
jest.mock('@/middlewares/auth', () => ({
    requireAuth: jest.fn((req, res, next) => {
        (req as any).user = { id: 'user-123' };
        next();
    })
}));

jest.mock('../controllers/LibraryController', () => ({
    listLibrary: jest.fn((req, res) => res.status(200).json({ data: [] })),
    upsertLibraryEntry: jest.fn((req, res) => res.status(201).json({ message: 'Entrada criada' })),
    updateLibraryEntry: jest.fn((req, res) => res.status(200).json({ message: 'Entrada atualizada' })),
    removeLibraryEntry: jest.fn((req, res) => res.status(204).send()),
    toggleLibraryEntry: jest.fn((req, res) => res.status(200).json({ message: 'Status alternado' })),
    checkMangaStatus: jest.fn((req, res) => res.status(200).json({ isRead: false, isLiked: false }))
}));

import { LibraryRouter } from '../routes/LibraryRouter';

// Setup do Express app para testes
const app = express();
app.use(express.json());
app.use('/library', LibraryRouter);

describe('Library Router', () => {
    describe('GET /library/:type', () => {
        it('deve listar biblioteca de progresso com autenticação', async () => {
            // When
            const response = await request(app)
                .get('/library/progress');

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ data: [] });
        });

        it('deve listar biblioteca de favoritos com autenticação', async () => {
            // When
            const response = await request(app)
                .get('/library/favorite');

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ data: [] });
        });

        it('deve listar biblioteca de seguindo com autenticação', async () => {
            // When
            const response = await request(app)
                .get('/library/following');

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ data: [] });
        });

        it('deve listar biblioteca de completos com autenticação', async () => {
            // When
            const response = await request(app)
                .get('/library/complete');

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ data: [] });
        });
    });

    describe('POST /library', () => {
        it('deve criar entrada na biblioteca com autenticação', async () => {
            // Given
            const entryData = {
                mangaId: 'manga-1',
                isRead: true,
                isLiked: false,
                isFollowed: true,
                isComplete: false
            };

            // When
            const response = await request(app)
                .post('/library')
                .send(entryData);

            // Then
            expect(response.status).toBe(201);
            expect(response.body).toEqual({ message: 'Entrada criada' });
        });
    });

    describe('PATCH /library', () => {
        it('deve atualizar entrada na biblioteca com autenticação', async () => {
            // Given
            const updateData = {
                mangaId: 'manga-1',
                isRead: true,
                isLiked: true
            };

            // When
            const response = await request(app)
                .patch('/library')
                .send(updateData);

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Entrada atualizada' });
        });
    });

    describe('DELETE /library/:mangaId', () => {
        it('deve remover entrada da biblioteca com autenticação', async () => {
            // When
            const response = await request(app)
                .delete('/library/manga-1');

            // Then
            expect(response.status).toBe(204);
        });
    });

    describe('POST /library/:type/toggle/:mangaId', () => {
        it('deve alternar status de favorito com autenticação', async () => {
            // When
            const response = await request(app)
                .post('/library/favorite/toggle/manga-1');

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Status alternado' });
        });

        it('deve alternar status de progresso com autenticação', async () => {
            // When
            const response = await request(app)
                .post('/library/progress/toggle/manga-1');

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Status alternado' });
        });

        it('deve alternar status de seguindo com autenticação', async () => {
            // When
            const response = await request(app)
                .post('/library/following/toggle/manga-1');

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Status alternado' });
        });

        it('deve alternar status de completo com autenticação', async () => {
            // When
            const response = await request(app)
                .post('/library/complete/toggle/manga-1');

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Status alternado' });
        });
    });

    describe('GET /library/status/:mangaId', () => {
        it('deve verificar status do mangá com autenticação', async () => {
            // When
            const response = await request(app)
                .get('/library/status/manga-1');

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ isRead: false, isLiked: false });
        });
    });
});
