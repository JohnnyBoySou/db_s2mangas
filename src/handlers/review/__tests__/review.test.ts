import { prismaMock } from '../../../test/mocks/prisma';
import {
  createReview,
  updateReview,
  deleteReview,
  toggleUpvote,
  toggleDownvote,
  getMangaReviews,
  getUserReview,
  getReview
} from '../index';

describe('Review Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    const mockReviewData = {
      userId: 'user-123',
      mangaId: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Excelente mangá',
      rating: 9,
      content: 'Uma história incrível com personagens bem desenvolvidos.',
      art: 8,
      story: 9,
      characters: 10,
      worldbuilding: 8,
      pacing: 7,
      emotion: 9,
      originality: 8,
      dialogues: 9
    };

    const mockCreatedReview = {
      id: 'review-123',
      ...mockReviewData,
      upvotes: 0,
      downvotes: 0,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      user: {
        id: 'user-123',
        name: 'João Silva',
        username: 'joao123',
        avatar: 'avatar.jpg'
      }
    };

    it('deve criar uma review com sucesso', async () => {
      prismaMock.review.findUnique.mockResolvedValue(null);
      prismaMock.review.create.mockResolvedValue(mockCreatedReview);

      const result = await createReview(mockReviewData);

      expect(prismaMock.review.findUnique).toHaveBeenCalledWith({
        where: {
          userId_mangaId: {
            userId: mockReviewData.userId,
            mangaId: mockReviewData.mangaId
          }
        }
      });
      expect(prismaMock.review.create).toHaveBeenCalledWith({
        data: mockReviewData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          }
        }
      });
      expect(result).toEqual(mockCreatedReview);
    });

    it('deve lançar erro se review já existe', async () => {
      const existingReview = { id: 'existing-review' };
      prismaMock.review.findUnique.mockResolvedValue(existingReview as any);

      await expect(createReview(mockReviewData)).rejects.toThrow(
        'Você já fez uma review para este manga'
      );

      expect(prismaMock.review.create).not.toHaveBeenCalled();
    });

    it('deve lançar erro para rating inválido', async () => {
      const invalidData = {
        ...mockReviewData,
        rating: 11 // rating inválido
      };

      prismaMock.review.findUnique.mockResolvedValue(null);

      await expect(createReview(invalidData)).rejects.toThrow(
        'As avaliações devem estar entre 1 e 10'
      );

      expect(prismaMock.review.create).not.toHaveBeenCalled();
    });

    it('deve lançar erro para art rating inválido', async () => {
      const invalidData = {
        ...mockReviewData,
        art: 0 // rating inválido
      };

      prismaMock.review.findUnique.mockResolvedValue(null);

      await expect(createReview(invalidData)).rejects.toThrow(
        'As avaliações devem estar entre 1 e 10'
      );
    });
  });

  describe('updateReview', () => {
    const mockUpdateData = {
      title: 'Título atualizado',
      rating: 8,
      content: 'Conteúdo atualizado',
      art: 7
    };

    const mockUpdatedReview = {
      id: 'review-123',
      userId: 'user-123',
      mangaId: '123e4567-e89b-12d3-a456-426614174000',
      ...mockUpdateData,
      story: 9,
      characters: 10,
      worldbuilding: 8,
      pacing: 7,
      emotion: 9,
      originality: 8,
      dialogues: 9,
      upvotes: 5,
      downvotes: 1,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      user: {
        id: 'user-123',
        name: 'João Silva',
        username: 'joao123',
        avatar: 'avatar.jpg'
      }
    };

    it('deve atualizar uma review com sucesso', async () => {
      prismaMock.review.update.mockResolvedValue(mockUpdatedReview);

      const result = await updateReview('review-123', mockUpdateData);

      expect(prismaMock.review.update).toHaveBeenCalledWith({
        where: { id: 'review-123' },
        data: mockUpdateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          }
        }
      });
      expect(result).toEqual(mockUpdatedReview);
    });

    it('deve atualizar review com dados parciais', async () => {
      const partialData = { rating: 7 };
      const mockPartialUpdate = { ...mockUpdatedReview, rating: 7 };
      
      prismaMock.review.update.mockResolvedValue(mockPartialUpdate);

      const result = await updateReview('review-123', partialData);

      expect(prismaMock.review.update).toHaveBeenCalledWith({
        where: { id: 'review-123' },
        data: partialData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          }
        }
      });
      expect(result).toEqual(mockPartialUpdate);
    });
  });

  describe('deleteReview', () => {
    it('deve deletar uma review com sucesso', async () => {
      prismaMock.review.delete.mockResolvedValue({} as any);

      await deleteReview('review-123');

      expect(prismaMock.review.delete).toHaveBeenCalledWith({
        where: { id: 'review-123' }
      });
    });

    it('deve propagar erro do Prisma', async () => {
      const prismaError = new Error('Review não encontrada');
      prismaMock.review.delete.mockRejectedValue(prismaError);

      await expect(deleteReview('review-123')).rejects.toThrow('Review não encontrada');
    });
  });

  describe('toggleUpvote', () => {
    const mockReview = {
      id: 'review-123',
      title: 'Review teste',
      rating: 8,
      upvotes: 1,
      downvotes: 0,
      user: {
        id: 'user-456',
        name: 'Maria',
        username: 'maria123',
        avatar: 'avatar2.jpg'
      }
    };

    it('deve adicionar upvote quando não existe voto', async () => {
      prismaMock.reviewVote.findUnique.mockResolvedValue(null);
      prismaMock.reviewVote.create.mockResolvedValue({} as any);
      prismaMock.review.update.mockResolvedValue({} as any);
      prismaMock.review.findUnique.mockResolvedValue(mockReview as any);

      const result = await toggleUpvote('user-123', 'review-123');

      expect(prismaMock.reviewVote.findUnique).toHaveBeenCalledWith({
        where: {
          userId_reviewId: {
            userId: 'user-123',
            reviewId: 'review-123'
          }
        }
      });
      expect(prismaMock.reviewVote.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          reviewId: 'review-123',
          isUpvote: true
        }
      });
      expect(prismaMock.review.update).toHaveBeenCalledWith({
        where: { id: 'review-123' },
        data: { upvotes: { increment: 1 } }
      });
      expect(result).toEqual(mockReview);
    });

    it('deve remover upvote quando já existe', async () => {
      const existingUpvote = { id: 'vote-123', isUpvote: true };
      prismaMock.reviewVote.findUnique.mockResolvedValue(existingUpvote as any);
      prismaMock.reviewVote.delete.mockResolvedValue({} as any);
      prismaMock.review.update.mockResolvedValue({} as any);
      prismaMock.review.findUnique.mockResolvedValue(mockReview as any);

      const result = await toggleUpvote('user-123', 'review-123');

      expect(prismaMock.reviewVote.delete).toHaveBeenCalledWith({
        where: { id: 'vote-123' }
      });
      expect(prismaMock.review.update).toHaveBeenCalledWith({
        where: { id: 'review-123' },
        data: { upvotes: { decrement: 1 } }
      });
      expect(result).toEqual(mockReview);
    });

    it('deve mudar downvote para upvote', async () => {
      const existingDownvote = { id: 'vote-123', isUpvote: false };
      prismaMock.reviewVote.findUnique.mockResolvedValue(existingDownvote as any);
      prismaMock.reviewVote.update.mockResolvedValue({} as any);
      prismaMock.review.update.mockResolvedValue({} as any);
      prismaMock.review.findUnique.mockResolvedValue(mockReview as any);

      const result = await toggleUpvote('user-123', 'review-123');

      expect(prismaMock.reviewVote.update).toHaveBeenCalledWith({
        where: { id: 'vote-123' },
        data: { isUpvote: true }
      });
      expect(prismaMock.review.update).toHaveBeenCalledWith({
        where: { id: 'review-123' },
        data: {
          upvotes: { increment: 1 },
          downvotes: { decrement: 1 }
        }
      });
      expect(result).toEqual(mockReview);
    });
  });

  describe('toggleDownvote', () => {
    const mockReview = {
      id: 'review-123',
      title: 'Review teste',
      rating: 5,
      upvotes: 0,
      downvotes: 1,
      user: {
        id: 'user-456',
        name: 'Maria',
        username: 'maria123',
        avatar: 'avatar2.jpg'
      }
    };

    it('deve adicionar downvote quando não existe voto', async () => {
      prismaMock.reviewVote.findUnique.mockResolvedValue(null);
      prismaMock.reviewVote.create.mockResolvedValue({} as any);
      prismaMock.review.update.mockResolvedValue({} as any);
      prismaMock.review.findUnique.mockResolvedValue(mockReview as any);

      const result = await toggleDownvote('user-123', 'review-123');

      expect(prismaMock.reviewVote.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          reviewId: 'review-123',
          isUpvote: false
        }
      });
      expect(prismaMock.review.update).toHaveBeenCalledWith({
        where: { id: 'review-123' },
        data: { downvotes: { increment: 1 } }
      });
      expect(result).toEqual(mockReview);
    });

    it('deve remover downvote quando já existe', async () => {
      const existingDownvote = { id: 'vote-123', isUpvote: false };
      prismaMock.reviewVote.findUnique.mockResolvedValue(existingDownvote as any);
      prismaMock.reviewVote.delete.mockResolvedValue({} as any);
      prismaMock.review.update.mockResolvedValue({} as any);
      prismaMock.review.findUnique.mockResolvedValue(mockReview as any);

      const result = await toggleDownvote('user-123', 'review-123');

      expect(prismaMock.reviewVote.delete).toHaveBeenCalledWith({
        where: { id: 'vote-123' }
      });
      expect(prismaMock.review.update).toHaveBeenCalledWith({
        where: { id: 'review-123' },
        data: { downvotes: { decrement: 1 } }
      });
      expect(result).toEqual(mockReview);
    });

    it('deve mudar upvote para downvote', async () => {
      const existingUpvote = { id: 'vote-123', isUpvote: true };
      prismaMock.reviewVote.findUnique.mockResolvedValue(existingUpvote as any);
      prismaMock.reviewVote.update.mockResolvedValue({} as any);
      prismaMock.review.update.mockResolvedValue({} as any);
      prismaMock.review.findUnique.mockResolvedValue(mockReview as any);

      const result = await toggleDownvote('user-123', 'review-123');

      expect(prismaMock.reviewVote.update).toHaveBeenCalledWith({
        where: { id: 'vote-123' },
        data: { isUpvote: false }
      });
      expect(prismaMock.review.update).toHaveBeenCalledWith({
        where: { id: 'review-123' },
        data: {
          upvotes: { decrement: 1 },
          downvotes: { increment: 1 }
        }
      });
      expect(result).toEqual(mockReview);
    });
  });

  describe('getMangaReviews', () => {
    const mockReviews = [
      {
        id: 'review-1',
        title: 'Ótimo mangá',
        rating: 9,
        content: 'Excelente história',
        upvotes: 10,
        downvotes: 1,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        user: {
          id: 'user-1',
          name: 'João',
          username: 'joao123',
          avatar: 'avatar.jpg'
        }
      },
      {
        id: 'review-2',
        title: 'Bom mangá',
        rating: 7,
        content: 'História interessante',
        upvotes: 5,
        downvotes: 0,
        createdAt: new Date('2025-01-02T00:00:00.000Z'),
        user: {
          id: 'user-2',
          name: 'Maria',
          username: 'maria123',
          avatar: 'avatar2.jpg'
        }
      }
    ];

    it('deve retornar reviews de um mangá com paginação', async () => {
      const mangaId = 'manga-123';
      const page = 1;
      const take = 10;

      prismaMock.review.findMany.mockResolvedValue(mockReviews as any);
      prismaMock.review.count.mockResolvedValue(2);

      const result = await getMangaReviews(mangaId, page, take);

      expect(prismaMock.review.findMany).toHaveBeenCalledWith({
        where: { mangaId },
        skip: 0,
        take: 10,
        orderBy: [
          { upvotes: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          }
        }
      });
      expect(prismaMock.review.count).toHaveBeenCalledWith({
        where: { mangaId }
      });
      expect(result).toEqual({
        data: mockReviews,
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
          next: null,
          prev: null
        }
      });
    });

    it('deve calcular paginação corretamente para múltiplas páginas', async () => {
      const mangaId = 'manga-123';
      const page = 2;
      const take = 5;

      prismaMock.review.findMany.mockResolvedValue(mockReviews as any);
      prismaMock.review.count.mockResolvedValue(12);

      const result = await getMangaReviews(mangaId, page, take);

      expect(prismaMock.review.findMany).toHaveBeenCalledWith({
        where: { mangaId },
        skip: 5, // (page - 1) * take
        take: 5,
        orderBy: [
          { upvotes: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          }
        }
      });
      expect(result.pagination).toEqual({
        total: 12,
        page: 2,
        limit: 5,
        totalPages: 3,
        next: 3,
        prev: 1
      });
    });
  });

  describe('getUserReview', () => {
    const mockUserReview = {
      id: 'review-123',
      title: 'Minha review',
      rating: 8,
      content: 'Boa história',
      userId: 'user-123',
      mangaId: 'manga-123',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      user: {
        id: 'user-123',
        name: 'João Silva',
        username: 'joao123',
        avatar: 'avatar.jpg'
      }
    };

    it('deve retornar a review do usuário para um mangá', async () => {
      prismaMock.review.findUnique.mockResolvedValue(mockUserReview as any);

      const result = await getUserReview('user-123', 'manga-123');

      expect(prismaMock.review.findUnique).toHaveBeenCalledWith({
        where: {
          userId_mangaId: {
            userId: 'user-123',
            mangaId: 'manga-123'
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          }
        }
      });
      expect(result).toEqual(mockUserReview);
    });

    it('deve retornar null quando review não encontrada', async () => {
      prismaMock.review.findUnique.mockResolvedValue(null);

      const result = await getUserReview('user-123', 'manga-123');

      expect(result).toBeNull();
    });
  });

  describe('getReview', () => {
    const mockReview = {
      id: 'review-123',
      title: 'Review detalhada',
      rating: 8,
      content: 'Análise completa do mangá',
      upvotes: 15,
      downvotes: 2,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      user: {
        id: 'user-456',
        name: 'Maria',
        username: 'maria123',
        avatar: 'avatar2.jpg'
      },
      votes: [
        { id: 'vote-1', userId: 'user-1', isUpvote: true },
        { id: 'vote-2', userId: 'user-2', isUpvote: false }
      ]
    };

    it('deve retornar uma review específica', async () => {
      prismaMock.review.findUnique.mockResolvedValue(mockReview as any);

      const result = await getReview('review-123');

      expect(prismaMock.review.findUnique).toHaveBeenCalledWith({
        where: { id: 'review-123' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          },
          votes: true
        }
      });
      expect(result).toEqual(mockReview);
    });

    it('deve lançar erro quando review não encontrada', async () => {
      prismaMock.review.findUnique.mockResolvedValue(null);

      await expect(getReview('review-123')).rejects.toThrow('Review não encontrada');
    });
  });
});