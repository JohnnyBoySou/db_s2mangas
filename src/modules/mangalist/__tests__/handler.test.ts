import { prismaMock } from '../../../test/mocks/prisma';
import { ZodError } from 'zod';

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
    __esModule: true,
    default: prismaMock,
}));

import * as MangaListHandler from '../handlers/MangaListHandler';

describe('MangaList Handlers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockMangaListData = {
        id: 'list-123',
        name: 'Minha Lista',
        cover: 'https://example.com/cover.jpg',
        mood: 'Ação',
        description: 'Lista de mangás de ação',
        status: 'PUBLIC',
        isDefault: false,
        userId: 'user-123',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        _count: {
            items: 5,
            likes: 10
        }
    };

    const mockMangaListItem = {
        id: 'item-123',
        listId: 'list-123',
        mangaId: 'manga-123',
        order: 0,
        note: 'Ótimo mangá',
        manga: {
            id: 'manga-123',
            cover: 'https://example.com/manga-cover.jpg',
            status: 'ongoing',
            translations: [
                {
                    id: 'trans-123',
                    name: 'Manga Teste',
                    language: 'pt-BR',
                    mangaId: 'manga-123'
                }
            ]
        }
    };

    const validCreateData = {
        name: 'Nova Lista',
        cover: 'https://example.com/cover.jpg',
        mood: 'Aventura',
        description: 'Lista de aventuras',
        status: 'PRIVATE' as const,
        isDefault: false
    };

    describe('createMangaList', () => {
        it('deve criar uma lista de mangás com sucesso', async () => {
            prismaMock.mangaList.create.mockResolvedValue(mockMangaListData);

            const result = await MangaListHandler.createMangaList(validCreateData);

            expect(prismaMock.mangaList.create).toHaveBeenCalledWith({
                data: {
                    name: validCreateData.name,
                    cover: validCreateData.cover,
                    mood: validCreateData.mood,
                    description: validCreateData.description,
                    status: validCreateData.status,
                    isDefault: validCreateData.isDefault
                },
                include: {
                    _count: {
                        select: {
                            items: true,
                            likes: true
                        }
                    }
                }
            });

            expect(result).toEqual(mockMangaListData);
        });

        it('deve criar lista com mangás iniciais', async () => {
            const dataWithMangas = {
                ...validCreateData,
                mangaIds: ['manga-123', 'manga-456']
            };

            prismaMock.mangaList.create.mockResolvedValue(mockMangaListData);
            prismaMock.manga.findUnique.mockResolvedValue({ id: 'manga-123' });
            prismaMock.mangaListItem.create
                .mockResolvedValueOnce({ id: 'item-1', listId: 'list-123', mangaId: 'manga-123', order: 0 })
                .mockResolvedValueOnce({ id: 'item-2', listId: 'list-123', mangaId: 'manga-456', order: 1 });

            const result = await MangaListHandler.createMangaList(dataWithMangas);

            expect(prismaMock.manga.findUnique).toHaveBeenCalledTimes(2);
            expect(prismaMock.mangaListItem.create).toHaveBeenCalledTimes(2);
            expect(result).toEqual(mockMangaListData);
        });

        it('deve falhar se mangá não existir', async () => {
            const dataWithInvalidManga = {
                ...validCreateData,
                mangaIds: ['invalid-manga-id']
            };

            prismaMock.mangaList.create.mockResolvedValue(mockMangaListData);
            prismaMock.manga.findUnique.mockResolvedValue(null);

            await expect(MangaListHandler.createMangaList(dataWithInvalidManga))
                .rejects.toThrow(MangaListHandler.MangaNotFoundError);
        });

        it('deve falhar com dados inválidos', async () => {
            const invalidData = {
                ...validCreateData,
                name: '', // Nome vazio não permitido
                cover: 'invalid-url'
            };

            await expect(MangaListHandler.createMangaList(invalidData))
                .rejects.toThrow(ZodError);
        });
    });

    describe('getMangaLists', () => {
        it('deve listar listas com filtros', async () => {
            const mockLists = [mockMangaListData];
            const mockTotal = 1;

            prismaMock.mangaList.findMany.mockResolvedValue(mockLists);
            prismaMock.mangaList.count.mockResolvedValue(mockTotal);

            const filters = {
                userId: 'user-123',
                status: 'PUBLIC' as const,
                page: 1,
                limit: 20
            };

            const result = await MangaListHandler.getMangaLists(filters);

            expect(prismaMock.mangaList.findMany).toHaveBeenCalledWith({
                where: {
                    userId: 'user-123',
                    status: 'PUBLIC'
                },
                include: {
                    _count: {
                        select: {
                            items: true,
                            likes: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 20
            });

            expect(result).toEqual({
                lists: mockLists,
                total: mockTotal,
                totalPages: 1,
                currentPage: 1
            });
        });

        it('deve aplicar filtro de busca', async () => {
            prismaMock.mangaList.findMany.mockResolvedValue([]);
            prismaMock.mangaList.count.mockResolvedValue(0);

            const filters = {
                search: 'aventura',
                page: 1,
                limit: 20
            };

            await MangaListHandler.getMangaLists(filters);

            expect(prismaMock.mangaList.findMany).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { name: { contains: 'aventura', mode: 'insensitive' } },
                        { description: { contains: 'aventura', mode: 'insensitive' } }
                    ]
                },
                include: expect.any(Object),
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 20
            });
        });

        it('deve aplicar ordenação por likes', async () => {
            prismaMock.mangaList.findMany.mockResolvedValue([]);
            prismaMock.mangaList.count.mockResolvedValue(0);

            const filters = {
                sortBy: 'likesCount' as const,
                sortOrder: 'asc' as const,
                page: 1,
                limit: 20
            };

            await MangaListHandler.getMangaLists(filters);

            expect(prismaMock.mangaList.findMany).toHaveBeenCalledWith({
                where: {},
                include: expect.any(Object),
                orderBy: { likes: { _count: 'asc' } },
                skip: 0,
                take: 20
            });
        });
    });

    describe('getPublicMangaLists', () => {
        it('deve retornar apenas listas públicas', async () => {
            prismaMock.mangaList.findMany.mockResolvedValue([mockMangaListData]);
            prismaMock.mangaList.count.mockResolvedValue(1);

            const filters = { page: 1, limit: 20 };

            await MangaListHandler.getPublicMangaLists(filters);

            expect(prismaMock.mangaList.findMany).toHaveBeenCalledWith({
                where: { status: 'PUBLIC' },
                include: expect.any(Object),
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 20
            });
        });
    });

    describe('getMangaListById', () => {
        it('deve retornar lista por ID com itens', async () => {
            const mockListWithItems = {
                ...mockMangaListData,
                items: [mockMangaListItem]
            };

            prismaMock.mangaList.findUnique.mockResolvedValue(mockListWithItems);

            const result = await MangaListHandler.getMangaListById('list-123');

            expect(prismaMock.mangaList.findUnique).toHaveBeenCalledWith({
                where: { id: 'list-123' },
                include: {
                    items: {
                        include: {
                            manga: {
                                include: {
                                    translations: {
                                        where: { language: 'pt-BR' },
                                        take: 1
                                    }
                                }
                            }
                        },
                        orderBy: { order: 'asc' }
                    },
                    _count: {
                        select: {
                            items: true,
                            likes: true
                        }
                    }
                }
            });

            expect(result.items[0].manga.title).toBe('Manga Teste');
        });

        it('deve falhar para lista não encontrada', async () => {
            prismaMock.mangaList.findUnique.mockResolvedValue(null);

            await expect(MangaListHandler.getMangaListById('invalid-id'))
                .rejects.toThrow(MangaListHandler.MangaListNotFoundError);
        });
    });

    describe('updateMangaList', () => {
        it('deve atualizar lista existente', async () => {
            const updateData = {
                name: 'Lista Atualizada',
                description: 'Nova descrição'
            };

            prismaMock.mangaList.findUnique.mockResolvedValue(mockMangaListData);
            prismaMock.mangaList.update.mockResolvedValue({ ...mockMangaListData, ...updateData });

            const result = await MangaListHandler.updateMangaList('list-123', updateData);

            expect(prismaMock.mangaList.findUnique).toHaveBeenCalledWith({
                where: { id: 'list-123' }
            });

            expect(prismaMock.mangaList.update).toHaveBeenCalledWith({
                where: { id: 'list-123' },
                data: updateData,
                include: {
                    _count: {
                        select: {
                            items: true,
                            likes: true
                        }
                    }
                }
            });

            expect(result.name).toBe('Lista Atualizada');
        });

        it('deve falhar para lista não encontrada', async () => {
            prismaMock.mangaList.findUnique.mockResolvedValue(null);

            await expect(MangaListHandler.updateMangaList('invalid-id', { name: 'Teste' }))
                .rejects.toThrow(MangaListHandler.MangaListNotFoundError);
        });
    });

    describe('deleteMangaList', () => {
        it('deve deletar lista existente', async () => {
            prismaMock.mangaList.findUnique.mockResolvedValue(mockMangaListData);
            prismaMock.mangaList.delete.mockResolvedValue(mockMangaListData);

            const result = await MangaListHandler.deleteMangaList('list-123');

            expect(prismaMock.mangaList.findUnique).toHaveBeenCalledWith({
                where: { id: 'list-123' }
            });

            expect(prismaMock.mangaList.delete).toHaveBeenCalledWith({
                where: { id: 'list-123' }
            });

            expect(result.message).toBe('Lista deletada com sucesso');
        });

        it('deve falhar para lista não encontrada', async () => {
            prismaMock.mangaList.findUnique.mockResolvedValue(null);

            await expect(MangaListHandler.deleteMangaList('invalid-id'))
                .rejects.toThrow(MangaListHandler.MangaListNotFoundError);
        });
    });

    describe('addMangaToList', () => {
        it('deve adicionar mangá à lista', async () => {
            const addData = {
                mangaId: 'manga-123',
                note: 'Ótimo mangá'
            };

            prismaMock.mangaList.findUnique.mockResolvedValue(mockMangaListData);
            prismaMock.manga.findUnique.mockResolvedValue({ id: 'manga-123' });
            prismaMock.mangaListItem.findFirst.mockResolvedValue(null); // Não existe na lista
            prismaMock.mangaListItem.findFirst.mockResolvedValueOnce(null); // Para maxOrder
            prismaMock.mangaListItem.create.mockResolvedValue(mockMangaListItem);

            const result = await MangaListHandler.addMangaToList('list-123', addData);

            expect(prismaMock.mangaListItem.create).toHaveBeenCalledWith({
                data: {
                    listId: 'list-123',
                    mangaId: 'manga-123',
                    order: 0,
                    note: 'Ótimo mangá'
                },
                include: {
                    manga: {
                        include: {
                            translations: {
                                where: { language: 'pt-BR' },
                                take: 1
                            }
                        }
                    }
                }
            });

            expect(result.manga.title).toBe('Manga Teste');
        });

        it('deve falhar se lista não existir', async () => {
            prismaMock.mangaList.findUnique.mockResolvedValue(null);

            await expect(MangaListHandler.addMangaToList('invalid-list', { mangaId: 'manga-123' }))
                .rejects.toThrow(MangaListHandler.MangaListNotFoundError);
        });

        it('deve falhar se mangá não existir', async () => {
            prismaMock.mangaList.findUnique.mockResolvedValue(mockMangaListData);
            prismaMock.manga.findUnique.mockResolvedValue(null);

            await expect(MangaListHandler.addMangaToList('list-123', { mangaId: 'invalid-manga' }))
                .rejects.toThrow(MangaListHandler.MangaNotFoundError);
        });

        it('deve falhar se mangá já estiver na lista', async () => {
            prismaMock.mangaList.findUnique.mockResolvedValue(mockMangaListData);
            prismaMock.manga.findUnique.mockResolvedValue({ id: 'manga-123' });
            prismaMock.mangaListItem.findFirst.mockResolvedValue(mockMangaListItem); // Já existe

            await expect(MangaListHandler.addMangaToList('list-123', { mangaId: 'manga-123' }))
                .rejects.toThrow(MangaListHandler.MangaAlreadyInListError);
        });

        it('deve usar ordem especificada', async () => {
            const addData = {
                mangaId: 'manga-123',
                order: 5
            };

            prismaMock.mangaList.findUnique.mockResolvedValue(mockMangaListData);
            prismaMock.manga.findUnique.mockResolvedValue({ id: 'manga-123' });
            prismaMock.mangaListItem.findFirst.mockResolvedValue(null);
            prismaMock.mangaListItem.create.mockResolvedValue(mockMangaListItem);

            await MangaListHandler.addMangaToList('list-123', addData);

            expect(prismaMock.mangaListItem.create).toHaveBeenCalledWith({
                data: {
                    listId: 'list-123',
                    mangaId: 'manga-123',
                    order: 5,
                    note: undefined
                },
                include: expect.any(Object)
            });
        });
    });

    describe('removeMangaFromList', () => {
        it('deve remover item da lista', async () => {
            prismaMock.mangaList.findUnique.mockResolvedValue(mockMangaListData);
            prismaMock.mangaListItem.findUnique.mockResolvedValue(mockMangaListItem);
            prismaMock.mangaListItem.delete.mockResolvedValue(mockMangaListItem);

            const result = await MangaListHandler.removeMangaFromList('list-123', 'item-123');

            expect(prismaMock.mangaListItem.delete).toHaveBeenCalledWith({
                where: { id: 'item-123' }
            });

            expect(result.message).toBe('Mangá removido da lista com sucesso');
        });

        it('deve falhar se lista não existir', async () => {
            prismaMock.mangaList.findUnique.mockResolvedValue(null);

            await expect(MangaListHandler.removeMangaFromList('invalid-list', 'item-123'))
                .rejects.toThrow(MangaListHandler.MangaListNotFoundError);
        });

        it('deve falhar se item não existir', async () => {
            prismaMock.mangaList.findUnique.mockResolvedValue(mockMangaListData);
            prismaMock.mangaListItem.findUnique.mockResolvedValue(null);

            await expect(MangaListHandler.removeMangaFromList('list-123', 'invalid-item'))
                .rejects.toThrow(MangaListHandler.MangaListItemNotFoundError);
        });

        it('deve falhar se item não pertencer à lista', async () => {
            const itemFromDifferentList = { ...mockMangaListItem, listId: 'other-list' };
            
            prismaMock.mangaList.findUnique.mockResolvedValue(mockMangaListData);
            prismaMock.mangaListItem.findUnique.mockResolvedValue(itemFromDifferentList);

            await expect(MangaListHandler.removeMangaFromList('list-123', 'item-123'))
                .rejects.toThrow(MangaListHandler.MangaListItemNotFoundError);
        });
    });

    describe('Error Classes', () => {
        it('deve criar MangaListNotFoundError corretamente', () => {
            const error = new MangaListHandler.MangaListNotFoundError();
            expect(error.name).toBe('MangaListNotFoundError');
            expect(error.message).toBe('Lista de mangás não encontrada');
        });

        it('deve criar MangaNotFoundError com mensagem customizada', () => {
            const customMessage = 'Mangá específico não encontrado';
            const error = new MangaListHandler.MangaNotFoundError(customMessage);
            expect(error.name).toBe('MangaNotFoundError');
            expect(error.message).toBe(customMessage);
        });

        it('deve criar MangaAlreadyInListError corretamente', () => {
            const error = new MangaListHandler.MangaAlreadyInListError();
            expect(error.name).toBe('MangaAlreadyInListError');
            expect(error.message).toBe('Mangá já está na lista');
        });

        it('deve criar MangaListItemNotFoundError corretamente', () => {
            const error = new MangaListHandler.MangaListItemNotFoundError();
            expect(error.name).toBe('MangaListItemNotFoundError');
            expect(error.message).toBe('Item da lista não encontrado');
        });
    });
});