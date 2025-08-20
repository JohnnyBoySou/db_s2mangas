import { z } from 'zod';
import { playlistSchema, tagSchema, playlistTagSchema } from '../valitators/playlistSchema';

describe('Playlist Schema Validation', () => {
  describe('playlistSchema', () => {
    it('should validate a valid playlist object', () => {
      const validPlaylist = {
        name: 'Test Playlist',
        cover: 'https://example.com/cover.jpg',
        link: 'https://example.com/playlist',
        description: 'A test playlist',
        tags: ['123e4567-e89b-12d3-a456-426614174000', '987fcdeb-51a2-43d1-9f12-123456789abc']
      };

      expect(() => playlistSchema.parse(validPlaylist)).not.toThrow();
      const result = playlistSchema.parse(validPlaylist);
      expect(result).toEqual(validPlaylist);
    });

    it('should validate playlist without optional fields', () => {
      const minimalPlaylist = {
        name: 'Test Playlist',
        cover: 'https://example.com/cover.jpg',
        link: 'https://example.com/playlist'
      };

      expect(() => playlistSchema.parse(minimalPlaylist)).not.toThrow();
      const result = playlistSchema.parse(minimalPlaylist);
      expect(result).toEqual(minimalPlaylist);
    });

    it('should reject playlist with empty name', () => {
      const invalidPlaylist = {
        name: '',
        cover: 'https://example.com/cover.jpg',
        link: 'https://example.com/playlist'
      };

      expect(() => playlistSchema.parse(invalidPlaylist)).toThrow(z.ZodError);
    });

    it('should reject playlist with missing required fields', () => {
      const invalidPlaylist = {
        name: 'Test Playlist'
        // missing cover and link
      };

      expect(() => playlistSchema.parse(invalidPlaylist)).toThrow(z.ZodError);
    });

    it('should reject playlist with invalid URL format for cover', () => {
      const invalidPlaylist = {
        name: 'Test Playlist',
        cover: 'not-a-valid-url',
        link: 'https://example.com/playlist'
      };

      expect(() => playlistSchema.parse(invalidPlaylist)).toThrow(z.ZodError);
    });

    it('should reject playlist with invalid URL format for link', () => {
      const invalidPlaylist = {
        name: 'Test Playlist',
        cover: 'https://example.com/cover.jpg',
        link: 'invalid-link'
      };

      expect(() => playlistSchema.parse(invalidPlaylist)).toThrow(z.ZodError);
    });

    it('should reject playlist with invalid UUID format in tags', () => {
      const invalidPlaylist = {
        name: 'Test Playlist',
        cover: 'https://example.com/cover.jpg',
        link: 'https://example.com/playlist',
        tags: ['invalid-uuid', '123e4567-e89b-12d3-a456-426614174000']
      };

      expect(() => playlistSchema.parse(invalidPlaylist)).toThrow(z.ZodError);
    });

    it('should accept empty tags array', () => {
      const validPlaylist = {
        name: 'Test Playlist',
        cover: 'https://example.com/cover.jpg',
        link: 'https://example.com/playlist',
        tags: []
      };

      expect(() => playlistSchema.parse(validPlaylist)).not.toThrow();
    });
  });

  describe('tagSchema', () => {
    it('should validate a valid tag object', () => {
      const validTag = {
        name: 'Action',
        color: '#FF5733'
      };

      expect(() => tagSchema.parse(validTag)).not.toThrow();
      const result = tagSchema.parse(validTag);
      expect(result).toEqual(validTag);
    });

    it('should validate tag without optional color', () => {
      const minimalTag = {
        name: 'Adventure'
      };

      expect(() => tagSchema.parse(minimalTag)).not.toThrow();
      const result = tagSchema.parse(minimalTag);
      expect(result).toEqual(minimalTag);
    });

    it('should reject tag with empty name', () => {
      const invalidTag = {
        name: '',
        color: '#FF5733'
      };

      expect(() => tagSchema.parse(invalidTag)).toThrow(z.ZodError);
    });

    it('should reject tag with name longer than 50 characters', () => {
      const invalidTag = {
        name: 'A'.repeat(51), // 51 characters
        color: '#FF5733'
      };

      expect(() => tagSchema.parse(invalidTag)).toThrow(z.ZodError);
    });

    it('should reject tag with invalid hex color format', () => {
      const invalidTag = {
        name: 'Action',
        color: 'invalid-color'
      };

      expect(() => tagSchema.parse(invalidTag)).toThrow(z.ZodError);
    });

    it('should reject tag with incomplete hex color', () => {
      const invalidTag = {
        name: 'Action',
        color: '#FF57' // incomplete hex
      };

      expect(() => tagSchema.parse(invalidTag)).toThrow(z.ZodError);
    });

    it('should accept valid hex color variations', () => {
      const testCases = [
        { name: 'Red', color: '#FF0000' },
        { name: 'Green', color: '#00FF00' },
        { name: 'Blue', color: '#0000FF' },
        { name: 'White', color: '#FFFFFF' },
        { name: 'Black', color: '#000000' },
        { name: 'Mixed', color: '#A1B2C3' }
      ];

      testCases.forEach(testCase => {
        expect(() => tagSchema.parse(testCase)).not.toThrow();
      });
    });

    it('should accept lowercase hex colors', () => {
      const validTag = {
        name: 'Action',
        color: '#ff5733'
      };

      expect(() => tagSchema.parse(validTag)).not.toThrow();
    });
  });

  describe('playlistTagSchema', () => {
    it('should validate a valid playlist-tag association', () => {
      const validAssociation = {
        playlistId: '123e4567-e89b-12d3-a456-426614174000',
        tagId: '987fcdeb-51a2-43d1-9f12-123456789abc'
      };

      expect(() => playlistTagSchema.parse(validAssociation)).not.toThrow();
      const result = playlistTagSchema.parse(validAssociation);
      expect(result).toEqual(validAssociation);
    });

    it('should reject association with invalid playlist UUID', () => {
      const invalidAssociation = {
        playlistId: 'invalid-uuid',
        tagId: '987fcdeb-51a2-43d1-9f12-123456789abc'
      };

      expect(() => playlistTagSchema.parse(invalidAssociation)).toThrow(z.ZodError);
    });

    it('should reject association with invalid tag UUID', () => {
      const invalidAssociation = {
        playlistId: '123e4567-e89b-12d3-a456-426614174000',
        tagId: 'invalid-uuid'
      };

      expect(() => playlistTagSchema.parse(invalidAssociation)).toThrow(z.ZodError);
    });

    it('should reject association with missing fields', () => {
      const invalidAssociation = {
        playlistId: '123e4567-e89b-12d3-a456-426614174000'
        // missing tagId
      };

      expect(() => playlistTagSchema.parse(invalidAssociation)).toThrow(z.ZodError);
    });
  });

  describe('Schema Integration Tests', () => {
    it('should work with partial validation for updates', () => {
      const partialUpdate = {
        name: 'Updated Playlist Name'
      };

      expect(() => playlistSchema.partial().parse(partialUpdate)).not.toThrow();
    });

    it('should work with partial tag validation for updates', () => {
      const partialTagUpdate = {
        color: '#123456'
      };

      expect(() => tagSchema.partial().parse(partialTagUpdate)).not.toThrow();
    });

    it('should validate complex playlist with all fields', () => {
      const complexPlaylist = {
        name: 'Complete Test Playlist',
        cover: 'https://cdn.example.com/covers/playlist-cover.jpg',
        link: 'https://mysite.com/playlists/complete-test',
        description: 'This is a comprehensive test playlist with all possible fields filled out to ensure proper validation.',
        tags: [
          '123e4567-e89b-12d3-a456-426614174000',
          '987fcdeb-51a2-43d1-9f12-123456789abc',
          '456789ab-cdef-1234-5678-9abcdef01234'
        ]
      };

      expect(() => playlistSchema.parse(complexPlaylist)).not.toThrow();
      const result = playlistSchema.parse(complexPlaylist);
      expect(result).toEqual(complexPlaylist);
    });
  });
});