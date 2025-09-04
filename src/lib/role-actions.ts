"use server";

/**
 * Server actions for role management / refresh.
 *
 * Provides a secure way to trigger dynamic role reloads after changes
 * (e.g. when role statements are updated in the database or cache).
 *
 * Security Model:
 *  - Requires the caller to possess the permission: moderation:view
 *  - Escalated options (bustCache, clearDynamic, reinitialize) are only honored
 *    if the caller has the same required permission (you can extend this later
 *    to differentiate between standard and elevated capabilities).
 *
 * NOTE:
 *  If you later introduce a stronger admin-only permission or role domain,
 *  adjust REQUIRED_PERMISSION accordingly or add an additional check.
 */

import { headers } from "next/headers";
import { auth } from "./auth";
import { log, Logger } from "./logger";
import {
  refreshRoles,
  ensureRolesInitialized,
  checkPermissions,
} from "./permissions";

/**
 * Options accepted by the refreshRolesAction server action.
 * Mirrors (and passes through to) the underlying refreshRoles utility.
 */
export interface RoleRefreshOptions {
  clearDynamic?: boolean;
  bustCache?: boolean;
  reloadCache?: boolean;
  reloadDb?: boolean;
  reinitialize?: boolean;
}

/**
 * Result payload returned from refreshRolesAction.
 */
export interface RoleRefreshActionResult {
  success: boolean;
  message: string;
  result?: {
    removed: number;
    cacheLoaded: number;
    dbLoaded: number;
    total: number;
  };
  sanitizedOptions?: RoleRefreshOptions;
}

/**
 * Required permission domain/action combination to invoke the action.
 * Adjust this constant if you introduce a distinct admin requirement.
 */
const REQUIRED_PERMISSION: Record<string, string[]> = {
  moderation: ["view"],
};

/**
 * Ensures the caller is authenticated and has the required permission(s).
 * Returns the userId if authorized; otherwise null.
 */
async function authorizeCaller(): Promise<string | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;
    if (!userId) return null;

    const has = await checkPermissions(REQUIRED_PERMISSION, userId);
    return has ? userId : null;
  } catch (err) {
    log(`Authorization error: ${err}`, Logger.MODERATION_PROTECT);
    return null;
  }
}

/**
 * Refresh dynamic roles. Intended to be invoked from admin tooling or
 * protected dashboards.
 *
 * Behavior:
 *  - Sanitizes escalation flags if caller lacks permission (currently the same
 *    permission gate; extend if you differentiate).
 *  - Optionally reinitializes role system state.
 *
 * @param options RoleRefreshOptions
 * @returns RoleRefreshActionResult
 */
export async function refreshRolesAction(
  options: RoleRefreshOptions = {},
): Promise<RoleRefreshActionResult> {
  const userId = await authorizeCaller();
  if (!userId) {
    return {
      success: false,
      message: "Unauthorized",
    };
  }

  // Clone & sanitize options (future: differentiate escalation permission)
  const sanitized: RoleRefreshOptions = { ...options };

  // Example future hook:
  // if (!hasElevated) { sanitized.bustCache = false; sanitized.clearDynamic = false; }

  try {
    // Ensure baseline initialization (in case action races early)
    await ensureRolesInitialized();

    const result = await refreshRoles({
      clearDynamic: sanitized.clearDynamic,
      bustCache: sanitized.bustCache,
      reloadCache: sanitized.reloadCache ?? true,
      reloadDb: sanitized.reloadDb ?? true,
      reinitialize: sanitized.reinitialize,
    });

    return {
      success: true,
      message: "Roles refreshed successfully",
      result,
      sanitizedOptions: sanitized,
    };
  } catch (error) {
    log(`Failed to refresh roles: ${error}`, Logger.MODERATION_ROLE);
    return {
      success: false,
      message: "Failed to refresh roles",
      sanitizedOptions: sanitized,
    };
  }
}

/**
 * Convenience action to force a full hard refresh equivalent to:
 *  clearDynamic + bustCache + reloadDb (no cache reload first).
 */
export async function forceFullRoleRebuildAction(): Promise<RoleRefreshActionResult> {
  return refreshRolesAction({
    clearDynamic: true,
    bustCache: true,
    reloadCache: false,
    reloadDb: true,
    reinitialize: true,
  });
}
