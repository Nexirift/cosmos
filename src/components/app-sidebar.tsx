import { HomeIcon, UsersIcon } from "lucide-react";
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
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { NavUser, User } from "@/components/nav-user";
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
];

export async function AppSidebar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

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
                  <SidebarMenuItem key={item.title}>
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
