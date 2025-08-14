import axios from 'axios';
import { listChapters, getChapterPages } from '../handlers/ChaptersHandler';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Chapters Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listChapters', () => {
    it('deve listar capítulos com sucesso', async () => {
      // Given
      const params = {
        id: 'manga-123',
        lg: 'pt-br',
        order: 'asc',
        page: 1,
        limit: 10,
        offset: 0
      };

      const mockResponse = {
        status: 200,
        data: {
          data: [
            {
              id: 'chapter-1',
              attributes: {
                title: 'Capítulo 1',
                chapter: '1',
                volume: '1',
                translatedLanguage: 'pt-br',
                publishAt: '2023-01-01T00:00:00Z',
                pages: 20
              }
            },
            {
              id: 'chapter-2',
              attributes: {
                chapter: '2',
                volume: '1',
                translatedLanguage: 'pt-br',
                publishAt: '2023-01-02T00:00:00Z',
                pages: 18
              }
            }
          ],
          total: 50
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      // When
      const result = await listChapters(params);

      // Then
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.mangadex.org/manga/manga-123/feed',
        {
          params: {
            includeEmptyPages: 0,
            includeFuturePublishAt: 0,
            includeExternalUrl: 0,
            limit: 10,
            offset: 0,
            translatedLanguage: ['pt-br'],
            contentRating: ['safe', 'suggestive', 'erotica', 'pornographic'],
            order: {
              chapter: 'asc'
            }
          }
        }
      );

      expect(result).toEqual({
        current_page: 1,
        data: [
          {
            id: 'chapter-1',
            title: 'Capítulo 1',
            chapter: 1,
            volume: 1,
            language: ['pt-br'],
            publish_date: expect.any(String),
            pages: 20
          },
          {
            id: 'chapter-2',
            title: 'Capítulo 2',
            chapter: 2,
            volume: 1,
            language: ['pt-br'],
            publish_date: expect.any(String),
            pages: 18
          }
        ],
        first_page_url: '?page=1&limit=10&lang=pt-br&order=asc',
        from: 1,
        last_page: 5,
        last_page_url: '?page=5&limit=10&lang=pt-br&order=asc',
        next_page_url: '?page=2&limit=10&lang=pt-br&order=asc',
        path: '',
        per_page: 10,
        prev_page_url: null,
        to: 10,
        total: 50
      });
    });

    it('deve filtrar capítulos sem páginas', async () => {
      // Given
      const params = {
        id: 'manga-123',
        lg: 'pt-br',
        order: 'asc',
        page: 1,
        limit: 10,
        offset: 0
      };

      const mockResponse = {
        status: 200,
        data: {
          data: [
            {
              id: 'chapter-1',
              attributes: {
                title: 'Capítulo 1',
                chapter: '1',
                pages: 20
              }
            },
            {
              id: 'chapter-2',
              attributes: {
                title: 'Capítulo 2',
                chapter: '2',
                pages: 0 // Sem páginas
              }
            }
          ],
          total: 10
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      // When
      const result = await listChapters(params);

      // Then
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('chapter-1');
    });

    it('deve lançar erro quando a API falha', async () => {
      // Given
      const params = {
        id: 'manga-123',
        lg: 'pt-br',
        order: 'asc',
        page: 1,
        limit: 10,
        offset: 0
      };

      mockedAxios.get.mockResolvedValue({ status: 500 });

      // When & Then
      await expect(listChapters(params)).rejects.toThrow('Failed to fetch chapters');
    });

    it('deve calcular URLs de paginação corretamente para última página', async () => {
      // Given
      const params = {
        id: 'manga-123',
        lg: 'pt-br',
        order: 'desc',
        page: 3,
        limit: 10,
        offset: 20
      };

      const mockResponse = {
        status: 200,
        data: {
          data: [],
          total: 25
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      // When
      const result = await listChapters(params);

      // Then
      expect(result.current_page).toBe(3);
      expect(result.last_page).toBe(3);
      expect(result.next_page_url).toBeNull();
      expect(result.prev_page_url).toBe('?page=2&limit=10&lang=pt-br&order=desc');
    });
  });

  describe('getChapterPages', () => {
    it('deve obter páginas do capítulo com sucesso', async () => {
      // Given
      const chapterID = 'chapter-123';
      const mockResponse = {
        status: 200,
        data: {
          chapter: {
            hash: 'abc123',
            data: ['page1.jpg', 'page2.jpg', 'page3.jpg']
          }
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      // When
      const result = await getChapterPages(chapterID);

      // Then
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.mangadex.org/at-home/server/chapter-123'
      );

      expect(result).toEqual({
        pages: [
          'https://uploads.mangadex.org/data/abc123/page1.jpg',
          'https://uploads.mangadex.org/data/abc123/page2.jpg',
          'https://uploads.mangadex.org/data/abc123/page3.jpg'
        ],
        total: 3,
        chapter_id: 'chapter-123'
      });
    });

    it('deve lançar erro quando a API falha', async () => {
      // Given
      const chapterID = 'chapter-123';
      mockedAxios.get.mockResolvedValue({ status: 500 });

      // When & Then
      await expect(getChapterPages(chapterID)).rejects.toThrow('Failed to fetch chapter');
    });

    it('deve lançar erro quando dados do capítulo são inválidos', async () => {
      // Given
      const chapterID = 'chapter-123';
      const mockResponse = {
        status: 200,
        data: {
          chapter: {
            // hash ausente
            data: ['page1.jpg']
          }
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      // When & Then
      await expect(getChapterPages(chapterID)).rejects.toThrow('Invalid chapter data');
    });

    it('deve lançar erro quando não há dados de páginas', async () => {
      // Given
      const chapterID = 'chapter-123';
      const mockResponse = {
        status: 200,
        data: {
          chapter: {
            hash: 'abc123'
            // data ausente
          }
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      // When & Then
      await expect(getChapterPages(chapterID)).rejects.toThrow('Invalid chapter data');
    });
  });
});