"use client";

import { checkPlugin } from "@/lib/auth-client";
import { Shield, Smartphone, Ticket, User } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { InvitationsSection } from "./_components/invitations/section";
import { ProfileSection } from "./_components/profile/section";
import { SecuritySection } from "./_components/security/section";
import { SessionsSection } from "./_components/sessions/section";

export default function SettingsPage() {
  const router = useRouter();
  const [hash, setHash] = useState("");
  const params = useSearchParams();

  // Update hash when URL changes
  useEffect(() => {
    if (window.location.hash) {
      setHash(window.location.hash);
    } else {
      setHash("#profile"); // Default hash if none exists
    }
  }, [params]);

  useEffect(() => {
    if (hash && !window.location.hash.includes(hash)) {
      router.replace(hash);
    }
  }, [hash, router]);

  // Setup intersection observer to update hash when scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            const newHash = `#${sectionId}`;
            // Only update URL if hash changed, without causing scroll
            if (window.location.hash !== newHash) {
              window.history.replaceState(null, "", newHash);
              setHash(newHash);
            }
          }
        });
      },
      { threshold: 0.3 }, // Trigger when 30% of the section is visible
    );

    // Observe all sections
    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      sections.forEach((section) => {
        observer.unobserve(section);
      });
    };
  }, []);

  const sidebarItems = useMemo(
    () => [
      {
        href: "#profile",
        label: "Profile",
        icon: <User className="h-4 w-4 mr-2" />,
      },
      {
        href: "#security",
        label: "Security",
        icon: <Shield className="h-4 w-4 mr-2" />,
      },
      {
        href: "#sessions",
        label: "Sessions",
        icon: <Smartphone className="h-4 w-4 mr-2" />,
      },
      {
        href: "#invitations",
        label: "Invitations",
        icon: <Ticket className="h-4 w-4 mr-2" />,
        shown: checkPlugin("invitation"),
      },
    ],
    [],
  );

  return (
    <div className="flex gap-4 p-2 md:p-8">
      <aside className="md:min-w-80 hidden md:block">
        <h1 className="font-semibold text-lg mb-4">Settings</h1>
        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            if (item.shown !== undefined && !item.shown) {
              return null;
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md hover:bg-muted ${
                  hash === item.href ? "bg-muted" : ""
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex flex-col gap-4 w-full">
        <ProfileSection />
        <SecuritySection />
        <SessionsSection />
        <InvitationsSection />
      </main>
    </div>
  );
}
