"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { columns, Data } from "./columns";

const COLUMNS_PREFERENCE_KEY =
  "/moderation/directory/users---(columns-preference)";

export default function Page() {
  const router = useRouter();
  const [data, setData] = useState<Data>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const pageSize = 10;
  const [columnVisibility, setColumnVisibility] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(COLUMNS_PREFERENCE_KEY);
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await authClient.admin.listUsers({
        query: {
          limit: pageSize,
          offset: (currentPage - 1) * pageSize,
          searchField: "name",
          searchValue: filterValue,
        },
      });
      console.log(result);
      setData(result.data);
      setTotalPages(Math.ceil((result.data?.total ?? 1) / pageSize));
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, filterValue]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    localStorage.setItem(
      COLUMNS_PREFERENCE_KEY,
      JSON.stringify(columnVisibility),
    );
  }, [columnVisibility]);

  const table = useReactTable({
    data: data?.users ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
  });

  const truncateId = useCallback((id: string) => {
    return id.length > 12 ? `${id.substring(0, 12)}...` : id;
  }, []);

  const handlePreviousPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () =>
    setCurrentPage((p) => Math.min(totalPages, p + 1));

  return (
    <main className="m-4 flex flex-col gap-2">
      <h2 className="text-2xl font-bold">Users</h2>
      <div className="flex items-center">
        <Input
          placeholder="Search by name..."
          value={filterValue}
          onChange={(event) => {
            setFilterValue(event.target.value);
            setCurrentPage(1);
          }}
          className="max-w-xl"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.columnDef.header as string}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isLoading ? (
        <div className="text-center py-4">Loading...</div>
      ) : data ? (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => {
                        router.push(
                          `/moderation/directory/users/${row.original.id}`,
                        );
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} title={cell.id}>
                          {cell.column.id === "id"
                            ? truncateId(cell.getContext().getValue() as string)
                            : flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-between gap-2 mt-4">
            <Button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              variant="outline"
            >
              Previous
            </Button>
            <span className="px-4 py-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              variant="outline"
            >
              Next
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-4">No data available</div>
      )}
      <CreateUser />
    </main>
  );
}

function CreateUser() {
  const initialState = {
    name: "",
    username: "",
    email: "",
    role: "user",
    password: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleChange =
    (field: keyof typeof initialState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const resetForm = () => {
    setFormData(initialState);
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await authClient.admin.createUser({
        ...formData,
        data: {
          username: formData.username.toLowerCase(),
          displayUsername: formData.username,
        },
      });
      resetForm();
    } catch (error) {
      console.error("Failed to create user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Create User</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new user account.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Input
            placeholder="Name"
            value={formData.name}
            onChange={handleChange("name")}
            className="w-full"
          />
          <Input
            placeholder="Username"
            value={formData.username}
            onChange={handleChange("username")}
            className="w-full"
          />
          <Input
            placeholder="Password"
            type="password"
            value={formData.password}
            onChange={handleChange("password")}
            className="w-full"
          />
          <Input
            placeholder="Email"
            type="email"
            value={formData.email}
            onChange={handleChange("email")}
            className="w-full"
          />
          <Select
            value={formData.role}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, role: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="gap-2">
          <Button onClick={handleSubmit} disabled={isLoading} variant="outline">
            {isLoading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
