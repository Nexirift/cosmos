import { InviteForm } from "@/components/auth/invite-form";
import { SignUp } from "@/components/auth/sign-up";
import { checkPlugin } from "@/lib/auth";

export default async function Page({
  searchParams,
}: {
  searchParams: { invite: string };
}) {
  const { invite } = await searchParams;

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      {invite || !checkPlugin("invitation") ? (
        <SignUp invite={invite} />
      ) : (
        <InviteForm params={searchParams} />
      )}
    </div>
  );
}
