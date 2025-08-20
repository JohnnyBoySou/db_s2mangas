import { prismaMock } from '../../../test/mocks/prisma';
import { ZodError } from 'zod';
import axios from 'axios';

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
    __esModule: true,
    default: prismaMock,
}));

// Mock do axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

import * as MangaHandler from '../handlers/MangaHandler';

describe('Manga Handlers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockMangaData = {
        id: 'manga-123',
        cover: 'https://example.com/cover.jpg',
        status: 'ongoing',
        type: 'manga',
        releaseDate: new Date('2023-01-01'),
        manga_uuid: 'uuid-123',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        categories: [],
        translations: [
            {
                id: 'trans-123',
                language: 'pt',
                name: 'Manga Teste',
                description: 'Descrição do manga',
                mangaId: 'manga-123'
            }
        ],
        languages: [
            {
                id: 'lang-123',
                name: 'Português',
                code: 'pt'
            }
        ]
    };

    const validCreateData = {
        cover: 'https://example.com/cover.jpg',
        status: 'ongoing',
        type: 'manga',
        releaseDate: new Date('2023-01-01'),
        manga_uuid: 'uuid-123',
        languageIds: ['lang-123'],
        categoryIds: ['cat-123'],
        translations: [
            {
                language: 'pt',
                name: 'Manga Teste',
                description: 'Descrição do manga'
            }
        ]
    };

    describe('createManga', () => {
        it('deve criar um mangá com dados válidos', async () => {
            prismaMock.manga.create.mockResolvedValue(mockMangaData);

            const result = await MangaHandler.createManga(validCreateData);

            expect(prismaMock.manga.create).toHaveBeenCalledWith({
                data: {
                    cover: validCreateData.cover,
                    status: validCreateData.status,
                    type: validCreateData.type,
                    releaseDate: validCreateData.releaseDate,
                    manga_uuid: validCreateData.manga_uuid,
                    languages: {
                        connect: validCreateData.languageIds.map(id => ({ id }))
                    },
                    categories: {
                        connect: validCreateData.categoryIds?.map(id => ({ id })) ?? []
                    },
                    translations: {
                        create: validCreateData.translations.map(t => ({
                            language: t.language,
                            name: t.name,
                            description: t.description
                        }))
                    }
                },
                include: {
                    categories: true,
                    translations: true,
                    languages: true
                }
            });
            expect(result).toEqual(mockMangaData);
        });

        it('deve falhar com dados inválidos', async () => {
            const invalidData = {
                ...validCreateData,
                cover: 'invalid-url',
                languageIds: [] // Array vazio não permitido
            };

            await expect(MangaHandler.createManga(invalidData)).rejects.toThrow(ZodError);
        });

        it('deve falhar sem cover obrigatório', async () => {
            const dataWithoutCover = {
                ...validCreateData,
                cover: undefined
            };

            await expect(MangaHandler.createManga(dataWithoutCover)).rejects.toThrow(ZodError);
        });
    });

    describe('listMangas', () => {
        it('deve listar mangás com paginação', async () => {
            const mockMangas = [mockMangaData];
            const mockTotal = 1;

            prismaMock.manga.findMany.mockResolvedValue(mockMangas);
            prismaMock.manga.count.mockResolvedValue(mockTotal);

            const result = await MangaHandler.listMangas('pt', 1, 10);

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith({
                include: {
                    categories: true,
                    translations: true,
                    languages: true
                },
                orderBy: { createdAt: "desc" },
                skip: 0,
                take: 10
            });

            expect(result).toEqual({
                data: expect.any(Array),
                pagination: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                    next: false,
                    prev: false
                }
            });
        });

        it('deve calcular paginação corretamente', async () => {
            prismaMock.manga.findMany.mockResolvedValue([]);
            prismaMock.manga.count.mockResolvedValue(25);

            const result = await MangaHandler.listMangas('pt', 2, 10);

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 10,
                    take: 10
                })
            );

            expect(result.pagination).toEqual({
                total: 25,
                page: 2,
                limit: 10,
                totalPages: 3,
                next: true,
                prev: true
            });
        });
    });

    describe('getMangaById', () => {
        it('deve retornar mangá por ID com dados completos', async () => {
            const mockMangaWithViews = {
                ...mockMangaData,
                chapters: [],
                likes: []
            };

            prismaMock.manga.findUnique
                .mockResolvedValueOnce(mockMangaWithViews)
                .mockResolvedValueOnce({ manga_uuid: 'uuid-123' });
            
            prismaMock.view.count.mockResolvedValue(10);
            prismaMock.mangaTranslation.findFirst.mockResolvedValue({
                id: 'trans-123',
                language: 'pt',
                name: 'Manga Teste',
                description: 'Descrição',
                mangaId: 'manga-123'
            });

            mockedAxios.get.mockResolvedValue({
                data: { data: [] }
            });

            const result = await MangaHandler.getMangaById('manga-123', 'pt');

            expect(prismaMock.manga.findUnique).toHaveBeenCalledWith({
                where: { id: 'manga-123' },
                include: {
                    categories: true,
                    languages: true,
                    chapters: {
                        include: {
                            language: true
                        }
                    },
                    likes: true
                }
            });

            expect(result.views).toBe(10);
            expect(result.title).toBe('Manga Teste');
        });

        it('deve lançar erro para mangá não encontrado', async () => {
            prismaMock.manga.findUnique.mockResolvedValue(null);

            await expect(MangaHandler.getMangaById('invalid-id', 'pt'))
                .rejects.toThrow('Mangá não encontrado');
        });

        it('deve registrar view se userId fornecido', async () => {
            const mockMangaWithViews = {
                ...mockMangaData,
                chapters: [],
                likes: []
            };

            prismaMock.manga.findUnique
                .mockResolvedValueOnce(mockMangaWithViews)
                .mockResolvedValueOnce({ manga_uuid: 'uuid-123' });
            
            prismaMock.view.findFirst.mockResolvedValue(null);
            prismaMock.view.create.mockResolvedValue({
                id: 'view-123',
                userId: 'user-123',
                mangaId: 'manga-123',
                createdAt: new Date()
            });
            prismaMock.view.count.mockResolvedValue(1);
            prismaMock.mangaTranslation.findFirst.mockResolvedValue(null);

            mockedAxios.get.mockResolvedValue({
                data: { data: [] }
            });

            await MangaHandler.getMangaById('manga-123', 'pt', 'user-123');

            expect(prismaMock.view.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user-123',
                    mangaId: 'manga-123'
                }
            });
        });
    });

    describe('updateManga', () => {
        it('deve atualizar mangá existente', async () => {
            prismaMock.manga.findUnique.mockResolvedValue(mockMangaData);
            prismaMock.manga.update.mockResolvedValue(mockMangaData);

            const updateData = {
                cover: 'https://example.com/new-cover.jpg',
                languageIds: ['lang-123'],
                translations: [
                    {
                        language: 'pt',
                        name: 'Novo Nome'
                    }
                ]
            };

            const result = await MangaHandler.updateManga('manga-123', updateData);

            expect(prismaMock.manga.findUnique).toHaveBeenCalledWith({
                where: { id: 'manga-123' }
            });

            expect(prismaMock.manga.update).toHaveBeenCalledWith({
                where: { id: 'manga-123' },
                data: expect.objectContaining({
                    cover: updateData.cover,
                    translations: {
                        deleteMany: {},
                        create: updateData.translations
                    }
                }),
                include: {
                    categories: true,
                    translations: true,
                    languages: true
                }
            });

            expect(result).toEqual(mockMangaData);
        });

        it('deve falhar para mangá não encontrado', async () => {
            prismaMock.manga.findUnique.mockResolvedValue(null);

            await expect(MangaHandler.updateManga('invalid-id', {}))
                .rejects.toThrow('Mangá não encontrado');
        });
    });

    describe('patchManga', () => {
        it('deve atualizar parcialmente o mangá', async () => {
            prismaMock.manga.findUnique.mockResolvedValue(mockMangaData);
            prismaMock.manga.update.mockResolvedValue(mockMangaData);

            const patchData = {
                cover: 'https://example.com/new-cover.jpg'
            };

            const result = await MangaHandler.patchManga('manga-123', patchData);

            expect(prismaMock.manga.update).toHaveBeenCalledWith({
                where: { id: 'manga-123' },
                data: {
                    cover: patchData.cover
                },
                include: {
                    categories: true,
                    translations: true,
                    languages: true
                }
            });

            expect(result).toEqual(mockMangaData);
        });

        it('deve falhar para mangá não encontrado', async () => {
            prismaMock.manga.findUnique.mockResolvedValue(null);

            await expect(MangaHandler.patchManga('invalid-id', { cover: 'test' }))
                .rejects.toThrow('Mangá não encontrado');
        });
    });

    describe('deleteManga', () => {
        it('deve deletar mangá existente', async () => {
            prismaMock.manga.findUnique.mockResolvedValue(mockMangaData);
            prismaMock.manga.delete.mockResolvedValue(mockMangaData);

            const result = await MangaHandler.deleteManga('manga-123');

            expect(prismaMock.manga.findUnique).toHaveBeenCalledWith({
                where: { id: 'manga-123' }
            });

            expect(prismaMock.manga.delete).toHaveBeenCalledWith({
                where: { id: 'manga-123' }
            });

            expect(result).toEqual({
                message: 'Mangá deletado com sucesso'
            });
        });

        it('deve falhar para mangá não encontrado', async () => {
            prismaMock.manga.findUnique.mockResolvedValue(null);

            await expect(MangaHandler.deleteManga('invalid-id'))
                .rejects.toThrow('Mangá não encontrado');
        });
    });

    describe('getMangaByCategory', () => {
        it('deve retornar mangás por categoria com paginação', async () => {
            const mockMangas = [mockMangaData];
            
            prismaMock.manga.findMany.mockResolvedValue(mockMangas);
            prismaMock.manga.count.mockResolvedValue(1);

            const result = await MangaHandler.getMangaByCategory('Ação', 1, 10);

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith({
                where: {
                    categories: {
                        some: {
                            name: {
                                equals: 'Ação',
                                mode: 'insensitive'
                            }
                        }
                    }
                },
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    translations: true,
                    categories: true,
                    _count: {
                        select: {
                            likes: true,
                            views: true
                        }
                    }
                }
            });

            expect(result.data).toEqual(mockMangas);
            expect(result.pagination.total).toBe(1);
        });
    });

    describe('getMangaCovers', () => {
        it('deve retornar covers do MangaDex', async () => {
            prismaMock.manga.findUnique.mockResolvedValue({
                manga_uuid: 'uuid-123'
            });

            const mockCoversResponse = {
                data: {
                    data: [
                        {
                            id: 'cover-123',
                            attributes: {
                                fileName: 'cover.jpg',
                                volume: '1'
                            }
                        }
                    ]
                }
            };

            mockedAxios.get.mockResolvedValue(mockCoversResponse);

            const result = await MangaHandler.getMangaCovers('manga-123');

            expect(mockedAxios.get).toHaveBeenCalledWith('https://api.mangadx.org/cover', {
                params: {
                    manga: ['uuid-123']
                }
            });

            expect(result).toEqual([
                {
                    img: 'https://uploads.mangadx.org/covers/uuid-123/cover.jpg',
                    volume: '1',
                    id: 'cover-123'
                }
            ]);
        });

        it('deve falhar se UUID não encontrado', async () => {
            prismaMock.manga.findUnique.mockResolvedValue(null);

            await expect(MangaHandler.getMangaCovers('invalid-id'))
                .rejects.toThrow('UUID do mangá não encontrado');
        });
    });

    describe('getSimilarMangas', () => {
        it('deve retornar mangás similares baseados nas categorias', async () => {
            const mockMangaWithCategories = {
                ...mockMangaData,
                categories: [
                    { id: 'cat-123', name: 'Ação' }
                ]
            };

            const mockSimilarMangas = [
                {
                    id: 'manga-456',
                    cover: 'https://example.com/cover2.jpg',
                    translations: [
                        { language: 'pt', name: 'Manga Similar' }
                    ]
                }
            ];

            prismaMock.manga.findUnique.mockResolvedValue(mockMangaWithCategories);
            prismaMock.manga.findMany.mockResolvedValue(mockSimilarMangas);

            const result = await MangaHandler.getSimilarMangas('manga-123', 5);

            expect(prismaMock.manga.findMany).toHaveBeenCalledWith({
                where: {
                    id: { not: 'manga-123' },
                    categories: {
                        some: {
                            id: { in: ['cat-123'] }
                        }
                    }
                },
                select: {
                    id: true,
                    cover: true,
                    translations: {
                        select: {
                            language: true,
                            name: true
                        }
                    }
                },
                take: 5,
                orderBy: { createdAt: 'desc' }
            });

            expect(result).toEqual([
                {
                    id: 'manga-456',
                    cover: 'https://example.com/cover2.jpg',
                    title: 'Manga Similar'
                }
            ]);
        });

        it('deve falhar para mangá não encontrado', async () => {
            prismaMock.manga.findUnique.mockResolvedValue(null);

            await expect(MangaHandler.getSimilarMangas('invalid-id'))
                .rejects.toThrow('Mangá não encontrado');
        });
    });

    describe('clearMangaTable', () => {
        it('deve limpar tabela de mangás e relacionamentos', async () => {
            prismaMock.$transaction.mockResolvedValue([]);

            const result = await MangaHandler.clearMangaTable();

            expect(prismaMock.$transaction).toHaveBeenCalled();
            expect(result.message).toContain('limpas com sucesso');
            expect(result.timestamp).toBeInstanceOf(Date);
        });
    });
});