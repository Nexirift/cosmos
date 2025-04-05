import { auth } from "@/lib/auth";
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
    console.error("Error checking protection:", error);
    return false;
  }
}
