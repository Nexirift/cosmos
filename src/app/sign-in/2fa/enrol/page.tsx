"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { handleError } from "@/lib/common";
import { useQRCode } from "next-qrcode";
import { useState } from "react";

export default function Page() {
  const { Canvas } = useQRCode();

  const [totpURI, setTotpURI] = useState("no totp uri");
  const [code, setCode] = useState("");

  async function generate() {
    try {
      const { data, error } = await authClient.twoFactor.enable({
        password: "P@ssw0rd",
      });

      if (error?.message) {
        throw new Error(error.message);
      }

      if (data?.totpURI) setTotpURI(data.totpURI);
    } catch (error) {
      if (error instanceof Error) {
        handleError(error);
      } else {
        handleError(new Error("An unexpected error occurred"));
      }
    }
  }

  async function submit() {
    try {
      const { data, error } = await authClient.twoFactor.verifyTotp({
        code,
      });

      if (error?.message) {
        throw new Error(error.message);
      }

      if (data) alert("Enrolled.");
    } catch (error) {
      if (error instanceof Error) {
        handleError(error);
      } else {
        handleError(new Error("An unexpected error occurred"));
      }
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Card>
        <CardHeader>
          <CardTitle>Enrolment Test</CardTitle>
          <CardDescription>Test enrolment of 2FA with QR code</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-2 w-full">
          <Canvas
            text={totpURI}
            options={{
              errorCorrectionLevel: "M",
              margin: 3,
              scale: 4,
              width: 200,
            }}
          />
          <Button onClick={generate}>Generate</Button>
          <Input
            type="text"
            placeholder="2FA Code"
            disabled={totpURI === "no totp uri"}
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button disabled={code.length !== 6} onClick={submit}>
            Submit
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
