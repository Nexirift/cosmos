"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import Link from "next/link";

export default function Page() {
  const { data: session, isPending } = authClient.useSession();

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
      <div className="flex flex-wrap gap-2 font-bold text-lg">
        <Button variant="default" asChild>
          <Link href={session?.user ? "/dashboard" : "/sign-in"}>
            {session?.user ? "Go to Dashboard" : "Sign In"}
          </Link>
        </Button>
        {!session?.user && (
          <Button variant="secondary" asChild>
            <Link href="/sign-up">Sign Up</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
