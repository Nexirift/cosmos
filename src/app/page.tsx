"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { handleError } from "@/lib/common";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Page() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen w-screen items-center justify-center gap-4">
      <Image
        src="/assets/images/banner.png"
        alt="Cosmos"
        width={300}
        height={95.15}
        className="transition-transform hover:scale-110 duration-700"
      />
      {session?.user ? (
        <div className="flex flex-col items-center gap-2">
          <span className="text-muted-foreground">
            Logged in as {session.user.email}
          </span>
        </div>
      ) : isPending ? (
        <div className="flex flex-col items-center gap-2">
          <span className="text-muted-foreground">Loading...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <span className="text-muted-foreground">Not logged in</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const userData = {
                email: "another325353454@nexirift.com",
                password: "P@ssw0rd",
                username: "Another267534442",
                name: "Another User",
                birthday: "2007-11-21",
                invite: "nexirift-m37sh-xxaew",
              };

              const { data, error } = await authClient.signUp.email(userData);

              if (error && !data) {
                throw new Error(error.message);
              }

              toast("New user created!");
            } catch (error) {
              if (error instanceof Error) {
                handleError(error);
              } else {
                handleError(new Error("An unexpected error occurred"));
              }
            }
            if (session?.user) {
              try {
                const { data, error } = await authClient.invitation.revoke({
                  invitationId: "FUSf7q02MybKrRdZGHk3eqeTh7W4osuN",
                });
                if (error) {
                  throw new Error(error.message);
                }

                console.log(data);
                toast("Invitation created successfully!");
              } catch (error) {
                handleError(
                  error instanceof Error
                    ? error
                    : new Error("Failed to create invitation"),
                );
              }
            } else {
              toast("You must be logged in to create an invitation");
            }
          }}
        >
          Create Test User
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            router.push("/sign-in");
            /* const { data: subscriptions } =
              await authClient.subscription.cancel({
                returnUrl: "/dashboard",
              });
            console.log(subscriptions); */
            /* const { error: error1 } = await authClient.subscription.upgrade({
              plan: "nebula-individual",
              successUrl: "/dashboard",
              cancelUrl: "/",
            });

            if (error1) {
              alert(error1.message);
              } */
          }}
        >
          Trigger Login Flow
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const { data, error } = await authClient.signOut();

              if (error) {
                throw new Error(error.message);
              }

              if (data?.success) {
                toast("New user created!");
              } else {
                throw new Error("An error occurred while logging out");
              }
            } catch (error) {
              if (error instanceof Error) {
                handleError(error);
              } else {
                handleError(new Error("An unexpected error occurred"));
              }
            }
          }}
        >
          Force Logout Event
        </Button>
      </div>
    </div>
  );
}
