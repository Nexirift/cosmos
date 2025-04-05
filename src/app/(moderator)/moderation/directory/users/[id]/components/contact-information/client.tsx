"use client";

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
import { Input } from "@/components/ui/input";
import { UserSchemaType } from "@nexirift/db";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { handleError } from "../common";

export function ContactInformationCardActions({
  data,
  modifyAction,
  verifyAction,
}: {
  data: UserSchemaType;
  modifyAction: (email: string) => Promise<void>;
  verifyAction: () => Promise<void>;
}) {
  const router = useRouter();
  const [modifyOpen, setModifyOpen] = useState(false);
  const [email, setEmail] = useState(data.email ?? "");

  const isValidEmail = (email: string) =>
    email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const modifyConfirm = useCallback(async () => {
    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      await modifyAction(email.trim());
      toast.success("Email modified successfully");
      setModifyOpen(false);
      router.refresh();
    } catch (e) {
      handleError(e);
    }
  }, [email, modifyAction, router]);

  const verifyConfirm = useCallback(async () => {
    try {
      await verifyAction();
      toast.success("Email verification status changed successfully");
      router.refresh();
    } catch (e) {
      handleError(e);
    }
  }, [verifyAction, router]);

  const emailVerificationAction = data.emailVerified ? "Unverify" : "Verify";

  return (
    <CardFooter className="gap-2">
      <Dialog open={modifyOpen} onOpenChange={setModifyOpen}>
        <DialogTrigger asChild>
          <Button className={presets.blue} disabled={!data.email}>
            Modify Email
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Email</DialogTitle>
            <DialogDescription>
              Make changes to the user&#39;s email. The new email must be valid.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Enter new email address"
            type="email"
            value={email}
            onChange={handleEmailChange}
            required
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={modifyConfirm} disabled={!isValidEmail(email)}>
              Modify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            className={data.emailVerified ? presets.red : presets.green}
            disabled={!data.email}
          >
            {emailVerificationAction} Email
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm {emailVerificationAction} Email Action
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you absolutely sure that you want to{" "}
              {data.emailVerified ? "unverify" : "verify"} this user&#39;s
              email? This action may affect the user&#39;s account access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={verifyConfirm}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CardFooter>
  );
}
