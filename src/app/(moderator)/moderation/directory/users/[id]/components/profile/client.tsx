"use client";

import { presets } from "@/components/moderation-alert";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserProfileSchemaType } from "@nexirift/db";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { insertUserProfileSchema, InsertUserProfileSchema } from "../../schema";
import { handleError } from "../common";

type ImageDataType = {
  banner: string | null;
  background: string | null;
};

const IMAGE_FIELDS = ["banner", "background"] as const;
const EXCLUDED_FIELDS = ["createdAt", "updatedAt", "userId"] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ProfileCardActions({
  data,
  modifyAction,
}: {
  data?: UserProfileSchemaType;
  modifyAction: (values: InsertUserProfileSchema) => Promise<void>;
}) {
  const router = useRouter();
  const [modifyOpen, setModifyOpen] = React.useState(false);
  const [imageData, setImageData] = React.useState<ImageDataType>({
    banner: null,
    background: null,
  });

  const form = useForm<InsertUserProfileSchema>({
    resolver: zodResolver(insertUserProfileSchema),
    defaultValues: data,
  });

  const base64ToFile = useCallback(
    (base64String: string, filename: string): File => {
      const [header, data] = base64String.split(",");
      if (!data) throw new Error("Invalid base64 string");
      const mime = header?.match(/:(.*?);/)?.[1];
      const binaryStr = atob(data);
      const bytes = new Uint8Array(binaryStr.length);

      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      return new File([bytes], filename, { type: mime });
    },
    [],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: "banner" | "background") => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error("File size must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setImageData((prev) => ({
          ...prev,
          [type]: reader.result as string,
        }));
      };
      reader.onerror = () => toast.error("Error reading file");
      reader.readAsDataURL(file);
    },
    [],
  );

  async function modifyConfirm() {
    try {
      // Create files from base64 data
      const files = [
        imageData.banner &&
          base64ToFile(imageData.banner, `${data?.userId}/banner.jpg`),
        imageData.background &&
          base64ToFile(imageData.background, `${data?.userId}/background.jpg`),
      ].filter(Boolean) as File[];

      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => formData.append("file", file));

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload file");
        }

        const responseJson = (await response.json())["files"];

        // Update form values with new image URLs
        if (responseJson.length >= 1) {
          form.setValue("banner", responseJson[0].url);
          if (responseJson.length >= 2) {
            form.setValue("background", responseJson[1].url);
          }
        }
      }

      await modifyAction(form.getValues());
      toast.success("Profile modified successfully");
      setModifyOpen(false);
      router.refresh();
    } catch (e) {
      handleError(e);
    }
  }

  // Get form fields excluding specific keys
  const formFields = useMemo(() => {
    return Object.keys(form.getValues()).filter(
      (key) =>
        !EXCLUDED_FIELDS.includes(key as "userId" | "createdAt" | "updatedAt"),
    );
  }, [form]);

  // Format field label - convert camelCase to Title Case with spaces
  const formatFieldLabel = (fieldName: string) => {
    return fieldName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  };

  return (
    <CardFooter className="gap-2">
      <Dialog open={modifyOpen} onOpenChange={setModifyOpen}>
        <DialogTrigger asChild>
          <Button className={presets.blue}>Modify</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modify Profile</DialogTitle>
            <DialogDescription>
              Update the user&apos;s profile information
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <div className="space-y-4">
              {formFields.map((fieldName) => {
                const fieldKey = fieldName as keyof InsertUserProfileSchema;
                const formattedLabel = formatFieldLabel(fieldName);
                const image =
                  imageData[fieldName as "banner" | "background"] ??
                  data?.[fieldName as "banner" | "background"];
                const isImageField = IMAGE_FIELDS.includes(
                  fieldName as "banner" | "background",
                );
                const isExtendedBio = fieldName === "extendedBio";

                return (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={fieldKey}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{formattedLabel}</FormLabel>
                        <FormControl>
                          {isImageField ? (
                            <div className="flex items-center gap-2">
                              <div className="relative h-16 w-16 border rounded overflow-hidden">
                                {image ? (
                                  <Image
                                    fill
                                    className="object-cover"
                                    src={image}
                                    alt={`${formattedLabel} preview`}
                                  />
                                ) : (
                                  <div className="bg-gray-500 w-full h-full"></div>
                                )}
                              </div>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handleFileChange(
                                    e,
                                    fieldName as "banner" | "background",
                                  )
                                }
                                className="flex-1"
                              />
                            </div>
                          ) : isExtendedBio ? (
                            <Textarea
                              placeholder={`Enter ${formattedLabel.toLowerCase()}`}
                              {...field}
                              value={field.value?.toString() ?? ""}
                              rows={Math.min(
                                10,
                                Math.max(
                                  3,
                                  (field.value?.toString() ?? "").split("\n")
                                    .length + 1,
                                ),
                              )}
                              className="min-h-[100px] resize-y"
                            />
                          ) : (
                            <Input
                              placeholder={`Enter ${formattedLabel.toLowerCase()}`}
                              {...field}
                              value={field.value?.toString() ?? ""}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
              })}
            </div>
          </Form>
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={modifyConfirm} type="submit">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardFooter>
  );
}
