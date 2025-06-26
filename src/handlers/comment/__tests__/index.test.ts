import { prismaMock } from '../../../test/mocks/prisma';
import {
  createComment,
  listComments,
  updateComment,
  deleteComment
} from '../index';

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
  __esModule: true,
  default: prismaMock,
}));

describe('Comment Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createComment', () => {
    it('deve criar um comentário com sucesso', async () => {
      // Given
      const commentData = {
        userId: 'user-123',
        mangaId: 'manga-123',
        content: 'Ótimo mangá!'
      };

      const mockComment = {
        id: 'comment-123',
        userId: 'user-123',
        mangaId: 'manga-123',
        message: 'Ótimo mangá!',
        user: {
          id: 'user-123',
          name: 'João',
          avatar: 'avatar.jpg'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prismaMock.comment.create.mockResolvedValue(mockComment as any);

      // When
      const result = await createComment(commentData);

      // Then
      expect(prismaMock.comment.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          mangaId: 'manga-123',
          message: 'Ótimo mangá!'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      expect(result).toEqual(mockComment);
    });
  });

  describe('listComments', () => {
    it('deve listar comentários com paginação', async () => {
      // Given
      const mangaId = 'manga-123';
      const page = 1;
      const take = 10;

      const mockComments = [
        {
          id: 'comment-1',
          message: 'Primeiro comentário',
          user: {
            id: 'user-1',
            name: 'João',
            avatar: 'avatar1.jpg',
            username: 'joao123'
          },
          createdAt: new Date()
        },
        {
          id: 'comment-2',
          message: 'Segundo comentário',
          user: {
            id: 'user-2',
            name: 'Maria',
            avatar: 'avatar2.jpg',
            username: 'maria456'
          },
          createdAt: new Date()
        }
      ];

      prismaMock.comment.findMany.mockResolvedValue(mockComments as any);
      prismaMock.comment.count.mockResolvedValue(25);

      // When
      const result = await listComments(mangaId, page, take);

      // Then
      expect(prismaMock.comment.findMany).toHaveBeenCalledWith({
        where: { mangaId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              username: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      });

      expect(prismaMock.comment.count).toHaveBeenCalledWith({
        where: { mangaId }
      });

      expect(result).toEqual({
        data: mockComments,
        pagination: {
          total: 25,
          page: 1,
          limit: 10,
          totalPages: 3,
          next: true,
          prev: false
        }
      });
    });

    it('deve calcular paginação corretamente para última página', async () => {
      // Given
      const mangaId = 'manga-123';
      const page = 3;
      const take = 10;

      prismaMock.comment.findMany.mockResolvedValue([]);
      prismaMock.comment.count.mockResolvedValue(25);

      // When
      const result = await listComments(mangaId, page, take);

      // Then
      expect(result.pagination).toEqual({
        total: 25,
        page: 3,
        limit: 10,
        totalPages: 3,
        next: false,
        prev: true
      });
    });
  });

  describe('updateComment', () => {
    it('deve atualizar comentário com sucesso', async () => {
      // Given
      const commentId = 'comment-123';
      const userId = 'user-123';
      const newContent = 'Comentário atualizado';

      const mockComment = {
        id: commentId,
        userId,
        message: 'Comentário original'
      };

      const updatedComment = {
        ...mockComment,
        message: newContent,
        user: {
          id: userId,
          name: 'João',
          avatar: 'avatar.jpg'
        }
      };

      prismaMock.comment.findUnique.mockResolvedValue(mockComment as any);
      prismaMock.comment.update.mockResolvedValue(updatedComment as any);

      // When
      const result = await updateComment(commentId, userId, newContent);

      // Then
      expect(prismaMock.comment.findUnique).toHaveBeenCalledWith({
        where: { id: commentId }
      });

      expect(prismaMock.comment.update).toHaveBeenCalledWith({
        where: { id: commentId },
        data: { message: newContent },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      expect(result).toEqual(updatedComment);
    });

    it('deve lançar erro quando comentário não existe', async () => {
      // Given
      prismaMock.comment.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(updateComment('invalid-id', 'user-123', 'novo conteúdo'))
        .rejects.toThrow('Comentário não encontrado.');
    });

    it('deve lançar erro quando usuário não tem permissão', async () => {
      // Given
      const mockComment = {
        id: 'comment-123',
        userId: 'other-user',
        message: 'Comentário de outro usuário'
      };

      prismaMock.comment.findUnique.mockResolvedValue(mockComment as any);

      // When & Then
      await expect(updateComment('comment-123', 'user-123', 'novo conteúdo'))
        .rejects.toThrow('Você não tem permissão para editar este comentário.');
    });
  });

  describe('deleteComment', () => {
    it('deve deletar comentário com sucesso', async () => {
      // Given
      const commentId = 'comment-123';
      const userId = 'user-123';

      const mockComment = {
        id: commentId,
        userId,
        message: 'Comentário para deletar'
      };

      prismaMock.comment.findUnique.mockResolvedValue(mockComment as any);
      prismaMock.comment.delete.mockResolvedValue(mockComment as any);

      // When
      await deleteComment(commentId, userId);

      // Then
      expect(prismaMock.comment.findUnique).toHaveBeenCalledWith({
        where: { id: commentId }
      });

      expect(prismaMock.comment.delete).toHaveBeenCalledWith({
        where: { id: commentId }
      });
    });

    it('deve lançar erro quando comentário não existe', async () => {
      // Given
      prismaMock.comment.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(deleteComment('invalid-id', 'user-123'))
        .rejects.toThrow('Comentário não encontrado.');
    });

    it('deve lançar erro quando usuário não tem permissão para deletar', async () => {
      // Given
      const mockComment = {
        id: 'comment-123',
        userId: 'other-user',
        message: 'Comentário de outro usuário'
      };

      prismaMock.comment.findUnique.mockResolvedValue(mockComment as any);

      // When & Then
      await expect(deleteComment('comment-123', 'user-123'))
        .rejects.toThrow('Você não tem permissão para deletar este comentário.');
    });
  });
});