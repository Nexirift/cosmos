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
    return <div>User not found</div>;
  }

  protect();

  return <div>{data.username}</div>;
}
