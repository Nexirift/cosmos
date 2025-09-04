"use server";

/**
 * -----------------------------------------------------------------------------
 *  Settings / Actions Utilities
 * -----------------------------------------------------------------------------
 *  Responsibilities:
 *    - Provide unified read / write access to application settings
 *    - Multi-tier retrieval: Redis Cache -> Database -> Defaults
 *    - Safe parsing of primitive + array values
 *    - Efficient bulk retrieval (getAllSettings)
 *    - Cache maintenance utilities (scan / clear)
 *
 *  Design Goals:
 *    - Zero-throw core (log instead, return graceful fallbacks)
 *    - Stable external interface (backward compatible return shapes)
 *    - Avoid duplicate logic for defaults / fallbacks
 *    - Explicit separation of parse vs. retrieval concerns
 *
 *  NOTE ABOUT RETURN TYPES:
 *    The legacy implementation of `checkCache` returned an empty string ""
 *    for "missing" values. For backward compatibility we preserve that
 *    behavior. Internally we use `null` to represent absence and only
 *    coerce to "" at the boundary.
 * -----------------------------------------------------------------------------
 */

import { env } from "@/env";
import { db } from "@/db";
import { cosmosSetting } from "@/db/schema";
import { CACHE_TTL, DEFAULTS, SETTING_KEY, SettingKey } from "./defaults";
import { log, Logger } from "./logger";
import { redis } from "./redis";
import { ensureRolesInitialized } from "./permissions";

/* -----------------------------------------------------------------------------
 * Types
 * -------------------------------------------------------------------------- */

type DbRow = { key: string; value: string };
type DbResult = DbRow | null | undefined;

export type PrimitiveSetting = string | number | boolean;
export type ComplexSetting = string[] | number[];
export type ParsedSetting = PrimitiveSetting | ComplexSetting;
type InternalSetting = ParsedSetting | null;

type SettingValueInput = string | number | boolean;

/* -----------------------------------------------------------------------------
 * Constants / Helpers
 * -------------------------------------------------------------------------- */

const CACHE_PREFIX = `${SETTING_KEY}:`;
const SETTINGS_VERSION_KEY = `cosmos:settings:__version__`;
const NEGATIVE_SENTINEL = "__NULL__";

/**
 * Maps a runtime "SettingKey enum value" (string literal) back to its
 * enum constant name so we can look up defaults. Returns null if not found.
 */
function resolveEnumKey(value: string): keyof typeof SettingKey | null {
  const found = (
    Object.entries(SettingKey) as [keyof typeof SettingKey, string][]
  ).find(([, enumValue]) => enumValue === value);
  return found?.[0] ?? null;
}

/**
 * Convert a canonical external key (enum value) to a DEFAULTS key.
 * Provided for clarity; currently identical pass-through.
 */
function toDefaultsKey(enumValue: string): keyof typeof SettingKey | null {
  return resolveEnumKey(enumValue);
}

/* -----------------------------------------------------------------------------
 * Parsing
 * -------------------------------------------------------------------------- */

/**
 * Attempts to parse a raw string value to a richer type.
 * Order of evaluation:
 *  - Booleans ("true"/"false")
 *  - Numbers (int / float)
 *  - Arrays (JSON arrays with homogenous types: string[] | number[])
 *  - JSON objects (left as original string for safety)
 *  - Special numeric markers (NaN, Infinity, -Infinity)
 *  - Fallback: original string
 */
