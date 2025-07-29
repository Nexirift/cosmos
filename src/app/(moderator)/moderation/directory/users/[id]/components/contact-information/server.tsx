import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { user, UserSchemaType } from "@/db/schema";
import { eq } from "drizzle-orm";
import { VisibleBadge } from "../common";
import { ContactInformationCardActions } from "./client";

export function ContactInformationCard({ data }: { data: UserSchemaType }) {
  const verifyAction = async () => {
    "use server";
    await db
      .update(user)
      .set({ emailVerified: !data.emailVerified })
      .where(eq(user.id, data.id));
  };

  const modifyAction = async (email: string) => {
    "use server";
    await db.update(user).set({ email }).where(eq(user.id, data.id));
  };

  const verificationStatus = data.emailVerified
    ? {
        text: "Verified",
        className: "bg-green-500/10 text-green-500",
      }
    : {
        text: "Not Verified",
        className: "bg-red-500/10 text-red-500",
      };

  return (
    <Card className="gap-2 break-inside-avoid">
      <CardHeader>
        <VisibleBadge role="Super Administrators" />
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="flex items-center gap-2">
          <b className="font-semibold min-w-[80px]">Email:</b>
          <span>{data.email}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-sm ${verificationStatus.className}`}
          >
            {verificationStatus.text}
          </span>
        </p>
      </CardContent>
      <ContactInformationCardActions
        data={data}
        modifyAction={modifyAction}
        verifyAction={verifyAction}
      />
    </Card>
  );
}
