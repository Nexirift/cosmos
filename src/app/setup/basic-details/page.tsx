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
import { findImagesAndConvert } from "@/lib/image";

export default function Page() {
  const router = useRouter();

  const [formState, setFormState] = useState({
    appName: String(DEFAULTS.appName),
    appLogo: String(DEFAULTS.appLogo),
    appHeader: String(DEFAULTS.appHeader),
    appDescription: String(DEFAULTS.appDescription),
    nexiriftMode: Boolean(DEFAULTS.nexiriftMode),
    novaUrl: String(DEFAULTS.novaUrl),
    redirectIndexToDashboard: Boolean(DEFAULTS.redirectIndexToDashboard),
    logoError: "",
    headerError: "",
  });

  const handleSubmit = async () => {
    await Promise.all([
      setDb(SettingKey.appName, formState.appName),
      setDb(SettingKey.appLogo, formState.appLogo),
      setDb(SettingKey.appHeader, formState.appHeader),
      setDb(SettingKey.appDescription, formState.appDescription),
      setDb(SettingKey.nexiriftMode, formState.nexiriftMode),
      formState.novaUrl && setDb(SettingKey.novaUrl, formState.novaUrl),
      setDb(
        SettingKey.redirectIndexToDashboard,
        formState.redirectIndexToDashboard,
      ),
    ]);
    await findImagesAndConvert();
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
