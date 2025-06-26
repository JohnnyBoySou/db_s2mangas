import { 
  createManga, 
  getMangaById, 
  listMangas, 
  deleteManga, 
  updateManga,
  getMangaByCategory,
  getMangaCovers,
  importMangaFromMangaDex,
  getMangaChapters,
  clearMangaTable,
  getSimilarMangas
} from '../index';
import { prismaMock } from '../../../test/mocks/prisma';
import axios from 'axios';

// Mock do axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Manga Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createManga', () => {
    it('deve criar um mangá com sucesso', async () => {
      const mockMangaData = {
        cover: 'https://example.com/cover.jpg',
        status: 'ongoing',
        type: 'manga',
        releaseDate: new Date('2023-01-01'),
        manga_uuid: '72ede3e2-951e-4597-a268-ffe22373d483',
        languageIds: ['72ede3e2-951e-4597-a268-ffe22373d481'], // UUID válido
        categoryIds: ['72ede3e2-951e-4597-a268-ffe22373d482'], // UUID válido
        translations: [{
          language: 'pt-br',
          name: 'Teste Manga',
          description: 'Descrição do teste'
        }]
      };

      const mockCreatedManga = {
        id: '72ede3e2-951e-4597-a268-ffe22373d483',
        ...mockMangaData,
        categories: [{ id: '72ede3e2-951e-4597-a268-ffe22373d482', name: 'Ação' }],
        translations: mockMangaData.translations,
        languages: [{ id: '72ede3e2-951e-4597-a268-ffe22373d481', code: 'pt-br' }]
      };

      prismaMock.manga.create.mockResolvedValue(mockCreatedManga);

      const result = await createManga(mockMangaData);

      expect(prismaMock.manga.create).toHaveBeenCalledWith({
        data: {
          cover: mockMangaData.cover,
          status: mockMangaData.status,
          type: mockMangaData.type,
          releaseDate: mockMangaData.releaseDate,
          manga_uuid: mockMangaData.manga_uuid,
          languages: {
            connect: mockMangaData.languageIds.map(id => ({ id }))
          },
          categories: {
            connect: mockMangaData.categoryIds.map(id => ({ id }))
          },
          translations: {
            create: mockMangaData.translations
          }
        },
        include: {
          categories: true,
          translations: true,
          languages: true
        }
      });

      expect(result).toEqual(mockCreatedManga);
    });

    it('deve lançar erro com dados inválidos', async () => {
      const invalidData = {
        // dados inválidos
      };

      await expect(createManga(invalidData)).rejects.toThrow();
    });
  });

  describe('getMangaById', () => {
    it('deve retornar um mangá por ID com sucesso', async () => {
      const mangaId = 'manga-1';
      const language = 'pt-br';
      const userId = 'user-1';

      const mockManga = {
        id: mangaId,
        manga_uuid: 'test-uuid',
        cover: 'cover.jpg',
        categories: [],
        languages: [],
        chapters: [],
        likes: []
      };

      const mockTranslation = {
        name: 'Teste Manga',
        description: 'Descrição do teste'
      };

      // Mock das chamadas do Prisma
      prismaMock.manga.findUnique
        .mockResolvedValueOnce(mockManga) // primeira chamada
        .mockResolvedValueOnce({ manga_uuid: 'test-uuid' }); // segunda chamada
      
      prismaMock.view.findFirst.mockResolvedValue(null);
      prismaMock.view.create.mockResolvedValue({});
      prismaMock.view.count.mockResolvedValue(10);
      prismaMock.mangaTranslation.findFirst.mockResolvedValue(mockTranslation);

      // Mock do axios para covers
      mockedAxios.get.mockResolvedValue({
        data: { data: [] }
      });

      const result = await getMangaById(mangaId, language, userId);

      expect(result.title).toBe(mockTranslation.name);
      expect(result.description).toBe(mockTranslation.description);
      expect(result.views).toBe(10);
    });

    it('deve lançar erro quando mangá não for encontrado', async () => {
      prismaMock.manga.findUnique.mockResolvedValue(null);

      await expect(getMangaById('invalid-id', 'pt-br'))
        .rejects.toThrow('Mangá não encontrado');
    });
  });

  describe('listMangas', () => {
    it('deve listar mangás com paginação', async () => {
      const mockMangas = [
        {
          id: 'manga-1',
          translations: [{ language: 'pt-br', name: 'Manga 1', description: 'Desc 1' }],
          categories: [],
          languages: []
        }
      ];

      prismaMock.manga.findMany.mockResolvedValue(mockMangas);
      prismaMock.manga.count.mockResolvedValue(1);

      const result = await listMangas('pt-br', 1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });
  });

  describe('deleteManga', () => {
    it('deve deletar um mangá com sucesso', async () => {
      const mangaId = 'manga-1';
      const mockManga = { id: mangaId };

      prismaMock.manga.findUnique.mockResolvedValue(mockManga);
      prismaMock.manga.delete.mockResolvedValue(mockManga);

      const result = await deleteManga(mangaId);

      expect(prismaMock.manga.delete).toHaveBeenCalledWith({ where: { id: mangaId } });
      expect(result.message).toBe('Mangá deletado com sucesso');
    });

    it('deve lançar erro quando mangá não existir', async () => {
      prismaMock.manga.findUnique.mockResolvedValue(null);

      await expect(deleteManga('invalid-id'))
        .rejects.toThrow('Mangá não encontrado');
    });
  });

  describe('updateManga', () => {
    it('deve atualizar um mangá com sucesso', async () => {
      const mangaId = 'manga-1';
      const updateData = {
        cover: 'https://example.com/new-cover.jpg',
        status: 'completed',
        type: 'manhwa',
        releaseDate: new Date('2024-01-01'),
        languageIds: ['550e8400-e29b-41d4-a716-446655440000'],
        categoryIds: ['550e8400-e29b-41d4-a716-446655440001'],
        translations: [{
          language: 'pt-br',
          name: 'Manga Atualizado',
          description: 'Nova descrição'
        }]
      };

      const mockExistingManga = { id: mangaId };
      const mockUpdatedManga = {
        id: mangaId,
        ...updateData,
        categories: [{ id: 'cat-1', name: 'Ação' }],
        translations: updateData.translations,
        languages: [{ id: 'lang-1', code: 'pt-br' }]
      };

      prismaMock.manga.findUnique.mockResolvedValue(mockExistingManga);
      prismaMock.manga.update.mockResolvedValue(mockUpdatedManga);

      const result = await updateManga(mangaId, updateData);

      expect(prismaMock.manga.update).toHaveBeenCalledWith({
        where: { id: mangaId },
        data: {
          cover: updateData.cover,
          status: updateData.status,
          type: updateData.type,
          releaseDate: updateData.releaseDate,
          languages: {
            set: updateData.languageIds.map(id => ({ id }))
          },
          categories: {
            set: updateData.categoryIds.map(id => ({ id }))
          },
          translations: {
            deleteMany: {},
            create: updateData.translations
          }
        },
        include: {
          categories: true,
          translations: true,
          languages: true
        }
      });

      expect(result).toEqual(mockUpdatedManga);
    });

    it('deve lançar erro quando mangá não existir', async () => {
      const validUpdateData = {
        languageIds: ['550e8400-e29b-41d4-a716-446655440000'],
        translations: [{
          language: 'pt-br',
          name: 'Teste'
        }]
      };
      
      prismaMock.manga.findUnique.mockResolvedValue(null);

      await expect(updateManga('invalid-id', validUpdateData))
        .rejects.toThrow('Mangá não encontrado');
    });
  });

  describe('getMangaByCategory', () => {
    it('deve retornar mangás por categoria com paginação', async () => {
      const category = 'Ação';
      const page = 1;
      const limit = 10;

      const mockMangas = [
        {
          id: 'manga-1',
          translations: [{ language: 'pt-br', name: 'Manga Ação 1' }],
          categories: [{ name: 'Ação' }],
          _count: { likes: 5, views: 100 }
        }
      ];

      prismaMock.manga.findMany.mockResolvedValue(mockMangas);
      prismaMock.manga.count.mockResolvedValue(1);

      const result = await getMangaByCategory(category, page, limit);

      expect(result.data).toEqual(mockMangas);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(page);
      expect(result.pagination.limit).toBe(limit);
    });
  });

  describe('getMangaCovers', () => {
    it('deve retornar capas do mangá', async () => {
      const mangaId = 'manga-1';
      const mockManga = { manga_uuid: 'test-uuid' };
      const mockCoversResponse = {
        data: {
          data: [
            {
              id: 'cover-1',
              attributes: {
                fileName: 'cover.jpg',
                volume: '1'
              }
            }
          ]
        }
      };

      prismaMock.manga.findUnique.mockResolvedValue(mockManga);
      mockedAxios.get.mockResolvedValue(mockCoversResponse);

      const result = await getMangaCovers(mangaId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        img: 'https://uploads.mangadex.org/covers/test-uuid/cover.jpg',
        volume: '1',
        id: 'cover-1'
      });
    });

    it('deve lançar erro quando UUID não for encontrado', async () => {
      prismaMock.manga.findUnique.mockResolvedValue({ manga_uuid: null });

      await expect(getMangaCovers('invalid-id'))
        .rejects.toThrow('UUID do mangá não encontrado');
    });
  });

  describe('getMangaChapters', () => {
    it('deve retornar capítulos do mangá', async () => {
      const mangaId = 'manga-1';
      const mockManga = { manga_uuid: 'test-uuid' };
      const mockChaptersResponse = {
        status: 200,
        data: {
          data: [
            {
              id: 'chapter-1',
              attributes: {
                title: 'Capítulo 1',
                chapter: '1',
                volume: '1'
              }
            }
          ],
          total: 1
        }
      };

      prismaMock.manga.findUnique.mockResolvedValue(mockManga);
      mockedAxios.get.mockResolvedValue(mockChaptersResponse);

      const result = await getMangaChapters(mangaId, 'pt-br', 'asc', 1, 10);

      expect(result.total).toBe(1);
      expect(result.current_page).toBe(1);
      expect(result.data).toBeDefined();
    });

    it('deve lançar erro quando UUID não estiver disponível', async () => {
      prismaMock.manga.findUnique.mockResolvedValue({ manga_uuid: null });

      await expect(getMangaChapters('invalid-id', 'pt-br', 'asc', 1, 10))
        .rejects.toThrow('Mangá não encontrado ou UUID não disponível');
    });
  });

  describe('clearMangaTable', () => {
    it('deve limpar tabela de mangás e relações', async () => {
      prismaMock.$transaction.mockResolvedValue(undefined);

      const result = await clearMangaTable();

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(result.message).toBe('Tabela de mangás e suas relações foram limpas com sucesso');
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('getSimilarMangas', () => {
    it('deve retornar mangás similares', async () => {
      const mangaId = 'manga-1';
      const mockManga = {
        id: mangaId,
        categories: [{ id: 'cat-1', name: 'Ação' }]
      };
      const mockSimilarMangas = [
        {
          id: 'manga-2',
          cover: 'cover2.jpg',
          translations: [{ name: 'Manga Similar' }]
        }
      ];

      prismaMock.manga.findUnique.mockResolvedValue(mockManga);
      prismaMock.manga.findMany.mockResolvedValue(mockSimilarMangas);

      const result = await getSimilarMangas(mangaId, 5);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'manga-2',
        cover: 'cover2.jpg',
        title: 'Manga Similar'
      });
    });

    it('deve lançar erro quando mangá não for encontrado', async () => {
      prismaMock.manga.findUnique.mockResolvedValue(null);

      await expect(getSimilarMangas('invalid-id'))
        .rejects.toThrow('Mangá não encontrado');
    });
  });

  describe('importMangaFromMangaDex', () => {
    it('deve importar mangá do MangaDex', async () => {
      const mangaId = 'test-uuid';
      const mockMangaDexResponse = {
        data: {
          data: {
            attributes: {
              title: { 'pt-br': 'Manga Importado' },
              description: { 'pt-br': 'Descrição importada' },
              status: 'ongoing',
              type: 'manga',
              year: 2023,
              availableTranslatedLanguages: ['pt-br']
            },
            relationships: [
              { type: 'tag', id: 'tag-1' }
            ]
          }
        }
      };

      const mockCreatedManga = {
        id: 'new-manga-id',
        manga_uuid: mangaId,
        translations: [{ language: 'pt-br', name: 'Manga Importado' }],
        languages: [{ code: 'pt-br' }],
        categories: [{ id: 'tag-1' }]
      };

      mockedAxios.get.mockResolvedValue(mockMangaDexResponse);
      prismaMock.manga.create.mockResolvedValue(mockCreatedManga);

      const result = await importMangaFromMangaDex(mangaId);

      expect(result).toEqual(mockCreatedManga);
      expect(prismaMock.manga.create).toHaveBeenCalled();
    });
  });
});