import { DataTable } from "@/components/data-table";
import { ProtectedPage } from "@/components/protected-page";
import { db } from "@/db";
import { columns } from "./columns";

export default async function Page() {
  const data = await db.query.oauthApplication.findMany();

  return (
    <ProtectedPage permissions={{ oauth: ["view"] }}>
      <main className="m-4 flex flex-col gap-2">
        <h2 className="text-2xl font-bold">OAuth Applications</h2>
        <div className="flex items-center">
          <DataTable columns={columns} data={data} />
        </div>
      </main>
    </ProtectedPage>
  );
}
