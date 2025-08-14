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

        it('should update comment successfully', async () => {
            // Given
            const commentId = 'comment-1';
            const userId = 'user-1';
            const newContent = 'Comentário atualizado';

            (prismaMock.comment.findUnique as jest.Mock).mockResolvedValue(mockComment);
            (prismaMock.comment.update as jest.Mock).mockResolvedValue(mockComment);

            // When
            await updateComment(commentId, userId, newContent);

            // Then
            expect(prismaMock.comment.findUnique).toHaveBeenCalledWith({
                where: { id: commentId },
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
    });
});