export async function parseValue(raw: string): Promise<ParsedSetting | string> {
  if (raw === "" || raw == null) return "";

  const lower = raw.toLowerCase();
  if (lower === "true") return true;
  if (lower === "false") return false;

  // Numbers
  if (!isNaN(Number(raw))) {
    const n = Number(raw);
    // Preserve integer semantics
    return Number.isInteger(n) ? parseInt(raw, 10) : n;
  }

  // Potential JSON structure
  if (
    (raw.startsWith("[") && raw.endsWith("]")) ||
    (raw.startsWith("{") && raw.endsWith("}"))
  ) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (parsed.every((x) => typeof x === "string"))
          return parsed as string[];
        if (parsed.every((x) => typeof x === "number"))
          return parsed as number[];
        // Mixed arrays fallback to raw string (to avoid ambiguous typing)
        return raw;
      }
      // Objects: Return raw (we only officially support arrays for now)
      return raw;
    } catch {
      // fallthrough to raw string
    }
  }

  if (raw === "NaN") return NaN;
  if (raw === "Infinity") return Infinity;
  if (raw === "-Infinity") return -Infinity;

  return raw;
}

/* -----------------------------------------------------------------------------
 * Database Layer
 * -------------------------------------------------------------------------- */

/**
 * Fetch a single setting row from DB.
 * Never throws; logs on failure.
 */
export async function checkDb(key: string): Promise<DbResult> {
  if (!key) return null;
  try {
    return await db.query.cosmosSetting.findFirst({
      where: (setting, { eq }) => eq(setting.key, key),
    });
  } catch (error) {
    log(`Failed DB fetch for key '${key}': ${error}`, Logger.LIB_DB);
    return null;
  }
}

/**
 * Insert or update a key in DB and propagate to cache.
 */
export async function setDb(
  key: SettingKey,
  value: SettingValueInput,
): Promise<boolean> {
  if (!key) return false;

  const cacheKey = CACHE_PREFIX + key;
  const stringValue = String(value);

  try {
    await db
      .insert(cosmosSetting)
      .values({ key, value: stringValue })
      .onConflictDoUpdate({
        target: cosmosSetting.key,
        set: { value: stringValue },
      });

    // Cache write with small TTL jitter to reduce herd expiry
    const ttl = CACHE_TTL + Math.floor(Math.random() * 30);
    await redis.set(cacheKey, stringValue, "EX", ttl).catch(() => {});
    // Bump version (best-effort)
    void redis.incr(SETTINGS_VERSION_KEY).catch(() => {});
    // Remove any negative sentinel if present (best-effort)
    // (If previously cached as missing)
    return true;
  } catch (error) {
    log(`Failed to set key '${key}': ${error}`, Logger.LIB_DB);
    return false;
  }
}

/* -----------------------------------------------------------------------------
 * Cache Helpers
 * -------------------------------------------------------------------------- */

/**
 * SCAN wrapper (non-blocking) to fetch keys matching a pattern.
 * Falls back to KEYS if SCAN not supported (legacy client).
 */
export async function scanForKeys(
  pattern: string,
  count = 100,
): Promise<string[]> {
  const client: any = redis as any;
  const out: string[] = [];
  if (!client) return out;

  if (typeof client.scan !== "function") {
    try {
      const legacy = await client.keys?.(pattern);
      return Array.isArray(legacy) ? legacy : [];
    } catch {
      return out;
    }
  }

  let cursor = "0";
  try {
    do {
      const res = await client.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        String(count),
      );
      if (Array.isArray(res) && res.length === 2) {
        cursor = res[0];
        const batch = res[1];
        if (Array.isArray(batch)) out.push(...batch);
      } else {
        break;
      }
    } while (cursor !== "0");
  } catch (error) {
    log(`SCAN failed for pattern '${pattern}': ${error}`, Logger.LIB_CACHE);
  }
  return out;
}

/**
 * Batch clear cache keys under an optional prefix.
 * Returns number of cleared keys, or -1 on failure.
 */
export async function clearCache(
  prefix: string = SETTING_KEY,
): Promise<number> {
  try {
    const keys = await scanForKeys(`${prefix}:*`);
    if (!keys.length) return 0;

    const pipeline = redis.pipeline();
    for (const k of keys) pipeline.del(k);
    await pipeline.exec();

    log(
      `Cleared ${keys.length} setting cache key(s) for prefix '${prefix}'`,
      Logger.LIB_CACHE,
    );
    return keys.length;
  } catch (error) {
    log(`Failed to clear cache: ${error}`, Logger.LIB_CACHE);
    return -1;
  }
}

