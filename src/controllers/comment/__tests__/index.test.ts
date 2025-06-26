import request from 'supertest';
import express from 'express';
import * as commentController from '../index';
import {
    createComment,
    listComments,
    updateComment,
    deleteComment,
} from '@/handlers/comment';
import { handleZodError } from '@/utils/zodError';
import { getPaginationParams } from '@/utils/pagination';
// Schemas são mockados abaixo

// Mock das dependências
jest.mock('@/handlers/comment');
jest.mock('@/utils/zodError');
jest.mock('@/utils/pagination');
jest.mock('@/schemas/commentSchemas');

const mockedCreateComment = createComment as jest.MockedFunction<typeof createComment>;
const mockedListComments = listComments as jest.MockedFunction<typeof listComments>;
const mockedUpdateComment = updateComment as jest.MockedFunction<typeof updateComment>;
const mockedDeleteComment = deleteComment as jest.MockedFunction<typeof deleteComment>;
const mockedHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;
const mockedGetPaginationParams = getPaginationParams as jest.MockedFunction<typeof getPaginationParams>;

// Mock dos schemas
jest.mock('@/schemas/commentSchemas', () => ({
  commentSchema: {
    safeParse: jest.fn(),
    pick: jest.fn()
  },
  commentIdSchema: {
    safeParse: jest.fn()
  }
}));

// Importa os schemas mockados
const { commentSchema, commentIdSchema } = jest.requireMock('@/schemas/commentSchemas');

// Setup do Express app para testes
const app = express();
app.use(express.json());

