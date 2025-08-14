import request from 'supertest';
import express from 'express';

// Mock das dependências
jest.mock('@/middlewares/auth', () => ({
    requireAuth: jest.fn((req, res, next) => {
        (req as any).user = { id: 'user-123' };
        next();
    })
}));

jest.mock('../controllers/CommentController', () => ({
    create: jest.fn((req, res) => res.status(201).json({ message: 'Comentário criado' })),
    list: jest.fn((req, res) => res.status(200).json({ data: [] })),
    update: jest.fn((req, res) => res.status(200).json({ message: 'Comentário atualizado' })),
    remove: jest.fn((req, res) => res.status(204).send())
}));

import { CommentRouter } from '../routes/CommentRouter';

// Setup do Express app para testes
const app = express();
app.use(express.json());
app.use('/comments', CommentRouter);

describe('Comment Router', () => {
    describe('POST /comments', () => {
        it('deve criar um comentário com autenticação', async () => {
            // Given
            const commentData = {
                content: 'Muito bom esse mangá!',
                mangaId: 'manga-1'
            };

            // When
            const response = await request(app)
                .post('/comments')
                .send(commentData);

            // Then
            expect(response.status).toBe(201);
            expect(response.body).toEqual({ message: 'Comentário criado' });
        });
    });

    describe('GET /comments/:mangaId', () => {
        it('deve listar comentários de um mangá com autenticação', async () => {
            // When
            const response = await request(app)
                .get('/comments/manga-1');

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ data: [] });
        });
    });

    describe('PUT /comments/:id', () => {
        it('deve atualizar um comentário com autenticação', async () => {
            // Given
            const updateData = {
                content: 'Comentário atualizado'
            };

            // When
            const response = await request(app)
                .put('/comments/comment-1')
                .send(updateData);

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Comentário atualizado' });
        });
    });

    describe('DELETE /comments/:id', () => {
        it('deve deletar um comentário com autenticação', async () => {
            // When
            const response = await request(app)
                .delete('/comments/comment-1');

            // Then
            expect(response.status).toBe(204);
        });
    });
});
