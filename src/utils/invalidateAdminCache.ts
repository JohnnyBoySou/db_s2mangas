import { getRedisClient } from "@/config/redis";

export async function invalidateAdminCache(userId: string) {
  const redis = getRedisClient();
  const cacheKey = `admin:${userId}`;
  await redis.del(cacheKey);
}