"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { handleError } from "@/lib/common";
import { Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

export function ChangeEmailDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsLoading(true);
      const result = await authClient.changeEmail({
        newEmail: email,
      });

      if (result?.error?.message) {
        throw new Error(result.error.message);
      }

      toast.success("An email change request has been sent");
      setEmail("");
      setIsOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        handleError(error);
      } else {
        handleError(new Error("An unexpected error occurred"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) setEmail("");
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button variant="secondary">Change Email</Button>
      </DialogTrigger>
      <DialogContent>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change your email</DialogTitle>
            <DialogDescription>
              This will send an email change confirmation request to your new
              email.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="New email"
              required
              autoFocus
            />
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="submit"
              variant="secondary"
              disabled={isLoading || !email.trim()}
              className="relative w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <span className="opacity-0">Change email</span>
                  <Loader2 className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                </>
              ) : (
                "Change email"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
