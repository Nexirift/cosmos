"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ColumnDef, Row } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type Data = Awaited<
  ReturnType<typeof authClient.admin.listUsers<{ query: { limit: number } }>>
>["data"];

export type Users = NonNullable<Data>["users"][number];

type DialogProps = {
  row: Row<Users>;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export const columns: ColumnDef<Users>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "Display Name",
  },
  {
    accessorKey: "displayUsername",
    header: "Username",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const Cell = () => {
        const [isImpersonateOpen, setIsImpersonateOpen] = useState(false);
        const [isSetUserPasswordOpen, setIsSetUserPasswordOpen] =
          useState(false);

        return (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsImpersonateOpen(true)}>
                  Impersonate
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="w-full"
                  onClick={() => setIsSetUserPasswordOpen(true)}
                >
                  Set User Password
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ImpersonateDialog
              row={row}
              isOpen={isImpersonateOpen}
              setIsOpen={setIsImpersonateOpen}
            />

            <SetUserPasswordDialog
              row={row}
              isOpen={isSetUserPasswordOpen}
              setIsOpen={setIsSetUserPasswordOpen}
            />
          </>
        );
      };

      return <Cell />;
    },
  },
];

function ImpersonateDialog({ row, isOpen, setIsOpen }: DialogProps) {
  const [impersonateConfirm, setImpersonateConfirm] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Impersonate</DialogTitle>
          <DialogDescription>
            By impersonating a user, you understand the ethical rights set out
            by the organisation operating this system.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="understood"
              checked={impersonateConfirm}
              onCheckedChange={(checked) => setImpersonateConfirm(!!checked)}
            />
            <Label htmlFor="understood">I understand</Label>
          </div>
          <div className="flex-grow" />
          <Button
            onClick={async () => {
              await authClient.admin.impersonateUser({
                userId: row.original.id,
                fetchOptions: {
                  onSuccess: () => {
                    router.push("/dashboard");
                  },
                },
              });
            }}
            disabled={!impersonateConfirm}
          >
            Impersonate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SetUserPasswordDialog({ row, isOpen, setIsOpen }: DialogProps) {
  const [userPassword, setUserPassword] = useState("");
  const [userPasswordConfirm, setUserPasswordConfirm] = useState("");
  const [confirmAction, setConfirmAction] = useState(false);
  const [message, setMessage] = useState("Passwords cannot be empty.");

  useEffect(() => {
    if (userPassword === "" || userPasswordConfirm === "") {
      setMessage("Passwords cannot be empty.");
      return;
    }
    if (userPassword !== userPasswordConfirm) {
      setMessage("Passwords do not match.");
    } else {
      setMessage("Passwords match!");
    }
  }, [userPassword, userPasswordConfirm]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set user password</DialogTitle>
          <DialogDescription>
            This will manually set a user&#39;s password. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="password"
          placeholder="Enter new password"
          value={userPassword}
          onChange={(e) => setUserPassword(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Confirm new password"
          value={userPasswordConfirm}
          onChange={(e) => setUserPasswordConfirm(e.target.value)}
          required
        />
        <p
          className={cn(
            "text-sm",
            message === "Passwords match!" ? "text-green-500" : "text-red-500",
          )}
        >
          {message}
        </p>
        <DialogFooter className="flex justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="resetPasswordConfirm"
              checked={confirmAction}
              onCheckedChange={(checked) => setConfirmAction(!!checked)}
            />
            <Label htmlFor="resetPasswordConfirm">I confirm this action</Label>
          </div>
          <div className="flex-grow" />
          <Button
            onClick={async () => {
              await authClient.admin.setUserPassword({
                userId: row.original.id,
                newPassword: userPassword,
                fetchOptions: {
                  onSuccess: () => {
                    toast("Password set successfully!");
                    setIsOpen(false);
                  },
                  onError: (err) => {
                    toast(err.error.message);
                  },
                },
              });
            }}
            disabled={message !== "Passwords match!" || !confirmAction}
          >
            Set
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
