import { prismaMock } from '../../../test/mocks/prisma';

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
    __esModule: true,
    default: prismaMock,
}));

import {
    upsertLibraryEntry,
    updateLibraryEntry,
    removeLibraryEntry,
    listLibrary,
    toggleLibraryEntry,
    checkMangaStatus
} from '../handlers/LibraryHandler';

describe('Library Handler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('upsertLibraryEntry', () => {
        const mockData = {
            userId: 'user-1',
            mangaId: 'manga-1',
            isRead: true,
            isLiked: false,
            isFollowed: true,
            isComplete: false
        };

        const mockEntry = {
            id: 'entry-1',
            userId: 'user-1',
            mangaId: 'manga-1',
            isRead: true,
            isLiked: false,
            isFollowed: true,
            isComplete: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        it('should create a new library entry successfully', async () => {
            // Given
            (prismaMock.libraryEntry.upsert as jest.Mock).mockResolvedValue(mockEntry);

            // When
            const result = await upsertLibraryEntry(mockData);

            // Then
            expect(result).toEqual(mockEntry);
            expect(prismaMock.libraryEntry.upsert).toHaveBeenCalledWith({
                where: {
                    userId_mangaId: {
                        userId: 'user-1',
                        mangaId: 'manga-1',
                    },
                },
                update: {
                    isRead: true,
                    isLiked: false,
                    isFollowed: true,
                    isComplete: false,
                },
                create: {
                    userId: 'user-1',
                    mangaId: 'manga-1',
                    isRead: true,
                    isLiked: false,
                    isFollowed: true,
                    isComplete: false,
                },
            });
        });

        it('should use default values when optional fields are not provided', async () => {
            // Given
            const dataWithoutOptionals = {
                userId: 'user-1',
                mangaId: 'manga-1'
            };

            (prismaMock.libraryEntry.upsert as jest.Mock).mockResolvedValue(mockEntry);

            // When
            await upsertLibraryEntry(dataWithoutOptionals);

            // Then
            expect(prismaMock.libraryEntry.upsert).toHaveBeenCalledWith({
                where: {
                    userId_mangaId: {
                        userId: 'user-1',
                        mangaId: 'manga-1',
                    },
                },
                update: {
                    isRead: undefined,
                    isLiked: undefined,
                    isFollowed: undefined,
                    isComplete: undefined,
                },
                create: {
                    userId: 'user-1',
                    mangaId: 'manga-1',
                    isRead: false,
                    isLiked: false,
                    isFollowed: false,
                    isComplete: false,
                },
            });
        });
    });

    describe('updateLibraryEntry', () => {
        const mockData = {
            userId: 'user-1',
            mangaId: 'manga-1',
            isRead: true,
            isLiked: true
        };

        const mockUpdatedEntry = {
            id: 'entry-1',
            userId: 'user-1',
            mangaId: 'manga-1',
            isRead: true,
            isLiked: true,
            isFollowed: false,
            isComplete: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        it('should update library entry successfully', async () => {
            // Given
            (prismaMock.libraryEntry.update as jest.Mock).mockResolvedValue(mockUpdatedEntry);

            // When
            const result = await updateLibraryEntry(mockData);

            // Then
            expect(result).toEqual(mockUpdatedEntry);
            expect(prismaMock.libraryEntry.update).toHaveBeenCalledWith({
                where: {
                    userId_mangaId: {
                        userId: 'user-1',
                        mangaId: 'manga-1',
                    },
                },
                data: {
                    isRead: true,
                    isLiked: true,
                },
            });
        });
    });

    describe('removeLibraryEntry', () => {
        it('should remove library entry successfully', async () => {
            // Given
            const userId = 'user-1';
            const mangaId = 'manga-1';

            (prismaMock.libraryEntry.delete as jest.Mock).mockResolvedValue(undefined);

            // When
            await removeLibraryEntry(userId, mangaId);

            // Then
            expect(prismaMock.libraryEntry.delete).toHaveBeenCalledWith({
                where: {
                    userId_mangaId: {
                        userId: 'user-1',
                        mangaId: 'manga-1',
                    },
                },
            });
        });
    });

    describe('listLibrary', () => {
        const mockEntries = [
            {
                id: 'entry-1',
                userId: 'user-1',
                mangaId: 'manga-1',
                isRead: true,
                isLiked: false,
                isFollowed: true,
                isComplete: false,
                updatedAt: new Date(),
                manga: {
                    id: 'manga-1',
                    manga_uuid: 'uuid-1',
                    cover: 'cover-url',
                    translations: [
                        { name: 'Manga Title', language: 'pt' }
                    ],
                    _count: {
                        views: 100
                    }
                }
            }
        ];

        it('should list progress library successfully', async () => {
            // Given
            const userId = 'user-1';
            const type = 'progress';
            const page = 1;
            const take = 10;
            const total = 1;

            (prismaMock.libraryEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);
            (prismaMock.libraryEntry.count as jest.Mock).mockResolvedValue(total);

            // When
            const result = await listLibrary(userId, type, page, take);

            // Then
            expect(result).toEqual({
                data: [
                    {
                        ...mockEntries[0],
                        manga: {
                            id: 'manga-1',
                            manga_uuid: 'uuid-1',
                            title: 'Manga Title',
                            cover: 'cover-url',
                            views_count: 100
                        }
                    }
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
        });

        it('should throw error for invalid type', async () => {
            // Given
            const userId = 'user-1';
            const type = 'invalid';
            const page = 1;
            const take = 10;

            // When & Then
            await expect(listLibrary(userId, type, page, take))
                .rejects.toThrow('Tipo de biblioteca inválido');
        });
    });

    describe('toggleLibraryEntry', () => {
        const mockManga = {
            id: 'manga-1',
            title: 'Test Manga'
        };

        const mockEntry = {
            id: 'entry-1',
            userId: 'user-1',
            mangaId: 'manga-1',
            isRead: false,
            isLiked: false,
            isFollowed: false,
            isComplete: false
        };

        it('should toggle favorite status from false to true', async () => {
            // Given
            const data = {
                userId: 'user-1',
                mangaId: 'manga-1',
                type: 'favorite' as const
            };

            (prismaMock.manga.findUnique as jest.Mock).mockResolvedValue(mockManga);
            (prismaMock.libraryEntry.findUnique as jest.Mock).mockResolvedValue(mockEntry);
            (prismaMock.libraryEntry.update as jest.Mock).mockResolvedValue({
                ...mockEntry,
                isLiked: true
            });

            // When
            const result = await toggleLibraryEntry(data);

            // Then
            expect(result.isLiked).toBe(true);
            expect(prismaMock.libraryEntry.update).toHaveBeenCalledWith({
                where: {
                    userId_mangaId: {
                        userId: 'user-1',
                        mangaId: 'manga-1',
                    },
                },
                data: {
                    isLiked: true
                },
            });
        });

        it('should create new entry when it does not exist', async () => {
            // Given
            const data = {
                userId: 'user-1',
                mangaId: 'manga-1',
                type: 'favorite' as const
            };

            (prismaMock.manga.findUnique as jest.Mock).mockResolvedValue(mockManga);
            (prismaMock.libraryEntry.findUnique as jest.Mock).mockResolvedValue(null);
            (prismaMock.libraryEntry.create as jest.Mock).mockResolvedValue({
                ...mockEntry,
                isLiked: true
            });

            // When
            const result = await toggleLibraryEntry(data);

            // Then
            expect(result.isLiked).toBe(true);
            expect(prismaMock.libraryEntry.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user-1',
                    mangaId: 'manga-1',
                    isLiked: true
                },
            });
        });

        it('should throw error when manga does not exist', async () => {
            // Given
            const data = {
                userId: 'user-1',
                mangaId: 'manga-1',
                type: 'favorite' as const
            };

            (prismaMock.manga.findUnique as jest.Mock).mockResolvedValue(null);

            // When & Then
            await expect(toggleLibraryEntry(data))
                .rejects.toThrow('Mangá não encontrado');
        });
    });

    describe('checkMangaStatus', () => {
        it('should return manga status when entry exists', async () => {
            // Given
            const userId = 'user-1';
            const mangaId = 'manga-1';

            const mockEntry = {
                isRead: true,
                isLiked: false,
                isFollowed: true,
                isComplete: false
            };

            (prismaMock.libraryEntry.findUnique as jest.Mock).mockResolvedValue(mockEntry);

            // When
            const result = await checkMangaStatus(userId, mangaId);

            // Then
            expect(result).toEqual({
                isRead: true,
                isLiked: false,
                isFollowed: true,
                isComplete: false
            });
        });

        it('should return default values when entry does not exist', async () => {
            // Given
            const userId = 'user-1';
            const mangaId = 'manga-1';

            (prismaMock.libraryEntry.findUnique as jest.Mock).mockResolvedValue(null);

            // When
            const result = await checkMangaStatus(userId, mangaId);

            // Then
            expect(result).toEqual({
                isRead: false,
                isLiked: false,
                isFollowed: false,
                isComplete: false
            });
        });
    });
});
