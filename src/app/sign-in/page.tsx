import { SignIn } from "@/components/auth/sign-in";
import { getEnabledProviders } from "@/lib/auth";

export default function Page() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <SignIn enabledProviders={getEnabledProviders()} />
    </div>
  );
}
