"use client";

import { DynamicForm, generateDefaultValues } from "@/components/dynamic-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import { handleError } from "@/lib/common";
import { zodResolver } from "@/lib/zod-resolver";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";

const formSchema = z.object({
  email: z.email(),
  name: z.string(),
  username: z.string(),
  password: z.string(),
  birthday: z.date(),
});

type FormSchemaType = z.infer<typeof formSchema>;

export function AddUserDialog() {
  const [open, setOpen] = useState(false);

  const data: FormSchemaType = generateDefaultValues(formSchema);

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: data,
  });

  const action = async (values: FormSchemaType) => {
    try {
      await authClient.admin.createUser({
        email: values.email,
        name: values.name,
        password: values.password,
        data: {
          username: values.username,
          birthday: values.birthday,
        },
      });
    } catch (e) {
      alert(e);
      if (e instanceof Error) {
        handleError(e);
      } else {
        handleError(new Error("An unexpected error occurred"));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new user</DialogTitle>
          <DialogDescription>TBD</DialogDescription>
        </DialogHeader>
        <DynamicForm form={form} data={data!} action={action} />
      </DialogContent>
    </Dialog>
  );
}
