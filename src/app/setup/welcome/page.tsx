"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function Page() {
  return (
    <Card className="gap-4 w-full">
      <CardHeader>
        <CardTitle>Welcome to Cosmos!</CardTitle>
        <CardDescription className="flex flex-col gap-1">
          <p>
            Welcome to your new authentication server! We&#39;ve designed this
            setup wizard to guide you through the configuration process step by
            step.
          </p>
          <p className="font-bold">
            Please complete the entire setup process to gain access to your
            dashboard and begin using Cosmos.
          </p>
        </CardDescription>
      </CardHeader>
      <CardFooter className="justify-end">
        <Button asChild>
          <Link href="/setup/basic-details">Continue</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
