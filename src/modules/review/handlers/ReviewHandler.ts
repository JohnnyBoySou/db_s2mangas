import prisma from '@/prisma/client';

export const createReview = async (data: {
    userId: string;
    mangaId: string;
    title: string; 
    rating: number;
    content: string;
    art: number;
    story: number;
    characters: number;
    worldbuilding: number;
    pacing: number;
    emotion: number;
    originality: number;
    dialogues: number;
}) => {
    const { 
        userId, 
        mangaId, 
        title, 
        rating, 
        content,
        art,
        story,
        characters,
        worldbuilding,
        pacing,
        emotion,
        originality,
        dialogues
    } = data;

    const existingReview = await prisma.review.findUnique({
        where: {
            userId_mangaId: {
                userId,
                mangaId
            }
        }
    });

    if (existingReview) {
        throw new Error("Você já fez uma review para este manga");
    }

    const ratings = [rating, art, story, characters, worldbuilding, pacing, emotion, originality, dialogues];
    for (const r of ratings) {
        if (r < 1 || r > 10) {
            throw new Error("As avaliações devem estar entre 1 e 10");
        }
    }

    return await prisma.review.create({
        data: {
            userId,
            mangaId,
            title,
            rating,
            content,
            art,
            story,
            characters,
            worldbuilding,
            pacing,
            emotion,
            originality,
            dialogues
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar: true
                }
            }
        }
    });
};

export const updateReview = async (reviewId: string, data: {
    title?: string; // Nova propriedade
    rating?: number;
    content?: string;
    art?: number;
    story?: number;
    characters?: number;
    worldbuilding?: number;
    pacing?: number;
    emotion?: number;
    originality?: number;
    dialogues?: number;
}) => {
    const { 
        title, 
        rating, 
        content,
        art,
        story,
        characters,
        worldbuilding,
        pacing,
        emotion,
        originality,
        dialogues
    } = data;

    return await prisma.review.update({
        where: { id: reviewId },
        data: {
            title,
            rating,
            content,
            art,
            story,
            characters,
            worldbuilding,
            pacing,
            emotion,
            originality,
            dialogues
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar: true
                }
            }
        }
    });
};

export const deleteReview = async (reviewId: string) => {
    await prisma.review.delete({
        where: { id: reviewId }
    });
};

export const toggleUpvote = async (userId: string, reviewId: string) => {
    const existingVote = await prisma.reviewVote.findUnique({
        where: {
            userId_reviewId: {
                userId,
                reviewId
            }
        }
    });

    if (existingVote) {
        if (existingVote.isUpvote) {
            // Remove upvote
            await prisma.reviewVote.delete({
                where: { id: existingVote.id }
            });
            await prisma.review.update({
                where: { id: reviewId },
                data: { upvotes: { decrement: 1 } }
            });
        } else {
            // Change downvote to upvote
            await prisma.reviewVote.update({
                where: { id: existingVote.id },
                data: { isUpvote: true }
            });
            await prisma.review.update({
                where: { id: reviewId },
                data: {
                    upvotes: { increment: 1 },
                    downvotes: { decrement: 1 }
                }
            });
        }
    } else {
        // Add new upvote
        await prisma.reviewVote.create({
            data: {
                userId,
                reviewId,
                isUpvote: true
            }
        });
        await prisma.review.update({
            where: { id: reviewId },
            data: { upvotes: { increment: 1 } }
        });
    }

    return await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar: true
                }
            }
        }
    });
};

