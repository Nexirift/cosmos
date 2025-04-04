"use client";

import { BasicDetailsForm } from "@/app/setup/basic-details/_component";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { clearCache, setDb } from "@/lib/actions";
import { DEFAULTS } from "@/lib/defaults";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ClearCache() {
  const action = async () => {
    const result = await clearCache();
    toast(`Cleared ${result} key(s) from cache`);
  };

  return (
    <Button onClick={action} variant="destructive" className="w-fit">
      Clear Cache
    </Button>
  );
}

export function RestartSetup({ disabled }: { disabled: boolean }) {
  const router = useRouter();

  const action = async () => {
    await setDb("setup_completed", false);
    router.push("/setup");
  };

  return !disabled ? (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <RestartSetupButton />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure that you want to restart the setup?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Restarting the setup process shouldn&#39;t be used unless the Cosmos
            instance is isolated from the internet.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={action}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : (
    <RestartSetupButton
      onClick={() =>
        toast("This feature is disabled because DISABLE_SETUP is set to true")
      }
    />
  );
}

function RestartSetupButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button onClick={onClick} variant="secondary" className="w-fit">
      Restart Setup
    </Button>
  );
}

export function BasicDetails() {
  const [formState, setFormState] = useState({
    appName: DEFAULTS.appName,
    appLogo: DEFAULTS.appLogo,
    nexiriftMode: DEFAULTS.nexiriftMode,
    novaUrl: DEFAULTS.novaUrl,
    logoError: "",
  });

  const handleSubmit = async () => {
    await Promise.all([
      setDb("app_name", formState.appName),
      setDb("app_logo", formState.appLogo),
      setDb("nexirift_mode", formState.nexiriftMode),
      formState.novaUrl && setDb("nova_url", formState.novaUrl),
    ]);
    toast("Settings saved");
  };

  return (
    <div className="gap-4 flex flex-col max-w-xs">
      <BasicDetailsForm formState={formState} setFormState={setFormState} />
      <Button onClick={handleSubmit}>Save</Button>
    </div>
  );
}
