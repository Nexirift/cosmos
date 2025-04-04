import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/common";
import { db } from "@nexirift/db";
import { protect } from "../../../protect";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const data = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, id),
  });

  if (!data) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        User not found
      </div>
    );
  }

  protect();

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-card dark:border-gray-800 dark:bg-gray-950 text-center flex-col p-4 font-medium">
        Viewing user <b>{data.displayName}</b> (<b>{data.username}</b>)
      </header>
      <div className="flex flex-col gap-4 p-4">
        <Avatar className="w-32 h-32">
          <AvatarImage src={data.avatar!} />
          <AvatarFallback>
            {initials(data.displayName ?? data.username)}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
