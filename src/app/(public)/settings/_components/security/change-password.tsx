import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { handleError } from "@/lib/common";
import { Loader2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

export function ChangePasswordDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Passwords cannot be empty.");

  // Validate passwords
  useEffect(() => {
    if (!password || !passwordConfirm) {
      setMessage("Passwords cannot be empty.");
      return;
    }
    setMessage(
      password === passwordConfirm
        ? "Passwords match!"
        : "Passwords do not match.",
    );
  }, [password, passwordConfirm]);

  const isPasswordValid = message === "Passwords match!" && oldPassword.trim();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    try {
      setIsLoading(true);
      const result = await authClient.changePassword({
        currentPassword: oldPassword,
        newPassword: password,
        revokeOtherSessions,
      });

      if (result?.error?.message) {
        throw new Error(result.error.message);
      }

      toast.success("Password changed successfully");
      resetForm();
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

  const resetForm = () => {
    setOldPassword("");
    setPassword("");
    setPasswordConfirm("");
    setRevokeOtherSessions(false);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) resetForm();
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button variant="secondary">Change Password</Button>
      </DialogTrigger>
      <DialogContent>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change your password</DialogTitle>
            <DialogDescription>
              Enter a new password for your account. Make sure it&apos;s secure.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="oldPassword">Current Password</Label>
            <Input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Current password"
              required
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="passwordConfirm">Confirm New Password</Label>
            <Input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </div>

          <p
            className={`text-sm ${
              message === "Passwords match!" ? "text-green-500" : "text-red-500"
            }`}
          >
            {message}
          </p>
          <DialogFooter className="justify-between w-full">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="revokeOtherSessions"
                checked={revokeOtherSessions}
                onCheckedChange={(checked) => setRevokeOtherSessions(!!checked)}
              />
              <Label htmlFor="revokeOtherSessions">
                Sign out all other devices
              </Label>
            </div>
            <div className="flex-grow" />
            <Button
              type="submit"
              variant="secondary"
              disabled={isLoading || !isPasswordValid}
              className="relative w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <span className="opacity-0">Change Password</span>
                  <Loader2 className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
