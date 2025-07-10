import { checkCache } from "@/lib/actions";
import { SettingKey } from "@/lib/defaults";
import { redirect } from "next/navigation";
import { IndexPage } from "./_component";

export default async function Page() {
  const redirectIndexToDashboard = await checkCache(
    SettingKey.redirectIndexToDashboard,
  );

  // Handle redirect first to avoid unnecessary renders
  if (redirectIndexToDashboard) {
    redirect("/dashboard");
  }

  return <IndexPage />;
}
