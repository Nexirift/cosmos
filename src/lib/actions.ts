"use server";

import { connect, cosmosSetting, db } from "@nexirift/db";
import { redis } from "./redis";
import { env } from "@/env";
import { DEFAULTS, SettingKey } from "./defaults";

const SETTING_KEY = "cosmos_setting";
const CACHE_TTL = 3600;

type DbResult = { key: string; value: string } | null | undefined;
type SettingValue = string | number | boolean;

async function checkDb(key: string): Promise<DbResult> {
  if (!key) {
    return null;
  }

  try {
    await connect();
    return await db.query.cosmosSetting.findFirst({
      where: (setting, { eq }) => eq(setting.key, key),
    });
  } catch (error) {
    console.error(`[DB Error] Failed to fetch key ${key}:`, error);
    return null;
  }
}

async function setDb(key: string, value: SettingValue): Promise<void> {
  if (!key) return;

  try {
    await connect();
    const stringValue = String(value);
    await db
      .insert(cosmosSetting)
      .values({ key, value: stringValue })
      .onConflictDoUpdate({
        target: cosmosSetting.key,
        set: { value: stringValue },
      });

    // Invalidate cache after DB update
    await redis.del(`${SETTING_KEY}:${key}`);
  } catch (error) {
    console.error(`[DB Error] Failed to set key ${key}:`, error);
  }
}

async function checkCache(
  key: string | SettingKey,
): Promise<string | boolean | number | string[] | number[]> {
  if (!key) {
    console.warn("[Cache Warning] Attempted to check cache with empty key");
    return "";
  }

  const cacheKey = `${SETTING_KEY}:${key}`;

  try {
    // Try cache first
    const cachedResult = await redis.get(cacheKey);
    if (cachedResult) {
      return parseValue(cachedResult);
    }

    // Try database next
    const dbResult = await checkDb(key);
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
      //await redis.set(cacheKey, String(defaultValue), "EX", CACHE_TTL);
      return defaultValue;
    }

    return "";
  } catch (error) {
    console.error(`[Cache Error] Failed to check key ${key}:`, error);
    return "";
  }
}

function parseValue(
  value: string,
): string | boolean | number | string[] | number[] {
  // Handle booleans
  const lowerValue = value.toLowerCase();
  if (lowerValue === "true") return true;
  if (lowerValue === "false") return false;

  // Handle numbers
  if (!isNaN(Number(value))) {
    const num = Number(value);
    if (Number.isInteger(num)) return parseInt(value);
    return num;
  }

  // Handle arrays and objects
  try {
    if (value.startsWith("[") || value.startsWith("{")) {
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

async function clearCache(): Promise<number> {
  try {
    const keys = await redis.keys(`${SETTING_KEY}:*`);
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`[Cache] Successfully cleared ${keys.length} keys`);
      return keys.length;
    }
    return 0;
  } catch (error) {
    console.error("[Cache Error] Failed to clear cache:", error);
    return -1;
  }
}

async function isSetupComplete(): Promise<boolean> {
  return (
    env.DISABLE_SETUP ?? (await checkDb("setup_completed"))?.value === "true"
  );
}

async function getAllSettings(): Promise<
  Record<
    keyof typeof SettingKey,
    string | boolean | number | string[] | number[]
  >
> {
  const settings: Record<
    keyof typeof SettingKey,
    string | boolean | number | string[] | number[]
  > = {} as Record<
    keyof typeof SettingKey,
    string | boolean | number | string[] | number[]
  >;
  const settingPromises = Object.values(SettingKey).map(async (key) => {
    const value = await checkCache(key);
    if (value) {
      const enumKey = Object.keys(SettingKey).find(
        (k) => SettingKey[k as keyof typeof SettingKey] === key,
      );
      if (enumKey) {
        settings[enumKey as keyof typeof SettingKey] = value;
      }
    }
  });

  await Promise.all(settingPromises);
  return settings;
}

export {
  checkDb,
  setDb,
  checkCache,
  clearCache,
  isSetupComplete,
  getAllSettings,
};
