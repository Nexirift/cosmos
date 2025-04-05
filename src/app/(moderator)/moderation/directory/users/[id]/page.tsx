import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/common";
import { db } from "@nexirift/db";
import { protect } from "../../../protect";
import { ContactInformationCard } from "./components/contact-information/server";
import { ProfileCard } from "./components/profile/server";
import { VerificationCard } from "./components/verification/server";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await protect();

  const { id } = await params;

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
            <p>{data.displayUsername ?? data.username}</p>
          </div>
        </section>
        <div className="flex gap-2 flex-wrap items-start">
          <VerificationCard
            data={{ id: data.id, verification: data.verification ?? undefined }}
          />
          <ContactInformationCard data={data} />
          <ProfileCard
            data={{ id: data.id, profile: data.profile ?? undefined }}
          />
        </div>
      </div>
    </div>
  );
}