export const toggleDownvote = async (userId: string, reviewId: string) => {
    const existingVote = await prisma.reviewVote.findUnique({
        where: {
            userId_reviewId: {
                userId,
                reviewId
            }
        }
    });

    if (existingVote) {
        if (!existingVote.isUpvote) {
            // Remove downvote
            await prisma.reviewVote.delete({
                where: { id: existingVote.id }
            });
            await prisma.review.update({
                where: { id: reviewId },
                data: { downvotes: { decrement: 1 } }
            });
        } else {
            // Change upvote to downvote
            await prisma.reviewVote.update({
                where: { id: existingVote.id },
                data: { isUpvote: false }
            });
            await prisma.review.update({
                where: { id: reviewId },
                data: {
                    upvotes: { decrement: 1 },
                    downvotes: { increment: 1 }
                }
            });
        }
    } else {
        // Add new downvote
        await prisma.reviewVote.create({
            data: {
                userId,
                reviewId,
                isUpvote: false
            }
        });
        await prisma.review.update({
            where: { id: reviewId },
            data: { downvotes: { increment: 1 } }
        });
    }

    return await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar: true
                }
            }
        }
    });
};

// Atualizar getMangaReviews para ordenar por upvotes
export const getMangaReviews = async (mangaId: string, page: number, take: number) => {
    const skip = (page - 1) * take;

    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where: { mangaId },
            skip,
            take,
            orderBy: [
                { upvotes: 'desc' }, // Removido
                { createdAt: 'desc' }
            ],
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true
                    }
                }
            }
        }),
        prisma.review.count({
            where: { mangaId }
        })
    ]);

    const totalPages = Math.ceil(total / take);

    return {
        data: reviews,
        pagination: {
            total,
            page,
            limit: take,
            totalPages,
            next: page < totalPages ? page + 1 : null,
            prev: page > 1 ? page - 1 : null,
        },
    };
};

export const getUserReview = async (userId: string, mangaId: string) => {
    return await prisma.review.findUnique({
        where: {
            userId_mangaId: {
                userId,
                mangaId
            }
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar: true
                }
            }
        }
    });
};

export const getReview = async (id: string) => {
    const review = await prisma.review.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar: true
                }
            },
            votes: true
        }
    });

    if (!review) {
        throw new Error("Review não encontrada");
    }

    return review;
};

export const getReviewOverview = async (mangaId: string) => {
    const reviews = await prisma.review.findMany({
        where: { mangaId },
        select: {
            rating: true,
            art: true,
            story: true,
            characters: true,
            worldbuilding: true,
            pacing: true,
            emotion: true,
            originality: true,
            dialogues: true,
        }
    });

    if (reviews.length === 0) {
        return {
            totalReviews: 0,
            averages: {
                rating: 0,
                art: 0,
                story: 0,
                characters: 0,
                worldbuilding: 0,
                pacing: 0,
                emotion: 0,
                originality: 0,
                dialogues: 0,
            }
        };
    }

    const totals = reviews.reduce((acc, review) => ({
        rating: acc.rating + review.rating,
        art: acc.art + review.art,
        story: acc.story + review.story,
        characters: acc.characters + review.characters,
        worldbuilding: acc.worldbuilding + review.worldbuilding,
        pacing: acc.pacing + review.pacing,
        emotion: acc.emotion + review.emotion,
        originality: acc.originality + review.originality,
        dialogues: acc.dialogues + review.dialogues,
    }), {
        rating: 0,
        art: 0,
        story: 0,
        characters: 0,
        worldbuilding: 0,
        pacing: 0,
        emotion: 0,
        originality: 0,
        dialogues: 0,
    });

    const totalReviews = reviews.length;

    const averages = {
        rating: Number((totals.rating / totalReviews).toFixed(2)),
        art: Number((totals.art / totalReviews).toFixed(2)),
        story: Number((totals.story / totalReviews).toFixed(2)),
        characters: Number((totals.characters / totalReviews).toFixed(2)),
        worldbuilding: Number((totals.worldbuilding / totalReviews).toFixed(2)),
        pacing: Number((totals.pacing / totalReviews).toFixed(2)),
        emotion: Number((totals.emotion / totalReviews).toFixed(2)),
        originality: Number((totals.originality / totalReviews).toFixed(2)),
        dialogues: Number((totals.dialogues / totalReviews).toFixed(2)),
    };

    return {
        totalReviews,
        averages
    };
};
