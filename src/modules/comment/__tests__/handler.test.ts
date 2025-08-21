import { prismaMock } from '../../../test/mocks/prisma';

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
    __esModule: true,
    default: prismaMock,
}));

import {
    createComment,
    listComments,
    updateComment,
    deleteComment
} from '../handlers/CommentHandler';

describe('Comment Handler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createComment', () => {
        const mockCommentData = {
            userId: 'user-1',
            mangaId: 'manga-1',
            content: 'Muito bom esse mangá!'
        };

        const mockCreatedComment = {
            id: 'comment-1',
            userId: 'user-1',
            mangaId: 'manga-1',
            message: 'Muito bom esse mangá!',
            createdAt: new Date(),
            updatedAt: new Date(),
            user: {
                id: 'user-1',
                name: 'João Silva',
                avatar: 'avatar-url'
            }
        };

        it('should create a comment successfully', async () => {
            // Given
            (prismaMock.comment.create as jest.Mock).mockResolvedValue(mockCreatedComment);

            // When
            const result = await createComment(mockCommentData);

            // Then
            expect(result).toEqual(mockCreatedComment);
            expect(prismaMock.comment.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user-1',
                    mangaId: 'manga-1',
                    message: 'Muito bom esse mangá!',
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                        },
                    },
                },
            });
        });

        it('should create a comment with parentId successfully', async () => {
            // Given
            const mockCommentDataWithParent = {
                ...mockCommentData,
                parentId: 'parent-comment-1'
            };

            const mockCreatedCommentWithParent = {
                ...mockCreatedComment,
                parentId: 'parent-comment-1'
            };

            (prismaMock.comment.create as jest.Mock).mockResolvedValue(mockCreatedCommentWithParent);

            // When
            const result = await createComment(mockCommentDataWithParent);

            // Then
            expect(result).toEqual(mockCreatedCommentWithParent);
            expect(prismaMock.comment.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user-1',
                    mangaId: 'manga-1',
                    message: 'Muito bom esse mangá!',
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                        },
                    },
                },
            });
        });

        it('should handle database errors when creating comment', async () => {
            // Given
            const databaseError = new Error('Database connection failed');
            (prismaMock.comment.create as jest.Mock).mockRejectedValue(databaseError);

            // When & Then
            await expect(createComment(mockCommentData)).rejects.toThrow('Database connection failed');
        });
    });

    describe('listComments', () => {
        const mockComments = [
            {
                id: 'comment-1',
                userId: 'user-1',
                mangaId: 'manga-1',
                message: 'Muito bom esse mangá!',
                createdAt: new Date(),
                updatedAt: new Date(),
                user: {
                    id: 'user-1',
                    name: 'João Silva',
                    avatar: 'avatar-url',
                    username: 'joaosilva'
                }
            }
        ];

        it('should list comments with pagination successfully', async () => {
            // Given
            const mangaId = 'manga-1';
            const page = 1;
            const take = 10;
            const total = 1;

            (prismaMock.comment.findMany as jest.Mock).mockResolvedValue(mockComments);
            (prismaMock.comment.count as jest.Mock).mockResolvedValue(total);

            // When
            const result = await listComments(mangaId, page, take);

            // Then
            expect(result).toEqual({
                data: mockComments,
                pagination: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                    next: false,
                    prev: false,
                },
            });
        });

        it('should handle pagination correctly with multiple pages', async () => {
            // Given
            const mangaId = 'manga-1';
            const page = 2;
            const take = 5;
            const total = 15;

            (prismaMock.comment.findMany as jest.Mock).mockResolvedValue(mockComments);
            (prismaMock.comment.count as jest.Mock).mockResolvedValue(total);

            // When
            const result = await listComments(mangaId, page, take);

            // Then
            expect(result.pagination).toEqual({
                total: 15,
                page: 2,
                limit: 5,
                totalPages: 3,
                next: true,
                prev: true,
            });
        });

        it('should handle empty comments list', async () => {
            // Given
            const mangaId = 'manga-1';
            const page = 1;
            const take = 10;
            const total = 0;

            (prismaMock.comment.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.comment.count as jest.Mock).mockResolvedValue(total);

            // When
            const result = await listComments(mangaId, page, take);

            // Then
            expect(result).toEqual({
                data: [],
                pagination: {
                    total: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 0,
                    next: false,
                    prev: false,
                },
            });
        });

        it('should handle database errors when listing comments', async () => {
            // Given
            const mangaId = 'manga-1';
            const page = 1;
            const take = 10;
            const databaseError = new Error('Database connection failed');

            (prismaMock.comment.findMany as jest.Mock).mockRejectedValue(databaseError);

            // When & Then
            await expect(listComments(mangaId, page, take)).rejects.toThrow('Database connection failed');
        });
    });

    describe('updateComment', () => {
        const mockComment = {
            id: 'comment-1',
            userId: 'user-1',
            mangaId: 'manga-1',
            message: 'Comentário original',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const mockUpdatedComment = {
            ...mockComment,
            message: 'Comentário atualizado',
            updatedAt: new Date()
        };

        it('should update comment successfully', async () => {
            // Given
            const commentId = 'comment-1';
            const userId = 'user-1';
            const newContent = 'Comentário atualizado';

            (prismaMock.comment.findUnique as jest.Mock).mockResolvedValue(mockComment);
            (prismaMock.comment.update as jest.Mock).mockResolvedValue(mockUpdatedComment);

            // When
            const result = await updateComment(commentId, userId, newContent);

            // Then
            expect(result).toEqual(mockUpdatedComment);
            expect(prismaMock.comment.findUnique).toHaveBeenCalledWith({
                where: { id: commentId },
            });
            expect(prismaMock.comment.update).toHaveBeenCalledWith({
                where: { id: commentId },
                data: { message: newContent },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                        },
                    },
                },
            });
        });

        it('should throw error when comment not found', async () => {
            // Given
            const commentId = 'comment-1';
            const userId = 'user-1';
            const newContent = 'Comentário atualizado';

            (prismaMock.comment.findUnique as jest.Mock).mockResolvedValue(null);

            // When & Then
            await expect(updateComment(commentId, userId, newContent))
                .rejects.toThrow('Comentário não encontrado.');
        });

        it('should throw error when user is not the comment owner', async () => {
            // Given
            const commentId = 'comment-1';
            const userId = 'user-2'; // Different user
            const newContent = 'Comentário atualizado';

            (prismaMock.comment.findUnique as jest.Mock).mockResolvedValue(mockComment);

            // When & Then
            await expect(updateComment(commentId, userId, newContent))
                .rejects.toThrow('Você não tem permissão para editar este comentário.');
        });

        it('should handle database errors when updating comment', async () => {
            // Given
            const commentId = 'comment-1';
            const userId = 'user-1';
            const newContent = 'Comentário atualizado';
            const databaseError = new Error('Database connection failed');

            (prismaMock.comment.findUnique as jest.Mock).mockResolvedValue(mockComment);
            (prismaMock.comment.update as jest.Mock).mockRejectedValue(databaseError);

            // When & Then
            await expect(updateComment(commentId, userId, newContent))
                .rejects.toThrow('Database connection failed');
        });
    });

    describe('deleteComment', () => {
        const mockComment = {
            id: 'comment-1',
            userId: 'user-1',
            mangaId: 'manga-1',
            message: 'Comentário para deletar',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        it('should delete comment successfully', async () => {
            // Given
            const commentId = 'comment-1';
            const userId = 'user-1';

            (prismaMock.comment.findUnique as jest.Mock).mockResolvedValue(mockComment);
            (prismaMock.comment.delete as jest.Mock).mockResolvedValue(mockComment);

            // When
            await deleteComment(commentId, userId);

            // Then
            expect(prismaMock.comment.findUnique).toHaveBeenCalledWith({
                where: { id: commentId },
            });
            expect(prismaMock.comment.delete).toHaveBeenCalledWith({
                where: { id: commentId },
            });
        });

        it('should throw error when comment not found', async () => {
            // Given
            const commentId = 'comment-1';
            const userId = 'user-1';

            (prismaMock.comment.findUnique as jest.Mock).mockResolvedValue(null);

            // When & Then
            await expect(deleteComment(commentId, userId))
                .rejects.toThrow('Comentário não encontrado.');
        });

        it('should throw error when user is not the comment owner', async () => {
            // Given
            const commentId = 'comment-1';
            const userId = 'user-2'; // Different user

            (prismaMock.comment.findUnique as jest.Mock).mockResolvedValue(mockComment);

            // When & Then
            await expect(deleteComment(commentId, userId))
                .rejects.toThrow('Você não tem permissão para deletar este comentário.');
        });

        it('should handle database errors when deleting comment', async () => {
            // Given
            const commentId = 'comment-1';
            const userId = 'user-1';
            const databaseError = new Error('Database connection failed');

            (prismaMock.comment.findUnique as jest.Mock).mockResolvedValue(mockComment);
            (prismaMock.comment.delete as jest.Mock).mockRejectedValue(databaseError);

            // When & Then
            await expect(deleteComment(commentId, userId))
                .rejects.toThrow('Database connection failed');
        });
    });
});
