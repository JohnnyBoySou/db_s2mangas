import { getMangaReviews } from '../index';
import { prismaMock } from '../../../test/mocks/prisma';

describe('Review Handlers', () => {
  describe('getMangaReviews', () => {
    it('deve retornar reviews de um mangá com paginação', async () => {
      const mangaId = 'manga-1';
      const page = 1;
      const take = 10;

      const mockReviews = [
        {
          id: 'review-1',
          content: 'Ótimo mangá!',
          rating: 5,
          upvotes: 10,
          createdAt: new Date(),
          user: {
            id: 'user-1',
            name: 'João',
            username: 'joao123',
            avatar: 'avatar.jpg'
          }
        }
      ];

      prismaMock.review.findMany.mockResolvedValue(mockReviews);
      prismaMock.review.count.mockResolvedValue(1);

      const result = await getMangaReviews(mangaId, page, take);

      expect(result.data).toEqual(mockReviews);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(page);
      expect(result.pagination.limit).toBe(take);
    });
  });
});