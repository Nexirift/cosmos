"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export function TwoFactor() {
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackupCode, setIsBackupCode] = useState(false);

  const router = useRouter();

  /**
   * Displays an error toast notification to the user
   * @param error The error object containing the message to display
   */
  function handleError(error: Error) {
    toast(error.message || "An error occurred during verification");
  }

  const handleVerify = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await (isBackupCode
        ? authClient.twoFactor.verifyBackupCode({ code, trustDevice })
        : authClient.twoFactor.verifyTotp({ code, trustDevice }));

      if (error?.message) {
        throw new Error(error.message);
      }

      if (data) {
        router.push("/");
      }
    } catch (error) {
      if (error instanceof Error) {
        handleError(error);
      } else {
        handleError(new Error("An unexpected error occurred"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [code, router, isBackupCode, trustDevice]);

  // useEffect(() => {
  //   if (
  //     (isBackupCode && code.length === 11) ||
  //     (!isBackupCode && code.length === 6)
  //   ) {
  //     handleVerify();
  //   }
  // }, [code, handleVerify, isBackupCode]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two Factor Authentication</CardTitle>
        <CardDescription>
          This account is protected with two factor authentication.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center w-full gap-6">
        {isBackupCode ? (
          <InputOTP maxLength={10} value={code} onChange={setCode}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={5} />
              <InputOTPSlot index={6} />
              <InputOTPSlot index={7} />
              <InputOTPSlot index={8} />
              <InputOTPSlot index={9} />
            </InputOTPGroup>
          </InputOTP>
        ) : (
          <InputOTP maxLength={6} value={code} onChange={setCode}>
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
        )}

        <div className="flex items-center gap-2">
          <Checkbox
            id="trust"
            checked={trustDevice}
            onCheckedChange={(checked) => setTrustDevice(!!checked)}
          />
          <Label htmlFor="trust">Trust Device</Label>
        </div>

        <Button
          className="w-full"
          onClick={handleVerify}
          disabled={
            isLoading || (isBackupCode ? code.length !== 10 : code.length !== 6)
          }
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying
            </>
          ) : (
            "Verify"
          )}
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            setCode("");
            setIsBackupCode(!isBackupCode);
          }}
        >
          {isBackupCode ? "Use authenticator code" : "Use backup code"}
        </Button>
      </CardContent>
    </Card>
  );
}
