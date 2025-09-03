import { AppSidebar } from "@/components/app-sidebar";
import { ProtectedPage } from "@/components/protected-page";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedPage permissions={{ moderation: ["view"] }}>
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <SidebarTrigger className="md:hidden fixed top-4 right-4" />
          {children}
        </main>
      </SidebarProvider>
    </ProtectedPage>
  );
}
