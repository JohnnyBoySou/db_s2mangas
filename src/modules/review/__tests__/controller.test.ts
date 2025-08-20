import { Request, Response } from "express";
import * as reviewController from "../controllers/ReviewController";
import * as reviewHandlers from "../handlers/ReviewHandler";
import { handleZodError } from "../../../utils/zodError";
import { getPaginationParams } from "../../../utils/pagination";
import { createReviewSchema, updateReviewSchema } from "../validators/ReviewSchemas";

// Mock das dependências
jest.mock("../handlers/ReviewHandler");
jest.mock("@/utils/zodError");
jest.mock("@/utils/pagination");
jest.mock("../validators/ReviewSchemas");

const mockReviewHandlers = reviewHandlers as jest.Mocked<typeof reviewHandlers>;
const mockHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;
const mockGetPaginationParams = getPaginationParams as jest.MockedFunction<typeof getPaginationParams>;
const mockCreateReviewSchema = createReviewSchema as jest.Mocked<typeof createReviewSchema>;
const mockUpdateReviewSchema = updateReviewSchema as jest.Mocked<typeof updateReviewSchema>;

describe("ReviewController", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
    } as any;
    (mockReq as any).user = { id: "user123" };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("createReview", () => {
    const mockReviewData = {
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

    const mockCreatedReview = {
      id: "review123",
      ...mockReviewData,
      userId: "user123",
      upvotes: 0,
      downvotes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: "user123",
        name: "Test User",
        username: "testuser",
        avatar: "avatar.jpg",
      },
    };

    it("should create a review successfully", async () => {
      mockReq.body = mockReviewData;
      mockCreateReviewSchema.parse = jest.fn().mockReturnValue(mockReviewData);
      mockReviewHandlers.createReview.mockResolvedValue(mockCreatedReview);

      await reviewController.createReview(mockReq as Request, mockRes as Response, mockNext);

      expect(mockCreateReviewSchema.parse).toHaveBeenCalledWith(mockReviewData);
      expect(mockReviewHandlers.createReview).toHaveBeenCalledWith({
        ...mockReviewData,
        userId: "user123",
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockCreatedReview);
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Validation failed");
      mockCreateReviewSchema.parse = jest.fn().mockImplementation(() => {
        throw validationError;
      });

      await reviewController.createReview(mockReq as Request, mockRes as Response, mockNext);

      expect(mockHandleZodError).toHaveBeenCalledWith(validationError, mockRes);
    });

    it("should handle handler errors", async () => {
      const handlerError = new Error("Handler error");
      mockCreateReviewSchema.parse = jest.fn().mockReturnValue(mockReviewData);
      mockReviewHandlers.createReview.mockRejectedValue(handlerError);

      await reviewController.createReview(mockReq as Request, mockRes as Response, mockNext);

      expect(mockHandleZodError).toHaveBeenCalledWith(handlerError, mockRes);
    });
  });

  describe("updateReview", () => {
    const mockUpdateData = {
      title: "Updated title",
      content: "Updated content",
      rating: 8,
    };

    const mockUpdatedReview = {
      id: "review123",
      ...mockUpdateData,
      mangaId: "manga123",
      userId: "user123",
      art: 8,
      story: 8,
      characters: 8,
      worldbuilding: 7,
      pacing: 8,
      emotion: 8,
      originality: 7,
      dialogues: 8,
      upvotes: 3,
      downvotes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: "user123",
        name: "Test User",
        username: "testuser",
        avatar: "avatar.jpg"
      }
    };

    it("should update a review successfully", async () => {
      mockReq.body = mockUpdateData;
      mockReq.params = { reviewId: "review123" };
      mockUpdateReviewSchema.parse = jest.fn().mockReturnValue(mockUpdateData);
      mockReviewHandlers.updateReview.mockResolvedValue(mockUpdatedReview);

      await reviewController.updateReview(mockReq as Request, mockRes as Response, mockNext);

      expect(mockUpdateReviewSchema.parse).toHaveBeenCalledWith(mockUpdateData);
      expect(mockReviewHandlers.updateReview).toHaveBeenCalledWith("review123", mockUpdateData);
      expect(mockRes.json).toHaveBeenCalledWith(mockUpdatedReview);
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Validation failed");
      mockUpdateReviewSchema.parse = jest.fn().mockImplementation(() => {
        throw validationError;
      });

      await reviewController.updateReview(mockReq as Request, mockRes as Response, mockNext);

      expect(mockHandleZodError).toHaveBeenCalledWith(validationError, mockRes);
    });
  });

  describe("deleteReview", () => {
    it("should delete a review successfully", async () => {
      mockReq.params = { reviewId: "review123" };
      mockReviewHandlers.deleteReview.mockResolvedValue(undefined);

      await reviewController.deleteReview(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReviewHandlers.deleteReview).toHaveBeenCalledWith("review123");
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it("should handle handler errors", async () => {
      const handlerError = new Error("Handler error");
      mockReviewHandlers.deleteReview.mockRejectedValue(handlerError);

      await reviewController.deleteReview(mockReq as Request, mockRes as Response, mockNext);

      expect(mockHandleZodError).toHaveBeenCalledWith(handlerError, mockRes);
    });
  });

  describe("getMangaReviews", () => {
    const mockReviews = {
      data: [
        {
          id: "review123",
          title: "Great review",
          rating: 9,
          mangaId: "manga123",
          userId: "user123",
          content: "Great content",
          art: 8,
          story: 9,
          characters: 8,
          worldbuilding: 7,
          pacing: 8,
          emotion: 9,
          originality: 7,
          dialogues: 8,
          upvotes: 5,
          downvotes: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { 
            id: "user123", 
            name: "Test User",
            username: "testuser",
            avatar: "avatar.jpg"
          },
          votes: []
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        next: null,
        prev: null,
      },
    };

    it("should get manga reviews successfully", async () => {
      mockReq.params = { mangaId: "manga123" };
      mockGetPaginationParams.mockReturnValue({ page: 1, take: 10, skip: 0 });
      mockReviewHandlers.getMangaReviews.mockResolvedValue(mockReviews);

      await reviewController.getMangaReviews(mockReq as Request, mockRes as Response, mockNext);

      expect(mockGetPaginationParams).toHaveBeenCalledWith(mockReq);
      expect(mockReviewHandlers.getMangaReviews).toHaveBeenCalledWith("manga123", 1, 10);
      expect(mockRes.json).toHaveBeenCalledWith(mockReviews);
    });

    it("should handle handler errors", async () => {
      const handlerError = new Error("Handler error");
      mockGetPaginationParams.mockReturnValue({ page: 1, take: 10, skip: 0 });
      mockReviewHandlers.getMangaReviews.mockRejectedValue(handlerError);

      await reviewController.getMangaReviews(mockReq as Request, mockRes as Response, mockNext);

      expect(mockHandleZodError).toHaveBeenCalledWith(handlerError, mockRes);
    });
  });

  describe("getUserReview", () => {
    const mockUserReview = {
      id: "review123",
      title: "User review",
      rating: 8,
      mangaId: "manga123",
      userId: "user123",
      content: "User content",
      art: 8,
      story: 8,
      characters: 8,
      worldbuilding: 7,
      pacing: 8,
      emotion: 8,
      originality: 7,
      dialogues: 8,
      upvotes: 3,
      downvotes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: "user123",
        name: "Test User",
        username: "testuser",
        avatar: "avatar.jpg"
      },
      votes: []
    };

    it("should get user review successfully", async () => {
      mockReq.params = { mangaId: "manga123" };
      mockReviewHandlers.getUserReview.mockResolvedValue(mockUserReview);

      await reviewController.getUserReview(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReviewHandlers.getUserReview).toHaveBeenCalledWith("user123", "manga123");
      expect(mockRes.json).toHaveBeenCalledWith(mockUserReview);
    });

    it("should return 404 if review not found", async () => {
      mockReq.params = { mangaId: "manga123" };
      mockReviewHandlers.getUserReview.mockResolvedValue(null);

      await reviewController.getUserReview(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Review não encontrada" });
    });

    it("should handle handler errors", async () => {
      const handlerError = new Error("Handler error");
      mockReviewHandlers.getUserReview.mockRejectedValue(handlerError);

      await reviewController.getUserReview(mockReq as Request, mockRes as Response, mockNext);

      expect(mockHandleZodError).toHaveBeenCalledWith(handlerError, mockRes);
    });
  });

  describe("toggleUpvote", () => {
    const mockReview = {
      id: "review123",
      title: "Review title",
      rating: 8,
      mangaId: "manga123",
      userId: "user123",
      content: "Review content",
      art: 8,
      story: 8,
      characters: 8,
      worldbuilding: 7,
      pacing: 8,
      emotion: 8,
      originality: 7,
      dialogues: 8,
      upvotes: 5,
      downvotes: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: "user123",
        name: "Test User",
        username: "testuser",
        avatar: "avatar.jpg"
      },
      votes: []
    };

    it("should toggle upvote successfully", async () => {
      mockReq.params = { reviewId: "review123" };
      mockReviewHandlers.toggleUpvote.mockResolvedValue(mockReview);

      await reviewController.toggleUpvote(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReviewHandlers.toggleUpvote).toHaveBeenCalledWith("user123", "review123");
      expect(mockRes.json).toHaveBeenCalledWith(mockReview);
    });

    it("should handle handler errors", async () => {
      const handlerError = new Error("Handler error");
      mockReviewHandlers.toggleUpvote.mockRejectedValue(handlerError);

      await reviewController.toggleUpvote(mockReq as Request, mockRes as Response, mockNext);

      expect(mockHandleZodError).toHaveBeenCalledWith(handlerError, mockRes);
    });
  });

  describe("toggleDownvote", () => {
    const mockReview = {
      id: "review123",
      title: "Review title",
      rating: 8,
      mangaId: "manga123",
      userId: "user123",
      content: "Review content",
      art: 8,
      story: 8,
      characters: 8,
      worldbuilding: 7,
      pacing: 8,
      emotion: 8,
      originality: 7,
      dialogues: 8,
      upvotes: 2,
      downvotes: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: "user123",
        name: "Test User",
        username: "testuser",
        avatar: "avatar.jpg"
      },
      votes: []
    };

    it("should toggle downvote successfully", async () => {
      mockReq.params = { reviewId: "review123" };
      mockReviewHandlers.toggleDownvote.mockResolvedValue(mockReview);

      await reviewController.toggleDownvote(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReviewHandlers.toggleDownvote).toHaveBeenCalledWith("user123", "review123");
      expect(mockRes.json).toHaveBeenCalledWith(mockReview);
    });

    it("should handle handler errors", async () => {
      const handlerError = new Error("Handler error");
      mockReviewHandlers.toggleDownvote.mockRejectedValue(handlerError);

      await reviewController.toggleDownvote(mockReq as Request, mockRes as Response, mockNext);

      expect(mockHandleZodError).toHaveBeenCalledWith(handlerError, mockRes);
    });
  });

  describe("getReview", () => {
    const mockReview = {
      id: "review123",
      title: "Great review",
      rating: 9,
      mangaId: "manga123",
      userId: "user123",
      content: "Great content",
      art: 8,
      story: 9,
      characters: 8,
      worldbuilding: 7,
      pacing: 8,
      emotion: 9,
      originality: 7,
      dialogues: 8,
      upvotes: 5,
      downvotes: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: "user123",
        name: "Test User",
        username: "testuser",
        avatar: "avatar.jpg"
      },
      votes: []
    };

    it("should get review successfully", async () => {
      mockReq.params = { reviewId: "review123" };
      mockReviewHandlers.getReview.mockResolvedValue(mockReview);

      await reviewController.getReview(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReviewHandlers.getReview).toHaveBeenCalledWith("review123");
      expect(mockRes.json).toHaveBeenCalledWith(mockReview);
    });

    it("should return 404 if review not found", async () => {
      mockReq.params = { reviewId: "review123" };
      mockReviewHandlers.getReview.mockResolvedValue(null as any);

      await reviewController.getReview(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Review não encontrada" });
    });

    it("should handle handler errors", async () => {
      const handlerError = new Error("Handler error");
      mockReviewHandlers.getReview.mockRejectedValue(handlerError);

      await reviewController.getReview(mockReq as Request, mockRes as Response, mockNext);

      expect(mockHandleZodError).toHaveBeenCalledWith(handlerError, mockRes);
    });
  });
});