/* -----------------------------------------------------------------------------
 * Retrieval Pipeline
 * -------------------------------------------------------------------------- */

/**
 * Try retrieving value from cache. Returns null if not present or on error.
 */
async function tryCache(
  enumValue: string | SettingKey,
): Promise<InternalSetting> {
  const cacheKey = CACHE_PREFIX + enumValue;
  try {
    const hit = await redis.get(cacheKey);
    if (hit == null) return null;
    if (hit === NEGATIVE_SENTINEL) return null;
    return (await parseValue(hit)) as InternalSetting;
  } catch (error) {
    log(`Cache read failed for key '${enumValue}': ${error}`, Logger.LIB_CACHE);
    return null;
  }
}

/**
 * Populate cache with a value (best-effort).
 */
async function writeCache(
  enumValue: string | SettingKey,
  value: ParsedSetting | string,
) {
  try {
    const cacheKey = CACHE_PREFIX + enumValue;
    const store =
      typeof value === "object"
        ? JSON.stringify(value)
        : (value as string | number | boolean).toString();
    await redis.set(cacheKey, store, "EX", CACHE_TTL);
  } catch (error) {
    log(
      `Cache write failed for key '${String(enumValue)}': ${error}`,
      Logger.LIB_CACHE,
    );
  }
}

/**
 * Retrieve a default value from DEFAULTS (may be undefined).
 */
function tryDefault(enumValue: string): InternalSetting {
  const defaultsKey = toDefaultsKey(enumValue);
  if (!defaultsKey) return null;
  const defaultValue = DEFAULTS[
    defaultsKey as keyof typeof DEFAULTS
  ] as unknown as InternalSetting;
  return defaultValue ?? null;
}

/**
 * Unified retrieval function:
 *    1. Cache
 *    2. DB (and backfill cache)
 *    3. Defaults (and optionally cache)
 *
 * Returns InternalSetting (null if missing).
 */
async function internalGetSetting(
  enumValue: string | SettingKey,
): Promise<InternalSetting> {
  if (!enumValue) return null;

  // 1. Cache
  const fromCache = await tryCache(enumValue);
  if (fromCache !== null) return fromCache;

  // 2. DB
  const dbRow = await checkDb(enumValue);
  if (dbRow?.value != null) {
    const parsed = (await parseValue(dbRow.value)) as InternalSetting;
    // Best-effort write to cache
    void writeCache(enumValue, dbRow.value);
    return parsed;
  }

  // 3. Defaults
  if (typeof enumValue === "string") {
    const defaultVal = tryDefault(enumValue);
    if (defaultVal !== null) {
      void writeCache(
        enumValue,
        Array.isArray(defaultVal)
          ? JSON.stringify(defaultVal)
          : String(defaultVal),
      );
      return defaultVal;
    }
  }

  // Negative caching for true miss
  try {
    await redis.set(CACHE_PREFIX + enumValue, NEGATIVE_SENTINEL, "EX", 120);
  } catch {
    /* ignore */
  }

  return null;
}

/**
 * Public retrieval (backwards-compatible). Returns:
 *   - Parsed setting
 *   - "" (empty string) if missing
 */
export async function checkCache(
  key: string | SettingKey,
): Promise<string | boolean | number | string[] | number[]> {
  const result = await internalGetSetting(key);
  if (result === null || result === undefined) return "";
  return result as Exclude<InternalSetting, null>;
}

/* -----------------------------------------------------------------------------
 * Bulk Operations
 * -------------------------------------------------------------------------- */

export type SettingsRecord = Record<
  keyof typeof SettingKey,
  string | boolean | number | string[] | number[]
>;

/**
 * Fetch all settings (parallel retrieval) with default fallback.
 * Cache is leveraged per-key automatically.
 */