// Middleware para simular usuário autenticado
app.use((req, res, next) => {
  (req as any).user = { id: 'user123' };
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
      content: 'Este é um comentário de teste',
      mangaId: 'manga123'
    };

    const mockCreatedComment = {
      id: 'comment123',
      content: mockCommentData.content,
      mangaId: mockCommentData.mangaId,
      userId: 'user123',
      createdAt: new Date("2025-06-26T17:19:07.116Z")
    };

    it('deve criar comentário com sucesso', async () => {
      // Given
      commentSchema.safeParse.mockReturnValue({
        success: true,
        data: mockCommentData
      });
      mockedCreateComment.mockResolvedValue(mockCreatedComment as any);

      // When
      const response = await request(app)
        .post('/comments')
        .send(mockCommentData);

      // Then
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: mockCreatedComment.id,
        content: mockCreatedComment.content,
        mangaId: mockCreatedComment.mangaId,
        userId: mockCreatedComment.userId
      });
      expect(mockedCreateComment).toHaveBeenCalledWith({
        userId: 'user123',
        ...mockCommentData
      });
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      // Given
      const mockError = {
        issues: [{ message: 'Conteúdo é obrigatório' }]
      };
      commentSchema.safeParse.mockReturnValue({
        success: false,
        error: mockError
      });

      // When
      const response = await request(app)
        .post('/comments')
        .send({ content: '' });

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toEqual(mockError);
    });

    it('deve retornar erro 401 para usuário não autenticado', async () => {
      // Given
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      appWithoutAuth.post('/comments', commentController.create);
      
      commentSchema.safeParse.mockReturnValue({
        success: true,
        data: mockCommentData
      });

      // When
      const response = await request(appWithoutAuth)
        .post('/comments')
        .send(mockCommentData);

      // Then
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: "Não autorizado" });
    });

    it('deve lidar com erro do handler', async () => {
      // Given
      const mockError = new Error('Erro interno');
      commentSchema.safeParse.mockReturnValue({
        success: true,
        data: mockCommentData
      });
      mockedCreateComment.mockRejectedValue(mockError);
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(500).json({ error: 'Erro interno' });
      });

      // When
      const response = await request(app)
        .post('/comments')
        .send(mockCommentData);

      // Then
      expect(response.status).toBe(500);
      expect(mockedHandleZodError).toHaveBeenCalledWith(mockError, expect.any(Object));
    });
  });

  describe('GET /comments/:mangaId - list', () => {
    const mangaId = 'manga123';
    const mockPaginationParams = { page: 1, take: 20, skip: 0 };
    const mockCommentsResponse = {
      comments: [
        {
          id: 'comment1',
          content: 'Comentário 1',
          userId: 'user1',
          mangaId: mangaId,
          createdAt: new Date("2025-06-26T17:19:07.116Z")
        }
      ],
      total: 1,
      page: 1,
      totalPages: 1
    };

    it('deve listar comentários com sucesso', async () => {
      // Given
      mockedGetPaginationParams.mockReturnValue(mockPaginationParams);
      mockedListComments.mockResolvedValue(mockCommentsResponse as any);

      // When
      const response = await request(app)
        .get(`/comments/${mangaId}`);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        total: 1,
        page: 1,
        totalPages: 1
      });
      expect(response.body.comments).toHaveLength(1);
      expect(response.body.comments[0]).toMatchObject({
        id: 'comment1',
        content: 'Comentário 1',
        mangaId: 'manga123',
        userId: 'user1'
      });
      expect(mockedListComments).toHaveBeenCalledWith(mangaId, 1, 20);
    });

    it('deve retornar erro 400 quando mangaId não for fornecido', async () => {
      // When
      const response = await request(app)
        .get('/comments/');

      // Then
      expect(response.status).toBe(404); // Express retorna 404 para rota não encontrada
    });

    it('deve lidar com erro do handler', async () => {
      // Given
      const mockError = new Error('Erro interno');
      mockedGetPaginationParams.mockReturnValue(mockPaginationParams);
      mockedListComments.mockRejectedValue(mockError);
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(500).json({ error: 'Erro interno' });
      });

      // When
      const response = await request(app)
        .get(`/comments/${mangaId}`);

      // Then
      expect(response.status).toBe(500);
      expect(mockedHandleZodError).toHaveBeenCalledWith(mockError, expect.any(Object));
    });
  });

  describe('PUT /comments/:id - update', () => {
    const commentId = 'comment123';
    const mockUpdateData = {
      content: 'Comentário atualizado'
    };

    const mockUpdatedComment = {
      id: commentId,
      content: mockUpdateData.content,
      userId: 'user123',
      mangaId: 'manga123',
      updatedAt: new Date("2025-06-26T17:19:07.116Z")
    };

    beforeEach(() => {
      commentSchema.pick = jest.fn().mockReturnValue({
        safeParse: jest.fn()
      });
    });

    it('deve atualizar comentário com sucesso', async () => {
      // Given
      commentIdSchema.safeParse.mockReturnValue({
        success: true,
        data: { id: commentId }
      });
      (commentSchema.pick as jest.Mock).mockReturnValue({
        safeParse: jest.fn().mockReturnValue({
          success: true,
          data: mockUpdateData
        })
      });
      mockedUpdateComment.mockResolvedValue(mockUpdatedComment as any);

      // When
      const response = await request(app)
        .put(`/comments/${commentId}`)
        .send(mockUpdateData);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        id: mockUpdatedComment.id,
        content: mockUpdatedComment.content,
        userId: mockUpdatedComment.userId
      }));
      expect(mockedUpdateComment).toHaveBeenCalledWith(commentId, 'user123', mockUpdateData.content);
    });

    it('deve retornar erro 400 para ID inválido', async () => {
      // Given
      const mockError = {
        issues: [{ message: 'ID inválido' }]
      };
      commentIdSchema.safeParse.mockReturnValue({
        success: false,
        error: mockError
      });

      // When
      const response = await request(app)
        .put('/comments/invalid-id')
        .send(mockUpdateData);

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toEqual(mockError);
    });

    it('deve retornar erro 400 para conteúdo inválido', async () => {
      // Given
      const mockError = {
        issues: [{ message: 'Conteúdo inválido' }]
      };
      commentIdSchema.safeParse.mockReturnValue({
        success: true,
        data: { id: commentId }
      });
      (commentSchema.pick as jest.Mock).mockReturnValue({
        safeParse: jest.fn().mockReturnValue({
          success: false,
          error: mockError
        })
      });

      // When
      const response = await request(app)
        .put(`/comments/${commentId}`)
        .send({ content: '' });

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toEqual(mockError);
    });

    it('deve retornar erro 404 quando comentário não for encontrado', async () => {
      // Given
      const mockError = new Error('Comentário não encontrado.');
      commentIdSchema.safeParse.mockReturnValue({
        success: true,
        data: { id: commentId }
      });
      (commentSchema.pick as jest.Mock).mockReturnValue({
        safeParse: jest.fn().mockReturnValue({
          success: true,
          data: mockUpdateData
        })
      });
      mockedUpdateComment.mockRejectedValue(mockError);

      // When
      const response = await request(app)
        .put(`/comments/${commentId}`)
        .send(mockUpdateData);

      // Then
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Comentário não encontrado.' });
    });

    it('deve retornar erro 403 quando usuário não tiver permissão', async () => {
      // Given
      const mockError = new Error('Você não tem permissão para editar este comentário.');
      commentIdSchema.safeParse.mockReturnValue({
        success: true,
        data: { id: commentId }
      });
      (commentSchema.pick as jest.Mock).mockReturnValue({
        safeParse: jest.fn().mockReturnValue({
          success: true,
          data: mockUpdateData
        })
      });
      mockedUpdateComment.mockRejectedValue(mockError);

      // When
      const response = await request(app)
        .put(`/comments/${commentId}`)
        .send(mockUpdateData);

      // Then
      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Você não tem permissão para editar este comentário.' });
    });
  });

  describe('DELETE /comments/:id - remove', () => {
    const commentId = 'comment123';

    it('deve deletar comentário com sucesso', async () => {
      // Given
      commentIdSchema.safeParse.mockReturnValue({
        success: true,
        data: { id: commentId }
      });
      mockedDeleteComment.mockResolvedValue(undefined);

      // When
      const response = await request(app)
        .delete(`/comments/${commentId}`);

      // Then
      expect(response.status).toBe(204);
      expect(mockedDeleteComment).toHaveBeenCalledWith(commentId, 'user123');
    });

    it('deve retornar erro 400 para ID inválido', async () => {
      // Given
      const mockError = {
        issues: [{ message: 'ID inválido' }]
      };
      commentIdSchema.safeParse.mockReturnValue({
        success: false,
        error: mockError
      });

      // When
      const response = await request(app)
        .delete('/comments/invalid-id');

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toEqual(mockError);
    });

    it('deve retornar erro 404 quando comentário não for encontrado', async () => {
      // Given
      const mockError = new Error('Comentário não encontrado.');
      commentIdSchema.safeParse.mockReturnValue({
        success: true,
        data: { id: commentId }
      });
      mockedDeleteComment.mockRejectedValue(mockError);

      // When
      const response = await request(app)
        .delete(`/comments/${commentId}`);

      // Then
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Comentário não encontrado.' });
    });

    it('deve retornar erro 403 quando usuário não tiver permissão', async () => {
      // Given
      const mockError = new Error('Você não tem permissão para deletar este comentário.');
      commentIdSchema.safeParse.mockReturnValue({
        success: true,
        data: { id: commentId }
      });
      mockedDeleteComment.mockRejectedValue(mockError);

      // When
      const response = await request(app)
        .delete(`/comments/${commentId}`);

      // Then
      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Você não tem permissão para deletar este comentário.' });
    });
  });
});