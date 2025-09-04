import { Header } from "@/components/header";
import { ProtectedPage } from "@/components/protected-page";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedPage>
      <div className="flex flex-col h-screen">
        <Header />
        {children}
      </div>
    </ProtectedPage>
  );
}
