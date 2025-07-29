"use server";

import { env } from "@/env";
import { db } from "@/db";
import { cosmosSetting } from "@/db/schema";
import { DEFAULTS, SettingKey } from "./defaults";
import { log, Logger } from "./logger";
import { redis } from "./redis";

const SETTING_KEY = "cosmos_setting";
const CACHE_TTL = 3600; // 1 hour in seconds

type DbResult = { key: string; value: string } | null | undefined;
type SettingValue = string | number | boolean;

async function checkDb(key: string): Promise<DbResult> {
  if (!key) {
    return null;
  }

  try {
    // await connect();
    return await db.query.cosmosSetting.findFirst({
      where: (setting, { eq }) => eq(setting.key, key),
    });
  } catch (error) {
    log(`Failed to fetch key ${key}:\n${error}`, Logger.LIB_DB);
    return null;
  }
}

async function setDb(key: string, value: SettingValue): Promise<boolean> {
  if (!key) return false;

  const cacheKey = `${SETTING_KEY}:${key}`;
  const stringValue = String(value);

  try {
    // await connect();
    await db
      .insert(cosmosSetting)
      .values({ key, value: stringValue })
      .onConflictDoUpdate({
        target: cosmosSetting.key,
        set: { value: stringValue },
      });

    // Update cache with new value directly instead of invalidating
    await redis.set(cacheKey, stringValue, "EX", CACHE_TTL);
    return true;
  } catch (error) {
    log(`Failed to set key ${key}:\n${error}`, Logger.LIB_DB);
    return false;
  }
}

async function checkCache(
  key: string | SettingKey,
): Promise<string | boolean | number | string[] | number[]> {
  if (!key) {
    log(`Attempted to check cache with empty key`, Logger.LIB_CACHE);
    return "";
  }

  const cacheKey = `${SETTING_KEY}:${key}`;

  try {
    // Try cache first
    const cachedResult = await redis.get(cacheKey);
    if (cachedResult) {
      return parseValue(cachedResult);
    }

    // Try database next - use Promise to avoid blocking
    const dbPromise = checkDb(key);

    // Wait for DB result if no cache is available
    const dbResult = await dbPromise;
    if (dbResult?.value) {
      await redis.set(cacheKey, dbResult.value, "EX", CACHE_TTL);
      return parseValue(dbResult.value);
    }

    // Finally check defaults
    const settingKey = Object.keys(SettingKey).find(
      (k) => SettingKey[k as keyof typeof SettingKey] === key,
    );

    if (settingKey) {
      const defaultValue = DEFAULTS[settingKey as keyof typeof SettingKey];
      return defaultValue;
    }

    return "";
  } catch (error) {
    log(`Failed to check key ${key}:\n${error}`, Logger.LIB_CACHE);

    // Try fallback to defaults on error
    if (typeof key === "string") {
      const settingKey = Object.keys(SettingKey).find(
        (k) => SettingKey[k as keyof typeof SettingKey] === key,
      );
      if (settingKey) {
        return DEFAULTS[settingKey as keyof typeof SettingKey];
      }
    }

    return "";
  }
}

/**
 * Parses a string value into the appropriate type
 */
function parseValue(
  value: string,
): string | boolean | number | string[] | number[] {
  if (!value) return "";

  // Handle booleans
  const lowerValue = value.toLowerCase();
  if (lowerValue === "true") return true;
  if (lowerValue === "false") return false;

  // Handle numbers
  if (!isNaN(Number(value))) {
    const num = Number(value);
    return Number.isInteger(num) ? parseInt(value) : num;
  }

  // Handle arrays and objects
  try {
    if (
      (value.startsWith("[") && value.endsWith("]")) ||
      (value.startsWith("{") && value.endsWith("}"))
    ) {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        // Check if array contains all strings or all numbers
        const isStringArray = parsed.every((item) => typeof item === "string");
        const isNumberArray = parsed.every((item) => typeof item === "number");

        if (isStringArray) return parsed as string[];
        if (isNumberArray) return parsed as number[];
      }
      return value; // Return as string if not string[] or number[]
    }
  } catch {
    // If JSON parsing fails, continue to string handling
  }

  // Handle special strings
  if (value === "NaN") return NaN;
  if (value === "Infinity") return Infinity;
  if (value === "-Infinity") return -Infinity;

  // Default to string
  return value;
}

/**
 * Clears all settings from cache
 * @returns Number of cleared keys or -1 on error
 */
async function clearCache(): Promise<number> {
  try {
    // Use scan instead of keys for production safety
    let cursor = "0";
    let keys: string[] = [];

    do {
      const [nextCursor, scanKeys] = await redis.scan(
        cursor,
        "MATCH",
        `${SETTING_KEY}:*`,
        "COUNT",
        "100",
      );
      cursor = nextCursor;
      keys = keys.concat(scanKeys);
    } while (cursor !== "0");

    if (keys.length > 0) {
      // Use pipeline for batch deletion
      const pipeline = redis.pipeline();
      for (const key of keys) {
        pipeline.del(key);
      }
      await pipeline.exec();
      log(`Successfully cleared ${keys.length} keys`, Logger.LIB_CACHE);
      return keys.length;
    }
    return 0;
  } catch (error) {
    log(`Failed to clear cache:\n${error}`, Logger.LIB_CACHE);
    return -1;
  }
}

/**
 * Checks if initial setup has been completed
 */
async function isSetupComplete(): Promise<boolean> {
  if (env.DISABLE_SETUP) return true;

  try {
    const setupCompleted = await checkCache(SettingKey.setupCompleted);
    return setupCompleted === true;
  } catch (error) {
    log(
      `An error occurred while triyng to check setup status:\n${error}`,
      Logger.LIB_SETTINGS,
    );
    // Fallback to database direct check
    return (await checkDb("setup_completed"))?.value === "true";
  }
}

/**
 * Type definition for settings return value
 */
export type SettingsRecord = Record<
  keyof typeof SettingKey,
  string | boolean | number | string[] | number[]
>;

/**
 * Gets all application settings with defaults
 * @returns Record of all settings
 */
async function getAllSettings(): Promise<SettingsRecord> {
  // Initialize with defaults
  const settings = { ...DEFAULTS } as SettingsRecord;

  try {
    // Fetch all settings in parallel
    const settingPromises = Object.entries(SettingKey).map(
      async ([enumKey, key]) => {
        const value = await checkCache(key);
        if (value !== undefined && value !== null) {
          settings[enumKey as keyof typeof SettingKey] = value;
        }
      },
    );

    await Promise.all(settingPromises);

    return settings;
  } catch (error) {
    log(`Failed to get all settings:\n${error}`, Logger.LIB_SETTINGS);
    // Return defaults on error
    return { ...DEFAULTS } as SettingsRecord;
  }
}

export {
  checkCache,
  checkDb,
  clearCache,
  getAllSettings,
  isSetupComplete,
  setDb,
};
