"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { handleError } from "@/lib/common";
import { Passkey } from "better-auth/plugins/passkey";
import { Loader2, MoreHorizontalIcon } from "lucide-react";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";

export function Passkeys() {
  const { data, isPending, refetch } = authClient.useListPasskeys();
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Passkeys</h2>
        <Button
          onClick={() => setIsAddOpen(true)}
          variant="secondary"
          size="sm"
        >
          Add Passkey
        </Button>
      </div>

      {isPending && (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {!isPending &&
          data?.map((passkey) => (
            <PasskeyCard key={passkey.id} passkey={passkey} refetch={refetch} />
          ))}
      </div>

      {!isPending && data?.length === 0 && (
        <div className="text-muted-foreground">
          No passkeys added yet. Add a passkey for passwordless login.
        </div>
      )}

      <AddPasskeyDialog
        length={data?.length ?? 0}
        isOpen={isAddOpen}
        setIsOpen={setIsAddOpen}
        refetch={refetch}
      />
    </div>
  );
}

function PasskeyCard({
  passkey,
  refetch,
}: {
  passkey: Passkey;
  refetch: () => void;
}) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const displayName = passkey.name || passkey.id.substring(0, 16);
  const createdDate = new Date(passkey.createdAt).toLocaleDateString();

  return (
    <>
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="pb-8">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="truncate" title={displayName}>
              {displayName}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setIsDeleteOpen(true)}
                  className="text-red-500 focus:text-red-500"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardTitle>
          <CardDescription>Created on {createdDate}</CardDescription>
        </CardHeader>
      </Card>

      <DeletePasskeyDialog
        passkey={passkey}
        isOpen={isDeleteOpen}
        setIsOpen={setIsDeleteOpen}
        refetch={refetch}
      />
    </>
  );
}

function DeletePasskeyDialog({
  passkey,
  isOpen,
  setIsOpen,
  refetch,
}: {
  passkey: Passkey;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  refetch: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await authClient.passkey.deletePasskey({ id: passkey.id });
      toast.success("Passkey deleted successfully");
      refetch();
      setIsOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        handleError(error);
      } else {
        handleError(new Error("An unexpected error occurred"));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => !isDeleting && setIsOpen(open)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete passkey</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove this passkey from your account.
            You&#39;ll no longer be able to use it to sign in.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="relative bg-red-500 hover:bg-red-600 text-white"
          >
            {isDeleting ? (
              <>
                <span className="opacity-0">Delete</span>
                <Loader2 className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin" />
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AddPasskeyDialog({
  length,
  isOpen,
  setIsOpen,
  refetch,
}: {
  length: number;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  refetch: () => void;
}) {
  const defaultName = `Passkey #${length + 1}`;
  const [name, setName] = useState(defaultName);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
    }
  }, [isOpen, defaultName]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    try {
      setIsLoading(true);
      const result = await authClient.passkey.addPasskey({
        name: trimmedName,
      });

      if (result?.error?.message) {
        throw new Error(result.error.message);
      }

      toast.success("Passkey added successfully");
      refetch();
      setIsOpen(false);
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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !isLoading && setIsOpen(open)}
    >
      <DialogContent>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Passkey</DialogTitle>
            <DialogDescription>
              This will add a new passkey to your account. Passkeys provide a
              more secure, passwordless way to log in.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="passkey-name">Passkey Name</Label>
            <Input
              id="passkey-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Work Laptop, iPhone"
              required
              autoFocus
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Give your passkey a name to help you identify which device it
              belongs to.
            </p>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              variant="secondary"
              className="relative"
            >
              {isLoading ? (
                <>
                  <span className="opacity-0">Create Passkey</span>
                  <Loader2 className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                </>
              ) : (
                "Create Passkey"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
