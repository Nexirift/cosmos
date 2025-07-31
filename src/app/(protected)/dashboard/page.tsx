import { db } from "@/db";
import { auth } from "@/lib/auth";
import { oauthApplication, oauthConsent } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlagIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import moment from "moment";
import { oauthScopeMap } from "@/lib/common";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return <p>Oops! An error occured!</p>;

  const consentedApplications = await db.query.oauthConsent.findMany({
    where: and(
      eq(oauthConsent.userId, session.user.id),
      eq(oauthConsent.consentGiven, true),
    ),
  });

  return (
    <div className="flex flex-col p-6 gap-4">
      <h3 className="font-bold text-2xl">Authorized Applications</h3>
      {consentedApplications.length === 0 && (
        <p className="text-muted-foreground">
          You haven't authorized any applications yet.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {consentedApplications.map(
          async ({ clientId, scopes, createdAt, updatedAt }) => {
            if (!clientId) return null;

            const application = await db.query.oauthApplication.findFirst({
              where: eq(oauthApplication.id, clientId),
            });

            if (!application) return null;

            const { name, icon } = application;
            const scopeArray = scopes?.split(",") || [];

            return (
              <Dialog key={clientId}>
                <DialogTrigger asChild>
                  <Card className="flex flex-col max-w-[300px] max-h-[300px] hover:border-primary/20 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-xl cursor-pointer">
                    <CardHeader className="space-y-3 flex flex-col justify-center items-center">
                      <CardTitle className="flex flex-col items-center text-center">
                        {icon && (
                          <div className="mb-3 p-1 rounded-lg border bg-secondary/30 shadow-sm">
                            <Image
                              src={icon}
                              alt={`${name} icon`}
                              width={64}
                              height={64}
                              className="rounded-md hover:scale-105 transition-transform duration-200"
                              priority
                            />
                          </div>
                        )}
                        <h3 className="text-xl font-bold truncate max-w-full">
                          {name}
                        </h3>
                      </CardTitle>
                      <CardDescription className="text-center">
                        <span className="text-xs text-muted-foreground">
                          Click for details
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center mt-auto">
                      <p className="text-sm text-muted-foreground">
                        Authorized {moment(createdAt).fromNow()}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-center pb-4">
                      <span className="text-xs bg-secondary/50 px-3 py-1 rounded-full">
                        {scopeArray.length} permission
                        {scopeArray.length !== 1 ? "s" : ""} granted
                      </span>
                    </CardFooter>
                  </Card>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md [&>button:last-child]:hidden">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                      {icon && (
                        <Image
                          src={icon}
                          alt={`${name} icon`}
                          width={28}
                          height={28}
                          className="rounded-sm"
                        />
                      )}
                      <span>{name}</span>
                      <FlagIcon
                        width={16}
                        height={16}
                        className="cursor-pointer text-red-400 ml-auto hover:text-red-500 transition-colors"
                        title="Report application"
                      />
                    </DialogTitle>
                    <DialogDescription>
                      Application permissions and access details
                    </DialogDescription>
                  </DialogHeader>
                  <div className="text-muted-foreground space-y-5 py-3">
                    {scopes && scopeArray.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-foreground">
                          Permissions Granted
                        </h4>
                        <ul className="list-inside list-disc gap-2 flex flex-col bg-secondary/30 p-4 rounded-md">
                          {scopeArray.map((scope) => {
                            const mapped = oauthScopeMap[
                              scope as keyof typeof oauthScopeMap
                            ] ?? {
                              friendlyName:
                                scope.charAt(0).toUpperCase() + scope.slice(1),
                              description:
                                "We do not have any information about this scope.",
                            };
                            return (
                              <li
                                key={scope}
                                className="transition-colors duration-200 hover:text-primary text-sm"
                              >
                                <b>{mapped.friendlyName}:</b>{" "}
                                {mapped.description}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    <div className="space-y-2 bg-muted/50 p-4 rounded-md">
                      <h4 className="font-medium text-foreground">Timeline</h4>
                      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
                        <span className="font-medium">First authorized:</span>
                        <span>
                          {moment(createdAt).format("MMM D, YYYY h:mm A")}
                        </span>
                        <span className="font-medium">Last updated:</span>
                        <span>
                          {moment(updatedAt).format("MMM D, YYYY h:mm A")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="flex w-full justify-between gap-3 mt-3">
                    {/*<Button
                      variant="destructive"
                      type="button"
                      className="gap-2"
                    >
                      Revoke Access
                    </Button>*/}
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">
                        Close
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            );
          },
        )}
      </div>
    </div>
  );
}
