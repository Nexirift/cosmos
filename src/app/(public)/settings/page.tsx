"use client";

import { DatePicker } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, checkPlugin } from "@/lib/auth-client";
import { format } from "date-fns";
import { Loader2, Shield, User } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
  });
  const [birthday, setBirthday] = useState<Date | undefined>(undefined);
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

  // Initialize form data from session
  useEffect(() => {
    if (session?.user) {
      setFormData({
        displayName: session.user.name || "",
        username: session.user.displayUsername || "",
      });

      // Initialize birthday if available
      if (session.user.birthday) {
        setBirthday(new Date(session.user.birthday));
      }
    }
  }, [session?.user]);

  // Setup intersection observer to update hash when scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            const newHash = `#${sectionId}`;
            // Only update hash if we're not at the top of the page to prevent unwanted hash changes
            if (window.location.hash !== newHash && window.scrollY > 0) {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      // Only update username if it changed (case-insensitive comparison)
      const result = await authClient.updateUser({
        name: formData.displayName,
        username:
          session?.user.username !== formData.username.toLowerCase()
            ? formData.username
            : undefined,
        birthday: birthday ? format(birthday, "yyyy-MM-dd") : undefined,
      });

      if (result?.error?.message) {
        throw new Error(result.error.message);
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message || "Failed to update profile"
          : "An unexpected error occurred",
      );
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

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
    ],
    [],
  );

  return (
    <div className="flex gap-4 p-2 md:p-8">
      <aside className="md:min-w-80 hidden md:block">
        <h1 className="font-semibold text-lg mb-4">Settings</h1>
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
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
          ))}
        </nav>
      </aside>
      <main className="flex flex-col gap-4 w-full">
        <section id="profile" className="flex flex-col gap-4">
          <header>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-muted-foreground">
              This information is displayed on your profile. Some information
              may only be visible to you.
            </p>
          </header>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={handleChange}
                />
              </div>
              {checkPlugin("username") && (
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
              )}
              {checkPlugin("birthday") && (
                <div className="grid gap-2">
                  <Label htmlFor="birthday">Birthday</Label>
                  <DatePicker date={birthday} setDate={setBirthday} />
                </div>
              )}
            </div>

            <div className="mt-2">
              <Button
                type="submit"
                variant="secondary"
                disabled={isLoading}
                className="relative w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <span className="opacity-0">Save Changes</span>
                    <Loader2 className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </section>

        <section id="security" className="flex flex-col gap-4 pt-4 border-t">
          <header>
            <h1 className="text-2xl font-bold">Security</h1>
            <p className="text-muted-foreground">
              Manage your security settings, such as your email, password, and
              two-factor authentication.
            </p>
          </header>
          <div className="flex flex-wrap gap-3">
            <ChangeEmailDialog />
            <ChangePasswordDialog />
          </div>
        </section>
      </main>
    </div>
  );
}

function ChangeEmailDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsLoading(true);
      const result = await authClient.changeEmail({
        newEmail: email,
      });

      if (result?.error?.message) {
        throw new Error(result.error.message);
      }

      toast.success("An email change request has been sent");
      setEmail("");
      setIsOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message || "Failed to send email change request"
          : "An unexpected error occurred",
      );
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) setEmail("");
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button variant="secondary">Change Email</Button>
      </DialogTrigger>
      <DialogContent>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change your email</DialogTitle>
            <DialogDescription>
              This will send an email change confirmation request to your new
              email.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="New email"
              required
              autoFocus
            />
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="submit"
              variant="secondary"
              disabled={isLoading || !email.trim()}
              className="relative w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <span className="opacity-0">Change email</span>
                  <Loader2 className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                </>
              ) : (
                "Change email"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChangePasswordDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Passwords cannot be empty.");

  // Validate passwords
  useEffect(() => {
    if (!password || !passwordConfirm) {
      setMessage("Passwords cannot be empty.");
      return;
    }
    setMessage(
      password === passwordConfirm
        ? "Passwords match!"
        : "Passwords do not match.",
    );
  }, [password, passwordConfirm]);

  const isPasswordValid = message === "Passwords match!" && oldPassword.trim();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    try {
      setIsLoading(true);
      const result = await authClient.changePassword({
        currentPassword: oldPassword,
        newPassword: password,
        revokeOtherSessions,
      });

      if (result?.error?.message) {
        throw new Error(result.error.message);
      }

      toast.success("Password changed successfully");
      resetForm();
      setIsOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message || "Failed to change password"
          : "An unexpected error occurred",
      );
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setOldPassword("");
    setPassword("");
    setPasswordConfirm("");
    setRevokeOtherSessions(false);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) resetForm();
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button variant="secondary">Change Password</Button>
      </DialogTrigger>
      <DialogContent>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change your password</DialogTitle>
            <DialogDescription>
              Enter a new password for your account. Make sure it&apos;s secure.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="oldPassword">Current Password</Label>
            <Input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Current password"
              required
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="passwordConfirm">Confirm New Password</Label>
            <Input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </div>

          <p
            className={`text-sm ${
              message === "Passwords match!" ? "text-green-500" : "text-red-500"
            }`}
          >
            {message}
          </p>
          <DialogFooter className="justify-between w-full">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="revokeOtherSessions"
                checked={revokeOtherSessions}
                onCheckedChange={(checked) => setRevokeOtherSessions(!!checked)}
              />
              <Label htmlFor="revokeOtherSessions">
                Sign out all other devices
              </Label>
            </div>
            <div className="flex-grow" />
            <Button
              type="submit"
              variant="secondary"
              disabled={isLoading || !isPasswordValid}
              className="relative w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <span className="opacity-0">Change Password</span>
                  <Loader2 className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
