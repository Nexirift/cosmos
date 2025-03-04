import { checkPlugin } from "@/lib/auth-client";
import { Passkeys } from "./passkeys";
import { ChangeEmailDialog } from "./change-email";
import { ChangePasswordDialog } from "./change-password";

export function SecuritySection() {
  return (
    <section id="security" className="flex flex-col gap-4 pt-4 border-t">
      <header>
        <h1 className="text-2xl font-bold">Security</h1>
        <p className="text-muted-foreground">
          Manage your security settings, such as your email, password, and
          two-factor authentication.
        </p>
      </header>
      <div className="flex flex-wrap gap-3">
        <ChangeEmailDialog />
        <ChangePasswordDialog />
      </div>
      {checkPlugin("passkey") && <Passkeys />}
    </section>
  );
}
