import { describe, it, expect } from "@jest/globals";
import { ratingSchema, createReviewSchema, updateReviewSchema } from "../validators/ReviewSchemas";

describe("ReviewSchemas", () => {
  describe("ratingSchema", () => {
    it("should validate valid rating data", () => {
      const validRating = {
        art: 8,
        story: 9,
        characters: 7,
        worldbuilding: 6,
        pacing: 8,
        emotion: 9,
        originality: 7,
        dialogues: 8,
        title: "Great manga!"
      };

      const result = ratingSchema.safeParse(validRating);
      expect(result.success).toBe(true);
    });

    it("should reject rating with values below 1", () => {
      const invalidRating = {
        art: 0,
        story: 9,
        characters: 7,
        worldbuilding: 6,
        pacing: 8,
        emotion: 9,
        originality: 7,
        dialogues: 8,
        title: "Great manga!"
      };

      const result = ratingSchema.safeParse(invalidRating);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["art"]);
        expect(result.error.issues[0].code).toBe("too_small");
      }
    });

    it("should reject rating with values above 10", () => {
      const invalidRating = {
        art: 11,
        story: 9,
        characters: 7,
        worldbuilding: 6,
        pacing: 8,
        emotion: 9,
        originality: 7,
        dialogues: 8,
        title: "Great manga!"
      };

      const result = ratingSchema.safeParse(invalidRating);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["art"]);
        expect(result.error.issues[0].code).toBe("too_big");
      }
    });

    it("should reject empty title", () => {
      const invalidRating = {
        art: 8,
        story: 9,
        characters: 7,
        worldbuilding: 6,
        pacing: 8,
        emotion: 9,
        originality: 7,
        dialogues: 8,
        title: ""
      };

      const result = ratingSchema.safeParse(invalidRating);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["title"]);
        expect(result.error.issues[0].code).toBe("too_small");
      }
    });

    it("should reject title longer than 100 characters", () => {
      const invalidRating = {
        art: 8,
        story: 9,
        characters: 7,
        worldbuilding: 6,
        pacing: 8,
        emotion: 9,
        originality: 7,
        dialogues: 8,
        title: "a".repeat(101)
      };

      const result = ratingSchema.safeParse(invalidRating);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["title"]);
        expect(result.error.issues[0].code).toBe("too_big");
      }
    });

    it("should reject missing required fields", () => {
      const invalidRating = {
        art: 8,
        story: 9
        // Missing other required fields
      };

      const result = ratingSchema.safeParse(invalidRating);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe("createReviewSchema", () => {
    it("should validate valid create review data", () => {
      const validCreateReview = {
        mangaId: "123e4567-e89b-12d3-a456-426614174000",
        rating: 8,
        content: "This is a great manga with excellent story and characters.",
        art: 8,
        story: 9,
        characters: 7,
        worldbuilding: 6,
        pacing: 8,
        emotion: 9,
        originality: 7,
        dialogues: 8,
        title: "Great manga!"
      };

      const result = createReviewSchema.safeParse(validCreateReview);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID for mangaId", () => {
      const invalidCreateReview = {
        mangaId: "invalid-uuid",
        rating: 8,
        content: "This is a great manga with excellent story and characters.",
        art: 8,
        story: 9,
        characters: 7,
        worldbuilding: 6,
        pacing: 8,
        emotion: 9,
        originality: 7,
        dialogues: 8,
        title: "Great manga!"
      };

      const result = createReviewSchema.safeParse(invalidCreateReview);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["mangaId"]);
        expect(result.error.issues[0].code).toBe("invalid_string");
      }
    });

    it("should reject rating below 1", () => {
      const invalidCreateReview = {
        mangaId: "123e4567-e89b-12d3-a456-426614174000",
        rating: 0,
        content: "This is a great manga with excellent story and characters.",
        art: 8,
        story: 9,
        characters: 7,
        worldbuilding: 6,
        pacing: 8,
        emotion: 9,
        originality: 7,
        dialogues: 8,
        title: "Great manga!"
      };

      const result = createReviewSchema.safeParse(invalidCreateReview);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["rating"]);
        expect(result.error.issues[0].code).toBe("too_small");
      }
    });

    it("should reject rating above 10", () => {
      const invalidCreateReview = {
        mangaId: "123e4567-e89b-12d3-a456-426614174000",
        rating: 11,
        content: "This is a great manga with excellent story and characters.",
        art: 8,
        story: 9,
        characters: 7,
        worldbuilding: 6,
        pacing: 8,
        emotion: 9,
        originality: 7,
        dialogues: 8,
        title: "Great manga!"
      };

      const result = createReviewSchema.safeParse(invalidCreateReview);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["rating"]);
        expect(result.error.issues[0].code).toBe("too_big");
      }
    });

    it("should reject empty content", () => {
      const invalidCreateReview = {
        mangaId: "123e4567-e89b-12d3-a456-426614174000",
        rating: 8,
        content: "",
        art: 8,
        story: 9,
        characters: 7,
        worldbuilding: 6,
        pacing: 8,
        emotion: 9,
        originality: 7,
        dialogues: 8,
        title: "Great manga!"
      };

      const result = createReviewSchema.safeParse(invalidCreateReview);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["content"]);
        expect(result.error.issues[0].code).toBe("too_small");
      }
    });

    it("should reject content longer than 2000 characters", () => {
      const invalidCreateReview = {
        mangaId: "123e4567-e89b-12d3-a456-426614174000",
        rating: 8,
        content: "a".repeat(2001),
        art: 8,
        story: 9,
        characters: 7,
        worldbuilding: 6,
        pacing: 8,
        emotion: 9,
        originality: 7,
        dialogues: 8,
        title: "Great manga!"
      };

      const result = createReviewSchema.safeParse(invalidCreateReview);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["content"]);
        expect(result.error.issues[0].code).toBe("too_big");
      }
    });
  });

  describe("updateReviewSchema", () => {
    it("should validate valid update review data with all fields", () => {
      const validUpdateReview = {
        rating: 9,
        content: "Updated review content.",
        art: 9,
        story: 8,
        characters: 8,
        worldbuilding: 7,
        pacing: 9,
        emotion: 8,
        originality: 8,
        dialogues: 9,
        title: "Updated title!"
      };

      const result = updateReviewSchema.safeParse(validUpdateReview);
      expect(result.success).toBe(true);
    });

    it("should validate valid update review data with partial fields", () => {
      const validUpdateReview = {
        rating: 9,
        content: "Updated review content."
      };

      const result = updateReviewSchema.safeParse(validUpdateReview);
      expect(result.success).toBe(true);
    });

    it("should validate empty update review data", () => {
      const validUpdateReview = {};

      const result = updateReviewSchema.safeParse(validUpdateReview);
      expect(result.success).toBe(true);
    });

    it("should reject invalid rating in update", () => {
      const invalidUpdateReview = {
        rating: 0
      };

      const result = updateReviewSchema.safeParse(invalidUpdateReview);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["rating"]);
        expect(result.error.issues[0].code).toBe("too_small");
      }
    });

    it("should reject invalid content in update", () => {
      const invalidUpdateReview = {
        content: ""
      };

      const result = updateReviewSchema.safeParse(invalidUpdateReview);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["content"]);
        expect(result.error.issues[0].code).toBe("too_small");
      }
    });

    it("should reject invalid art rating in update", () => {
      const invalidUpdateReview = {
        art: 11
      };

      const result = updateReviewSchema.safeParse(invalidUpdateReview);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["art"]);
        expect(result.error.issues[0].code).toBe("too_big");
      }
    });
  });
});