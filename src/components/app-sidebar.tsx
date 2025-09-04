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
import { checkCache } from "@/lib/actions";
import { auth, checkPlugin } from "@/lib/auth";
import { getUserEffectivePermissions } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import {
  BuildingIcon,
  ChartAreaIcon,
  FlagIcon,
  HomeIcon,
  IdCardIcon,
  LucideProps,
  ScrollTextIcon,
  SettingsIcon,
  ShieldBanIcon,
  UsersIcon,
} from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";

interface Category {
  label: string;
  items: Item[];
}

interface Item {
  title: string;
  url: string;
  icon: React.FC<LucideProps>;
  hide?: boolean;
}

const content: Category[] = [
  {
    label: "Overview",
    items: [
      { title: "Home", url: "/moderation", icon: HomeIcon },
      {
        title: "Statistics",
        url: "/moderation/overview/statistics",
        icon: ChartAreaIcon,
      },
    ],
  },
  {
    label: "Directory",
    items: [
      { title: "Users", url: "/moderation/directory/users", icon: UsersIcon },
      {
        title: "Organizations",
        url: "/moderation/directory/organizations",
        icon: BuildingIcon,
        hide: !checkPlugin("organization"),
      },
      {
        title: "OAuth",
        url: "/moderation/directory/oauth",
        icon: IdCardIcon,
        hide: !checkPlugin("oidc"),
      },
      {
        title: "Sanctions",
        url: "/moderation/directory/sanctions",
        icon: ShieldBanIcon,
        hide: !checkPlugin("vortex"),
      },
      {
        title: "Reports",
        url: "/moderation/directory/reports",
        icon: FlagIcon,
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
      { title: "Logs", url: "/moderation/system/logs", icon: ScrollTextIcon },
    ],
  },
];

export async function AppSidebar() {
  const headerList = await headers();
  const session = await auth.api.getSession({ headers: headerList });

  const pathname = headerList.get("x-current-path") || "";

  const [showPoweredBy, permissionsRaw] = await Promise.all([
    checkCache("show_powered_by"),
    session?.user?.id
      ? getUserEffectivePermissions(session.user.id)
      : Promise.resolve({}),
  ]);

  const permissions: Record<string, any> = permissionsRaw || {};

  const permissionMap: Record<string, boolean> = {
    Statistics: permissions.statistics?.includes("view") ?? false,
    Users: permissions.users?.includes("view") ?? false,
    Organizations: permissions.organizations?.includes("view") ?? false,
    OAuth: permissions.oauth?.includes("view") ?? false,
    Sanctions: permissions.sanctions?.includes("view") ?? false,
    Reports: permissions.reports?.includes("view") ?? false,
    Settings: permissions.settings?.includes("view") ?? false,
    Logs: permissions.logs?.includes("view") ?? false,
  };

  return (
    <Sidebar className="min-w-60">
      <SidebarContent className="gap-0">
        <div className="flex items-center justify-center mt-4">
          <Link href="/dashboard" aria-label="Go to dashboard">
            <Image
              src="/assets/images/banner.png"
              alt="Cosmos Logo"
              width={150}
              height={48}
              priority
            />
          </Link>
        </div>
        {content.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (item.hide) return false;
            if (permissionMap[item.title] === undefined) return true; // No specific permission required
            return permissionMap[item.title];
          });

          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const isActive =
                      pathname === item.url ||
                      (pathname.startsWith(item.url + "/") && item.url !== "/");
                    return (
                      <SidebarMenuItem
                        key={item.title}
                        className={cn(
                          isActive &&
                            "bg-sidebar-accent text-sidebar-accent-foreground rounded-md",
                        )}
                      >
                        <SidebarMenuButton asChild>
                          <Link href={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter>
        {showPoweredBy && (
          <p
            id="powered-by-cosmos"
            className="text-muted-foreground pl-2 text-xs"
          >
            Powered by{" "}
            <a href="https://github.com/Nexirift/cosmos" className="underline">
              Cosmos
            </a>
          </p>
        )}
        <NavUser user={session?.user as User} />
      </SidebarFooter>
    </Sidebar>
  );
}
