import Redis from "ioredis";
import { env } from "@/env";
import { log, Logger } from "./logger";

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (_redis) return _redis;
  try {
    _redis = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      username: env.REDIS_USERNAME,
      password: env.REDIS_PASSWORD,
      connectTimeout: 5000,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy(times) {
        const delay = Math.min(times * 75, 2500);
        return delay;
      },
    });

    _redis.on("error", (e) =>
      log(
        `Redis error: ${e instanceof Error ? e.message : e}`,
        Logger.LIB_REDIS,
      ),
    );
    _redis.on("end", () => log("Redis connection closed", Logger.LIB_REDIS));
    _redis.on("connect", () => log("Redis connecting...", Logger.LIB_REDIS));
    _redis.on("ready", () => log("Redis ready", Logger.LIB_REDIS));
  } catch (e) {
    log(`Failed to create Redis client: ${e}`, Logger.LIB_REDIS);
    _redis = null;
  }
  return _redis!;
}

// Eager start (optional)
const redis = getRedis();
void redis?.connect().catch(() => {});

export async function redisHealth(): Promise<boolean> {
  try {
    if (!redis) return false;
    const pong = await redis.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}

export { redis };
