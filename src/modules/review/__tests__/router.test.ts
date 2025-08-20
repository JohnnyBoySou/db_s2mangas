import request from "supertest";
import express from "express";
import { ReviewRouter } from "../routes/ReviewRouter";
import * as reviewController from "../controllers/ReviewController";
import { requireAuth } from "../../../middlewares/auth";

// Mock das dependências
jest.mock("../controllers/ReviewController");
jest.mock("../../../middlewares/auth");

const mockReviewController = reviewController as jest.Mocked<typeof reviewController>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

describe("ReviewRouter", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/reviews", ReviewRouter);
    jest.clearAllMocks();

    // Mock do middleware de autenticação
    mockRequireAuth.mockImplementation((req: any, res, next) => {
      req.user = { id: "user123" };
      next();
    });

    // Mock dos controllers
    mockReviewController.createReview.mockImplementation((req, res) => {
      res.status(201).json({ id: "review123", message: "Review created" });
    });

    mockReviewController.updateReview.mockImplementation((req, res) => {
      res.json({ id: "review123", message: "Review updated" });
    });

    mockReviewController.deleteReview.mockImplementation((req, res) => {
      res.status(204).send();
    });

    mockReviewController.getMangaReviews.mockImplementation((req, res) => {
      res.json({ data: [], pagination: { page: 1, total: 0 } });
    });

    mockReviewController.getUserReview.mockImplementation((req, res) => {
      res.json({ id: "review123", userId: "user123" });
    });

    mockReviewController.toggleUpvote.mockImplementation((req, res) => {
      res.json({ id: "review123", upvotes: 5 });
    });

    mockReviewController.toggleDownvote.mockImplementation((req, res) => {
      res.json({ id: "review123", downvotes: 2 });
    });

    mockReviewController.getReview.mockImplementation((req, res) => {
      res.json({ id: "review123", title: "Great review" });
    });
  });

  describe("GET /reviews/manga/:mangaId", () => {
    it("should get manga reviews without authentication", async () => {
      const response = await request(app)
        .get("/reviews/manga/manga123")
        .expect(200);

      expect(response.body).toEqual({ data: [], pagination: { page: 1, total: 0 } });
      expect(mockReviewController.getMangaReviews).toHaveBeenCalled();
      expect(mockRequireAuth).not.toHaveBeenCalled();
    });
  });

  describe("POST /reviews", () => {
    it("should create a review with authentication", async () => {
      const reviewData = {
        mangaId: "manga123",
        title: "Great manga",
        content: "Amazing story",
        rating: 9,
        art: 8,
        story: 9,
        characters: 8,
        worldbuilding: 7,
        pacing: 8,
        emotion: 9,
        originality: 7,
        dialogues: 8,
      };

      const response = await request(app)
        .post("/reviews")
        .send(reviewData)
        .expect(201);

      expect(response.body).toEqual({ id: "review123", message: "Review created" });
      expect(mockReviewController.createReview).toHaveBeenCalled();
      expect(mockRequireAuth).toHaveBeenCalled();
    });
  });

  describe("GET /reviews/manga/:mangaId/user", () => {
    it("should get user review with authentication", async () => {
      const response = await request(app)
        .get("/reviews/manga/manga123/user")
        .expect(200);

      expect(response.body).toEqual({ id: "review123", userId: "user123" });
      expect(mockReviewController.getUserReview).toHaveBeenCalled();
      expect(mockRequireAuth).toHaveBeenCalled();
    });
  });

  describe("GET /reviews/:reviewId", () => {
    it("should get review with authentication", async () => {
      const response = await request(app)
        .get("/reviews/review123")
        .expect(200);

      expect(response.body).toEqual({ id: "review123", title: "Great review" });
      expect(mockReviewController.getReview).toHaveBeenCalled();
      expect(mockRequireAuth).toHaveBeenCalled();
    });
  });

  describe("PATCH /reviews/:reviewId", () => {
    it("should update review with authentication", async () => {
      const updateData = {
        title: "Updated title",
        content: "Updated content",
        rating: 8,
      };

      const response = await request(app)
        .patch("/reviews/review123")
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({ id: "review123", message: "Review updated" });
      expect(mockReviewController.updateReview).toHaveBeenCalled();
      expect(mockRequireAuth).toHaveBeenCalled();
    });
  });

  describe("DELETE /reviews/:reviewId", () => {
    it("should delete review with authentication", async () => {
      await request(app)
        .delete("/reviews/review123")
        .expect(204);

      expect(mockReviewController.deleteReview).toHaveBeenCalled();
      expect(mockRequireAuth).toHaveBeenCalled();
    });
  });

  describe("POST /reviews/:reviewId/upvote", () => {
    it("should toggle upvote with authentication", async () => {
      const response = await request(app)
        .post("/reviews/review123/upvote")
        .expect(200);

      expect(response.body).toEqual({ id: "review123", upvotes: 5 });
      expect(mockReviewController.toggleUpvote).toHaveBeenCalled();
      expect(mockRequireAuth).toHaveBeenCalled();
    });
  });

  describe("POST /reviews/:reviewId/downvote", () => {
    it("should toggle downvote with authentication", async () => {
      const response = await request(app)
        .post("/reviews/review123/downvote")
        .expect(200);

      expect(response.body).toEqual({ id: "review123", downvotes: 2 });
      expect(mockReviewController.toggleDownvote).toHaveBeenCalled();
      expect(mockRequireAuth).toHaveBeenCalled();
    });
  });

  describe("Route parameters", () => {
    it("should pass correct mangaId parameter to getMangaReviews", async () => {
      await request(app)
        .get("/reviews/manga/manga456")
        .expect(200);

      const call = mockReviewController.getMangaReviews.mock.calls[0];
      expect(call[0].params.mangaId).toBe("manga456");
    });

    it("should pass correct reviewId parameter to getReview", async () => {
      await request(app)
        .get("/reviews/review456")
        .expect(200);

      const call = mockReviewController.getReview.mock.calls[0];
      expect(call[0].params.reviewId).toBe("review456");
    });

    it("should pass correct reviewId parameter to toggleUpvote", async () => {
      await request(app)
        .post("/reviews/review789/upvote")
        .expect(200);

      const call = mockReviewController.toggleUpvote.mock.calls[0];
      expect(call[0].params.reviewId).toBe("review789");
    });

    it("should pass correct reviewId parameter to toggleDownvote", async () => {
      await request(app)
        .post("/reviews/review789/downvote")
        .expect(200);

      const call = mockReviewController.toggleDownvote.mock.calls[0];
      expect(call[0].params.reviewId).toBe("review789");
    });
  });

  describe("Authentication middleware", () => {
    beforeEach(() => {
      // Reset mock to test authentication failure
      mockRequireAuth.mockReset();
      mockRequireAuth.mockImplementation((req, res, next) => {
        res.status(401).json({ message: "Unauthorized" });
      });
    });

    it("should require authentication for POST /reviews", async () => {
      await request(app)
        .post("/reviews")
        .send({ title: "Test" })
        .expect(401);

      expect(mockRequireAuth).toHaveBeenCalled();
    });

    it("should require authentication for PATCH /reviews/:reviewId", async () => {
      await request(app)
        .patch("/reviews/review123")
        .send({ title: "Updated" })
        .expect(401);

      expect(mockRequireAuth).toHaveBeenCalled();
    });

    it("should require authentication for DELETE /reviews/:reviewId", async () => {
      await request(app)
        .delete("/reviews/review123")
        .expect(401);

      expect(mockRequireAuth).toHaveBeenCalled();
    });

    it("should require authentication for GET /reviews/manga/:mangaId/user", async () => {
      await request(app)
        .get("/reviews/manga/manga123/user")
        .expect(401);

      expect(mockRequireAuth).toHaveBeenCalled();
    });

    it("should require authentication for GET /reviews/:reviewId", async () => {
      await request(app)
        .get("/reviews/review123")
        .expect(401);

      expect(mockRequireAuth).toHaveBeenCalled();
    });

    it("should require authentication for POST /reviews/:reviewId/upvote", async () => {
      await request(app)
        .post("/reviews/review123/upvote")
        .expect(401);

      expect(mockRequireAuth).toHaveBeenCalled();
    });

    it("should require authentication for POST /reviews/:reviewId/downvote", async () => {
      await request(app)
        .post("/reviews/review123/downvote")
        .expect(401);

      expect(mockRequireAuth).toHaveBeenCalled();
    });
  });
});