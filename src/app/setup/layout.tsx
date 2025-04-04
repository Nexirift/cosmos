import { isSetupComplete } from "@/lib/actions";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await isSetupComplete()) {
    return (
      <div className="flex flex-col h-screen items-center justify-center w-lg mx-auto text-xl font-bold gap-2 text-center">
        <p>Setup is unavailable</p>
        <p className="font-normal text-lg">
          If you are an administrator and you wish to restart the setup process,
          visit the moderation dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen items-center justify-center w-lg mx-auto">
      {children}
    </div>
  );
}
