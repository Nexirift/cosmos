import { ResetPassword } from "@/components/auth/reset-password";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token: string }>;
}) {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <ResetPassword params={await searchParams} />
    </div>
  );
}
