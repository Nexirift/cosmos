"use server";

import { connect, cosmosSetting, db } from "@nexirift/db";
import { redis } from "./redis";
import { env } from "@/env";
import { SettingKey } from "./defaults";

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

async function checkCache(key: string | SettingKey): Promise<string | null> {
  if (!key) {
    console.warn("[Cache Warning] Attempted to check cache with empty key");
    return null;
  }

  const cacheKey = `${SETTING_KEY}:${key}`;

  try {
    // Check cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Fall back to DB if not in cache
    const dbData = await checkDb(key);
    if (dbData?.value) {
      await redis.set(cacheKey, dbData.value, "EX", CACHE_TTL);
      return dbData.value;
    }

    return null;
  } catch (error) {
    console.error(`[Cache Error] Failed to check key ${key}:`, error);
    return null;
  }
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
  Record<keyof typeof SettingKey, string | boolean | number>
> {
  const settings: Record<keyof typeof SettingKey, string | boolean | number> =
    {} as Record<keyof typeof SettingKey, string | boolean | number>;
  const settingPromises = Object.values(SettingKey).map(async (key) => {
    const value = await checkCache(key);
    if (value) {
      const enumKey = Object.keys(SettingKey).find(
        (k) => SettingKey[k as keyof typeof SettingKey] === key,
      );
      if (enumKey) {
        if (value.toLowerCase() === "true") {
          settings[enumKey as keyof typeof SettingKey] = true;
        } else if (value.toLowerCase() === "false") {
          settings[enumKey as keyof typeof SettingKey] = false;
        } else if (!isNaN(Number(value))) {
          settings[enumKey as keyof typeof SettingKey] = Number(value);
        } else {
          settings[enumKey as keyof typeof SettingKey] = value;
        }
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
