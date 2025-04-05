import { env } from "@/env";
import { BasicDetails, ClearCache, RestartSetup } from "./_components";
import { protect } from "../../protect";

export default async function Page() {
  await protect();

  return (
    <main className="m-4 flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <div>
          <h2 className="text-xl font-bold">Basic details</h2>
          <p className="text-muted-foreground">
            These are the basic details for your Cosmos instance.
          </p>
        </div>
        <BasicDetails />
      </section>
      <section className="flex flex-row gap-2">
        <ClearCache />
        <RestartSetup disabled={env.DISABLE_SETUP ?? false} />
      </section>
    </main>
  );
}
