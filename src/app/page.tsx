"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { authClient } from "@/lib/auth-client";
import { handleError } from "@/lib/common";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Page() {
  const { data: session, isPending } = authClient.useSession();
  const { toast } = useToast();
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
                email: "developer@nexirift.com",
                password: "P@ssw0rd",
                username: "Developer",
                name: "Developer",
              };

              const { data, error } = await authClient.signUp.email(userData);

              if (error) {
                throw new Error(error.message);
              }

              toast({
                title: "New user created!",
                description: `${userData.username} | ${data?.user.email} | ${userData.password}`,
                variant: "success",
                duration: 3000,
              });
            } catch (error) {
              if (error instanceof Error) {
                handleError(error);
              } else {
                handleError(new Error("An unexpected error occurred"));
              }
            }
          }}
        >
          Create Test User
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            router.replace("/sign-in");
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
                toast({
                  description: "Logged out successfully!",
                  variant: "success",
                  duration: 3000,
                });
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
