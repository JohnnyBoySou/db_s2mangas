// Simple test to verify test infrastructure works
import { createMangaSchema } from '../validators/MangaValidator';

describe('Basic Test Infrastructure', () => {
    it('should be able to run a simple test', () => {
        expect(1 + 1).toBe(2);
    });

    it('should be able to import manga validator', () => {
        expect(createMangaSchema).toBeDefined();
        expect(typeof createMangaSchema.parse).toBe('function');
    });
});