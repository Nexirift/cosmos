"use client";

import { authClient, checkPlugin } from "@/lib/auth-client";
import { Passkeys } from "./passkeys";
import { ChangeEmailDialog } from "./change-email";
import { ChangePasswordDialog } from "./change-password";
import { TwoFactor } from "./two-factor";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function SecuritySection({
  session,
}: {
  session: ReturnType<typeof authClient.useSession>["data"] | undefined;
}) {
  return (
    <section id="security" className="flex flex-col gap-4 pt-4 border-t">
      <header>
        <h1 className="text-2xl font-bold">Security</h1>
        <p className="text-muted-foreground">
          Manage your security settings, such as your email, password, and
          two-factor authentication.
        </p>
      </header>
      <div className="flex flex-col gap-3">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" disabled value={session?.user.email} />
        </div>
        <div className="flex flex-wrap gap-3">
          <ChangeEmailDialog />
          <ChangePasswordDialog />
        </div>
      </div>
      {checkPlugin("passkey") && <Passkeys />}
      {checkPlugin("twoFactor") && <TwoFactor session={session} />}
    </section>
  );
}
