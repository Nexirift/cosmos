import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ConsentPrompt } from "../../../components/auth/consent-prompt";
import { redirect } from "next/navigation";

interface SearchParams {
  client_id: string;
  scope: string;
}

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { client_id, scope } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.session.userId) {
    return redirect("/sign-in");
  }

  if (!client_id || !scope) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        Invalid request
      </div>
    );
  }

  const client = await auth.api.getOAuthClient({
    params: { id: client_id },
    headers: await headers(),
  });

  const scopes = scope.split(" ");

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <ConsentPrompt name={client.name} icon={client.icon} scopes={scopes} />
    </div>
  );
}
