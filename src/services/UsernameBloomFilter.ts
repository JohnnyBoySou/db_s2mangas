import { BloomFilter } from 'bloom-filters';
import prisma from '@/prisma/client';

/**
 * Service for managing username existence checks using a Bloom Filter
 * to reduce database queries and improve performance.
 * 
 * The Bloom Filter provides fast probabilistic checks:
 * - If it returns false, the username definitely doesn't exist
 * - If it returns true, the username might exist (needs database verification)
 */
export class UsernameBloomFilter {
    private bloomFilter: BloomFilter;
    private initialized = false;
    private expectedElements: number;
    private errorRate: number;

    constructor() {
        // Initialize with reasonable defaults for expected user base
        // These can be adjusted based on requirements
        this.expectedElements = 100000; // Expected number of usernames
        this.errorRate = 0.01; // 1% false positive rate
        
        this.bloomFilter = BloomFilter.create(this.expectedElements, this.errorRate);
    }

    /**
     * Initialize the Bloom Filter by loading all existing usernames from the database
     */
    async initialize(): Promise<void> {
        try {
            console.log('Initializing Username Bloom Filter...');
            
            // Load all existing usernames from the database
            const users = await prisma.user.findMany({
                select: { username: true },
                where: {
                    username: {
                        not: null
                    }
                }
            });

            // Add all usernames to the Bloom Filter
            for (const user of users) {
                if (user.username) {
                    this.bloomFilter.add(user.username);
                }
            }

            this.initialized = true;
            console.log(`Username Bloom Filter initialized with ${users.length} usernames`);
        } catch (error) {
            console.error('Failed to initialize Username Bloom Filter:', error);
            // Don't throw error - allow application to continue without bloom filter
            this.initialized = false;
        }
    }

    /**
     * Check if a username might exist using the Bloom Filter
     * @param username The username to check
     * @returns true if username might exist (requires DB verification), false if definitely doesn't exist
     */
    mightExist(username: string): boolean {
        if (!this.initialized) {
            // If not initialized, always return true to force database check
            return true;
        }

        return this.bloomFilter.has(username);
    }

    /**
     * Add a username to the Bloom Filter (call this when creating a new user)
     * @param username The username to add
     */
    addUsername(username: string): void {
        if (this.initialized && username) {
            this.bloomFilter.add(username);
        }
    }

    /**
     * Optimized username existence check that uses Bloom Filter as pre-filter
     * @param username The username to check
     * @returns true if username exists, false otherwise
     */
    async checkUsernameExists(username: string): Promise<boolean> {
        // First check with Bloom Filter
        if (!this.mightExist(username)) {
            // Definitely doesn't exist - no need for database query
            return false;
        }

        // Might exist - verify with database
        const existingUser = await prisma.user.findUnique({
            where: { username },
            select: { id: true }
        });

        return !!existingUser;
    }

    /**
     * Get statistics about the Bloom Filter
     */
    getStats(): {
        initialized: boolean;
        expectedElements: number;
        currentElements: number;
        errorRate: number;
    } {
        return {
            initialized: this.initialized,
            expectedElements: this.expectedElements,
            currentElements: this.bloomFilter.length,
            errorRate: this.bloomFilter.rate()
        };
    }

    /**
     * Reset the Bloom Filter (useful for testing or manual refresh)
     */
    reset(): void {
        this.bloomFilter = BloomFilter.create(this.expectedElements, this.errorRate);
        this.initialized = false;
    }
}

// Export singleton instance
export const usernameBloomFilter = new UsernameBloomFilter();