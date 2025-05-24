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
import { UserProfileSchemaType } from "@nexirift/db";
import { useRouter } from "next/navigation";
import React, { useCallback } from "react";
import { toast } from "sonner";
import {
  insertUserProfileSchema,
  InsertUserProfileSchema,
} from "@/lib/zod-schema";
import { handleError } from "../common";
import { DynamicForm } from "../../../../../../../../components/dynamic-form";
import { zodResolver } from "@/lib/zod-resolver";
import { useForm } from "react-hook-form";

export function ProfileCardActions({
  data,
  modifyAction,
}: {
  data?: UserProfileSchemaType;
  modifyAction: (values: InsertUserProfileSchema) => Promise<void>;
}) {
  const router = useRouter();
  const [modifyOpen, setModifyOpen] = React.useState(false);

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

  async function action(formFields: InsertUserProfileSchema) {
    try {
      const isBase64Image = (str: string) =>
        str.startsWith("data:image/png;base64,");

      const files = Object.entries({
        banner: formFields.banner,
        background: formFields.background,
      })
        .filter(([, value]) => value && isBase64Image(value))
        .map(([key, value]) =>
          base64ToFile(value!, `${data?.userId}/${key}.jpg`),
        );

      const formData = { ...formFields };

      if (files.length) {
        const uploadFormData = new FormData();
        files.forEach((file) => uploadFormData.append("file", file));

        const response = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload images");
        }

        const { files: uploadedFiles } = await response.json();

        for (const file of uploadedFiles) {
          if (file.filename.endsWith("banner.jpg")) formData.banner = file.url;
          if (file.filename.endsWith("background.jpg"))
            formData.background = file.url;
        }
      }

      await modifyAction(formData);
      toast.success("Profile modified successfully");
      setModifyOpen(false);
      router.refresh();
    } catch (e) {
      handleError(e);
    }
  }

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
          <DynamicForm
            form={form}
            data={data!}
            overrides={{
              banner: {
                type: "file",
              },
              background: {
                type: "file",
              },
              extendedBio: {
                type: "textarea",
              },
            }}
          />
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={async () => await action(form.getValues())}
              type="submit"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardFooter>
  );
}
