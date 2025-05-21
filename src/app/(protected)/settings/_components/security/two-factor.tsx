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
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { handleError } from "@/lib/common";
import { Loader2Icon } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { useQRCode } from "next-qrcode";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type TwoFactorStep = "password" | "qrcode" | "backupcodes";

// Common types for better type safety
interface PasswordStepProps {
  title: string;
  description: string;
  password: string;
  setPassword: (value: string) => void;
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: (e: FormEvent) => void;
  submitButtonText?: string;
  inputId?: string;
}

interface BackupCodesStepProps {
  backupCodes: string[];
  onFinish: () => void;
}

interface LoadingButtonProps {
  isLoading: boolean;
  disabled?: boolean;
  onClick?: () => void;
  loadingText: string;
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
}

export function TwoFactor({
  session,
}: {
  session: ReturnType<typeof authClient.useSession>["data"] | undefined;
}) {
  const twoFactorEnabled = session?.user?.twoFactorEnabled ?? false;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-bold">Two-Factor Authentication</h2>
      <p className="text-muted-foreground">
        {!twoFactorEnabled
          ? "Add an extra layer of security by enabling two-factor authentication."
          : "Manage your existing two-factor authentication settings."}
      </p>
      <div className="flex flex-wrap gap-3">
        <EnableTwoFactorDialog enabled={twoFactorEnabled} />
        {twoFactorEnabled && <RegenerateBackupCodesDialog />}
      </div>
    </div>
  );
}

// Common components for password and backup code functionality
function PasswordStep({
  title,
  description,
  password,
  setPassword,
  isLoading,
  onCancel,
  onSubmit,
  submitButtonText = "Continue",
  inputId = "password",
}: PasswordStepProps) {
  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor={inputId}>Password</Label>
        <Input
          id={inputId}
          type="password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
          placeholder="Enter your password"
          required
          autoFocus
        />
      </div>
      <DialogFooter className="sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <LoadingButton
          type="submit"
          isLoading={isLoading}
          disabled={!password.trim()}
          loadingText={submitButtonText}
        >
          {submitButtonText}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}

