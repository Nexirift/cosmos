import { checkCache } from "@/lib/actions";
import { SettingKey } from "@/lib/defaults";
import { redirect } from "next/navigation";
import { IndexPage } from "./_component";

/**
 * Safely read the redirect flag using checkCache with a timeout fallback.
 * Falls back to "true" (redirect) if:
 *  - checkCache hangs longer than the timeout
 *  - an error occurs
 *  - the value is an unexpected type
 */
async function safeGetRedirectFlag(timeoutMs = 500): Promise<boolean> {
  try {
    const result = await Promise.race([
      checkCache(SettingKey.redirectIndexToDashboard),
      new Promise<"__timeout__">((resolve) =>
        setTimeout(() => resolve("__timeout__"), timeoutMs),
      ),
    ]);

    if (result === "__timeout__") {
      console.warn(
        `[index] checkCache timed out after ${timeoutMs}ms; defaulting to redirect`,
      );
      return true;
    }

    if (typeof result === "boolean") return result;
    if (typeof result === "string") {
      // Empty string = missing (our checkCache sentinel) -> treat as false (no redirect)
      if (result.trim() === "") return false;
      if (["true", "1", "yes"].includes(result.toLowerCase())) return true;
      if (["false", "0", "no"].includes(result.toLowerCase())) return false;
    }
    if (typeof result === "number") {
      return result !== 0;
    }

    // Unexpected type -> be conservative and redirect
    return true;
  } catch (error) {
    console.error(
      "[index] Failed to resolve redirectIndexToDashboard; defaulting to redirect:",
      error,
    );
    return true;
  }
}

export default async function Page() {
  const redirectIndexToDashboard = await safeGetRedirectFlag();

  if (redirectIndexToDashboard) {
    redirect("/dashboard");
  }

  return <IndexPage />;
}
