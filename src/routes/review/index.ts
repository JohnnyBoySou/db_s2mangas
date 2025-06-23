import { Router } from "express";
import { requireAuth } from "@/middlewares/auth";
import {
    createReview,
    updateReview,
    deleteReview,
    getMangaReviews,
    getUserReview,
    toggleUpvote,
    toggleDownvote,
    getReview
} from "@/controllers/review";

const ReviewRouter = Router();

ReviewRouter.get("/manga/:mangaId", getMangaReviews);
ReviewRouter.post("/", requireAuth, createReview);
ReviewRouter.get("/manga/:mangaId/user", requireAuth, getUserReview);
ReviewRouter.get("/:reviewId", requireAuth, getReview);
ReviewRouter.patch("/:reviewId", requireAuth, updateReview);
ReviewRouter.delete("/:reviewId", requireAuth, deleteReview);
ReviewRouter.post("/:reviewId/upvote", requireAuth, toggleUpvote);
ReviewRouter.post("/:reviewId/downvote", requireAuth, toggleDownvote);

export default ReviewRouter;
