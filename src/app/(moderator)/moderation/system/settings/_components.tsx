"use client";

import { BasicDetailsForm } from "@/app/setup/basic-details/_component";
import { Combobox } from "@/components/combobox";
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
import { Label } from "@/components/ui/label";
import { clearCache, setDb } from "@/lib/actions";
import { DEFAULTS, SettingKey } from "@/lib/defaults";
import { findImagesAndConvert } from "@/lib/image";
import { forceFullRoleRebuildAction } from "@/lib/role-actions";
import { SettingValue } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const CACHE_OPTIONS = [
  { label: "Setting", value: "cosmos_setting" },
  { label: "Role", value: "cosmos_role" },
] as const;

const CACHE_LABEL_MAP: Record<string, string> = {
  cosmos_setting: "setting",
  cosmos_role: "role",
};

export function ClearCaches() {
  const [cacheType, setCacheType] = useState<string | null>("cosmos_role");
  const [isClearing, setIsClearing] = useState(false);

  const handleSubmit: React.FormEventHandler = useCallback(
    async (e) => {
      e.preventDefault();
      if (!cacheType) {
        toast("Please select a cache type first");
        return;
      }
      try {
        setIsClearing(true);
        const result = await clearCache(cacheType);
        const label = CACHE_LABEL_MAP[cacheType] ?? cacheType;
        toast(`Cleared ${result} key(s) from ${label} cache`);
        await forceFullRoleRebuildAction();
      } catch (err) {
        console.error(err);
        toast("Failed to clear cache");
      } finally {
        setIsClearing(false);
      }
    },
    [cacheType],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-2 items-start sm:items-end"
    >
      <div className="flex flex-col">
        <Label htmlFor="cacheType" className="text-sm font-medium">
          Cache Type
        </Label>
        <Combobox
          options={CACHE_OPTIONS}
          value={cacheType}
          onChange={(val) => setCacheType(val)}
          placeholder="Select cache type"
          emptyMessage="No cache types found"
          clearable
        />
      </div>
      <Button
        type="submit"
        variant="destructive"
        className="w-fit"
        disabled={!cacheType || isClearing}
        aria-busy={isClearing}
      >
        {isClearing ? "Clearing..." : "Clear Cache"}
      </Button>
    </form>
  );
}

export function RestartSetup({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [isRestarting, setIsRestarting] = useState(false);

  const action = useCallback(async () => {
    try {
      setIsRestarting(true);
      await setDb(SettingKey.setupCompleted, false);
      router.push("/setup");
    } catch (err) {
      console.error(err);
      toast("Failed to restart setup");
    } finally {
      setIsRestarting(false);
    }
  }, [router]);

  return !disabled ? (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <RestartSetupButton loading={isRestarting} />
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
          <AlertDialogCancel disabled={isRestarting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={action} disabled={isRestarting}>
            {isRestarting ? "Restarting..." : "Continue"}
          </AlertDialogAction>
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

function RestartSetupButton({
  onClick,
  loading,
}: {
  onClick?: () => void;
  loading?: boolean;
}) {
  return (
    <Button
      onClick={onClick}
      variant="secondary"
      className="w-fit"
      disabled={loading}
      aria-busy={loading}
    >
      {loading ? "Working..." : "Restart Setup"}
    </Button>
  );
}

interface BasicDetailsFormState {
  appName: string;
  appLogo: string;
  appHeader: string;
  appDescription: string;
  nexiriftMode: boolean;
  novaUrl: string;
  redirectIndexToDashboard: boolean;
  logoError: string;
  headerError: string;
}

export function BasicDetails() {
  const [formState, setFormState] = useState<BasicDetailsFormState>({
    appName: String(DEFAULTS.appName ?? ""),
    appLogo: String(DEFAULTS.appLogo ?? ""),
    appHeader: String(DEFAULTS.appHeader ?? ""),
    appDescription: String(DEFAULTS.appDescription ?? ""),
    nexiriftMode: Boolean(DEFAULTS.nexiriftMode),
    novaUrl: String(DEFAULTS.novaUrl ?? ""),
    redirectIndexToDashboard: Boolean(DEFAULTS.redirectIndexToDashboard),
    logoError: "",
    headerError: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = useCallback(async () => {
    try {
      setIsSaving(true);
      const entries: Array<[SettingKey, unknown]> = [
        [SettingKey.appName, formState.appName],
        [SettingKey.appLogo, formState.appLogo],
        [SettingKey.appHeader, formState.appHeader],
        [SettingKey.appDescription, formState.appDescription],
        [SettingKey.nexiriftMode, formState.nexiriftMode],
        [
          SettingKey.redirectIndexToDashboard,
          formState.redirectIndexToDashboard,
        ],
      ];
      if (formState.novaUrl) {
        entries.push([SettingKey.novaUrl, formState.novaUrl]);
      }

      await Promise.all(entries.map(([k, v]) => setDb(k, v as any)));
      await findImagesAndConvert();
      toast("Settings saved");
    } catch (err) {
      console.error(err);
      toast("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }, [formState]);

  return (
    <div className="gap-4 flex flex-col max-w-xs">
      <BasicDetailsForm formState={formState} setFormState={setFormState} />
      <Button onClick={handleSubmit} disabled={isSaving} aria-busy={isSaving}>
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