function BackupCodesStep({ backupCodes, onFinish }: BackupCodesStepProps) {
  return (
    <div className="flex flex-col gap-3">
      <DialogHeader>
        <DialogTitle>Backup Codes</DialogTitle>
        <DialogDescription>
          Save these backup codes in a secure place. You can use these if you
          lose access to your authenticator app.
        </DialogDescription>
      </DialogHeader>
      <div className="border rounded-md p-3 font-mono text-sm bg-muted text-center">
        <div className="grid grid-cols-2 gap-2">
          {backupCodes.map((code, index) => (
            <div key={index} className="p-1">
              {code}
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Each code can only be used once. Once you&#39;ve used all codes,
        you&#39;ll need to generate new ones.
      </p>
      <DialogFooter className="sm:justify-end">
        <Button type="button" onClick={onFinish}>
          Done
        </Button>
      </DialogFooter>
    </div>
  );
}

function LoadingButton({
  isLoading,
  disabled,
  onClick,
  loadingText,
  children,
  type = "button",
}: LoadingButtonProps) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className="relative"
    >
      {isLoading ? (
        <>
          <span className="opacity-0">{loadingText || children}</span>
          <Loader2Icon className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-spin" />
        </>
      ) : (
        children
      )}
    </Button>
  );
}

function EnableTwoFactorDialog({ enabled }: { enabled: boolean }) {
  const [step, setStep] = useState<TwoFactorStep>("password");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { Canvas } = useQRCode();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setStep("password");
      setPassword("");
      setVerificationCode("");
      setQrCodeUrl(null);
      setBackupCodes([]);
    }
  }, [open]);

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    try {
      setIsLoading(true);
      const result = await authClient.twoFactor.enable({
        password: password.trim(),
      });

      if (result?.error?.message) {
        throw new Error(result.error.message);
      }

      setQrCodeUrl(result.data?.totpURI || "");
      setBackupCodes(result.data?.backupCodes || []);
      setStep("qrcode");
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error("Failed to verify password"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRCodeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim() || verificationCode.length < 6) return;

    try {
      setIsLoading(true);
      const result = await authClient.twoFactor.verifyTotp({
        code: verificationCode.trim(),
      });

      if (result?.error?.message) {
        throw new Error(result.error.message);
      }

      setStep("backupcodes");
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error("Failed to verify code"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    toast.success("Two-factor authentication enabled successfully");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !isLoading && setOpen(open)}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-auto">
          {enabled ? "Re-enroll" : "Enroll"} in 2FA
        </Button>
      </DialogTrigger>
      <DialogContent>
        {step === "password" && (
          <PasswordStep
            title="Enable Two-Factor Authentication"
            description="First, enter your password to confirm your identity."
            password={password}
            setPassword={setPassword}
            isLoading={isLoading}
            onCancel={() => setOpen(false)}
            onSubmit={handlePasswordSubmit}
          />
        )}

        {step === "qrcode" && (
          <form className="flex flex-col gap-3" onSubmit={handleQRCodeSubmit}>
            <DialogHeader>
              <DialogTitle>Scan QR Code</DialogTitle>
              <DialogDescription>
                Scan this QR code with your authenticator app, then enter the
                verification code.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4">
              {qrCodeUrl && (
                <div className="p-2 rounded-lg bg-white">
                  <Canvas
                    text={qrCodeUrl}
                    options={{
                      errorCorrectionLevel: "M",
                      margin: 3,
                      scale: 4,
                      width: 192,
                    }}
                  />
                </div>
              )}
              <div className="w-full grid gap-2 text-center justify-center items-center">
                <Label
                  htmlFor="verification-code"
                  className="text-lg font-bold"
                >
                  Verification Code
                </Label>
                <InputOTP
                  id="verification-code"
                  maxLength={6}
                  value={verificationCode}
                  onChange={setVerificationCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            <DialogFooter className="sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("password")}
                disabled={isLoading}
              >
                Back
              </Button>
              <LoadingButton
                type="submit"
                isLoading={isLoading}
                disabled={
                  !verificationCode.trim() || verificationCode.length < 6
                }
                loadingText="Verify"
              >
                Verify
              </LoadingButton>
            </DialogFooter>
          </form>
        )}

        {step === "backupcodes" && (
          <BackupCodesStep backupCodes={backupCodes} onFinish={handleFinish} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RegenerateBackupCodesDialog() {
  const [step, setStep] = useState<"password" | "backupcodes">("password");
  const [password, setPassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setStep("password");
      setPassword("");
      setBackupCodes([]);
    }
  }, [open]);

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    try {
      setIsLoading(true);
      const result = await authClient.twoFactor.generateBackupCodes({
        password: password.trim(),
      });

      if (result?.error?.message) {
        throw new Error(result.error.message);
      }

      setBackupCodes(result.data?.backupCodes || []);
      setStep("backupcodes");
    } catch (error) {
      handleError(
        error instanceof Error
          ? error
          : new Error("Failed to regenerate backup codes"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !isLoading && setOpen(open)}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-auto">
          Regenerate Backup Codes
        </Button>
      </DialogTrigger>
      <DialogContent>
        {step === "password" && (
          <PasswordStep
            title="Regenerate Backup Codes"
            description="Enter your password to regenerate new backup codes. This will invalidate all previously generated backup codes."
            password={password}
            setPassword={setPassword}
            isLoading={isLoading}
            onCancel={() => setOpen(false)}
            onSubmit={handlePasswordSubmit}
            submitButtonText="Regenerate"
            inputId="regen-password"
          />
        )}

        {step === "backupcodes" && (
          <BackupCodesStep
            backupCodes={backupCodes}
            onFinish={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
