import Link from "next/link";
import { Button } from "./ui/button";

type GateProps = {
  title: string;
  message: React.ReactNode;
  actionHref: string;
  actionLabel: string;
  extra?: React.ReactNode;
};

export function Gate({
  title,
  message,
  actionHref,
  actionLabel,
  extra,
}: GateProps) {
  return (
    <div
      className="flex flex-col gap-4 min-h-screen w-full items-center justify-center p-6 text-center"
      role="alert"
      aria-live="polite"
    >
      <h2 className="text-3xl font-semibold">{title}</h2>
      <div className="space-y-2">{message}</div>
      {extra}
      <Button asChild>
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    </div>
  );
}

export function UnauthorizedGate() {
  return (
    <Gate
      title="Unauthorized"
      message={<p>You must be logged in to view this page.</p>}
      actionHref="/sign-in"
      actionLabel="Log In"
    />
  );
}
