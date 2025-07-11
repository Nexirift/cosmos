import { auth } from "@/lib/auth";
import { log, Logger } from "@/lib/logger";
import { headers } from "next/headers";

// this ensures that even if the middleware or layout is not rendered, our content can still be protected
export async function protect(roleToCheck?: string | null) {
  try {
    const defaultRole = "user";
    const role =
      roleToCheck ||
      (await auth.api.getSession({ headers: await headers() }))?.user?.role ||
      defaultRole;

    return role.includes("admin");
  } catch (error) {
    log(`An error occured:\n${error}`, Logger.MODERATION_PROTECT);
    return false;
  }
}
