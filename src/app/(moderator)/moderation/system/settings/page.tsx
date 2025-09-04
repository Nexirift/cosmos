import { env } from "@/env";
import { BasicDetails, ClearCaches, RestartSetup } from "./_components";
import { getUserEffectivePermissions } from "@/lib/permissions";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function Page() {
  const disableSetup = !!env.DISABLE_SETUP;

  const permissions = await getUserEffectivePermissions();
  const hasBasicDetails = permissions.settings?.includes("basic-details");
  const hasMiscellaneous = permissions.settings?.includes("miscellaneous");
  const hasClearCaches = permissions.settings?.includes("clear-cache");
  const hasRestartSetup = permissions.settings?.includes("restart-setup");

  return (
    <main className="m-4 flex flex-col gap-4">
      {hasBasicDetails && (
        <section className="flex flex-col gap-2">
          <header>
            <h2 className="text-xl font-bold">Basic details</h2>
            <p className="text-muted-foreground">
              These are the basic details for your Cosmos instance.
            </p>
          </header>
          <BasicDetails />
        </section>
      )}
      {hasMiscellaneous && (
        <section className="flex flex-col gap-2">
          <header>
            <h2 className="text-xl font-bold">Miscellaneous</h2>
            <p className="text-muted-foreground">
              These are miscellaneous settings for your Cosmos instance.
            </p>
          </header>
          {hasClearCaches && <ClearCaches />}
          {hasRestartSetup && <RestartSetup disabled={disableSetup} />}
        </section>
      )}
    </main>
  );
}
