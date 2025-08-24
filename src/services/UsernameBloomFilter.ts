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

// Module-level state
let bloomFilter: BloomFilter;
let initialized = false;

// Initialize with reasonable defaults for expected user base
const expectedElements = 100000; // Expected number of usernames
const errorRate = 0.01; // 1% false positive rate
bloomFilter = BloomFilter.create(expectedElements, errorRate);

/**
 * Initialize the Bloom Filter by loading all existing usernames from the database
 */
export async function initialize(): Promise<void> {
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
                bloomFilter.add(user.username);
            }
        }

        initialized = true;
        console.log(`Username Bloom Filter initialized with ${users.length} usernames`);
    } catch (error) {
        console.error('Failed to initialize Username Bloom Filter:', error);
        // Don't throw error - allow application to continue without bloom filter
        initialized = false;
    }
}

/**
 * Check if a username might exist using the Bloom Filter
 * @param username The username to check
 * @returns true if username might exist (requires DB verification), false if definitely doesn't exist
 */
export function mightExist(username: string): boolean {
    if (!initialized) {
        // If not initialized, always return true to force database check
        return true;
    }

    return bloomFilter.has(username);
}

/**
 * Add a username to the Bloom Filter (call this when creating a new user)
 * @param username The username to add
 */
export function addUsername(username: string): void {
    if (initialized && username) {
        bloomFilter.add(username);
    }
}

/**
 * Optimized username existence check that uses Bloom Filter as pre-filter
 * @param username The username to check
 * @returns true if username exists, false otherwise
 */
export async function checkUsernameExists(username: string): Promise<boolean> {
    // First check with Bloom Filter
    if (!mightExist(username)) {
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
export function getStats(): {
    initialized: boolean;
    expectedElements: number;
    currentElements: number;
    errorRate: number;
} {
    return {
        initialized,
        expectedElements,
        currentElements: bloomFilter.length,
        errorRate: bloomFilter.rate()
    };
}

/**
 * Reset the Bloom Filter (useful for testing or manual refresh)
 */
export function reset(): void {
    bloomFilter = BloomFilter.create(expectedElements, errorRate);
    initialized = false;
}

// Export object that mimics the previous class interface for compatibility
export const usernameBloomFilter = {
    initialize,
    mightExist,
    addUsername,
    checkUsernameExists,
    getStats,
    reset
};