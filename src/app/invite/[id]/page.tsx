import { Invite } from "@/components/invite";

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = await params;

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Invite />
    </div>
  );
}
