import { SignIn } from "@/components/auth/sign-in";
import { getEnabledProviders } from "@/lib/auth";
import { db } from "@/db";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ client_id: string }>;
}) {
  const { client_id } = await searchParams;

  const client = await db.query.oauthApplication.findFirst({
    where: (application, { eq }) => eq(application.clientId, client_id),
  });

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <SignIn
        enabledProviders={getEnabledProviders()}
        clientName={client?.name}
        params={await searchParams}
      />
    </div>
  );
}
