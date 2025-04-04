"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { setDb } from "@/lib/actions";
import { DEFAULTS, SettingKey } from "@/lib/defaults";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BasicDetailsForm } from "./_component";

export default function Page() {
  const router = useRouter();

  const [formState, setFormState] = useState({
    appName: DEFAULTS.appName,
    appLogo: DEFAULTS.appLogo,
    nexiriftMode: DEFAULTS.nexiriftMode,
    novaUrl: DEFAULTS.novaUrl,
    logoError: "",
  });

  const handleSubmit = async () => {
    await Promise.all([
      setDb(SettingKey.appName, formState.appName),
      setDb(SettingKey.appLogo, formState.appLogo),
      setDb(SettingKey.nexiriftMode, formState.nexiriftMode),
      formState.novaUrl && setDb(SettingKey.novaUrl, formState.novaUrl),
    ]);
    router.push("/setup/thank-you");
  };

  return (
    <Card className="gap-4 w-full">
      <CardHeader>
        <CardTitle>Basic details</CardTitle>
        <CardDescription>
          Let&#39;s get started by setting up your basic details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BasicDetailsForm formState={formState} setFormState={setFormState} />
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="secondary" asChild>
          <Link href="/setup/welcome">Back</Link>
        </Button>
        <Button onClick={handleSubmit}>Continue</Button>
      </CardFooter>
    </Card>
  );
}
