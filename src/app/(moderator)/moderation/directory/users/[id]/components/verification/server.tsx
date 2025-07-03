import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  db,
  userVerification,
  UserVerificationSchemaType,
  userVerificationType,
} from "@nexirift/db";
import { eq } from "drizzle-orm";
import moment from "moment";
import { VisibleBadge } from "../common";
import { VerificationCardActions } from "./client";

export function VerificationCard({
  data,
}: {
  data: { id: string; verification?: UserVerificationSchemaType };
}) {
  const removeAction = async () => {
    "use server";
    await db
      .delete(userVerification)
      .where(eq(userVerification.userId, data.id))
      .returning();
  };

  const modifyAction = async (formData: { type: string }) => {
    "use server";
    await db
      .insert(userVerification)
      .values({
        userId: data.id,
        type: formData.type as UserVerificationSchemaType["type"],
      })
      .onConflictDoUpdate({
        target: userVerification.userId,
        set: {
          type: formData.type as UserVerificationSchemaType["type"],
        },
      })
      .returning();
  };

  return (
    <Card className="gap-2 break-inside-avoid">
      <CardHeader>
        <VisibleBadge />
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="flex items-center gap-2">
          <b className="font-semibold min-w-[80px]">Status:</b>
          <span
            className={`px-2 py-0.5 rounded-full text-sm ${data.verification ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
          >
            {data.verification ? "Verified" : "Not Verified"}
          </span>
        </p>
        <p className="flex items-center gap-2">
          <b className="font-semibold min-w-[80px]">Type:</b>
          <span>
            {data.verification?.type
              ? data.verification?.type.charAt(0)?.toUpperCase() +
                data.verification?.type.slice(1).toLowerCase()
              : "None"}
          </span>
        </p>
        <p className="flex items-center gap-2">
          <b className="font-semibold min-w-[80px]">Since:</b>
          <span>
            {data.verification?.createdAt
              ? moment(data.verification?.createdAt).format(
                  "dddd, Do [of] MMMM, YYYY [at] hh:mm:ss a",
                )
              : "Not set"}
          </span>
        </p>
        <p className="flex items-center gap-2">
          <b className="font-semibold min-w-[80px]">Modified:</b>
          <span>
            {data.verification?.updatedAt
              ? moment(data.verification?.updatedAt).format(
                  "dddd, Do [of] MMMM, YYYY [at] hh:mm:ss a",
                )
              : "Not set"}
          </span>
        </p>
      </CardContent>
      <VerificationCardActions
        data={data}
        removeAction={removeAction}
        modifyAction={modifyAction}
        enumValues={userVerificationType.enumValues}
      />
    </Card>
  );
}
