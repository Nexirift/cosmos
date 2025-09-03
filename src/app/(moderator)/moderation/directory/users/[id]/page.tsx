import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/common";
import { db } from "@/db";
import { protect } from "../../../protect";
import { ContactInformationCard } from "./components/contact-information/server";
import { ProfileCard } from "./components/profile/server";
import { VerificationCard } from "./components/verification/server";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AuthenticationCard } from "./components/authentication/server";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // await protect();

  const { id: _id } = await params;

  const id = _id.replace(/%40/g, "@");

  const isFederated = id.includes("@");

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

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 p-4 w-full">
        <section className="flex gap-2">
          <Avatar className="w-16 h-16 rounded-lg">
            <AvatarImage src={data.avatar!} className="rounded-lg" />
            <AvatarFallback className="rounded-lg">
              {initials(
                data.displayName ?? data.displayUsername ?? data.username,
              )}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-bold">
              {data.displayName ?? data.displayUsername ?? data.username}
            </h2>
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
                    This is an ActivityPub federated account. Some profile data
                    may be limited and this user cannot log in to Nexirift.
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </section>
        <div className="columns-1 md:columns-2 lg:columns-3 gap-2 space-y-2">
          <ProfileCard
            data={{ id: data.id, profile: data.profile ?? undefined }}
          />
          {!isFederated && <ContactInformationCard data={data} />}
          <VerificationCard
            data={{ id: data.id, verification: data.verification ?? undefined }}
          />
          <AuthenticationCard data={data} />
        </div>
      </div>
    </div>
  );
}