export async function getAllSettings(): Promise<SettingsRecord> {
  // Start with defaults so that any missing values gracefully fall back
  const out = { ...DEFAULTS } as SettingsRecord;

  // Strongly typed tuple entries of the SettingKey enum
  type EnumEntries = Array<[keyof typeof SettingKey, string]>;
  const entries = Object.entries(SettingKey) as EnumEntries;

  // If redis client missing, just sequentially resolve via checkCache (which itself
  // handles DB + defaults). Rare path.
  if (!redis) {
    for (const [name, enumValue] of entries) {
      const v = await checkCache(enumValue);
      if (v !== "") {
        out[name] = v as SettingsRecord[keyof typeof SettingKey];
      }
    }
    return out;
  }

  // Batch attempt from cache first
  const cacheKeys = entries.map(([, enumVal]) => CACHE_PREFIX + enumVal);
  let raw: (string | null)[] = [];
  try {
    raw = await redis.mget(cacheKeys);
  } catch (e) {
    log(`Batch MGET failed, falling back sequential: ${e}`, Logger.LIB_CACHE);
    for (const [name, enumValue] of entries) {
      const v = await checkCache(enumValue);
      if (v !== "") {
        out[name] = v as SettingsRecord[keyof typeof SettingKey];
      }
    }
    return out;
  }

  const misses: Array<[keyof typeof SettingKey, string]> = [];

  // Process cache hits; collect misses for second-stage resolution
  for (let i = 0; i < entries.length; i++) {
    const tuple = entries[i];
    if (!tuple) continue;
    const [enumName, enumValue] = tuple;
    const hit = raw[i];

    if (hit == null || hit === NEGATIVE_SENTINEL) {
      misses.push([enumName, enumValue]);
      continue;
    }

    const parsed = await parseValue(hit);
    if (parsed !== "") {
      out[enumName] = parsed as SettingsRecord[keyof typeof SettingKey];
    }
  }

  // Resolve misses via full retrieval path (cache -> db -> defaults)
  if (misses.length) {
    await Promise.all(
      misses.map(async ([enumName, enumValue]) => {
        const resolved = await checkCache(enumValue);
        if (resolved !== "") {
          out[enumName] = resolved as SettingsRecord[keyof typeof SettingKey];
        }
      }),
    );
  }

  return out;
}

/**
 * Prime cache for all settings (useful during startup or warmup).
 * Non-blocking failures.
 */
export async function primeSettingsCache(): Promise<void> {
  const keys = Object.values(SettingKey);
  await Promise.all(
    keys.map(async (k) => {
      const cacheKey = CACHE_PREFIX + k;
      try {
        const exists = await redis.get(cacheKey);
        if (exists != null) return; // already primed
        const value = await internalGetSetting(k);
        if (value !== null) {
          await writeCache(
            k,
            Array.isArray(value) ? JSON.stringify(value) : String(value),
          );
        }
      } catch (error) {
        log(`Failed to prime cache for '${k}': ${error}`, Logger.LIB_CACHE);
      }
    }),
  );
}

/* -----------------------------------------------------------------------------
 * Setup / Status
 * -------------------------------------------------------------------------- */

/**
 * Determine if initial setup has completed.
 *  - Bypass if DISABLE_SETUP set.
 *  - Use checkCache for consistency.
 *  - Fallback direct DB read on error path (mirrors legacy behavior).
 */
export async function isSetupComplete(): Promise<boolean> {
  if (env.DISABLE_SETUP) return true;
  try {
    const val = await checkCache(SettingKey.setupCompleted);
    return val === true;
  } catch (error) {
    log(`Error while determining setup status: ${error}`, Logger.LIB_SETTINGS);
    return (await checkDb("setup_completed"))?.value === "true";
  }
}

/**
 * (Deprecated) leftover function stub; removed.
 * (No-op replacement to avoid reference errors)
 */
export async function recallRoleInitialization(): Promise<void> {
  return;
}
