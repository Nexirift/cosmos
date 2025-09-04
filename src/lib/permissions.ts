import { headers } from "next/headers";
import { auth } from "./auth";
import { log, Logger } from "./logger";
import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements as adminStatements,
  adminAc as adminAdminAc,
} from "better-auth/plugins/admin/access";
import {
  defaultStatements as organizationStatements,
  adminAc as organizationAdminAc,
} from "better-auth/plugins/organization/access";
import { db } from "@/db";
import { redis } from "./redis";
import {
  key,
  CacheDomains,
  scanKeys,
  mgetJSON,
  acquireLock,
  releaseLock,
} from "./cache";

/**
 * --------------------------------------------------------------------------------
 *  PERMISSIONS / ACCESS CONTROL
 * --------------------------------------------------------------------------------
 *  Responsibilities of this module:
 *   1. Define base permission statements & static roles
 *   2. Dynamically load additional roles from Redis cache & DB
 *   3. Expose helpers to query permissions
 *
 *  Design Goals:
 *   - Avoid duplicate role registrations
 *   - Safe parsing & validation of role statements
 *   - Non-blocking initialization (background warmup)
 *   - Minimal surface area; stable exports
 *
 *  Public Exports:
 *   - permissions (base statements)
 *   - ac (access control instance)
 *   - roles (record of instantiated roles)
 *   - admin (static admin role)
 *   - generateRolesFromDb()
 *   - checkPermissions()
 *   - ensureRolesInitialized()
 *   - registerDynamicRole()
 *   - hasRole(), getRole()
 * --------------------------------------------------------------------------------
 */

/* --------------------------------- Constants --------------------------------- */

const ROLE_CACHE_PREFIX = "cosmos_role";

/**
 * Merge of default plugin-provided statements
 */
const defaultStatements = {
  ...adminStatements,
  ...organizationStatements,
} as const;

/**
 * Extend baseline permissions with project custom domains
 */
export const permissions = {
  ...defaultStatements,
  moderation: ["view"],
  settings: [
    "view",
    "basic-details",
    "miscellaneous",
    "clear-cache",
    "restart-setup",
  ],
} as const;

/* ----------------------- Access Control / Static Roles ----------------------- */
// Use var to avoid TDZ issues in circular import scenarios.
export var ac = createAccessControl(permissions);

/**
 * Static admin role includes:
 *  - Baseline moderation/view
 *  - All admin plugin statements
 *  - All org admin plugin statements
 */
export const admin = ac.newRole({
  moderation: ["view"],
  settings: ["basic-details", "miscellaneous", "clear-cache", "restart-setup"],
  ...adminAdminAc.statements,
  ...organizationAdminAc.statements,
});

/**
 * Central registry of all roles.
 * Key: role identifier (DB id, slug, or reserved name like "admin")
 */
export var roles: Record<string, ReturnType<typeof ac.newRole>> = Object.create(
  null,
);
roles.admin = admin; // Ensure always present

/**
 * Registry preserving the original (normalized) statements for each role.
 * This allows accurate aggregation & inspection beyond the instantiated
 * access-control role objects.
 */
const roleStatementsRegistry: Record<string, RoleStatements> = {
  admin: {
    moderation: ["view"],
    ...adminAdminAc.statements,
    ...organizationAdminAc.statements,
  },
};

/* ------------------------------- Type Helpers -------------------------------- */

export type RoleStatements = Record<string, string[]>;
type UnknownRecord = Record<string, unknown>;
type Serializable = Record<string, unknown> | unknown[];

/* ------------------------------ Parse Utilities ------------------------------ */

/**
 * Safe JSON parse with null fallback (never throws)
 */
function safeParseJSON(value: unknown): unknown | null {
  if (typeof value !== "string") return value ?? null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Determine if a value is a string array
 */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((x) => typeof x === "string");
}

/**
 * Validate a dynamic structure into role statements.
 * Filters only object properties where the value is string[]
 */
