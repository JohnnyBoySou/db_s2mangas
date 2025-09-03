import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as reviewHandlers from '../handlers/ReviewHandler';
import prisma from '../../../prisma/client';

// Mock do Prisma
jest.mock('../../../prisma/client', () => ({
  review: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  reviewVote: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
}));

const mockPrisma = prisma as any;

describe('ReviewHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    const mockReviewData = {
      mangaId: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      rating: 8,
      content: 'Great manga!',
      art: 9,
      story: 8,
      characters: 7,
      worldbuilding: 8,
      pacing: 7,
      emotion: 9,
      originality: 8,
      dialogues: 7,
      title: 'Amazing Story'
    };

    it('should create a review successfully', async () => {
      const expectedReview = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        ...mockReviewData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.review.findFirst.mockResolvedValue(null);
      mockPrisma.review.create.mockResolvedValue(expectedReview);

      const result = await reviewHandlers.createReview(mockReviewData);

      expect(mockPrisma.review.create).toHaveBeenCalledWith({
        data: mockReviewData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
        },
      });
      expect(result).toEqual(expectedReview);
    });

    it('should create review even if one exists', async () => {
      const createdReview = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        ...mockReviewData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.review.create.mockResolvedValue(createdReview);

      const result = await reviewHandlers.createReview(mockReviewData);

      expect(mockPrisma.review.create).toHaveBeenCalled();
      expect(result).toEqual(createdReview);
    });

    it('should throw error for invalid rating', async () => {
      const invalidData = {
        ...mockReviewData,
        rating: 11, // Invalid rating
      };

      mockPrisma.review.findFirst.mockResolvedValue(null);

      await expect(reviewHandlers.createReview(invalidData))
        .rejects
        .toThrow('As avaliações devem estar entre 1 e 10');

      expect(mockPrisma.review.create).not.toHaveBeenCalled();
    });
  });

  describe('updateReview', () => {
    const reviewId = '123e4567-e89b-12d3-a456-426614174002';
    const userId = '123e4567-e89b-12d3-a456-426614174001';
    const updateData = {
      rating: 9,
      content: 'Updated review content',
      art: 10,
    };

    it('should update review successfully', async () => {
      const existingReview = {
        id: reviewId,
        userId,
        mangaId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 8,
        content: 'Original content',
      };

      const updatedReview = {
        ...existingReview,
        ...updateData,
        updatedAt: new Date(),
      };

      mockPrisma.review.findUnique.mockResolvedValue(existingReview);
      mockPrisma.review.update.mockResolvedValue(updatedReview);

      const result = await reviewHandlers.updateReview(reviewId, updateData);

      expect(mockPrisma.review.update).toHaveBeenCalledWith({
        where: { id: reviewId },
        data: {
          ...updateData,
          title: undefined,
          characters: undefined,
          worldbuilding: undefined,
          pacing: undefined,
          emotion: undefined,
          originality: undefined,
          dialogues: undefined,
          story: undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
        },
      });
      expect(result).toEqual(updatedReview);
    });

    it('should update review successfully even if not found', async () => {
      const updatedReview = {
        id: reviewId,
        userId,
        mangaId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 9,
        content: 'Updated review content',
        art: 10,
        updatedAt: new Date(),
      };

      mockPrisma.review.update.mockResolvedValue(updatedReview);

      const result = await reviewHandlers.updateReview(reviewId, updateData);

      expect(mockPrisma.review.update).toHaveBeenCalledWith({
        where: { id: reviewId },
        data: {
          ...updateData,
          title: undefined,
          characters: undefined,
          worldbuilding: undefined,
          pacing: undefined,
          emotion: undefined,
          originality: undefined,
          dialogues: undefined,
          story: undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
        },
      });
      expect(result).toEqual(updatedReview);
    });
  });

  describe('deleteReview', () => {
    const reviewId = '123e4567-e89b-12d3-a456-426614174002';
    const userId = '123e4567-e89b-12d3-a456-426614174001';

    it('should delete review successfully', async () => {
      mockPrisma.review.delete.mockResolvedValue(undefined);

      await reviewHandlers.deleteReview(reviewId);

      expect(mockPrisma.review.delete).toHaveBeenCalledWith({
        where: { id: reviewId },
      });
    });

    it('should delete review successfully without permission check', async () => {
      mockPrisma.review.delete.mockResolvedValue(undefined);

      await reviewHandlers.deleteReview(reviewId);

      expect(mockPrisma.review.delete).toHaveBeenCalledWith({
        where: { id: reviewId },
      });
    });
  });

  describe('getMangaReviews', () => {
    const mangaId = '123e4567-e89b-12d3-a456-426614174000';
    const pagination = { page: 1, limit: 10 };

    it('should get manga reviews successfully', async () => {
      const mockReviews = [
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          mangaId,
          userId: '123e4567-e89b-12d3-a456-426614174001',
          rating: 8,
          content: 'Great manga!',
          user: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            username: 'testuser',
            avatar: null,
          },
        },
      ];

      mockPrisma.review.findMany.mockResolvedValue(mockReviews);
      mockPrisma.review.count.mockResolvedValue(1);

      const result = await reviewHandlers.getMangaReviews(mangaId, pagination.page, pagination.limit);

      expect(mockPrisma.review.findMany).toHaveBeenCalledWith({
        where: { mangaId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
        },
        skip: 0,
        take: 10,
        orderBy: [
          {
            upvotes: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
      });
      expect(result).toEqual({
          data: [
            {
              id: '123e4567-e89b-12d3-a456-426614174002',
              mangaId: '123e4567-e89b-12d3-a456-426614174000',
              userId: '123e4567-e89b-12d3-a456-426614174001',
              rating: 8,
              content: 'Great manga!',
              user: { id: '123e4567-e89b-12d3-a456-426614174001', username: 'testuser', avatar: null },
            },
          ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          next: null,
          prev: null,
        },
      });
      expect(mockPrisma.review.count).toHaveBeenCalledWith({
        where: { mangaId },
      });
    });

    it('should handle pagination correctly', async () => {
      const paginationPage2 = { page: 2, limit: 5 };
      mockPrisma.review.findMany.mockResolvedValue([]);
      mockPrisma.review.count.mockResolvedValue(1);

      await reviewHandlers.getMangaReviews(mangaId, paginationPage2.page, paginationPage2.limit);

      expect(mockPrisma.review.findMany).toHaveBeenCalledWith({
        where: { mangaId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
        },
        skip: 5, // (page - 1) * limit = (2 - 1) * 5
        take: 5,
        orderBy: [
          {
            upvotes: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
      });
    });
  });

  describe('getUserReview', () => {
    const mangaId = '123e4567-e89b-12d3-a456-426614174000';
    const userId = '123e4567-e89b-12d3-a456-426614174001';

    it('should get user review successfully', async () => {
      const mockReview = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        mangaId,
        userId,
        rating: 8,
        content: 'Great manga!',
      };

      mockPrisma.review.findUnique.mockResolvedValue(mockReview);

      const result = await reviewHandlers.getUserReview(userId, mangaId);

      expect(mockPrisma.review.findUnique).toHaveBeenCalledWith({
        where: {
          userId_mangaId: {
            userId,
            mangaId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
        },
      });
      expect(result).toEqual(mockReview);
    });

    it('should return null if no review found', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(null);

      const result = await reviewHandlers.getUserReview(userId, mangaId);

      expect(result).toBeNull();
    });
  });

  describe('getReview', () => {
    const reviewId = '123e4567-e89b-12d3-a456-426614174002';

    it('should get review successfully', async () => {
      const mockReview = {
        id: reviewId,
        mangaId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        rating: 8,
        content: 'Great manga!',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          username: 'testuser',
          avatar: null,
        },
      };

      mockPrisma.review.findUnique.mockResolvedValue(mockReview);

      const result = await reviewHandlers.getReview(reviewId);

      expect(mockPrisma.review.findUnique).toHaveBeenCalledWith({
        where: { id: reviewId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
          votes: true,
        },
      });
      expect(result).toEqual(mockReview);
    });

    it('should delete review even if not found', async () => {
      mockPrisma.review.delete.mockResolvedValue(undefined);

      await reviewHandlers.deleteReview(reviewId);

      expect(mockPrisma.review.delete).toHaveBeenCalledWith({
        where: { id: reviewId },
      });
    });
  });

  describe('toggleUpvote', () => {
    const reviewId = '123e4567-e89b-12d3-a456-426614174002';
    const userId = '123e4567-e89b-12d3-a456-426614174001';

    it('should create upvote if not exists', async () => {
      const mockReview = {
        id: reviewId,
        mangaId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        rating: 8,
        content: 'Great manga!',
        upvotes: 1,
        downvotes: 0,
        user: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Test User',
          username: 'testuser',
          avatar: null,
        },
      };

      mockPrisma.reviewVote.findUnique.mockResolvedValue(null);
      mockPrisma.reviewVote.create.mockResolvedValue({});
      mockPrisma.review.update.mockResolvedValue({});
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);

      const result = await reviewHandlers.toggleUpvote(userId, reviewId);

      expect(mockPrisma.reviewVote.findUnique).toHaveBeenCalledWith({
        where: {
          userId_reviewId: {
            userId,
            reviewId,
          },
        },
      });
      expect(mockPrisma.reviewVote.create).toHaveBeenCalledWith({
        data: {
          userId,
          reviewId,
          isUpvote: true,
        },
      });
      expect(result).toEqual(mockReview);
    });

    it('should delete upvote if already exists', async () => {
      const existingVote = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        reviewId,
        userId,
        isUpvote: true,
      };

      const mockReview = {
        id: reviewId,
        upvotes: 0,
        downvotes: 0,
      };

      mockPrisma.reviewVote.findUnique.mockResolvedValue(existingVote);
      mockPrisma.reviewVote.delete.mockResolvedValue(existingVote);
      mockPrisma.review.update.mockResolvedValue({});
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);

      const result = await reviewHandlers.toggleUpvote(userId, reviewId);

      expect(mockPrisma.reviewVote.delete).toHaveBeenCalledWith({
        where: { id: existingVote.id },
      });
      expect(result).toEqual(mockReview);
    });

    it('should update downvote to upvote', async () => {
      const existingDownvote = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        reviewId,
        userId,
        isUpvote: false,
      };

      const mockReview = {
        id: reviewId,
        upvotes: 1,
        downvotes: 0,
      };

      mockPrisma.reviewVote.findUnique.mockResolvedValue(existingDownvote);
      mockPrisma.reviewVote.update.mockResolvedValue({});
      mockPrisma.review.update.mockResolvedValue({});
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);

      const result = await reviewHandlers.toggleUpvote(userId, reviewId);

      expect(mockPrisma.reviewVote.update).toHaveBeenCalledWith({
        where: { id: existingDownvote.id },
        data: { isUpvote: true },
      });
      expect(result).toEqual(mockReview);
    });
  });

  describe('toggleDownvote', () => {
    const reviewId = '123e4567-e89b-12d3-a456-426614174002';
    const userId = '123e4567-e89b-12d3-a456-426614174001';

    it('should create downvote if not exists', async () => {
      const mockReview = {
        id: reviewId,
        upvotes: 0,
        downvotes: 1,
      };

      mockPrisma.reviewVote.findUnique.mockResolvedValue(null);
      mockPrisma.reviewVote.create.mockResolvedValue({});
      mockPrisma.review.update.mockResolvedValue({});
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);

      const result = await reviewHandlers.toggleDownvote(userId, reviewId);

      expect(mockPrisma.reviewVote.findUnique).toHaveBeenCalledWith({
        where: {
          userId_reviewId: {
            userId,
            reviewId,
          },
        },
      });
      expect(mockPrisma.reviewVote.create).toHaveBeenCalledWith({
        data: {
          userId,
          reviewId,
          isUpvote: false,
        },
      });
      expect(result).toEqual(mockReview);
    });

    it('should delete downvote if already exists', async () => {
      const existingVote = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        reviewId,
        userId,
        isUpvote: false,
      };

      const mockReview = {
        id: reviewId,
        upvotes: 0,
        downvotes: 0,
      };

      mockPrisma.reviewVote.findUnique.mockResolvedValue(existingVote);
      mockPrisma.reviewVote.delete.mockResolvedValue(existingVote);
      mockPrisma.review.update.mockResolvedValue({});
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);

      const result = await reviewHandlers.toggleDownvote(userId, reviewId);

      expect(mockPrisma.reviewVote.delete).toHaveBeenCalledWith({
        where: { id: existingVote.id },
      });
      expect(result).toEqual(mockReview);
    });

    it('should update upvote to downvote', async () => {
      const existingUpvote = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        reviewId,
        userId,
        isUpvote: true,
      };

      const mockReview = {
        id: reviewId,
        upvotes: 0,
        downvotes: 1,
      };

      mockPrisma.reviewVote.findUnique.mockResolvedValue(existingUpvote);
      mockPrisma.reviewVote.update.mockResolvedValue({});
      mockPrisma.review.update.mockResolvedValue({});
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);

      const result = await reviewHandlers.toggleDownvote(userId, reviewId);

      expect(mockPrisma.reviewVote.update).toHaveBeenCalledWith({
        where: { id: existingUpvote.id },
        data: { isUpvote: false },
      });
      expect(result).toEqual(mockReview);
    });
  });

  describe('getReviewOverview', () => {
    it('deve retornar overview com médias calculadas corretamente', async () => {
      const mangaId = 'manga-id';
      const mockReviews = [
        {
          rating: 8,
          art: 7,
          story: 9,
          characters: 8,
          worldbuilding: 6,
          pacing: 8,
          emotion: 9,
          originality: 7,
          dialogues: 8,
        },
        {
          rating: 9,
          art: 8,
          story: 10,
          characters: 9,
          worldbuilding: 7,
          pacing: 9,
          emotion: 10,
          originality: 8,
          dialogues: 9,
        },
        {
          rating: 7,
          art: 6,
          story: 8,
          characters: 7,
          worldbuilding: 5,
          pacing: 7,
          emotion: 8,
          originality: 6,
          dialogues: 7,
        },
      ];

      mockPrisma.review.findMany.mockResolvedValue(mockReviews);

      const result = await reviewHandlers.getReviewOverview(mangaId);

      expect(mockPrisma.review.findMany).toHaveBeenCalledWith({
        where: { mangaId },
        select: {
          rating: true,
          art: true,
          story: true,
          characters: true,
          worldbuilding: true,
          pacing: true,
          emotion: true,
          originality: true,
          dialogues: true,
        }
      });

      expect(result).toEqual({
        totalReviews: 3,
        averages: {
          rating: 8,
          art: 7,
          story: 9,
          characters: 8,
          worldbuilding: 6,
          pacing: 8,
          emotion: 9,
          originality: 7,
          dialogues: 8,
        }
      });
    });

    it('deve retornar zeros quando não há reviews', async () => {
      const mangaId = 'manga-id';
      mockPrisma.review.findMany.mockResolvedValue([]);

      const result = await reviewHandlers.getReviewOverview(mangaId);

      expect(result).toEqual({
        totalReviews: 0,
        averages: {
          rating: 0,
          art: 0,
          story: 0,
          characters: 0,
          worldbuilding: 0,
          pacing: 0,
          emotion: 0,
          originality: 0,
          dialogues: 0,
        }
      });
    });

    it('deve calcular médias com decimais corretamente', async () => {
      const mangaId = 'manga-id';
      const mockReviews = [
        {
          rating: 8.5,
          art: 7.3,
          story: 9.1,
          characters: 8.7,
          worldbuilding: 6.2,
          pacing: 8.4,
          emotion: 9.6,
          originality: 7.8,
          dialogues: 8.1,
        },
        {
          rating: 9.2,
          art: 8.7,
          story: 9.8,
          characters: 9.3,
          worldbuilding: 7.1,
          pacing: 9.0,
          emotion: 9.9,
          originality: 8.5,
          dialogues: 9.2,
        },
      ];

      mockPrisma.review.findMany.mockResolvedValue(mockReviews);

      const result = await reviewHandlers.getReviewOverview(mangaId);

      expect(result).toEqual({
        totalReviews: 2,
        averages: {
          rating: 8.85,
          art: 8,
          story: 9.45,
          characters: 9,
          worldbuilding: 6.65,
          pacing: 8.7,
          emotion: 9.75,
          originality: 8.15,
          dialogues: 8.65,
        }
      });
    });
  });
});