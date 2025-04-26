"use client";

import { DynamicForm } from "@/components/dynamic-form";
import { presets } from "@/components/moderation-alert";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { UserVerificationSchemaType } from "@nexirift/db";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  insertUserVerificationSchema,
  InsertUserVerificationSchema,
} from "../../schema";
import { handleError } from "../common";

export function VerificationCardActions({
  data,
  removeAction,
  modifyAction,
  enumValues,
}: {
  data: { verification?: UserVerificationSchemaType };
  removeAction: () => Promise<void>;
  modifyAction: (values: InsertUserVerificationSchema) => Promise<void>;
  enumValues: string[];
}) {
  const router = useRouter();
  const [modifyOpen, setModifyOpen] = React.useState(false);

  const form = useForm<InsertUserVerificationSchema>({
    resolver: zodResolver(insertUserVerificationSchema),
    defaultValues: data.verification,
  });

  const action = async (formFields: InsertUserVerificationSchema) => {
    console.log(formFields);

    try {
      await modifyAction(formFields);
      toast.success("Verification modified successfully");
      setModifyOpen(false);
      router.refresh();
    } catch (e) {
      handleError(e);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!data.verification) {
      toast.error("No verification status to remove");
      return;
    }

    try {
      await removeAction();
      toast.success("Verification removed successfully");
      router.refresh();
    } catch (e) {
      handleError(e);
    }
  };

  return (
    <CardFooter className="gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            disabled={!data.verification}
            title={
              !data.verification
                ? "No verification status to remove"
                : "Remove verification status"
            }
          >
            Remove
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Verification Removal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this user&#39;s verification
              status? This action cannot be undone and should only be performed
              when absolutely necessary. The user will need to re-verify their
              account to regain verification status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveConfirm}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={modifyOpen} onOpenChange={setModifyOpen}>
        <DialogTrigger asChild>
          <Button className={presets.blue}>Modify</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modify Verification</DialogTitle>
            <DialogDescription>
              Update the user&apos;s verification information
            </DialogDescription>
          </DialogHeader>
          <DynamicForm
            form={form}
            data={
              data.verification ??
              ({ type: "NOTABLE" } as InsertUserVerificationSchema)
            }
            overrides={{
              type: {
                enumValues,
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