function normalizeRoleStatements(input: unknown): RoleStatements | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;

  const out: RoleStatements = {};
  for (const [k, v] of Object.entries(input as UnknownRecord)) {
    if (isStringArray(v) && v.length > 0) {
      out[k] = v;
    }
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Extract role ID from a Redis key of form "cosmos_role:<id>"
 */
function extractRoleIdFromKey(key: string): string | null {
  if (!key.startsWith(`${ROLE_CACHE_PREFIX}:`)) return null;
  return key.split(":", 2)[1] || null;
}

/* ------------------------------ Role Registration ---------------------------- */

/**
 * Registers a role if not already present.
 * Returns true if newly registered, false if skipped.
 */
export function registerDynamicRole(
  roleId: string,
  statements: RoleStatements,
): boolean {
  if (!roleId || roles[roleId]) return false;
  roles[roleId] = ac.newRole({ ...(statements as any) });
  // Store a shallow copy of original statements for later aggregation
  roleStatementsRegistry[roleId] = { ...statements };
  return true;
}

/**
 * Get a role instance
 */
export function getRole(roleId: string) {
  return roles[roleId] || null;
}

/**
 * Check if a role exists
 */
export function hasRole(roleId: string) {
  return !!roles[roleId];
}

/* ------------------------------ Redis Role Load ------------------------------ */

/**
 * Load dynamic roles from Redis cache keys.
 * Non-throwing; logs errors & continues.
 */
async function loadRolesFromCache(): Promise<number> {
  if (!redis) return 0;
  let loaded = 0;
  try {
    const keys = await scanKeys(`${ROLE_CACHE_PREFIX}:*`);
    if (!keys.length) return 0;

    // Filter out version / meta keys
    const roleKeys = keys.filter((k) => !k.endsWith(":__version__"));

    if (!roleKeys.length) return 0;

    // Batched fetch (string values)
    const client = redis;
    if (!client) return 0;
    const rawValues = await client.mget(roleKeys);

    for (let i = 0; i < roleKeys.length; i++) {
      const raw = rawValues[i];
      if (!raw) continue;
      const parsed = safeParseJSON(raw);
      const normalized = normalizeRoleStatements(parsed);
      if (!normalized) continue;

      // role id is last segment after prefix
      const roleId = roleKeys[i]!.substring(roleKeys[i]!.lastIndexOf(":") + 1);
      if (!roleId || roles[roleId]) continue;

      if (registerDynamicRole(roleId, normalized)) {
        loaded++;
        log(
          `Loaded role '${roleId}' from cache (batched)`,
          Logger.MODERATION_ROLE,
        );
      }
    }
  } catch (err) {
    log(`Failed batched role cache load: ${err}`, Logger.MODERATION_ROLE);
  }
  return loaded;
}

/**
 * Increment a monotonic version key to signal role set changes.
 */
async function bumpRoleVersion() {
  if (!redis) return;
  try {
    await redis.incr(`${ROLE_CACHE_PREFIX}:__version__`);
  } catch {
    /* ignore */
  }
}

/* ------------------------------- DB Role Loader ------------------------------ */

/**
 * Load roles from DB (missing ones only) and optionally backfill cache.
 * Returns number of roles created.
 */
export async function generateRolesFromDb(): Promise<number> {
  let created = 0;
  try {
    const dbRoles = await db.query.cosmosRole.findMany();
    if (!dbRoles?.length) return 0;

    for (const dbRole of dbRoles) {
      if (!dbRole.id) continue;
      if (roles[dbRole.id]) continue; // Already present from cache or earlier

      const parsed = safeParseJSON(dbRole.statements);
      const normalized = normalizeRoleStatements(parsed);
      if (!normalized) continue;

      if (registerDynamicRole(dbRole.id, normalized)) {
        created++;
        log(
          `Registered role '${dbRole.name || dbRole.id}' from DB`,
          Logger.MODERATION_ROLE,
        );

        // Backfill cache (best-effort)
        if (redis) {
          const cacheKey = `${ROLE_CACHE_PREFIX}:${dbRole.id}`;
          redis
            .set(cacheKey, JSON.stringify(normalized))
            .catch((e) =>
              log(
                `Failed caching role '${dbRole.id}': ${e}`,
                Logger.MODERATION_ROLE,
              ),
            );
        }
      }
    }
  } catch (err) {
    log(`Failed generating roles from DB: ${err}`, Logger.MODERATION_ROLE);
  }
  return created;
}

/* --------------------------- Initialization Orchestration -------------------- */

/**
 * Internal state to avoid duplicate initializations under concurrency.
 */
let rolesInitPromise: Promise<void> | null = null;
let rolesInitialized = false;

/**
 * Ensure roles are initialized once (cache + DB).
 * Safe to call multiple times concurrently.
 */
export function ensureRolesInitialized(): Promise<void> {
  if (rolesInitialized) return Promise.resolve();
  if (rolesInitPromise) return rolesInitPromise;

  rolesInitPromise = (async () => {
    const cacheCount = await loadRolesFromCache();
    const dbCount = await generateRolesFromDb();

    rolesInitialized = true;
    log(
      `Roles initialization complete (cache: ${cacheCount}, db new: ${dbCount})`,
      Logger.MODERATION_ROLE,
    );
  })().finally(() => {
    // Keep rolesInitialized flag; discard the promise reference
    rolesInitPromise = null;
  });

  return rolesInitPromise;
}

// Kick off background initialization (non-blocking)
void ensureRolesInitialized();

/* ----------------------------- Permission Checking --------------------------- */

export interface PermissionRequest {
  [domain: string]: string[];
}

/**
 * High-level permission check for the current (or supplied) user.
 * Returns boolean success indicator.
 */
export async function checkPermissions(
  requested: PermissionRequest,
  userId?: string,
): Promise<boolean> {
  if (
    !requested ||
    typeof requested !== "object" ||
    Array.isArray(requested) ||
    Object.keys(requested).length === 0
  ) {
    return false;
  }

  try {
    let resolvedUserId = userId;
    if (!resolvedUserId) {
      const session = await auth.api.getSession({ headers: await headers() });
      resolvedUserId = session?.user?.id;
      if (!resolvedUserId) return false;
    }

    const result = await auth.api.userHasPermission({
      body: { permissions: requested, userId: resolvedUserId as string },
    });

    return !!result?.success;
  } catch (error) {
    log(`Permission check failed: ${error}`, Logger.MODERATION_PROTECT);
    return false;
  }
}

/**
 * Aggregate helper: combine multiple RoleStatements maps into a single
 * domain -> unique actions[] structure.
 */
function aggregateRoleStatements(roleIds: string[]): RoleStatements {
  const aggregate: Record<string, Set<string>> = {};
  for (const rid of roleIds) {
    const stmt = roleStatementsRegistry[rid];
    if (!stmt) continue;
    for (const [domain, actions] of Object.entries(stmt)) {
      if (!aggregate[domain]) aggregate[domain] = new Set<string>();
      for (const act of actions) aggregate[domain].add(act);
    }
  }
  // Convert sets back to arrays (sorted for stable output)
  const out: RoleStatements = {};
  for (const [domain, set] of Object.entries(aggregate)) {
    out[domain] = Array.from(set).sort();
  }
  return out;
}

/**
 * Get the effective permissions (merged domain/action statements) for a user.
 *
 * NOTE: At present we do not have direct user->role mappings surfaced here.
 * Until that is integrated (e.g. via an auth API call returning role IDs),
 * we conservatively aggregate ALL currently registered roles. This yields a
 * superset of permissions which is still useful for diagnostics / UI preview.
 *
 * Future Extension:
 *  - Replace the role selection logic with an auth API lookup
 *    (e.g. auth.api.getUserRoles or similar) once available.
 */
export async function getUserEffectivePermissions(
  userId?: string,
): Promise<RoleStatements> {
  try {
    await ensureRolesInitialized();
    let resolvedUserId = userId;
    let sessionUser: any | undefined;
    if (!resolvedUserId) {
      const session = await auth.api.getSession({ headers: await headers() });
      sessionUser = session?.user;
      resolvedUserId = sessionUser?.id;
    } else {
      // attempt to fetch session anyway (may contain roles metadata)
      const session = await auth.api.getSession({ headers: await headers() });
      sessionUser = session?.user;
    }
    if (typeof resolvedUserId !== "string" || resolvedUserId.length === 0) {
      return {};
    }
    const finalUserId = resolvedUserId as string; // assured non-empty string after guard
    /**
     * Heuristic extraction of role IDs from the session user object.
     * We don't have a guaranteed shape from better-auth for custom roles, so we try
     * several conventional property names. This can be replaced later with a
     * dedicated API call when available (e.g. auth.api.getUserRoles).
     */
    const extractRoleIdsFromUser = (u: any): string[] => {
      if (!u || typeof u !== "object") return [];
      const candidates: (string[] | undefined)[] = [
        u.roles,
        u.roleIds,
        u.assignedRoles,
        u.cosmosRoles,
      ];
      for (const arr of candidates) {
        if (Array.isArray(arr) && arr.every((x) => typeof x === "string")) {
          return Array.from(new Set(arr));
        }
      }
      return [];
    };
    // Attempt direct extraction first
    const directRoleIds = extractRoleIdsFromUser(sessionUser);
    let roleIds: string[] = directRoleIds;
    // Fallback strategy: if no explicit role list, attempt to infer by checking if user has ANY action in each role's statements.
    if (!roleIds.length) {
      const collected: string[] = [];
      for (const [rid, stmts] of Object.entries(roleStatementsRegistry)) {
        // Build a minimal permission probe: pick first action of each domain
        const probe: Record<string, string[]> = {};
        for (const [domain, acts] of Object.entries(stmts)) {
          if (acts.length) {
            // only need one action to test membership heuristic
            probe[domain] = [acts[0]!];
          }
        }
        try {
          const has = await auth.api.userHasPermission({
            body: { permissions: probe, userId: finalUserId as string },
          });
          if (has?.success) collected.push(rid);
        } catch {
          // ignore probe failures
        }
      }
      roleIds = collected.length ? collected : []; // final fallback: all roles
    }
    return aggregateRoleStatements(roleIds);
  } catch (error) {
    log(
      `Failed to compute effective permissions: ${error}`,
      Logger.MODERATION_ROLE,
    );
    return {};
  }
}

/**
 * Refresh roles dynamically.
 *
 * Options:
 *  - clearDynamic: remove all non-static (non-"admin") roles before reload
 *  - bustCache: delete cached role entries in Redis before reloading
 *  - reloadCache: (default true) load roles from Redis
 *  - reloadDb: (default true) load roles from DB (only missing ones)
 *  - reinitialize: force internal flags to re-run initialization path
 *
 * Returns summary stats.
 */
export async function refreshRoles(opts?: {
  clearDynamic?: boolean;
  bustCache?: boolean;
  reloadCache?: boolean;
  reloadDb?: boolean;
  reinitialize?: boolean;
}): Promise<{
  removed: number;
  cacheLoaded: number;
  dbLoaded: number;
  total: number;
}> {
  const {
    clearDynamic = false,
    bustCache = false,
    reloadCache = true,
    reloadDb = true,
    reinitialize = false,
  } = opts ?? {};

  // Distributed lock to avoid cross-instance stampede
  const lock = await acquireLock("roles-refresh", 8000);
  if (!lock) {
    log(
      "Proceeding without roles-refresh lock (could not acquire)",
      Logger.MODERATION_ROLE,
    );
  }

  let removedCount = 0;

  try {
    // Optionally remove existing dynamic roles
    if (clearDynamic) {
      for (const key of Object.keys(roles)) {
        if (key !== "admin") {
          delete roles[key];
          removedCount++;
        }
      }
      if (removedCount) {
        log(`Removed ${removedCount} dynamic role(s)`, Logger.MODERATION_ROLE);
      }
    }

    // Optionally reset initialization state
    if (reinitialize) {
      rolesInitialized = false;
      rolesInitPromise = null;
    }

    // Optional cache bust
    if (bustCache && redis) {
      try {
        const keys = await scanKeys(`${ROLE_CACHE_PREFIX}:*`);
        if (keys.length) {
          const pipeline = redis.pipeline();
          for (const k of keys) pipeline.del(k);
          await pipeline.exec();
          log(
            `Busted ${keys.length} cached role key(s)`,
            Logger.MODERATION_ROLE,
          );
        }
      } catch (e) {
        log(`Failed busting role cache: ${e}`, Logger.MODERATION_ROLE);
      }
    }

    let cacheLoaded = 0;
    let dbLoaded = 0;

    if (reloadCache) {
      cacheLoaded = await loadRolesFromCache();
    }
    if (reloadDb) {
      dbLoaded = await generateRolesFromDb();
    }

    rolesInitialized = true;

    // Bump version (best-effort)
    void bumpRoleVersion();

    const total = Object.keys(roles).length;

    log(
      `Roles refreshed (removed=${removedCount}, cacheLoaded=${cacheLoaded}, dbLoaded=${dbLoaded}, total=${total})`,
      Logger.MODERATION_ROLE,
    );

    return {
      removed: removedCount,
      cacheLoaded,
      dbLoaded,
      total,
    };
  } finally {
    await releaseLock(lock);
  }
}
