import { auth } from "@/lib/auth";
import { checkPermissions } from "@/lib/permissions";
import { headers } from "next/headers";
import { Gate, UnauthorizedGate } from "./gate";

export type ProtectedPageProps = {
  permissions?: Record<string, string[]>;
  children: React.ReactNode;
  userId?: string | null;
};

export async function ProtectedPage({
  permissions,
  children,
  userId,
}: ProtectedPageProps) {
  let effectiveUserId = userId;
  if (!effectiveUserId) {
    const session = await auth.api.getSession({ headers: await headers() });
    effectiveUserId = session?.user?.id ?? null;
  }

  if (!effectiveUserId) {
    return <UnauthorizedGate />;
  }

  const permissionEntries =
    permissions &&
    Object.entries(permissions).sort(([a], [b]) => a.localeCompare(b));

  if (permissionEntries && permissionEntries.length > 0) {
    const hasPermission = await checkPermissions(permissions, effectiveUserId);
    if (!hasPermission) {
      const requiredList = (
        <div>
          <p className="mb-1">The following permission(s) are needed:</p>
          <ul className="list-disc list-inside text-left">
            {permissionEntries.map(([domain, actions]) => (
              <li key={domain}>
                <span className="font-medium">{domain}</span>:{" "}
                {actions.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      );

      return (
        <Gate
          title="Access Restricted"
          message={
            <p>
              You currently do not have the required permissions to view this
              page.
            </p>
          }
          actionHref="/"
          actionLabel="Go Home"
          extra={requiredList}
        />
      );
    }
  }

  return children;
}
