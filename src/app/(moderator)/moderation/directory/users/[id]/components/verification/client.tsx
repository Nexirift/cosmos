"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserVerificationSchemaType } from "@nexirift/db";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { handleError } from "../common";

export function VerificationCardActions({
  data,
  removeAction,
  modifyAction,
  enumValues,
}: {
  data: { verification?: UserVerificationSchemaType };
  removeAction: () => Promise<void>;
  modifyAction: (type: string) => Promise<void>;
  enumValues: string[];
}) {
  const router = useRouter();
  const [modifyOpen, setModifyOpen] = React.useState(false);
  const [type, setType] = React.useState<string | undefined>(
    data.verification?.type,
  );

  const modifyConfirm = async () => {
    if (!type) {
      toast.error("Please select a verification type");
      return;
    }

    try {
      await modifyAction(type);
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
          <Button variant="secondary" title="Modify verification status">
            Modify
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Verification</DialogTitle>
            <DialogDescription>
              Make changes to the user&#39;s verification status.
            </DialogDescription>
          </DialogHeader>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {enumValues.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0)?.toUpperCase() + type.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={modifyConfirm}
              disabled={!type}
              title={
                !type
                  ? "Please select a verification type"
                  : "Confirm modification"
              }
            >
              Modify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardFooter>
  );
}
