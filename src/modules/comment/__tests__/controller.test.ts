import request from 'supertest';
import express from 'express';
import { handleZodError } from '../../../utils/zodError';

// Mock das dependências
jest.mock('../handlers/CommentHandler', () => ({
    createComment: jest.fn(),
    listComments: jest.fn(),
    updateComment: jest.fn(),
    deleteComment: jest.fn()
}));

jest.mock('@/utils/zodError');
jest.mock('@/utils/pagination', () => ({
    getPaginationParams: jest.fn().mockReturnValue({ page: 1, take: 10 })
}));

const mockedCommentHandlers = require('../handlers/CommentHandler');
const mockedHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;

import * as commentController from '../controllers/CommentController';

// Setup do Express app para testes
const app = express();
app.use(express.json());

// Middleware para simular usuário autenticado
app.use((req, res, next) => {
    (req as any).user = { id: 'user-123' };
    next();
});

// Rotas para teste
app.post('/comments', commentController.create);
app.get('/comments/:mangaId', commentController.list);
app.put('/comments/:id', commentController.update);
app.delete('/comments/:id', commentController.remove);

describe('Controlador de Comentários', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /comments - create', () => {
        const mockCommentData = {
            content: 'Muito bom esse mangá!',
            mangaId: 'manga-1'
        };

        const mockCreatedComment = {
            id: 'comment-1',
            userId: 'user-123',
            mangaId: 'manga-1',
            message: 'Muito bom esse mangá!',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            user: {
                id: 'user-123',
                name: 'João Silva',
                avatar: 'avatar-url'
            }
        };

        it('deve criar um comentário com sucesso', async () => {
            // Given
            mockedCommentHandlers.createComment.mockResolvedValue(mockCreatedComment);

            // When
            const response = await request(app)
                .post('/comments')
                .send(mockCommentData);

            // Then
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id', 'comment-1');
            expect(response.body).toHaveProperty('message', 'Muito bom esse mangá!');
        });

        it('deve retornar erro 500 quando handler falha', async () => {
            // Given
            const error = new Error('Database error');
            mockedCommentHandlers.createComment.mockRejectedValue(error);

            mockedHandleZodError.mockImplementation((err: any, res: any) => {
                return res.status(500).json({ error: 'Erro interno' });
            });

            // When
            const response = await request(app)
                .post('/comments')
                .send(mockCommentData);

            // Then
            expect(response.status).toBe(500);
        });

        it('deve retornar erro 400 quando dados são inválidos', async () => {
            // Given
            const invalidData = {
                content: '', // Conteúdo vazio
                mangaId: 'manga-1'
            };

            // When
            const response = await request(app)
                .post('/comments')
                .send(invalidData);

            // Then
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('issues');
        });

        it('deve retornar erro 401 quando usuário não está autenticado', async () => {
            // Given
            const appWithoutAuth = express();
            appWithoutAuth.use(express.json());
            appWithoutAuth.post('/comments', commentController.create);

            // When
            const response = await request(appWithoutAuth)
                .post('/comments')
                .send(mockCommentData);

            // Then
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Não autorizado');
        });
    });

    describe('GET /comments/:mangaId - list', () => {
        const mockCommentsResponse = {
            data: [
                {
                    id: 'comment-1',
                    userId: 'user-1',
                    mangaId: 'manga-1',
                    message: 'Muito bom esse mangá!',
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String),
                    user: {
                        id: 'user-1',
                        name: 'João Silva',
                        avatar: 'avatar-url',
                        username: 'joaosilva'
                    }
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

        it('deve listar comentários com sucesso', async () => {
            // Given
            mockedCommentHandlers.listComments.mockResolvedValue(mockCommentsResponse);

            // When
            const response = await request(app)
                .get('/comments/manga-1');

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('pagination');
        });

        it('deve retornar erro 400 quando mangaId não é fornecido', async () => {
            // Given
            const appWithoutParams = express();
            appWithoutParams.use(express.json());
            appWithoutParams.get('/comments', commentController.list);

            // When
            const response = await request(appWithoutParams)
                .get('/comments');

            // Then
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'ID do mangá é obrigatório');
        });

        it('deve retornar erro 500 quando handler falha', async () => {
            // Given
            const error = new Error('Database error');
            mockedCommentHandlers.listComments.mockRejectedValue(error);

            mockedHandleZodError.mockImplementation((err: any, res: any) => {
                return res.status(500).json({ error: 'Erro interno' });
            });

            // When
            const response = await request(app)
                .get('/comments/manga-1');

            // Then
            expect(response.status).toBe(500);
        });
    });

    describe('PUT /comments/:id - update', () => {
        const mockUpdateData = {
            content: 'Comentário atualizado'
        };

        const mockUpdatedComment = {
            id: 'comment-1',
            userId: 'user-123',
            mangaId: 'manga-1',
            message: 'Comentário atualizado',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            user: {
                id: 'user-123',
                name: 'João Silva',
                avatar: 'avatar-url'
            }
        };

        it('deve atualizar um comentário com sucesso', async () => {
            // Given
            mockedCommentHandlers.updateComment.mockResolvedValue(mockUpdatedComment);

            // When
            const response = await request(app)
                .put('/comments/comment-1')
                .send(mockUpdateData);

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id', 'comment-1');
            expect(response.body).toHaveProperty('message', 'Comentário atualizado');
        });

        it('deve retornar erro 404 quando comentário não encontrado', async () => {
            // Given
            const nonExistentId = 'non-existent-id';
            const error = new Error('Comentário não encontrado.');
            mockedCommentHandlers.updateComment.mockRejectedValue(error);

            // When
            const response = await request(app)
                .put(`/comments/${nonExistentId}`)
                .send(mockUpdateData);

            // Then
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error', 'Comentário não encontrado.');
        });

        it('deve retornar erro 400 quando conteúdo é inválido', async () => {
            // Given
            const invalidData = {
                content: '' // Conteúdo vazio
            };

            // When
            const response = await request(app)
                .put('/comments/comment-1')
                .send(invalidData);

            // Then
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('issues');
        });

        it('deve retornar erro 401 quando usuário não está autenticado', async () => {
            // Given
            const appWithoutAuth = express();
            appWithoutAuth.use(express.json());
            appWithoutAuth.put('/comments/:id', commentController.update);

            // When
            const response = await request(appWithoutAuth)
                .put('/comments/comment-1')
                .send(mockUpdateData);

            // Then
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Não autorizado');
        });

        it('deve retornar erro 404 quando comentário não encontrado', async () => {
            // Given
            const error = new Error('Comentário não encontrado.');
            mockedCommentHandlers.updateComment.mockRejectedValue(error);

            // When
            const response = await request(app)
                .put('/comments/comment-1')
                .send(mockUpdateData);

            // Then
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error', 'Comentário não encontrado.');
        });

        it('deve retornar erro 403 quando usuário não tem permissão', async () => {
            // Given
            const error = new Error('Você não tem permissão para editar este comentário.');
            mockedCommentHandlers.updateComment.mockRejectedValue(error);

            // When
            const response = await request(app)
                .put('/comments/comment-1')
                .send(mockUpdateData);

            // Then
            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error', 'Você não tem permissão para editar este comentário.');
        });

        it('deve retornar erro 500 quando handler falha com erro genérico', async () => {
            // Given
            const error = new Error('Database error');
            mockedCommentHandlers.updateComment.mockRejectedValue(error);

            mockedHandleZodError.mockImplementation((err: any, res: any) => {
                return res.status(500).json({ error: 'Erro interno' });
            });

            // When
            const response = await request(app)
                .put('/comments/comment-1')
                .send(mockUpdateData);

            // Then
            expect(response.status).toBe(500);
        });
    });

    describe('DELETE /comments/:id - remove', () => {
        it('deve deletar um comentário com sucesso', async () => {
            // Given
            mockedCommentHandlers.deleteComment.mockResolvedValue(undefined);

            // When
            const response = await request(app)
                .delete('/comments/comment-1');

            // Then
            expect(response.status).toBe(204);
        });

        it('deve retornar erro 404 quando comentário não encontrado', async () => {
            // Given
            const nonExistentId = 'non-existent-id';
            const error = new Error('Comentário não encontrado.');
            mockedCommentHandlers.deleteComment.mockRejectedValue(error);

            // When
            const response = await request(app)
                .delete(`/comments/${nonExistentId}`);

            // Then
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error', 'Comentário não encontrado.');
        });

        it('deve retornar erro 401 quando usuário não está autenticado', async () => {
            // Given
            const appWithoutAuth = express();
            appWithoutAuth.use(express.json());
            appWithoutAuth.delete('/comments/:id', commentController.remove);

            // When
            const response = await request(appWithoutAuth)
                .delete('/comments/comment-1');

            // Then
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Não autorizado');
        });

        it('deve retornar erro 404 quando comentário não encontrado', async () => {
            // Given
            const error = new Error('Comentário não encontrado.');
            mockedCommentHandlers.deleteComment.mockRejectedValue(error);

            // When
            const response = await request(app)
                .delete('/comments/comment-1');

            // Then
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error', 'Comentário não encontrado.');
        });

        it('deve retornar erro 403 quando usuário não tem permissão', async () => {
            // Given
            const error = new Error('Você não tem permissão para deletar este comentário.');
            mockedCommentHandlers.deleteComment.mockRejectedValue(error);

            // When
            const response = await request(app)
                .delete('/comments/comment-1');

            // Then
            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error', 'Você não tem permissão para deletar este comentário.');
        });

        it('deve retornar erro 500 quando handler falha com erro genérico', async () => {
            // Given
            const error = new Error('Database error');
            mockedCommentHandlers.deleteComment.mockRejectedValue(error);

            mockedHandleZodError.mockImplementation((err: any, res: any) => {
                return res.status(500).json({ error: 'Erro interno' });
            });

            // When
            const response = await request(app)
                .delete('/comments/comment-1');

            // Then
            expect(response.status).toBe(500);
        });
    });
});
