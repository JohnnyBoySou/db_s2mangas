import { RequestHandler } from "express";
import { handleZodError } from "@/utils/zodError";
import { getPaginationParams } from "@/utils/pagination";
import { z } from "zod";
import * as reviewHandlers from "@/handlers/review";

const ratingSchema = z.object({
    art: z.number().min(1).max(10),
    story: z.number().min(1).max(10),
    characters: z.number().min(1).max(10),
    worldbuilding: z.number().min(1).max(10),
    pacing: z.number().min(1).max(10),
    emotion: z.number().min(1).max(10),
    originality: z.number().min(1).max(10),
    dialogues: z.number().min(1).max(10),
    title: z.string().min(1).max(100),
});

const createReviewSchema = z.object({
    mangaId: z.string().uuid(),
    rating: z.number().min(1).max(10),
    content: z.string().min(1).max(2000),
    ...ratingSchema.shape
});

const updateReviewSchema = z.object({
    rating: z.number().min(1).max(10).optional(),
    content: z.string().min(1).max(2000).optional(),
    ...Object.fromEntries(
        Object.entries(ratingSchema.shape).map(([key, value]) => [
            key,
            value.optional()
        ])
    )
});

export const createReview: RequestHandler = async (req, res) => {
    try {
        const data = createReviewSchema.parse(req.body);
        const userId = req.user!.id;

        const review = await reviewHandlers.createReview({
            ...data,
            userId
        });

        res.status(201).json(review);
    } catch (error) {
        handleZodError(error, res);
    }
};

export const updateReview: RequestHandler = async (req, res) => {
    try {
        const data = updateReviewSchema.parse(req.body);
        const { reviewId } = req.params;

        const review = await reviewHandlers.updateReview(reviewId, data);

        res.json(review);
    } catch (error) {
        handleZodError(error, res);
    }
};

export const deleteReview: RequestHandler = async (req, res) => {
    try {
        const { reviewId } = req.params;

        await reviewHandlers.deleteReview(reviewId);

        res.status(204).send();
    } catch (error) {
        handleZodError(error, res);
    }
};

export const getMangaReviews: RequestHandler = async (req, res) => {
    try {
        const { mangaId } = req.params;
        const { page, take } = getPaginationParams(req);

        const reviews = await reviewHandlers.getMangaReviews(mangaId, page, take);

        res.json(reviews);
    } catch (error) {
        handleZodError(error, res);
    }
};

export const getUserReview: RequestHandler = async (req, res) => {
    try {
        const { mangaId } = req.params;
        const userId = req.user!.id;

        const review = await reviewHandlers.getUserReview(userId, mangaId);

        if (!review) {
            res.status(404).json({ message: "Review não encontrada" });
            return 
        }

        res.json(review);
    } catch (error) {
        handleZodError(error, res);
    }
};

export const toggleUpvote: RequestHandler = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user!.id;

        const review = await reviewHandlers.toggleUpvote(userId, reviewId);

        res.json(review);
    } catch (error) {
        handleZodError(error, res);
    }
};

export const toggleDownvote: RequestHandler = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user!.id;

        const review = await reviewHandlers.toggleDownvote(userId, reviewId);

        res.json(review);
    } catch (error) {
        handleZodError(error, res);
    }
};

export const getReview: RequestHandler = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await reviewHandlers.getReview(reviewId);

        if (!review) {
            res.status(404).json({ message: "Review não encontrada" });
            return;
        }

        res.json(review);
    } catch (error) {
        handleZodError(error, res);
    }
};
