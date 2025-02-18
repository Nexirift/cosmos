"use client";

import { Button } from "./ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function SignOut() {
  const router = useRouter();

  return (
    <Button
      onClick={async () =>
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push("/");
            },
          },
        })
      }
    >
      Sign out
    </Button>
  );
}
