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
    appHeader: string;
    nexiriftMode: boolean;
    novaUrl: string;
    logoError: string;
    headerError: string;
  };
  setFormState: React.Dispatch<
    React.SetStateAction<{
      appName: string;
      appLogo: string;
      appHeader: string;
      nexiriftMode: boolean;
      novaUrl: string;
      logoError: string;
      headerError: string;
    }>
  >;
}) => {
  const { isLoading, ...config } = useConfig();

  const handleFileChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      mode: "logo" | "header" = "logo",
    ) => {
      const file = e.target.files?.[0];
      setFormState((prev) => ({
        ...prev,
        [mode === "logo" ? "logoError" : "headerError"]: "",
      }));

      if (file) {
        if (!file.type.startsWith("image/")) {
          setFormState((prev) => ({
            ...prev,
            [mode === "logo" ? "logoError" : "headerError"]:
              "Please upload an image file",
          }));
          return;
        }

        if (file.size > 10 * 1024 * 1024) {
          setFormState((prev) => ({
            ...prev,
            [mode === "logo" ? "logoError" : "headerError"]:
              "File size must be less than 10MB",
          }));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const img = new window.Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (mode === "logo") {
              // Set canvas size to 128px x 128px for logo
              canvas.width = 128;
              canvas.height = 128;
              ctx?.drawImage(img, 0, 0, 128, 128);
            } else {
              // Set canvas height to 128px, preserve aspect ratio for header
              const aspectRatio = img.width / img.height;
              canvas.height = 128;
              canvas.width = Math.round(128 * aspectRatio);
              ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            }

            const compressedBase64 = canvas.toDataURL("image/png", 0.8);
            setFormState((prev) => ({
              ...prev,
              [mode === "logo" ? "appLogo" : "appHeader"]: compressedBase64,
            }));
          };
          img.onerror = () => {
            setFormState((prev) => ({
              ...prev,
              [mode === "logo" ? "logoError" : "headerError"]:
                "Error processing image",
            }));
          };
          img.src = reader.result as string;
        };
        reader.onerror = () => {
          setFormState((prev) => ({
            ...prev,
            [mode === "logo" ? "logoError" : "headerError"]:
              "Error reading file",
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
        appHeader: String(config.appHeader ?? prev.appHeader),
        nexiriftMode: Boolean(config.nexiriftMode ?? prev.nexiriftMode),
        novaUrl: String(config.novaUrl ?? prev.novaUrl),
      }));
    }
  }, [
    isLoading,
    config.appLogo,
    config.appHeader,
    config.appName,
    config.nexiriftMode,
    config.novaUrl,
    setFormState,
  ]);

  if (isLoading) return <Loader className="w-full h-full p-20" />;

  return (
    <form className="flex flex-col gap-4">
      <div className="grid items-center gap-1.5">
        <Label htmlFor="header">Header</Label>
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative h-16 w-full">
            {formState.appHeader && (
              <Image
                fill
                className="object-contain"
                src={formState.appHeader}
                alt="Header"
              />
            )}
          </div>
          <Input
            id="header"
            type="file"
            onChange={(e) => handleFileChange(e, "header")}
            accept="image/*"
          />
        </div>
        {formState.headerError && (
          <p className="text-sm text-red-500">{formState.headerError}</p>
        )}
        <Label htmlFor="logo">Logo</Label>
        <div className="flex items-center gap-1.5">
          <div className="relative h-16 w-16">
            {formState.appLogo && (
              <Image
                fill
                className="object-contain"
                src={formState.appLogo}
                alt="Header"
              />
            )}
          </div>
          <Input
            id="logo"
            type="file"
            onChange={(e) => handleFileChange(e, "logo")}
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
