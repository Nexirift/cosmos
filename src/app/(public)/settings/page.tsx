import { SettingsPage } from "./_components/content";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ hash: string }>;
}) {
  return <SettingsPage params={await searchParams} />;
}
