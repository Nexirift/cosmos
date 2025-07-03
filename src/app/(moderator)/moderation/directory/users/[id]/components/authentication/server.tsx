import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserSchemaType } from "@nexirift/db";
import { VisibleBadge } from "../common";

export function AuthenticationCard({ data }: { data: UserSchemaType }) {
  return (
    <Card className="gap-2 break-inside-avoid">
      <CardHeader>
        <VisibleBadge role="Super Administrators" />
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          Authentication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="flex items-center gap-2">
          <b className="font-semibold min-w-[80px]">Two Factor Enabled:</b>
          <span>{data.twoFactorEnabled ? "Yes" : "No"}</span>
        </p>
      </CardContent>
    </Card>
  );
}
