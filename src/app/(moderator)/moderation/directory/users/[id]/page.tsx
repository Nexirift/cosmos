import { ProtectedPage } from "@/components/protected-page";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { db } from "@/db";
import { initials } from "@/lib/common";
import { AuthenticationCard } from "./components/authentication/server";
import { ContactInformationCard } from "./components/contact-information/server";
import { ProfileCard } from "./components/profile/server";
import { VerificationCard } from "./components/verification/server";
import { headers } from "next/headers";
import { getUserEffectivePermissions } from "@/lib/permissions";
import { auth } from "@/lib/auth";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Resolve params (kept original contract, though normally not a Promise)
  const { id: rawId } = await params;

  // Normalise ID (retain original intent)
  const id = rawId.replace(/%40/g, "@");
  const isFederated = id.includes("@");

  // Fetch session & permissions early (no unnecessary Promise.all for single call)
  const session = await auth.api.getSession({ headers: await headers() });
  const permissions =
    (session?.user?.id
      ? await getUserEffectivePermissions(session.user.id)
      : {}) || {};

  // Build permission map (avoid optional chain repetition)
  const userPermissions: string[] = permissions.users ?? [];
  const permissionMap = {
    View: userPermissions.includes("view"),
    Profile: userPermissions.includes("profile"),
    ContactInformation: userPermissions.includes("contact-information"),
    Verification: userPermissions.includes("verification"),
    Authentication: userPermissions.includes("authentication"),
  };

  // Fetch user (only after we know we at least have 'view' - but leave fetch in place
  // since ProtectedPage will enforce anyway; short-circuit if desired)
  const data = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, id),
    with: {
      verification: true,
      profile: true,
    },
  });

  if (!data) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        User not found
      </div>
    );
  }

  const displayName = data.displayName ?? data.displayUsername ?? data.username;

  const showProfile = permissionMap.Profile;
  const showContact = !isFederated && permissionMap.ContactInformation;
  const showVerification = permissionMap.Verification;
  const showAuth = permissionMap.Authentication;

  const noVisibleCards = !(
    showProfile ||
    showContact ||
    showVerification ||
    showAuth
  );

  return (
    <ProtectedPage permissions={{ users: ["view"] }}>
      <div className="flex flex-col">
        <div className="flex flex-col gap-4 p-4 w-full">
          <section className="flex gap-2">
            <Avatar className="w-16 h-16 rounded-lg">
              <AvatarImage
                src={data.avatar ?? undefined}
                className="rounded-lg"
              />
              <AvatarFallback className="rounded-lg">
                {initials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-bold">{displayName}</h2>
              <div className="flex gap-1 items-center">
                <p>{data.displayUsername ?? data.username}</p>
                {isFederated && (
                  <Tooltip>
                    <TooltipTrigger className="flex gap-1 items-center">
                      <Badge className="bg-[#F1007F] text-white">
                        ActivityPub
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-center text-sm">
                      This is an ActivityPub federated account. Some profile
                      data may be limited and this user cannot log in to
                      Nexirift.
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </section>
          <div className="columns-1 md:columns-2 lg:columns-3 gap-2 space-y-2">
            {showProfile && (
              <ProfileCard
                data={{ id: data.id, profile: data.profile || undefined }}
              />
            )}
            {showContact && <ContactInformationCard data={data} />}
            {showVerification && (
              <VerificationCard
                data={{
                  id: data.id,
                  verification: data.verification || undefined,
                }}
              />
            )}
            {showAuth && <AuthenticationCard data={data} />}
            {noVisibleCards && (
              <div className="p-4 text-sm text-muted-foreground">
                You do not have permission to view any of this user's
                information.
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
