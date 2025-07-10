"use client";

import { DatePicker } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, checkPlugin } from "@/lib/auth-client";
import { handleError } from "@/lib/common";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

export function ProfileSection({
  session,
}: {
  session: ReturnType<typeof authClient.useSession>["data"] | undefined;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
  });
  const [birthday, setBirthday] = useState<Date | undefined>(undefined);

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
      if (error instanceof Error) {
        handleError(error);
      } else {
        handleError(new Error("An unexpected error occurred"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="profile" className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          This information is displayed on your profile. Some information may
          only be visible to you.
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
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <DatePicker date={birthday} setDate={setBirthday} />
                </div>
                {birthday && (
                  <div className="flex-shrink-0">
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {(() => {
                        const today = new Date();
                        const birthDate = new Date(birthday);
                        let age = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff =
                          today.getMonth() - birthDate.getMonth();

                        if (
                          monthDiff < 0 ||
                          (monthDiff === 0 &&
                            today.getDate() < birthDate.getDate())
                        ) {
                          age--;
                        }

                        return age;
                      })()}{" "}
                      years old
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your birthday is used for age verification and content filtering
                purposes. Specific countries or states may require additional
                verification.
              </p>
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
  );
}
