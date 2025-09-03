import { checkPermissions } from "@/lib/permissions";
import Link from "next/link";
import { Button } from "./ui/button";

export type ProtectedPageProps = {
  permissions: { [key: string]: string[] };
  children: React.ReactNode;
};

export async function ProtectedPage({
  permissions,
  children,
}: ProtectedPageProps) {
  const hasPermission = await checkPermissions(permissions);
  if (!hasPermission) {
    return (
      <div
        className="flex flex-col gap-4 min-h-screen w-full items-center justify-center p-6 text-center"
        role="alert"
        aria-live="polite"
      >
        <h2 className="text-3xl font-semibold">Access Restricted</h2>
        <p>
          You currently do not have the required permissions to view this page.
        </p>
        {Object.keys(permissions || {}).length > 0 && (
          <div>
            <p className="mb-1">The following permission(s) are needed:</p>
            <ul className="list-disc list-inside text-left">
              {Object.entries(permissions || {})
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([domain, actions]: [string, string[]]) => (
                  <li key={domain}>
                    <span className="font-medium">{domain}</span>:{" "}
                    {Array.isArray(actions)
                      ? actions.join(", ")
                      : String(actions)}
                  </li>
                ))}
            </ul>
          </div>
        )}
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
