import { columns } from "./columns";
import { DataTable } from "@/components/data-table";
import { ProtectedPage } from "@/components/protected-page";
import { db } from "@/db";

export default async function Page() {
  const data = await db.query.organization.findMany();

  return (
    <ProtectedPage permissions={{ organizations: ["view"] }}>
      <main className="m-4 flex flex-col gap-2">
        <h2 className="text-2xl font-bold">Organizations</h2>
        <div className="flex items-center">
          <DataTable columns={columns} data={data} />
        </div>
      </main>
    </ProtectedPage>
  );
}
