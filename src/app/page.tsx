import { checkCache, checkDb } from "@/lib/actions";
import { SETTING_KEY, SettingKey } from "@/lib/defaults";
import { redirect } from "next/navigation";
import { IndexPage } from "./_component";
import { redis } from "@/lib/redis";

export default async function Page() {
  // For some reason, checkCache freezes the page, so we check it directly instead
  // TODO: Possibly fix this?
  const redirectIndexToDashboard = await redis
    .get(SETTING_KEY + ":" + SettingKey.redirectIndexToDashboard)
    .then((result) => result)
    .catch((error) => {
      console.error("Cache check failed, defaulting to redirect:", error);
      return true;
    });

  // Handle redirect first to avoid unnecessary renders
  if (redirectIndexToDashboard) {
    redirect("/dashboard");
  }

  return <IndexPage />;
}
