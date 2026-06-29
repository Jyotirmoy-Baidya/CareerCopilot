import type Redis from 'ioredis';

const TTL_SECONDS = 3600; // presence expires after 1 hour if not refreshed

export async function addPresence(redis: Redis, noteId: string, userId: string) {
  await redis.sadd(`presence:${noteId}`, userId);
  await redis.expire(`presence:${noteId}`, TTL_SECONDS);
}

export async function removePresence(redis: Redis, noteId: string, userId: string) {
  await redis.srem(`presence:${noteId}`, userId);
}

export async function getPresence(redis: Redis, noteId: string): Promise<string[]> {
  return redis.smembers(`presence:${noteId}`);
}
