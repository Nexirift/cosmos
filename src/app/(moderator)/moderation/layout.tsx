import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { protect } from "./protect";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await protect();

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <SidebarTrigger className="md:hidden fixed top-4 right-4" />
        {children}
      </main>
    </SidebarProvider>
  );
}
