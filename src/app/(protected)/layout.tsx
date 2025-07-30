"use client";

import { Header } from "@/components/header";
import { Loader } from "@/components/loader";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session && !isPending) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  if (!session || isPending) {
    return <Loader fillScreen />;
  }

  // authClient.checkout({
  //   slug: "plasma-individual",
  // });

  authClient.customer.portal();

  return (
    <div className="flex flex-col h-screen">
      <Header />
      {children}
    </div>
  );
}
