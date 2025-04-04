"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { clearCache, setDb } from "@/lib/actions";
import Link from "next/link";
import { useEffect } from "react";

export default function Page() {
  useEffect(() => {
    setDb("setup_completed", true);
    clearCache();
  });

  return (
    <Card className="gap-4 w-full">
      <CardHeader>
        <CardTitle>All done!</CardTitle>
        <CardDescription>
          Thank you for choosing our authentication server! Setup is now
          complete and your server is ready for use. You can access and modify
          all settings through the moderation dashboard at any time. While you
          have the option to restart this setup wizard from the dashboard, we
          strongly recommend avoiding this unless absolutely necessary, as the
          setup process is publicly accessible.
        </CardDescription>
      </CardHeader>
      <CardFooter className="justify-end">
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
