import { createManga, getMangaById, listMangas, deleteManga } from '../index';
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
});