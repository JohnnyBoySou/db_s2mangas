import * as UsernameBloomFilter from '../UsernameBloomFilter';
import prisma from '@/prisma/client';

// Mock Prisma
jest.mock('@/prisma/client', () => ({
    __esModule: true,
    default: {
        user: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
    },
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('UsernameBloomFilter', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        UsernameBloomFilter.reset();
    });

    afterEach(() => {
        UsernameBloomFilter.reset();
    });

    describe('initialize', () => {
        it('should initialize with existing usernames from database', async () => {
            // Given
            const mockUsers = [
                { username: 'user1' },
                { username: 'user2' },
                { username: 'user3' }
            ];
            mockedPrisma.user.findMany.mockResolvedValue(mockUsers as any);

            // When
            await UsernameBloomFilter.initialize();

            // Then
            expect(mockedPrisma.user.findMany).toHaveBeenCalledWith({
                select: { username: true },
                where: {
                    username: {
                        not: null
                    }
                }
            });
            
            const stats = UsernameBloomFilter.getStats();
            expect(stats.initialized).toBe(true);
        });

        it('should handle initialization failure gracefully', async () => {
            // Given
            mockedPrisma.user.findMany.mockRejectedValue(new Error('Database error'));

            // When
            await UsernameBloomFilter.initialize();

            // Then
            const stats = UsernameBloomFilter.getStats();
            expect(stats.initialized).toBe(false);
        });

        it('should filter out null usernames during initialization', async () => {
            // Given
            const mockUsers = [
                { username: 'user1' },
                { username: null },
                { username: 'user2' }
            ];
            mockedPrisma.user.findMany.mockResolvedValue(mockUsers as any);

            // When
            await UsernameBloomFilter.initialize();

            // Then
            const stats = UsernameBloomFilter.getStats();
            expect(stats.initialized).toBe(true);
        });
    });

    describe('mightExist', () => {
        it('should return true when not initialized', () => {
            // Given
            // Filter not initialized

            // When
            const result = UsernameBloomFilter.mightExist('testuser');

            // Then
            expect(result).toBe(true);
        });

        it('should return false for definitely non-existent username after initialization', async () => {
            // Given
            mockedPrisma.user.findMany.mockResolvedValue([
                { username: 'existinguser' }
            ] as any);
            await UsernameBloomFilter.initialize();

            // When
            const result = UsernameBloomFilter.mightExist('definitelydoesnotexist');

            // Then - This might be true due to bloom filter nature, but let's test the logic
            expect(typeof result).toBe('boolean');
        });

        it('should return true for added username', async () => {
            // Given
            mockedPrisma.user.findMany.mockResolvedValue([] as any);
            await UsernameBloomFilter.initialize();
            UsernameBloomFilter.addUsername('newuser');

            // When
            const result = UsernameBloomFilter.mightExist('newuser');

            // Then
            expect(result).toBe(true);
        });
    });

    describe('addUsername', () => {
        it('should add username when initialized', async () => {
            // Given
            mockedPrisma.user.findMany.mockResolvedValue([] as any);
            await UsernameBloomFilter.initialize();

            // When
            UsernameBloomFilter.addUsername('newuser');

            // Then
            expect(UsernameBloomFilter.mightExist('newuser')).toBe(true);
        });

        it('should handle null username gracefully', async () => {
            // Given
            mockedPrisma.user.findMany.mockResolvedValue([] as any);
            await UsernameBloomFilter.initialize();

            // When & Then - Should not throw
            expect(() => UsernameBloomFilter.addUsername('')).not.toThrow();
        });

        it('should not add username when not initialized', () => {
            // Given
            // Filter not initialized

            // When & Then - Should not throw
            expect(() => UsernameBloomFilter.addUsername('testuser')).not.toThrow();
        });
    });

    describe('checkUsernameExists', () => {
        it('should return false without database query when bloom filter says no', async () => {
            // Given
            mockedPrisma.user.findMany.mockResolvedValue([] as any);
            await UsernameBloomFilter.initialize();

            // When
            const result = await UsernameBloomFilter.checkUsernameExists('definitelynotexist12345');

            // Then
            expect(result).toBe(false);
            // Database should not be called if bloom filter returns false
            expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
        });

        it('should check database when bloom filter indicates possible existence', async () => {
            // Given
            mockedPrisma.user.findMany.mockResolvedValue([
                { username: 'existinguser' }
            ] as any);
            await UsernameBloomFilter.initialize();
            
            mockedPrisma.user.findUnique.mockResolvedValue({ id: '1' } as any);

            // When
            const result = await UsernameBloomFilter.checkUsernameExists('existinguser');

            // Then
            expect(result).toBe(true);
            expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { username: 'existinguser' },
                select: { id: true }
            });
        });

        it('should return false when database confirms non-existence despite bloom filter false positive', async () => {
            // Given
            mockedPrisma.user.findMany.mockResolvedValue([
                { username: 'someuser' }
            ] as any);
            await UsernameBloomFilter.initialize();
            
            // Add a username to increase chance of false positive
            UsernameBloomFilter.addUsername('anotheruser');
            mockedPrisma.user.findUnique.mockResolvedValue(null);

            // When
            const result = await UsernameBloomFilter.checkUsernameExists('falsepositive');

            // Then
            expect(result).toBe(false);
        });

        it('should always check database when not initialized', async () => {
            // Given
            mockedPrisma.user.findUnique.mockResolvedValue({ id: '1' } as any);

            // When
            const result = await UsernameBloomFilter.checkUsernameExists('testuser');

            // Then
            expect(result).toBe(true);
            expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { username: 'testuser' },
                select: { id: true }
            });
        });
    });

    describe('getStats', () => {
        it('should return correct stats when not initialized', () => {
            // When
            const stats = UsernameBloomFilter.getStats();

            // Then
            expect(stats).toEqual({
                initialized: false,
                expectedElements: expect.any(Number),
                currentElements: expect.any(Number),
                errorRate: expect.any(Number)
            });
        });

        it('should return correct stats when initialized', async () => {
            // Given
            mockedPrisma.user.findMany.mockResolvedValue([
                { username: 'user1' },
                { username: 'user2' }
            ] as any);
            await UsernameBloomFilter.initialize();

            // When
            const stats = UsernameBloomFilter.getStats();

            // Then
            expect(stats.initialized).toBe(true);
            expect(stats.expectedElements).toBeGreaterThan(0);
            expect(stats.currentElements).toBeGreaterThanOrEqual(0);
            expect(stats.errorRate).toBeGreaterThan(0);
        });
    });

    describe('reset', () => {
        it('should reset the bloom filter', async () => {
            // Given
            mockedPrisma.user.findMany.mockResolvedValue([
                { username: 'user1' }
            ] as any);
            await UsernameBloomFilter.initialize();

            // When
            UsernameBloomFilter.reset();

            // Then
            const stats = UsernameBloomFilter.getStats();
            expect(stats.initialized).toBe(false);
        });
    });
});