import { redis } from "./redis";
import { log, Logger } from "./logger";

/**
 * Central cache helpers.
 *
 * Naming Convention:
 *   <app>:<domain>:<entity>[:<id>]
 * Example:
 *   cosmos:settings:<key>
 *   cosmos:roles:<roleId>
 */

const APP_PREFIX = "cosmos";

export const CacheDomains = {
  SETTINGS: "settings",
  ROLES: "roles",
  META: "meta",
} as const;

export function key(domain: string, ...parts: string[]) {
  return [APP_PREFIX, domain, ...parts].join(":");
}

/* ---------------------- JSON Helpers ---------------------- */

export function safeJsonParse<T = unknown>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJSON(
  k: string,
  value: unknown,
  ttlSeconds?: number,
): Promise<boolean> {
  if (!redis) return false;
  try {
    const payload = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.set(k, payload, "EX", ttlSeconds);
    } else {
      await redis.set(k, payload);
    }
    return true;
  } catch (e) {
    log(`setJSON failed for ${k}: ${e}`, Logger.LIB_CACHE);
    return false;
  }
}

export async function getJSON<T = unknown>(k: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get(k);
    return safeJsonParse<T>(raw);
  } catch (e) {
    log(`getJSON failed for ${k}: ${e}`, Logger.LIB_CACHE);
    return null;
  }
}

/* ---------------------- Batch Ops ------------------------- */

export async function mgetJSON<T = unknown>(
  keys: string[],
): Promise<(T | null)[]> {
  if (!redis || !keys.length) return keys.map(() => null);
  try {
    const raw = await redis.mget(keys);
    return raw.map((r) => safeJsonParse<T>(r));
  } catch (e) {
    log(`mgetJSON failed: ${e}`, Logger.LIB_CACHE);
    return keys.map(() => null);
  }
}

export async function delKeys(keys: string[]): Promise<number> {
  if (!redis || !keys.length) return 0;
  try {
    const pipeline = redis.pipeline();
    keys.forEach((k) => pipeline.del(k));
    const res = await pipeline.exec();
    return res?.length ?? 0;
  } catch (e) {
    log(`delKeys failed: ${e}`, Logger.LIB_CACHE);
    return 0;
  }
}

/* ----------------------- Scan ------------------------------ */

export async function scanKeys(
  pattern: string,
  count = 200,
): Promise<string[]> {
  if (!redis) return [];
  const out: string[] = [];
  let cursor = "0";
  try {
    do {
      const reply = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        String(count),
      );
      cursor = reply[0];
      const batch = reply[1];
      if (Array.isArray(batch)) out.push(...batch);
    } while (cursor !== "0");
  } catch (e) {
    log(`scanKeys failed for ${pattern}: ${e}`, Logger.LIB_CACHE);
  }
  return out;
}

/* ------------------ Negative Caching ----------------------- */

const NEG_SENTINEL = "__NULL__";

/**
 * Store a null sentinel to prevent DB stampede on hot-miss.
 */
export async function setNegative(k: string, ttlSeconds = 120): Promise<void> {
  try {
    await redis.set(k, NEG_SENTINEL, "EX", ttlSeconds);
  } catch {
    /* ignore */
  }
}

export function isNegative(raw: unknown): boolean {
  return raw === NEG_SENTINEL;
}

/* ------------------ Distributed Lock ----------------------- */

export interface Lock {
  key: string;
  token: string;
  ttlMs: number;
}

export async function acquireLock(
  name: string,
  ttlMs = 5000,
  retryEveryMs = 150,
  maxWaitMs = 3000,
): Promise<Lock | null> {
  if (!redis) return null;
  const lockKey = key(CacheDomains.META, "lock", name);
  const token = Math.random().toString(36).slice(2);
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const ok = await redis.set(lockKey, token, "PX", ttlMs, "NX");
    if (ok) {
      return { key: lockKey, token, ttlMs };
    }
    await new Promise((r) => setTimeout(r, retryEveryMs));
  }
  return null;
}

export async function releaseLock(lock: Lock | null): Promise<void> {
  if (!lock || !redis) return;
  try {
    const stored = await redis.get(lock.key);
    if (stored === lock.token) {
      await redis.del(lock.key);
    }
  } catch {
    /* ignore */
  }
}
