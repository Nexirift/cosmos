"use client";

import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session && !isPending) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  if (!session || isPending) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 gap-1">
      <h3 className="font-bold text-xl">Authorized Applications</h3>
      <p>You haven&#39;t authorized any applications yet.</p>
    </div>
  );
}
