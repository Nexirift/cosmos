"use client";

import { Loader } from "@/components/loader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfig } from "@/lib/common";
import { CheckedState } from "@radix-ui/react-checkbox";
import Image from "next/image";
import { useCallback, useEffect } from "react";

export const BasicDetailsForm = ({
  formState,
  setFormState,
}: {
  formState: {
    appName: string;
    appLogo: string;
    nexiriftMode: boolean;
    novaUrl: string;
    logoError: string;
  };
  setFormState: React.Dispatch<
    React.SetStateAction<{
      appName: string;
      appLogo: string;
      nexiriftMode: boolean;
      novaUrl: string;
      logoError: string;
    }>
  >;
}) => {
  const { isLoading, ...config } = useConfig();

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      setFormState((prev) => ({ ...prev, logoError: "" }));

      if (file) {
        if (!file.type.startsWith("image/")) {
          setFormState((prev) => ({
            ...prev,
            logoError: "Please upload an image file",
          }));
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          setFormState((prev) => ({
            ...prev,
            logoError: "File size must be less than 5MB",
          }));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setFormState((prev) => ({ ...prev, appLogo: base64 }));
        };
        reader.onerror = () => {
          setFormState((prev) => ({
            ...prev,
            logoError: "Error reading file",
          }));
        };
        reader.readAsDataURL(file);
      }
    },
    [setFormState],
  );

  useEffect(() => {
    if (!isLoading) {
      setFormState((prev) => ({
        ...prev,
        appName: String(config.appName ?? prev.appName),
        appLogo: String(config.appLogo ?? prev.appLogo),
        nexiriftMode: Boolean(config.nexiriftMode ?? prev.nexiriftMode),
        novaUrl: String(config.novaUrl ?? prev.novaUrl),
      }));
    }
  }, [
    isLoading,
    config.appLogo,
    config.appName,
    config.nexiriftMode,
    config.novaUrl,
    setFormState,
  ]);

  if (isLoading) return <Loader className="w-full h-full p-20" />;

  return (
    <form className="flex flex-col gap-4">
      <div className="grid items-center gap-1.5">
        <Label htmlFor="logo">Logo</Label>
        <div className="flex items-center gap-1.5">
          <div className="relative h-16 w-16">
            <Image
              fill
              className="object-contain"
              src={formState.appLogo}
              alt="Logo"
            />
          </div>
          <Input
            id="logo"
            type="file"
            onChange={handleFileChange}
            accept="image/*"
          />
        </div>
        {formState.logoError && (
          <p className="text-sm text-red-500">{formState.logoError}</p>
        )}
      </div>
      <div className="grid items-center gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          onChange={(e) =>
            setFormState((prev) => ({ ...prev, appName: e.target.value }))
          }
          value={formState.appName}
          placeholder="Enter your app name"
        />
      </div>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="nexirift">
          <AccordionTrigger className="p-0">
            Nexirift Related Settings
          </AccordionTrigger>
          <AccordionContent className="gap-4 flex flex-col p-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isNexiriftMode"
                checked={formState.nexiriftMode}
                onCheckedChange={(checked: CheckedState) =>
                  setFormState((prev) => ({
                    ...prev,
                    nexiriftMode: checked === true,
                  }))
                }
              />
              <label
                htmlFor="isNexiriftMode"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Enabled
              </label>
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="novaUrl">Nova Server URL</Label>
              <Input
                id="novaUrl"
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    novaUrl: e.target.value,
                  }))
                }
                value={formState.novaUrl}
                placeholder="Enter your Nova server URL"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </form>
  );
};
