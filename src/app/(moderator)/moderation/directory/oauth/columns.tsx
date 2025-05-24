"use client";

import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/common";
import { SelectOauthApplicationSchema } from "@/lib/zod-schema";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import moment from "moment";
import Link from "next/link";

export const columns: ColumnDef<SelectOauthApplicationSchema>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => {
      const value = row.getValue("id");
      return value?.toString().substring(0, 12) + "..." || "";
    },
  },
  {
    accessorKey: "icon",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Icon" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("icon");
      return (
        <Avatar className="w-12 h-12 rounded-lg">
          <AvatarImage src={value as string} className="rounded-lg" />
          <AvatarFallback className="rounded-lg">
            {initials(row.getValue("name") as string)}
          </AvatarFallback>
        </Avatar>
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: "clientId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Client ID" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("clientId");
      return value?.toString().substring(0, 12) + "..." || "";
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("type") as string;
      return (
        <div className="flex items-center">
          <Badge variant="outline" className="mr-2">
            {value.substring(0, 1).toUpperCase() + value.slice(1)}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "disabled",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Disabled" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("disabled") as boolean;
      return (
        <div className="flex items-center">
          <Checkbox checked={value} disabled />
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("createdAt") as string;
      return value ? moment(value).format("MMM D, YYYY h:mm A") : "";
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated At" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("updatedAt") as string;
      return value ? moment(value).format("MMM D, YYYY h:mm A") : "";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/moderation/directory/organizations/${user.id}`}>
                View user
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
