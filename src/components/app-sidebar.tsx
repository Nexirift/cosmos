import { NavUser, User } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { HomeIcon, SettingsIcon, UsersIcon } from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";

const content = [
  {
    label: "Overview",
    items: [
      {
        title: "Home",
        url: "/moderation",
        icon: HomeIcon,
      },
    ],
  },
  {
    label: "Directory",
    items: [
      {
        title: "Users",
        url: "/moderation/directory/users",
        icon: UsersIcon,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        title: "Settings",
        url: "/moderation/system/settings",
        icon: SettingsIcon,
      },
    ],
  },
];

export async function AppSidebar() {
  const headerList = await headers();
  const session = await auth.api.getSession({
    headers: headerList,
  });

  const pathname = headerList.get("x-current-path");

  return (
    <Sidebar className="min-w-60">
      <SidebarContent className="gap-0">
        <div className="flex items-center justify-center mt-4">
          <Link href="/dashboard">
            <Image
              src="/assets/images/banner.png"
              alt="Cosmos Logo"
              width={150}
              height={47.65}
              priority
            />
          </Link>
        </div>
        {content.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem
                    key={item.title}
                    className={cn(
                      pathname === item.url &&
                        "bg-sidebar-accent text-sidebar-accent-foreground rounded-md",
                    )}
                  >
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={session?.user as User} />
      </SidebarFooter>
    </Sidebar>
  );
}
