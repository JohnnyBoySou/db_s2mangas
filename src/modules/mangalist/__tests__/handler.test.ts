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
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Minha Lista',
        cover: 'https://example.com/cover.jpg',
        mood: 'Ação',
        description: 'Lista de mangás de ação',
        status: 'PUBLIC',
        isDefault: false,
        userId: '550e8400-e29b-41d4-a716-446655440001',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        _count: {
            items: 5,
            likes: 10
        }
    };

    const mockMangaListItem = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        listId: '550e8400-e29b-41d4-a716-446655440000',
        mangaId: '550e8400-e29b-41d4-a716-446655440003',
        order: 0,
        note: 'Ótimo mangá',
        manga: {
            id: '550e8400-e29b-41d4-a716-446655440003',
            cover: 'https://example.com/manga-cover.jpg',
            status: 'ongoing',
            translations: [
                {
                    id: '550e8400-e29b-41d4-a716-446655440004',
                    name: 'Manga Teste',
                    language: 'pt-BR',
                    mangaId: '550e8400-e29b-41d4-a716-446655440003'
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
            (prismaMock.mangaList.create as any).mockResolvedValue(mockMangaListData);

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
                mangaIds: ['550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005']
            };

            (prismaMock.mangaList.create as any).mockResolvedValue(mockMangaListData);
            (prismaMock.manga.findUnique as any).mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440003' });
            (prismaMock.mangaListItem.create as any)
                .mockResolvedValueOnce({ id: '550e8400-e29b-41d4-a716-446655440006', listId: '550e8400-e29b-41d4-a716-446655440000', mangaId: '550e8400-e29b-41d4-a716-446655440003', order: 0 })
                .mockResolvedValueOnce({ id: '550e8400-e29b-41d4-a716-446655440007', listId: '550e8400-e29b-41d4-a716-446655440000', mangaId: '550e8400-e29b-41d4-a716-446655440005', order: 1 });

            const result = await MangaListHandler.createMangaList(dataWithMangas);

            expect(prismaMock.manga.findUnique).toHaveBeenCalledTimes(2);
            expect(prismaMock.mangaListItem.create).toHaveBeenCalledTimes(2);
            expect(result).toEqual(mockMangaListData);
        });

        it('deve falhar se mangá não existir', async () => {
            const dataWithInvalidManga = {
                ...validCreateData,
                mangaIds: ['550e8400-e29b-41d4-a716-446655440011']
            };

            (prismaMock.mangaList.create as any).mockResolvedValue(mockMangaListData);
            (prismaMock.manga.findUnique as any).mockResolvedValue(null);

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

            (prismaMock.mangaList.findMany as any).mockResolvedValue(mockLists);
            (prismaMock.mangaList.count as any).mockResolvedValue(mockTotal);

            const filters = {
                userId: '550e8400-e29b-41d4-a716-446655440001',
                status: 'PUBLIC' as const,
                page: 1,
                limit: 20,
                sortBy: 'createdAt' as const,
                sortOrder: 'desc' as const
            };

            const result = await MangaListHandler.getMangaLists(filters);

            expect(prismaMock.mangaList.findMany).toHaveBeenCalledWith({
                where: {
                    userId: '550e8400-e29b-41d4-a716-446655440001',
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
            (prismaMock.mangaList.findMany as any).mockResolvedValue([]);
            (prismaMock.mangaList.count as any).mockResolvedValue(0);

            const filters = {
                search: 'test',
                page: 1,
                limit: 10,
                sortBy: 'createdAt' as const,
                sortOrder: 'desc' as const
            };

            await MangaListHandler.getMangaLists(filters);

            expect(prismaMock.mangaList.findMany).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { name: { contains: 'test', mode: 'insensitive' } },
                        { description: { contains: 'test', mode: 'insensitive' } }
                    ]
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
                take: 10
            });
        });

        it('deve aplicar ordenação por likes', async () => {
            (prismaMock.mangaList.findMany as any).mockResolvedValue([]);
            (prismaMock.mangaList.count as any).mockResolvedValue(0);

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
            (prismaMock.mangaList.findMany as any).mockResolvedValue([mockMangaListData]);
            (prismaMock.mangaList.count as any).mockResolvedValue(1);

            const filters = { page: 1, limit: 20, sortBy: 'createdAt' as const, sortOrder: 'desc' as const };

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

            (prismaMock.mangaList.findUnique as any).mockResolvedValue(mockListWithItems);

            const result = await MangaListHandler.getMangaListById('550e8400-e29b-41d4-a716-446655440000');

            expect(prismaMock.mangaList.findUnique).toHaveBeenCalledWith({
                where: { id: '550e8400-e29b-41d4-a716-446655440000' },
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
            (prismaMock.mangaList.findUnique as any).mockResolvedValue(null);

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

            (prismaMock.mangaList.findUnique as any).mockResolvedValue(mockMangaListData);
            (prismaMock.mangaList.update as any).mockResolvedValue({ ...mockMangaListData, ...updateData });

            const result = await MangaListHandler.updateMangaList('550e8400-e29b-41d4-a716-446655440000', updateData);

            expect(prismaMock.mangaList.findUnique).toHaveBeenCalledWith({
                where: { id: '550e8400-e29b-41d4-a716-446655440000' }
            });

            expect(prismaMock.mangaList.update).toHaveBeenCalledWith({
                where: { id: '550e8400-e29b-41d4-a716-446655440000' },
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
            (prismaMock.mangaList.findUnique as any).mockResolvedValue(null);

            await expect(MangaListHandler.updateMangaList('invalid-id', { name: 'Teste' }))
                .rejects.toThrow(MangaListHandler.MangaListNotFoundError);
        });
    });

    describe('deleteMangaList', () => {
        it('deve deletar lista existente', async () => {
            (prismaMock.mangaList.findUnique as any).mockResolvedValue(mockMangaListData);
            (prismaMock.mangaList.delete as any).mockResolvedValue(mockMangaListData);

            const result = await MangaListHandler.deleteMangaList('550e8400-e29b-41d4-a716-446655440000');

            expect(prismaMock.mangaList.findUnique).toHaveBeenCalledWith({
                where: { id: '550e8400-e29b-41d4-a716-446655440000' }
            });

            expect(prismaMock.mangaList.delete).toHaveBeenCalledWith({
                where: { id: '550e8400-e29b-41d4-a716-446655440000' }
            });

            expect(result.message).toBe('Lista deletada com sucesso');
        });

        it('deve falhar para lista não encontrada', async () => {
            (prismaMock.mangaList.findUnique as any).mockResolvedValue(null);

            await expect(MangaListHandler.deleteMangaList('invalid-id'))
                .rejects.toThrow(MangaListHandler.MangaListNotFoundError);
        });
    });

    describe('addMangaToList', () => {
        it('deve adicionar mangá à lista', async () => {
            const addData = {
                mangaId: '550e8400-e29b-41d4-a716-446655440003',
                note: 'Ótimo mangá'
            };

            (prismaMock.mangaList.findUnique as any).mockResolvedValue(mockMangaListData);
            (prismaMock.manga.findUnique as any).mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440003' });
            (prismaMock.mangaListItem.findFirst as any).mockResolvedValue(null); // Não existe na lista
            (prismaMock.mangaListItem.findFirst as any).mockResolvedValueOnce(null); // Para maxOrder
            (prismaMock.mangaListItem.create as any).mockResolvedValue(mockMangaListItem);

            const result = await MangaListHandler.addMangaToList('550e8400-e29b-41d4-a716-446655440000', addData);

            expect(prismaMock.mangaListItem.create).toHaveBeenCalledWith({
                data: {
                    listId: '550e8400-e29b-41d4-a716-446655440000',
                    mangaId: '550e8400-e29b-41d4-a716-446655440003',
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
            (prismaMock.mangaList.findUnique as any).mockResolvedValue(null);

            await expect(MangaListHandler.addMangaToList('550e8400-e29b-41d4-a716-446655440008', { mangaId: '550e8400-e29b-41d4-a716-446655440003' }))
                .rejects.toThrow(MangaListHandler.MangaListNotFoundError);
        });

        it('deve falhar se mangá não existir', async () => {
            (prismaMock.mangaList.findUnique as any).mockResolvedValue(mockMangaListData);
            (prismaMock.manga.findUnique as any).mockResolvedValue(null);

            await expect(MangaListHandler.addMangaToList('550e8400-e29b-41d4-a716-446655440000', { mangaId: '550e8400-e29b-41d4-a716-446655440009' }))
                .rejects.toThrow(MangaListHandler.MangaNotFoundError);
        });

        it('deve falhar se mangá já estiver na lista', async () => {
            (prismaMock.mangaList.findUnique as any).mockResolvedValue(mockMangaListData);
            (prismaMock.manga.findUnique as any).mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440003' });
            (prismaMock.mangaListItem.findFirst as any).mockResolvedValue(mockMangaListItem); // Já existe

            await expect(MangaListHandler.addMangaToList('550e8400-e29b-41d4-a716-446655440000', { mangaId: '550e8400-e29b-41d4-a716-446655440003' }))
                .rejects.toThrow(MangaListHandler.MangaAlreadyInListError);
        });

        it('deve usar ordem especificada', async () => {
            const addData = {
                mangaId: '550e8400-e29b-41d4-a716-446655440003',
                order: 5
            };

            (prismaMock.mangaList.findUnique as any).mockResolvedValue(mockMangaListData);
            (prismaMock.manga.findUnique as any).mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440003' });
            (prismaMock.mangaListItem.findFirst as any).mockResolvedValue(null);
            (prismaMock.mangaListItem.create as any).mockResolvedValue(mockMangaListItem);

            await MangaListHandler.addMangaToList('550e8400-e29b-41d4-a716-446655440000', addData);

            expect(prismaMock.mangaListItem.create).toHaveBeenCalledWith({
                data: {
                    listId: '550e8400-e29b-41d4-a716-446655440000',
                    mangaId: '550e8400-e29b-41d4-a716-446655440003',
                    order: 5,
                    note: undefined
                },
                include: expect.any(Object)
            });
        });
    });

    describe('removeMangaFromList', () => {
        it('deve remover item da lista', async () => {
            (prismaMock.mangaList.findUnique as any).mockResolvedValue(mockMangaListData);
            (prismaMock.mangaListItem.findUnique as any).mockResolvedValue(mockMangaListItem);
            (prismaMock.mangaListItem.delete as any).mockResolvedValue(mockMangaListItem);

            const result = await MangaListHandler.removeMangaFromList('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002');

            expect(prismaMock.mangaListItem.delete).toHaveBeenCalledWith({
                where: { id: '550e8400-e29b-41d4-a716-446655440002' }
            });

            expect(result.message).toBe('Mangá removido da lista com sucesso');
        });

        it('deve falhar se lista não existir', async () => {
            (prismaMock.mangaList.findUnique as any).mockResolvedValue(null);

            await expect(MangaListHandler.removeMangaFromList('invalid-list', 'item-123'))
                .rejects.toThrow(MangaListHandler.MangaListNotFoundError);
        });

        it('deve falhar se item não existir', async () => {
            (prismaMock.mangaList.findUnique as any).mockResolvedValue(mockMangaListData);
            (prismaMock.mangaListItem.findUnique as any).mockResolvedValue(null);

            await expect(MangaListHandler.removeMangaFromList('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010'))
                .rejects.toThrow(MangaListHandler.MangaListItemNotFoundError);
        });

        it('deve falhar se item não pertencer à lista', async () => {
            const itemFromDifferentList = { ...mockMangaListItem, listId: 'other-list' };
            
            (prismaMock.mangaList.findUnique as any).mockResolvedValue(mockMangaListData);
            (prismaMock.mangaListItem.findUnique as any).mockResolvedValue(itemFromDifferentList);

            await expect(MangaListHandler.removeMangaFromList('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002'))
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