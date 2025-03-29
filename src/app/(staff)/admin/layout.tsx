import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <SidebarTrigger className="md:hidden fixed top-4 right-4" />
        <div className="group bg-red-100 border-red-500 text-red-700 dark:bg-red-300 dark:border-red-700 dark:text-red-900 flex w-full items-center justify-center border-b-2 p-6 text-center">
          We were unable to contact the Nova server, please report this to the
          system administrator. Any features that are related to the Nova API
          will not be available, such as post management.
        </div>
        {children}
      </main>
    </SidebarProvider>
  );
}
