import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { userProfile, UserProfileSchemaType } from "@/db/schema";
import moment from "moment";
import { MDXRemote } from "next-mdx-remote/rsc";
import Image from "next/image";
import {
  insertUserProfileSchema,
  InsertUserProfileSchema,
} from "@/lib/zod-schema";
import { VisibleBadge } from "../common";
import { ProfileCardActions } from "./client";

type ProfileCardProps = {
  data: {
    id: string;
    profile?: UserProfileSchemaType;
  };
};

const DATE_FORMAT = "dddd, Do [of] MMMM, YYYY [at] hh:mm:ss a";
const IMAGE_FIELDS = ["banner", "background"];

export async function ProfileCard({ data }: ProfileCardProps) {
  const modifyAction = async (values: InsertUserProfileSchema) => {
    "use server";
    await db
      .insert(userProfile)
      .values({ ...values, userId: data.id })
      .onConflictDoUpdate({
        target: userProfile.userId,
        set: values,
      });
  };

  const defaultValues = Object.keys(insertUserProfileSchema.shape).reduce<
    Partial<InsertUserProfileSchema>
  >((acc, key) => {
    if (key === "userId") {
      acc[key] = data.id;
    } else if (key === "createdAt" || key === "updatedAt") {
      acc[key] = new Date();
    } else {
      // @ts-expect-error any
      acc[key] = null;
    }
    return acc;
  }, {}) as UserProfileSchemaType;

  const profile = data.profile ?? defaultValues;

  const formatFieldName = (key: string) => {
    return (
      key.charAt(0).toUpperCase() +
      key
        .slice(1)
        .split(/(?=[A-Z])/)
        .join(" ")
    );
  };

  const renderFieldValue = (key: string, value: string | Date | null) => {
    const displayValue = value?.toString();
    if (!displayValue) return `No ${formatFieldName(key).toLowerCase()} set`;

    const isImage = IMAGE_FIELDS.includes(key);
    const isExtendedBio = key === "extendedBio";
    const isDate = key === "createdAt" || key === "updatedAt";

    if (isImage) {
      return (
        <Image
          width={200}
          height={100}
          src={displayValue}
          alt={`${formatFieldName(key)} Image`}
          className="object-cover rounded-md"
        />
      );
    }

    if (isExtendedBio) {
      return (
        <div className="prose">
          <MDXRemote source={displayValue} />
        </div>
      );
    }

    if (isDate) {
      return moment(new Date(displayValue)).format(DATE_FORMAT);
    }

    return displayValue;
  };

  return (
    <Card className="gap-2 break-inside-avoid">
      <CardHeader>
        <VisibleBadge role="user:profile" />
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {data.profile ? (
          Object.entries(profile)
            .filter(([key]) => key !== "userId" && key !== "createdAt")
            .map(([key, value]) => {
              const isImage = IMAGE_FIELDS.includes(key);
              return (
                <div key={key} className="flex flex-col gap-2 mb-2">
                  <b className="font-semibold">{formatFieldName(key)}:</b>
                  <span className={isImage ? "rounded-md overflow-hidden" : ""}>
                    {renderFieldValue(key, value)}
                  </span>
                </div>
              );
            })
        ) : (
          <p className="mb-2">No profile data available.</p>
        )}
      </CardContent>
      <ProfileCardActions data={profile} modifyAction={modifyAction} />
    </Card>
  );
}
