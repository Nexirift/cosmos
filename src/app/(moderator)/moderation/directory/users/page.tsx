import { columns } from "./columns";
import { DataTable } from "@/components/data-table";
import { db } from "@nexirift/db";

export default async function Page() {
  const data = await db.query.user.findMany();

  return (
    <main className="m-4 flex flex-col gap-2">
      <h2 className="text-2xl font-bold">Users</h2>
      <div className="flex items-center">
        <DataTable columns={columns} data={data} />
      </div>
    </main>
  );
}
