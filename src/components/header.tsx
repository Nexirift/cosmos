"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { authClient } from "@/lib/auth-client";
import { BellIcon, LogOutIcon, SettingsIcon, ShieldIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export function Header() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const navItems = [
    {
      icon: BellIcon,
      tooltip: "Notifications",
      onClick: () => alert("Not implemented yet."),
    },
    {
      icon: SettingsIcon,
      tooltip: "Settings",
      link: "/settings",
    },
    {
      icon: LogOutIcon,
      tooltip: "Logout",
      onClick: async () => await authClient.signOut(),
    },
    {
      icon: ShieldIcon,
      tooltip: "Admin",
      link: "/admin",
      shown: session?.user.role === "admin",
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card dark:border-gray-800 dark:bg-gray-950 flex justify-between items-center flex-col">
      {session?.session.impersonatedBy &&
        session?.session.impersonatedBy !== session?.session.userId && (
          <div className="group bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-300 dark:border-orange-700 dark:text-orange-900 flex w-full items-center justify-between border-b-2 p-6">
            You are currently impersonating {session?.user.displayUsername}.
            Your actions will be logged for security purposes.
            <Button
              onClick={async () => {
                await authClient.admin.stopImpersonating();
                router.push("/admin");
              }}
              variant="destructive"
            >
              Stop
            </Button>
          </div>
        )}
      <div className="flex items-center gap-4 justify-between w-full p-4">
        <Link href="/dashboard">
          <Image
            src="/assets/images/banner.png"
            alt="Cosmos Logo"
            width={150}
            height={47.65}
            priority
          />
        </Link>
        <nav className="flex items-center gap-4">
          {navItems.map(
            ({ icon: Icon, tooltip, link, onClick, shown = true }) =>
              shown && (
                <Tooltip key={tooltip}>
                  <TooltipTrigger>
                    {link ? (
                      <Link href={link}>
                        <Icon
                          className="w-5 h-5 text-gray-500 dark:text-gray-400 hover:cursor-pointer transition-transform hover:scale-110 duration-300"
                          onClick={onClick}
                        />
                      </Link>
                    ) : (
                      <Icon
                        className="w-5 h-5 text-gray-500 dark:text-gray-400 hover:cursor-pointer transition-transform hover:scale-110 duration-300"
                        onClick={onClick}
                      />
                    )}
                  </TooltipTrigger>
                  <TooltipContent className="mt-2">
                    <p className="text-sm">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ),
          )}
          <div className="flex items-center gap-2 md:ml-2">
            <p className="font-medium hidden md:block">{session?.user.name}</p>
            <Avatar>
              <AvatarImage src={session?.user.image ?? undefined} />
              <AvatarFallback>
                {session?.user.name?.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </nav>
      </div>
    </header>
  );
}
