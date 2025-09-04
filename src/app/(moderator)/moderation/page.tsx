import { ModerationAlert } from "@/components/moderation-alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSetupComplete } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { CheckIcon, TriangleAlertIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { UserAlerts } from "./user-alerts";
import { log } from "@/lib/logger";
import { env } from "@/env";
import { ProtectedPage } from "@/components/protected-page";

export function getGreeting() {
  const hours = new Date().getHours();
  if (hours < 12) return "Good Morning";
  if (hours <= 17) return "Good Afternoon";
  return "Good Evening";
}

export default async function Page() {
  const data = await auth.api.getSession({
    headers: await headers(),
  });

  if (env.NODE_ENV === "development")
    console.log("The currently logged in user's data:", data);

  const KEY = `cosmos_moderation_alert:${data?.session.id}`;
  const alertCount = parseInt((await redis.get(KEY)) || "0");
  const setupCompleted = await isSetupComplete();
  await redis.del(KEY);

  const updateAction = async () => {
    "use server";
    try {
      const current = Number(await redis.get(KEY)) ?? 0;
      await redis.set(KEY, current + 1);
    } catch (error) {
      log(
        `An error occured while trying to update the alert count:\n${error}`,
        "moderation:dashboard",
      );
    }
  };

  if (!setupCompleted) {
    updateAction();
  }

  const commonAlertClasses =
    "flex flex-row gap-4 justify-start text-left items-center max-w-sm";

  return (
    <ProtectedPage
      permissions={{
        moderation: ["view"],
      }}
    >
      <main className="m-4 flex flex-col gap-4">
        <section className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">
            {`${getGreeting()}, ${data?.user.name}!`}
          </h2>
          <p>Welcome to the moderation dashboard.</p>
        </section>
        {alertCount ? (
          <ModerationAlert preset="orange" className={commonAlertClasses}>
            <TriangleAlertIcon width={32} height={32} />
            <div>
              <h3 className="font-bold">System Status</h3>
              <p>{alertCount} or more issues found, check alerts.</p>
            </div>
          </ModerationAlert>
        ) : (
          <ModerationAlert preset="green" className={commonAlertClasses}>
            <CheckIcon width={32} height={32} />
            <div>
              <h3 className="font-bold">System Status</h3>
              <p>All systems operational.</p>
            </div>
          </ModerationAlert>
        )}
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
            <CardDescription>
              This is where important alerts will be displayed.
            </CardDescription>
          </CardHeader>
          <hr className="border-b-1 border-muted ml-4 mr-4" />
          <CardContent className="overflow-scroll max-h-[30rem] h-[30rem] mb-6 flex flex-col gap-4">
            {alertCount > 0 ? (
              <>
                {!setupCompleted && (
                  <ModerationAlert preset="orange">
                    <p className="font-medium">
                      <span className="font-bold">SECURITY ALERT:</span> The{" "}
                      <Link
                        href="/setup"
                        className="underline hover:text-orange-800"
                      >
                        setup wizard
                      </Link>{" "}
                      is currently accessible to all users. For security
                      reasons, please either:
                    </p>
                    <ul className="mt-2 list-disc list-inside">
                      <li>
                        Configure your Cosmos instance using the{" "}
                        <Link
                          href="/setup"
                          className="underline hover:text-orange-800"
                        >
                          setup wizard
                        </Link>
                      </li>
                      <li>
                        Visit the{" "}
                        <Link
                          href="/setup/thank-you"
                          className="underline hover:text-orange-800"
                        >
                          completion page
                        </Link>{" "}
                        to disable access
                      </li>
                      <li>
                        Set{" "}
                        <code className="bg-orange-200 dark:bg-orange-400 px-1 rounded-lg">
                          DISABLE_SETUP=true
                        </code>{" "}
                        in your environment variables
                      </li>
                    </ul>
                  </ModerationAlert>
                )}
                <UserAlerts updateAction={updateAction} />
              </>
            ) : (
              <>
                <p className="text-center text-muted-foreground">
                  No alerts found. Refresh your page to check again.
                </p>
                <UserAlerts updateAction={updateAction} show={false} />
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </ProtectedPage>
  );
}
